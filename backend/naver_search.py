"""
NCP API Hub 지역검색 API를 이용한 농협은행 지점 조회
엔드포인트: https://naverapihub.apigw.ntruss.com/search/v1/local
헤더: X-NCP-APIGW-API-KEY-ID / X-NCP-APIGW-API-KEY
"""
import os
import httpx

SEARCH_URL = "https://naverapihub.apigw.ntruss.com/search/v1/local"

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

async def search_nh_branches(sigungu: str, sido: str) -> list:
    """
    시/군/구 기준으로 NH농협은행 지점을 검색해 반환
    display 최대 5, start 1~21 → 최대 25건
    """
    query = f"NH농협은행 {sigungu}"
    branches = []
    seen = set()

    async with httpx.AsyncClient(timeout=10.0) as client:
        for start in range(1, 26, 5):   # 1, 6, 11, 16, 21
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
                items = resp.json().get("items", [])
            except Exception as e:
                print(f"[NaverSearch] 오류 (start={start}): {e}")
                break

            if not items:
                break

            for item in items:
                title    = clean_html(item.get("title", ""))
                category = item.get("category", "")
                mapx     = item.get("mapx", "")
                mapy     = item.get("mapy", "")

                if not mapx or not mapy:
                    continue

                # 농협은행 필터
                if "농협" not in title and "NH" not in title:
                    continue
                if "은행" not in category and "은행" not in title:
                    continue

                # 중복 제거
                key = f"{mapx},{mapy}"
                if key in seen:
                    continue
                seen.add(key)

                lat = parse_coord(mapy)
                lng = parse_coord(mapx)

                branches.append({
                    "id":          f"naver-{mapx}-{mapy}",
                    "name":        title,
                    "address":     item.get("address", ""),
                    "roadAddress": item.get("roadAddress", ""),
                    "lat":         lat,
                    "lng":         lng,
                    "phone":       item.get("telephone", ""),
                })

    return branches
