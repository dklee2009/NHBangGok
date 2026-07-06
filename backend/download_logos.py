"""
시/군/구 공식 로고 다운로더
각 지자체 공식 홈페이지에서 로고를 크롤링해 frontend/public/logos/ 에 저장
"""

import requests
from bs4 import BeautifulSoup
import os
import re
import json
import time
from urllib.parse import urljoin, urlparse

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "logos")
GEOJSON_PATH = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "korea-sigungu.json")

os.makedirs(OUTPUT_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
}

# (시도, 시군구) → 공식 도메인
DOMAIN_MAP = {
    # 서울특별시
    ("서울특별시", "종로구"): "https://www.jongno.go.kr",
    ("서울특별시", "중구"): "https://www.junggu.seoul.kr",
    ("서울특별시", "강남구"): "https://www.gangnam.go.kr",
    ("서울특별시", "서초구"): "https://www.seocho.go.kr",
    ("서울특별시", "마포구"): "https://www.mapo.go.kr",
    ("서울특별시", "영등포구"): "https://www.ydp.go.kr",
    ("서울특별시", "송파구"): "https://www.songpa.go.kr",
    ("서울특별시", "성동구"): "https://www.sd.go.kr",
    ("서울특별시", "광진구"): "https://www.gwangjin.go.kr",
    ("서울특별시", "노원구"): "https://www.nowon.go.kr",
    # 부산광역시
    ("부산광역시", "중구"): "https://www.bsjunggu.go.kr",
    ("부산광역시", "부산진구"): "https://www.busanjin.go.kr",
    ("부산광역시", "해운대구"): "https://www.haeundae.go.kr",
    ("부산광역시", "사하구"): "https://www.saha.go.kr",
    ("부산광역시", "금정구"): "https://www.geumjeong.go.kr",
    ("부산광역시", "강서구"): "https://www.bsgangseo.go.kr",
    # 대구광역시
    ("대구광역시", "중구"): "https://www.dgjunggu.go.kr",
    ("대구광역시", "수성구"): "https://www.suseong.go.kr",
    ("대구광역시", "달서구"): "https://www.dalseo.go.kr",
    ("대구광역시", "북구"): "https://www.buk.daegu.go.kr",
    # 인천광역시
    ("인천광역시", "중구"): "https://www.icjunggu.go.kr",
    ("인천광역시", "부평구"): "https://www.bupyeong.go.kr",
    ("인천광역시", "연수구"): "https://www.yeonsu.go.kr",
    ("인천광역시", "남동구"): "https://www.namdong.go.kr",
    ("인천광역시", "서구"): "https://www.seo.incheon.kr",
    # 광주광역시
    ("광주광역시", "동구"): "https://www.donggu.gwangju.kr",
    ("광주광역시", "서구"): "https://www.seogu.gwangju.kr",
    ("광주광역시", "북구"): "https://www.bukgu.gwangju.kr",
    ("광주광역시", "광산구"): "https://www.gwangsan.go.kr",
    ("광주광역시", "남구"): "https://www.namgu.gwangju.kr",
    # 대전광역시
    ("대전광역시", "중구"): "https://www.djjunggu.go.kr",
    ("대전광역시", "서구"): "https://www.djs.go.kr",
    ("대전광역시", "유성구"): "https://www.yuseong.go.kr",
    ("대전광역시", "동구"): "https://www.donggu.daejeon.kr",
    ("대전광역시", "대덕구"): "https://www.daedeok.go.kr",
    # 울산광역시
    ("울산광역시", "남구"): "https://www.ulsannamgu.go.kr",
    ("울산광역시", "중구"): "https://www.ulsanjunggu.go.kr",
    ("울산광역시", "북구"): "https://www.bukgu.ulsan.kr",
    ("울산광역시", "동구"): "https://www.donggu.ulsan.kr",
    # 세종특별자치시
    ("세종특별자치시", "세종시"): "https://www.sejong.go.kr",
    # 경기도
    ("경기도", "수원시"): "https://www.suwon.go.kr",
    ("경기도", "성남시"): "https://www.seongnam.go.kr",
    ("경기도", "고양시"): "https://www.goyang.go.kr",
    ("경기도", "부천시"): "https://www.bucheon.go.kr",
    ("경기도", "안양시"): "https://www.anyang.go.kr",
    ("경기도", "용인시"): "https://www.yongin.go.kr",
    ("경기도", "화성시"): "https://www.hwaseong.go.kr",
    ("경기도", "평택시"): "https://www.pyeongtaek.go.kr",
    ("경기도", "광명시"): "https://www.gwangmyeong.go.kr",
    # 강원특별자치도
    ("강원특별자치도", "춘천시"): "https://www.chuncheon.go.kr",
    ("강원특별자치도", "강릉시"): "https://www.gangneung.go.kr",
    ("강원특별자치도", "원주시"): "https://www.wonju.go.kr",
    ("강원특별자치도", "속초시"): "https://www.sokcho.go.kr",
    ("강원특별자치도", "동해시"): "https://www.donghae.go.kr",
    # 충청북도
    ("충청북도", "청주시"): "https://www.cheongju.go.kr",
    ("충청북도", "충주시"): "https://www.chungju.go.kr",
    ("충청북도", "제천시"): "https://www.jecheon.go.kr",
    # 충청남도
    ("충청남도", "천안시"): "https://www.cheonan.go.kr",
    ("충청남도", "아산시"): "https://www.asan.go.kr",
    ("충청남도", "홍성군"): "https://www.hongseong.go.kr",
    ("충청남도", "공주시"): "https://www.gongju.go.kr",
    ("충청남도", "서산시"): "https://www.seosan.go.kr",
    # 전북특별자치도
    ("전북특별자치도", "전주시"): "https://www.jeonju.go.kr",
    ("전북특별자치도", "익산시"): "https://www.iksan.go.kr",
    ("전북특별자치도", "군산시"): "https://www.gunsan.go.kr",
    ("전북특별자치도", "정읍시"): "https://www.jeongeup.go.kr",
    # 전라남도
    ("전라남도", "목포시"): "https://www.mokpo.go.kr",
    ("전라남도", "여수시"): "https://www.yeosu.go.kr",
    ("전라남도", "순천시"): "https://www.suncheon.go.kr",
    ("전라남도", "나주시"): "https://www.naju.go.kr",
    # 경상북도
    ("경상북도", "포항시"): "https://www.pohang.go.kr",
    ("경상북도", "경주시"): "https://www.gyeongju.go.kr",
    ("경상북도", "구미시"): "https://www.gumi.go.kr",
    ("경상북도", "안동시"): "https://www.andong.go.kr",
    ("경상북도", "영주시"): "https://www.yeongju.go.kr",
    # 경상남도
    ("경상남도", "창원시"): "https://www.changwon.go.kr",
    ("경상남도", "진주시"): "https://www.jinju.go.kr",
    ("경상남도", "통영시"): "https://www.tongyeong.go.kr",
    ("경상남도", "거제시"): "https://www.geoje.go.kr",
    ("경상남도", "김해시"): "https://www.gimhae.go.kr",
    # 제주특별자치도
    ("제주특별자치도", "제주시"): "https://www.jeju.go.kr",
    ("제주특별자치도", "서귀포시"): "https://www.seogwipo.go.kr",
}

# 시군구 한국어 이름 → GeoJSON 코드 매핑 (나중에 GeoJSON에서 읽어옴)
NAME_TO_CODE = {}


def load_sigungu_codes():
    """GeoJSON에서 이름 → 코드 매핑 로드"""
    if not os.path.exists(GEOJSON_PATH):
        print(f"[WARN] GeoJSON 파일 없음: {GEOJSON_PATH}")
        return
    with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    for feat in data["features"]:
        props = feat["properties"]
        key = (props.get("sido_name", ""), props.get("name", ""))
        NAME_TO_CODE[props.get("name", "")] = props.get("code", "")
        # 시도별 중복 구분을 위해 (sido_code, name) 도 저장
        NAME_TO_CODE[(props.get("sido_code", ""), props.get("name", ""))] = props.get("code", "")
    print(f"[INFO] {len(NAME_TO_CODE)} 개 시군구 코드 로드")


SIDO_CODE_MAP = {
    "서울특별시": "11", "부산광역시": "21", "대구광역시": "22", "인천광역시": "23",
    "광주광역시": "24", "대전광역시": "25", "울산광역시": "26", "세종특별자치시": "29",
    "경기도": "31", "강원특별자치도": "32", "충청북도": "33", "충청남도": "34",
    "전북특별자치도": "35", "전라남도": "36", "경상북도": "37", "경상남도": "38",
    "제주특별자치도": "39",
}


def get_code(sido, sigungu):
    sido_code = SIDO_CODE_MAP.get(sido, "")
    return NAME_TO_CODE.get((sido_code, sigungu)) or NAME_TO_CODE.get(sigungu)


def find_logo_in_html(html, base_url):
    """HTML에서 로고 이미지 URL 추출"""
    soup = BeautifulSoup(html, "lxml")

    candidates = []

    # 전략 1: alt/class/id/src에 "logo" or "로고" 포함한 img
    for img in soup.find_all("img"):
        src = img.get("src", "")
        alt = img.get("alt", "").lower()
        cls = " ".join(img.get("class", [])).lower()
        img_id = img.get("id", "").lower()

        score = 0
        if "logo" in src.lower():
            score += 3
        if "로고" in alt or "logo" in alt:
            score += 2
        if "logo" in cls or "logo" in img_id:
            score += 2
        # 헤더 안에 있는 이미지 가중치
        parent = img.parent
        for _ in range(5):
            if parent is None:
                break
            p_cls = " ".join(parent.get("class", [])).lower() if hasattr(parent, "get") else ""
            p_id = parent.get("id", "").lower() if hasattr(parent, "get") else ""
            if any(k in p_cls or k in p_id for k in ["header", "logo", "top", "gnb", "lnb"]):
                score += 1
            parent = parent.parent if hasattr(parent, "parent") else None

        if score > 0 and src:
            candidates.append((score, src))

    # 전략 2: <a> href='/' 또는 홈링크 내부 img
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href in ("/", "", "#", "javascript:void(0)") or re.match(r'^https?://', href):
            for img in a.find_all("img"):
                src = img.get("src", "")
                if src:
                    candidates.append((1, src))

    if not candidates:
        return None

    # 점수 높은 순 정렬
    candidates.sort(key=lambda x: -x[0])

    # SVG, PNG, GIF, JPG 확장자 우선
    for score, src in candidates:
        ext = src.lower().split("?")[0].split(".")[-1]
        if ext in ("svg", "png", "gif", "jpg", "jpeg", "webp"):
            full_url = urljoin(base_url, src)
            return full_url

    return urljoin(base_url, candidates[0][1])


def download_image(url, save_path_no_ext):
    """이미지 다운로드 후 확장자 결정해서 저장"""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10, stream=True)
        if resp.status_code != 200:
            return None

        content_type = resp.headers.get("Content-Type", "")
        if "svg" in content_type or url.lower().endswith(".svg"):
            ext = ".svg"
        elif "png" in content_type or url.lower().endswith(".png"):
            ext = ".png"
        elif "gif" in content_type or url.lower().endswith(".gif"):
            ext = ".gif"
        elif "jpeg" in content_type or "jpg" in content_type or url.lower().endswith((".jpg", ".jpeg")):
            ext = ".jpg"
        elif "webp" in content_type or url.lower().endswith(".webp"):
            ext = ".webp"
        else:
            # 내용 보고 판단
            content = b""
            for chunk in resp.iter_content(8192):
                content += chunk
                if len(content) > 100:
                    break
            if content.startswith(b"<svg") or content.startswith(b"<?xml"):
                ext = ".svg"
            elif content.startswith(b"\x89PNG"):
                ext = ".png"
            elif content.startswith(b"GIF"):
                ext = ".gif"
            elif content.startswith(b"\xff\xd8"):
                ext = ".jpg"
            else:
                ext = ".png"  # 기본값

        save_path = save_path_no_ext + ext
        with open(save_path, "wb") as f:
            for chunk in resp.iter_content(8192):
                f.write(chunk)

        size = os.path.getsize(save_path)
        if size < 200:  # 너무 작으면 오류 페이지
            os.remove(save_path)
            return None

        return save_path
    except Exception as e:
        return None


def process_municipality(sido, sigungu, domain_url, code):
    save_path_no_ext = os.path.join(OUTPUT_DIR, code)

    # 이미 다운로드된 파일이 있으면 스킵
    for ext in (".svg", ".png", ".gif", ".jpg", ".jpeg", ".webp"):
        if os.path.exists(save_path_no_ext + ext):
            print(f"  [SKIP] {sido} {sigungu} ({code}) - 이미 있음")
            return True

    try:
        resp = requests.get(domain_url, headers=HEADERS, timeout=12, allow_redirects=True)
        if resp.status_code not in (200, 301, 302):
            print(f"  [FAIL] {sido} {sigungu} - HTTP {resp.status_code}")
            return False

        final_url = resp.url
        logo_url = find_logo_in_html(resp.text, final_url)

        if not logo_url:
            print(f"  [FAIL] {sido} {sigungu} - 로고 URL 못 찾음")
            return False

        saved = download_image(logo_url, save_path_no_ext)
        if saved:
            size = os.path.getsize(saved)
            print(f"  [OK]   {sido} {sigungu} ({code}) → {os.path.basename(saved)} ({size} bytes)")
            return True
        else:
            print(f"  [FAIL] {sido} {sigungu} - 이미지 다운로드 실패: {logo_url}")
            return False

    except Exception as e:
        print(f"  [ERR]  {sido} {sigungu} - {e}")
        return False


def main():
    load_sigungu_codes()

    success = 0
    fail = 0

    for (sido, sigungu), domain_url in DOMAIN_MAP.items():
        code = get_code(sido, sigungu)
        if not code:
            print(f"  [WARN] 코드 없음: {sido} {sigungu}")
            # 코드 없이도 이름으로 저장 시도
            code = f"{sido[:2]}_{sigungu}"

        ok = process_municipality(sido, sigungu, domain_url, code)
        if ok:
            success += 1
        else:
            fail += 1
        time.sleep(0.5)  # 서버 부하 방지

    print(f"\n완료: 성공 {success}, 실패 {fail} (총 {success+fail})")
    print(f"저장 위치: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
