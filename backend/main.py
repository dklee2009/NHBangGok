from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from mock_data import MOCK_BRANCHES, get_branches_by_sigungu, get_all_branches_flat
from naver_search import search_nh_branches

load_dotenv()

app = FastAPI(title="NH Bank Stamp Tour API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

USE_MOCK = os.getenv("USE_MOCK", "true").lower() == "true"
NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "")

SIDO_LIST = list(MOCK_BRANCHES.keys())


@app.get("/api/banks/{sido_name}")
async def get_banks_by_sido(
    sido_name: str,
    sigungu: str = Query(default=None, description="시/군/구 이름으로 필터링"),
):
    """특정 시/도 (+ 선택적으로 시/군/구)의 농협은행 지점 목록 반환"""
    if sido_name not in SIDO_LIST:
        raise HTTPException(status_code=404, detail=f"'{sido_name}' 시/도를 찾을 수 없습니다.")

    # 네이버 검색 API 사용 (USE_MOCK=false + Client ID 설정 시)
    if not USE_MOCK and NAVER_CLIENT_ID and sigungu:
        try:
            branches = await search_nh_branches(sigungu, sido_name)
            if branches:
                return {
                    "sido": sido_name,
                    "sigungu": sigungu,
                    "total": len(branches),
                    "branches": branches,
                    "source": "naver",
                }
        except Exception:
            pass  # 실패 시 mock으로 fallback

    # Mock 데이터 fallback
    if sigungu:
        branches = get_branches_by_sigungu(sido_name, sigungu)
    else:
        branches = get_all_branches_flat(sido_name)
    return {
        "sido": sido_name,
        "sigungu": sigungu,
        "total": len(branches),
        "branches": branches,
        "source": "mock",
    }


@app.get("/api/sidos")
async def get_sidos():
    return {"sidos": SIDO_LIST}


@app.get("/api/sigungus/{sido_name}")
async def get_sigungus(sido_name: str):
    """특정 시/도의 시/군/구 목록 반환"""
    if sido_name not in MOCK_BRANCHES:
        raise HTTPException(status_code=404, detail=f"'{sido_name}' 시/도를 찾을 수 없습니다.")
    return {"sido": sido_name, "sigungus": list(MOCK_BRANCHES[sido_name].keys())}


@app.get("/health")
async def health():
    mode = "mock" if USE_MOCK else ("naver" if NAVER_CLIENT_ID else "mock")
    return {"status": "ok", "mode": mode}
