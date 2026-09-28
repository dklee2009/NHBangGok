"""
NCP API Hub 지역검색 API를 이용한 NH농협 관련 장소(은행/하나로마트/주유소) 조회
엔드포인트: https://naverapihub.apigw.ntruss.com/search/v1/local
헤더: X-NCP-APIGW-API-KEY-ID / X-NCP-APIGW-API-KEY
"""
import asyncio
import os
import httpx

SEARCH_URL = "https://naverapihub.apigw.ntruss.com/search/v1/local"

# 카테고리별 검색어 접두어. "NH농협" 등을 붙이면 네이버 지역검색이 0건을 반환하는
# 경우가 있어(예: "NH농협 하나로마트"), 실제 상호에 쓰이는 표현만 사용한다.
CATEGORY_QUERY_PREFIX = {
    "bank": "NH농협은행",
    "mart": "하나로마트",
    "gas":  "농협주유소",
}


def _matches_category(category: str, title: str, item_category: str) -> bool:
    if category == "mart":
        # "다이소 하나로마트○○점"처럼 하나로마트 매장 안 입점 코너나 주차장 결과를 제외
        return "하나로마트" in title and "마트" in item_category
    if category == "gas":
        # 네이버 카테고리가 "주유소>농협주유소" / "생활,편의>주유소" 등으로 나뉘어
        # 있어 카테고리 문자열에 "주유소"가 포함되는지로 판별 (상호에 우연히
        # "농협주유소"가 들어간 비주유소 업종 오검색을 제외)
        return "주유소" in item_category
    # 기본값: 은행
    return ("농협" in title or "NH" in title) and ("은행" in item_category or "은행" in title)

def get_headers():
    return {
        "X-NCP-APIGW-API-KEY-ID": os.getenv("NAVER_CLIENT_ID", ""),
        "X-NCP-APIGW-API-KEY":    os.getenv("NAVER_CLIENT_SECRET", ""),
    }

def parse_coord(value: str) -> float:
    """
    네이버 좌표 변환
    - 정수형(ex: 1270584000) → /10000000
    - 소수형(ex: 127.0584)   → 그대로 사용
    """
    v = float(value)
    if abs(v) > 1000:          # 정수 형식
        return round(v / 10_000_000, 7)
    return round(v, 7)         # 이미 소수 형식

def clean_html(text: str) -> str:
    return text.replace("<b>", "").replace("</b>", "")

async def search_nh_places(sigungu: str, sido: str, category: str = "bank") -> list:
    """
    시/군/구 기준으로 NH농협 관련 장소(은행/하나로마트/주유소)를 검색해 반환
    display 최대 5, start 1~21 → 최대 25건
    """
    # 서구/중구/북구처럼 여러 시/도에 동시에 존재하는 지역명이 있어 시/도명을 함께 붙여야
    # 엉뚱한 지역(예: 대구 서구 대신 인천 서구)의 지점이 섞여 나오는 것을 막을 수 있다.
    query_prefix = CATEGORY_QUERY_PREFIX.get(category, CATEGORY_QUERY_PREFIX["bank"])
    query = f"{query_prefix} {sido} {sigungu}"
    branches = []
    seen = set()

    async def fetch_page(client, start):
        params = {
            "query":   query,
            "display": 5,
            "start":   start,
            "sort":    "random",
            "format":  "json",
        }
        try:
            resp = await client.get(SEARCH_URL, headers=get_headers(), params=params)
            resp.raise_for_status()
            return resp.json().get("items", [])
        except Exception as e:
            print(f"[NaverSearch] 오류 (start={start}): {e}")
            return []

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 페이지 간 의존성이 없으므로(순차 대기 대신) 동시에 요청
        pages = await asyncio.gather(*(fetch_page(client, start) for start in range(1, 26, 5)))

        for items in pages:
            for item in items:
                title         = clean_html(item.get("title", ""))
                item_category = item.get("category", "")
                mapx          = item.get("mapx", "")
                mapy          = item.get("mapy", "")

                if not mapx or not mapy:
                    continue

                if not _matches_category(category, title, item_category):
                    continue

                # 중복 제거
                key = f"{mapx},{mapy}"
                if key in seen:
                    continue
                seen.add(key)

                lat = parse_coord(mapy)
                lng = parse_coord(mapx)

                branches.append({
                    "id":          f"naver-{category}-{mapx}-{mapy}",
                    "name":        title,
                    "address":     item.get("address", ""),
                    "roadAddress": item.get("roadAddress", ""),
                    "lat":         lat,
                    "lng":         lng,
                    "phone":       item.get("telephone", ""),
                })

    return branches
