"""한국관광공사 LocgoHub 관광타겟(허브 관광지) 서비스 연동.

시/도 단위로 대표 시·군·구 몇 곳을 골라 병렬 호출하고, 허브 관광지를
중복 제거 + 순위 정렬해서 "이 지역 추천 여행지" 목록으로 돌려준다.
API 문서: https://www.data.go.kr/data/15128559/openapi.do
"""
import asyncio
import os
import urllib.parse
from datetime import date

import httpx

BASE_URL = "http://apis.data.go.kr/B551011/LocgoHubTarService1/areaBasedList1"

# 앱의 시/도 한글명 → 대표 시·군·구 [(areaCd, signguCd, 표시명)]
# areaCd/signguCd 는 행정표준 시군구 코드.
SIDO_SIGNGU = {
    "서울특별시": [("11", "11110", "종로구"), ("11", "11140", "중구"), ("11", "11440", "마포구")],
    "부산광역시": [("26", "26350", "해운대구"), ("26", "26110", "중구"), ("26", "26500", "수영구")],
    "대구광역시": [("27", "27110", "중구"), ("27", "27260", "수성구"), ("27", "27710", "달성군")],
    "인천광역시": [("28", "28110", "중구"), ("28", "28185", "연수구"), ("28", "28710", "강화군")],
    "광주광역시": [("29", "29110", "동구"), ("29", "29140", "서구"), ("29", "29170", "북구")],
    "대전광역시": [("30", "30200", "유성구"), ("30", "30140", "중구"), ("30", "30110", "동구")],
    "울산광역시": [("31", "31140", "남구"), ("31", "31710", "울주군"), ("31", "31110", "중구")],
    "세종특별자치시": [("36", "36110", "세종시")],
    "경기도": [
        ("41", "41115", "수원시 팔달구"),
        ("41", "41285", "고양시 일산동구"),
        ("41", "41820", "가평군"),
        ("41", "41461", "용인시 처인구"),
    ],
    "강원특별자치도": [
        ("51", "51150", "강릉시"),
        ("51", "51210", "속초시"),
        ("51", "51110", "춘천시"),
        ("51", "51760", "평창군"),
    ],
    "충청북도": [("43", "43111", "청주시 상당구"), ("43", "43130", "충주시"), ("43", "43150", "제천시")],
    "충청남도": [
        ("44", "44131", "천안시 동남구"),
        ("44", "44150", "공주시"),
        ("44", "44180", "보령시"),
        ("44", "44760", "부여군"),
    ],
    "전북특별자치도": [("52", "52111", "전주시 완산구"), ("52", "52130", "군산시"), ("52", "52190", "남원시")],
    "전라남도": [("46", "46130", "여수시"), ("46", "46150", "순천시"), ("46", "46110", "목포시")],
    "경상북도": [("47", "47130", "경주시"), ("47", "47170", "안동시"), ("47", "47111", "포항시 남구")],
    "경상남도": [
        ("48", "48123", "창원시 성산구"),
        ("48", "48220", "통영시"),
        ("48", "48250", "김해시"),
        ("48", "48840", "남해군"),
    ],
    "제주특별자치도": [("50", "50110", "제주시"), ("50", "50130", "서귀포시")],
}

def _service_key() -> str:
    """.env 의 인증키를 반환. URL 인코딩/평문 모두 허용."""
    raw = os.getenv("TOUR_API_KEY", "")
    return urllib.parse.unquote(raw) if "%" in raw else raw

# 데이터가 존재하는 것으로 확인된 기준월 캐시
_base_ym_cache: str | None = None


def _candidate_base_yms() -> list[str]:
    """오늘 기준 2개월 전부터 과거로 최대 15개월치 YYYYMM."""
    y, m = date.today().year, date.today().month
    out = []
    # 통계 확정에 보통 1~2개월 걸리므로 2개월 전부터 시작
    m -= 2
    while m <= 0:
        m += 12
        y -= 1
    for _ in range(15):
        out.append(f"{y}{m:02d}")
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    return out


async def _fetch_one(client: httpx.AsyncClient, area_cd: str, signgu_cd: str, base_ym: str, rows: int):
    params = {
        "serviceKey": _service_key(),
        "MobileOS": "ETC",
        "MobileApp": "NHBangGok",
        "_type": "json",
        "numOfRows": str(rows),
        "pageNo": "1",
        "baseYm": base_ym,
        "areaCd": area_cd,
        "signguCd": signgu_cd,
    }
    try:
        r = await client.get(BASE_URL, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
    except (httpx.HTTPError, ValueError):
        return []
    body = (data.get("response") or {}).get("body") or {}
    items = body.get("items")
    if not items or not isinstance(items, dict):
        return []
    item = items.get("item") or []
    if isinstance(item, dict):
        item = [item]
    return item


async def _resolve_base_ym(client: httpx.AsyncClient) -> str | None:
    global _base_ym_cache
    if _base_ym_cache:
        return _base_ym_cache
    # 서울 중구로 데이터 존재 여부만 빠르게 확인
    for ym in _candidate_base_yms():
        rows = await _fetch_one(client, "11", "11140", ym, 1)
        if rows:
            _base_ym_cache = ym
            return ym
    return None


async def get_recommendations(sido_name: str, limit: int = 24) -> dict:
    """시/도 대표 시·군·구들의 허브 관광지를 모아 추천 목록으로 반환."""
    targets = SIDO_SIGNGU.get(sido_name)
    if not targets or not _service_key():
        return {"sido": sido_name, "baseYm": None, "count": 0, "spots": [], "available": False}

    async with httpx.AsyncClient() as client:
        base_ym = await _resolve_base_ym(client)
        if not base_ym:
            return {"sido": sido_name, "baseYm": None, "count": 0, "spots": [], "available": False}

        per = max(6, (limit * 2) // len(targets))
        results = await asyncio.gather(
            *[_fetch_one(client, a, s, base_ym, per) for a, s, _ in targets]
        )

    # 여행지 추천 성격상 쇼핑/숙박/음식은 뒤로 밀고 자연·문화·역사 관광을 우선
    cat_penalty = {"쇼핑": 3, "숙박": 6, "음식": 2}

    seen: set[str] = set()
    spots: list[dict] = []
    for raw_list in results:
        for it in raw_list:
            name = (it.get("hubTatsNm") or "").strip()
            if not name or name in seen:
                continue
            seen.add(name)
            try:
                rank = int(it.get("hubRank") or 999)
            except ValueError:
                rank = 999
            sub = it.get("hubCtgryMclsNm") or ""
            spots.append(
                {
                    "id": it.get("hubTatsCd") or name,
                    "name": name,
                    "category": it.get("hubCtgryLclsNm") or "",
                    "categorySub": sub,
                    "sigungu": it.get("signguNm") or "",
                    "rank": rank,
                    "_score": rank + cat_penalty.get(sub, 0),
                    "mapX": it.get("mapX"),
                    "mapY": it.get("mapY"),
                    "image": (
                        it.get("firstimage")
                        or it.get("firstimage2")
                        or it.get("hubTatsImg")
                        or ""
                    ),
                }
            )

    # 카테고리 가중치 + 시·군·구 순위 순으로 정렬
    spots.sort(key=lambda x: (x["_score"], x["rank"], x["name"]))
    for s in spots:
        s.pop("_score", None)
    spots = spots[:limit]
    return {
        "sido": sido_name,
        "baseYm": base_ym,
        "count": len(spots),
        "spots": spots,
        "available": True,
    }
