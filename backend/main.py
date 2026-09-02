from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# 라우터/모듈이 import 시점에 os.getenv 로 키를 읽으므로 먼저 로드
load_dotenv()

from database import engine, Base
from mock_data import MOCK_BRANCHES, get_branches_by_sigungu, get_all_branches_flat
from naver_search import search_nh_branches
from routers.auth_router import router as auth_router
from routers.stamps_router import router as stamps_router
from routers.tour_router import router as tour_router

# DB 테이블 생성
Base.metadata.create_all(bind=engine)

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


@app.get("/api/banks/{sido_name}")
async def get_banks_by_sido(
    sido_name: str,
    sigungu: str = Query(default=None, description="시/군/구 이름으로 필터링"),
):
    if sido_name not in SIDO_LIST:
        raise HTTPException(status_code=404, detail=f"'{sido_name}' 시/도를 찾을 수 없습니다.")

    if not USE_MOCK and NAVER_CLIENT_ID and sigungu:
        try:
            branches = await search_nh_branches(sigungu, sido_name)
            if branches:
                return {"sido": sido_name, "sigungu": sigungu, "total": len(branches), "branches": branches, "source": "naver"}
        except Exception:
            pass

    if sigungu:
        branches = get_branches_by_sigungu(sido_name, sigungu)
    else:
        branches = get_all_branches_flat(sido_name)
    return {"sido": sido_name, "sigungu": sigungu, "total": len(branches), "branches": branches, "source": "mock"}


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