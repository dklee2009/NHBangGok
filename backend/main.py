from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os
import time
from dotenv import load_dotenv

# 라우터/모듈이 import 시점에 os.getenv 로 키를 읽으므로 먼저 로드
load_dotenv()

from sqlalchemy import text

from database import engine, Base
from mock_data import MOCK_BRANCHES, get_branches_by_sigungu, get_all_branches_flat
from naver_search import search_nh_places
from routers.auth_router import router as auth_router
from routers.stamps_router import router as stamps_router
from routers.tour_router import router as tour_router

# DB 테이블 생성
Base.metadata.create_all(bind=engine)

# 기존 DB에 category 컬럼이 없으면 추가한다. 기존 스탬프는 전부 은행 조회 시절 데이터이므로
# 기본값 'bank'로 채운다. (Alembic 없이 단일 컬럼만 다루므로 가벼운 수동 마이그레이션으로 처리)
with engine.connect() as _conn:
    if engine.dialect.name == "sqlite":
        _existing_cols = {row[1] for row in _conn.execute(text("PRAGMA table_info(stamps)"))}
        if "category" not in _existing_cols:
            _conn.execute(text("ALTER TABLE stamps ADD COLUMN category VARCHAR NOT NULL DEFAULT 'bank'"))
            _conn.commit()
    else:
        _conn.execute(text("ALTER TABLE stamps ADD COLUMN IF NOT EXISTS category VARCHAR NOT NULL DEFAULT 'bank'"))
        _conn.commit()

app = FastAPI(title="NH Bank Stamp Tour API")

# 배포 시 CORS_ORIGINS 환경변수(쉼표 구분)로 프론트 도메인 추가
_extra_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", *_extra_origins],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(stamps_router)
app.include_router(tour_router)

USE_MOCK = os.getenv("USE_MOCK", "true").lower() == "true"
NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "")

SIDO_LIST = list(MOCK_BRANCHES.keys())
VALID_CATEGORIES = {"bank", "mart", "gas"}

# (sido, sigungu, category) → (조회 시각, 응답) 캐시. 지점 위치는 자주 바뀌지 않으므로
# 클릭할 때마다 네이버 API를 다시 호출하지 않도록 TTL 동안 재사용한다.
_BANKS_CACHE_TTL = 60 * 60  # 1시간
_banks_cache: dict[tuple[str, str, str], tuple[float, list]] = {}


@app.get("/api/banks/{sido_name}")
async def get_banks_by_sido(
    sido_name: str,
    sigungu: str = Query(default=None, description="시/군/구 이름으로 필터링"),
    category: str = Query(default="bank", description="장소 분류: bank(농협은행) | mart(하나로마트) | gas(농협주유소)"),
):
    if sido_name not in SIDO_LIST:
        raise HTTPException(status_code=404, detail=f"'{sido_name}' 시/도를 찾을 수 없습니다.")
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"'{category}'는 지원하지 않는 분류입니다.")

    if not USE_MOCK and NAVER_CLIENT_ID and sigungu:
        cache_key = (sido_name, sigungu, category)
        cached = _banks_cache.get(cache_key)
        if cached and time.time() - cached[0] < _BANKS_CACHE_TTL:
            branches = cached[1]
            return {"sido": sido_name, "sigungu": sigungu, "category": category, "total": len(branches), "branches": branches, "source": "naver-cache"}
        try:
            branches = await search_nh_places(sigungu, sido_name, category)
            if branches:
                _banks_cache[cache_key] = (time.time(), branches)
                return {"sido": sido_name, "sigungu": sigungu, "category": category, "total": len(branches), "branches": branches, "source": "naver"}
        except Exception:
            pass

    if sigungu:
        branches = get_branches_by_sigungu(sido_name, sigungu, category)
    else:
        branches = get_all_branches_flat(sido_name, category)
    return {"sido": sido_name, "sigungu": sigungu, "category": category, "total": len(branches), "branches": branches, "source": "mock"}


@app.get("/api/sidos")
async def get_sidos():
    return {"sidos": SIDO_LIST}


@app.get("/api/sigungus/{sido_name}")
async def get_sigungus(sido_name: str):
    if sido_name not in MOCK_BRANCHES:
        raise HTTPException(status_code=404, detail=f"'{sido_name}' 시/도를 찾을 수 없습니다.")
    return {"sido": sido_name, "sigungus": list(MOCK_BRANCHES[sido_name].keys())}


@app.get("/health")
async def health():
    mode = "mock" if USE_MOCK else ("naver" if NAVER_CLIENT_ID else "mock")
    return {"status": "ok", "mode": mode}