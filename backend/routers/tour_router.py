from fastapi import APIRouter, HTTPException

from tour_api import SIDO_SIGNGU, get_recommendations, get_signgu_recommendations

router = APIRouter(prefix="/api/tour", tags=["tour"])


@router.get("/{sido_name}")
async def tour_recommendations(sido_name: str, limit: int = 24):
    if sido_name not in SIDO_SIGNGU:
        raise HTTPException(status_code=404, detail=f"'{sido_name}' 추천 정보를 지원하지 않습니다.")
    limit = max(1, min(limit, 60))
    return await get_recommendations(sido_name, limit)


@router.get("/{sido_name}/{sigungu_name}")
async def tour_recommendations_by_sigungu(sido_name: str, sigungu_name: str, limit: int = 24):
    if sido_name not in SIDO_SIGNGU:
        raise HTTPException(status_code=404, detail=f"'{sido_name}' 추천 정보를 지원하지 않습니다.")
    limit = max(1, min(limit, 60))
    return await get_signgu_recommendations(sido_name, sigungu_name, limit)
