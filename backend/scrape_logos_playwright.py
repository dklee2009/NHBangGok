"""
Playwright 기반 지자체 로고 스크래퍼 (개선판)
- img 태그 + CSS background-image 모두 탐지
"""

import asyncio
import os
import json
import requests
from urllib.parse import urljoin

from playwright.async_api import async_playwright

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "logos")
GEOJSON_PATH = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "korea-sigungu.json")

os.makedirs(OUTPUT_DIR, exist_ok=True)

SIDO_CODE_MAP = {
    "서울특별시": "11", "부산광역시": "21", "대구광역시": "22", "인천광역시": "23",
    "광주광역시": "24", "대전광역시": "25", "울산광역시": "26", "세종특별자치시": "29",
    "경기도": "31", "강원특별자치도": "32", "충청북도": "33", "충청남도": "34",
    "전북특별자치도": "35", "전라남도": "36", "경상북도": "37", "경상남도": "38",
    "제주특별자치도": "39",
}

DOMAIN_MAP = [
    ("서울특별시", "종로구",   "https://www.jongno.go.kr"),
    ("서울특별시", "중구",     "https://www.junggu.seoul.kr"),
    ("서울특별시", "강남구",   "https://www.gangnam.go.kr"),
    ("서울특별시", "서초구",   "https://www.seocho.go.kr"),
    ("서울특별시", "마포구",   "https://www.mapo.go.kr"),
    ("서울특별시", "영등포구", "https://www.ydp.go.kr"),
    ("서울특별시", "송파구",   "https://www.songpa.go.kr"),
    ("서울특별시", "성동구",   "https://www.sd.go.kr"),
    ("서울특별시", "광진구",   "https://www.gwangjin.go.kr"),
    ("서울특별시", "노원구",   "https://www.nowon.go.kr"),
    ("부산광역시", "중구",     "https://www.bsjunggu.go.kr"),
    ("부산광역시", "부산진구", "https://www.busanjin.go.kr"),
    ("부산광역시", "해운대구", "https://www.haeundae.go.kr"),
    ("부산광역시", "사하구",   "https://www.saha.go.kr"),
    ("부산광역시", "금정구",   "https://www.geumjeong.go.kr"),
    ("부산광역시", "강서구",   "https://www.bsgangseo.go.kr"),
    ("대구광역시", "중구",     "https://www.dgjunggu.go.kr"),
    ("대구광역시", "수성구",   "https://www.suseong.go.kr"),
    ("대구광역시", "달서구",   "https://www.dalseo.go.kr"),
    ("대구광역시", "북구",     "https://www.buk.daegu.go.kr"),
    ("인천광역시", "중구",     "https://www.icjunggu.go.kr"),
    ("인천광역시", "부평구",   "https://www.bupyeong.go.kr"),
    ("인천광역시", "연수구",   "https://www.yeonsu.go.kr"),
    ("인천광역시", "남동구",   "https://www.namdong.go.kr"),
    ("인천광역시", "서구",     "https://www.seo.incheon.kr"),
    ("광주광역시", "동구",     "https://www.donggu.gwangju.kr"),
    ("광주광역시", "서구",     "https://www.seogu.gwangju.kr"),
    ("광주광역시", "북구",     "https://www.bukgu.gwangju.kr"),
    ("광주광역시", "광산구",   "https://www.gwangsan.go.kr"),
    ("광주광역시", "남구",     "https://www.namgu.gwangju.kr"),
    ("대전광역시", "중구",     "https://www.djjunggu.go.kr"),
    ("대전광역시", "서구",     "https://www.djs.go.kr"),
    ("대전광역시", "유성구",   "https://www.yuseong.go.kr"),
    ("대전광역시", "동구",     "https://www.donggu.daejeon.kr"),
    ("대전광역시", "대덕구",   "https://www.daedeok.go.kr"),
    ("울산광역시", "남구",     "https://www.ulsannamgu.go.kr"),
    ("울산광역시", "중구",     "https://www.ulsanjunggu.go.kr"),
    ("울산광역시", "북구",     "https://www.bukgu.ulsan.kr"),
    ("울산광역시", "동구",     "https://www.donggu.ulsan.kr"),
    ("세종특별자치시", "세종시", "https://www.sejong.go.kr"),
    ("경기도", "수원시",   "https://www.suwon.go.kr"),
    ("경기도", "성남시",   "https://www.seongnam.go.kr"),
    ("경기도", "고양시",   "https://www.goyang.go.kr"),
    ("경기도", "부천시",   "https://www.bucheon.go.kr"),
    ("경기도", "안양시",   "https://www.anyang.go.kr"),
    ("경기도", "용인시",   "https://www.yongin.go.kr"),
    ("경기도", "화성시",   "https://www.hwaseong.go.kr"),
    ("경기도", "평택시",   "https://www.pyeongtaek.go.kr"),
    ("경기도", "광명시",   "https://www.gwangmyeong.go.kr"),
    ("강원특별자치도", "춘천시", "https://www.chuncheon.go.kr"),
    ("강원특별자치도", "강릉시", "https://www.gangneung.go.kr"),
    ("강원특별자치도", "원주시", "https://www.wonju.go.kr"),
    ("강원특별자치도", "속초시", "https://www.sokcho.go.kr"),
    ("강원특별자치도", "동해시", "https://www.donghae.go.kr"),
    ("충청북도", "청주시", "https://www.cheongju.go.kr"),
    ("충청북도", "충주시", "https://www.chungju.go.kr"),
    ("충청북도", "제천시", "https://www.jecheon.go.kr"),
    ("충청남도", "천안시", "https://www.cheonan.go.kr"),
    ("충청남도", "아산시", "https://www.asan.go.kr"),
    ("충청남도", "홍성군", "https://www.hongseong.go.kr"),
    ("충청남도", "공주시", "https://www.gongju.go.kr"),
    ("충청남도", "서산시", "https://www.seosan.go.kr"),
    ("전북특별자치도", "전주시", "https://www.jeonju.go.kr"),
    ("전북특별자치도", "익산시", "https://www.iksan.go.kr"),
    ("전북특별자치도", "군산시", "https://www.gunsan.go.kr"),
    ("전북특별자치도", "정읍시", "https://www.jeongeup.go.kr"),
    ("전라남도", "목포시", "https://www.mokpo.go.kr"),
    ("전라남도", "여수시", "https://www.yeosu.go.kr"),
    ("전라남도", "순천시", "https://www.suncheon.go.kr"),
    ("전라남도", "나주시", "https://www.naju.go.kr"),
    ("경상북도", "포항시", "https://www.pohang.go.kr"),
    ("경상북도", "경주시", "https://www.gyeongju.go.kr"),
    ("경상북도", "구미시", "https://www.gumi.go.kr"),
    ("경상북도", "안동시", "https://www.andong.go.kr"),
    ("경상북도", "영주시", "https://www.yeongju.go.kr"),
    ("경상남도", "창원시", "https://www.changwon.go.kr"),
    ("경상남도", "진주시", "https://www.jinju.go.kr"),
    ("경상남도", "통영시", "https://www.tongyeong.go.kr"),
    ("경상남도", "거제시", "https://www.geoje.go.kr"),
    ("경상남도", "김해시", "https://www.gimhae.go.kr"),
    ("제주특별자치도", "제주시",   "https://www.jeju.go.kr"),
    ("제주특별자치도", "서귀포시", "https://www.seogwipo.go.kr"),
]


def load_code_map():
    mapping = {}
    if not os.path.exists(GEOJSON_PATH):
        return mapping
    with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    for feat in data["features"]:
        p = feat["properties"]
        key = (p.get("sido_code", ""), p.get("name", ""))
        mapping[key] = p.get("code", "")
    return mapping


def get_code(code_map, sido, sigungu):
    sido_code = SIDO_CODE_MAP.get(sido, "")
    return code_map.get((sido_code, sigungu), f"{sido_code}_{sigungu}")


def already_downloaded(code):
    for ext in (".svg", ".png", ".gif", ".jpg", ".jpeg", ".webp"):
        if os.path.exists(os.path.join(OUTPUT_DIR, code + ext)):
            return True
    return False


def download_image(url, code):
    headers = {"User-Agent": "Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36"}
    try:
        resp = requests.get(url, headers=headers, timeout=10, stream=True)
        if resp.status_code != 200:
            return None
        ct = resp.headers.get("Content-Type", "")
        if "svg" in ct or url.lower().split("?")[0].endswith(".svg"):
            ext = ".svg"
        elif "png" in ct or url.lower().split("?")[0].endswith(".png"):
            ext = ".png"
        elif "gif" in ct or url.lower().split("?")[0].endswith(".gif"):
            ext = ".gif"
        elif "jpeg" in ct or "jpg" in ct:
            ext = ".jpg"
        elif "webp" in ct:
            ext = ".webp"
        else:
            chunk = b""
            for c in resp.iter_content(8192):
                chunk += c
                if len(chunk) > 50:
                    break
            if chunk.startswith(b"<") or b"<svg" in chunk[:300]:
                ext = ".svg"
            elif chunk.startswith(b"\x89PNG"):
                ext = ".png"
            elif chunk.startswith(b"GIF"):
                ext = ".gif"
            elif chunk.startswith(b"\xff\xd8"):
                ext = ".jpg"
            else:
                ext = ".png"

        save_path = os.path.join(OUTPUT_DIR, code + ext)
        with open(save_path, "wb") as f:
            for chunk in resp.iter_content(8192):
                f.write(chunk)
        size = os.path.getsize(save_path)
        if size < 200:
            os.remove(save_path)
            return None
        return save_path, size
    except Exception:
        return None


# JavaScript to extract logo URL (injected into page)
FIND_LOGO_JS = r"""
() => {
    const candidates = [];

    // Strategy 1: img tags with logo-related attributes
    for (const img of document.querySelectorAll('img')) {
        const src = img.src || img.getAttribute('src') || '';
        const alt = (img.alt || '').toLowerCase();
        const cls = (img.className || '').toLowerCase();
        const imgId = (img.id || '').toLowerCase();
        let score = 0;
        if (src.toLowerCase().includes('logo')) score += 4;
        if (alt.includes('로고') || alt.includes('logo')) score += 3;
        if (cls.includes('logo') || imgId.includes('logo')) score += 2;
        let p = img.parentElement;
        for (let i = 0; i < 5 && p; i++) {
            const pc = (p.className || '').toLowerCase();
            const pi = (p.id || '').toLowerCase();
            if (pc.includes('logo') || pi.includes('logo')) score += 2;
            if (pc.includes('header') || pi.includes('header') || p.tagName === 'H1') score += 1;
            p = p.parentElement;
        }
        if (score > 0 && src) candidates.push({score, src});
    }

    // Strategy 2: CSS background-image with 'logo' in URL
    for (const el of document.querySelectorAll('*')) {
        const bg = window.getComputedStyle(el).backgroundImage;
        if (!bg || bg === 'none' || !bg.includes('url')) continue;
        const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
        if (!m) continue;
        const src = m[1];
        let score = 0;
        if (src.toLowerCase().includes('logo')) score += 4;
        const cls = (el.className || '').toLowerCase();
        const elId = (el.id || '').toLowerCase();
        if (cls.includes('logo') || elId.includes('logo')) score += 3;
        if (el.tagName === 'H1' || el.tagName === 'A') score += 1;
        if (score > 0) candidates.push({score, src});
    }

    candidates.sort((a, b) => b.score - a.score);
    const valid_exts = ['svg', 'png', 'gif', 'jpg', 'jpeg', 'webp'];
    for (const c of candidates) {
        const ext = c.src.toLowerCase().split('?')[0].split('.').pop();
        if (valid_exts.includes(ext)) return c.src;
    }
    return candidates.length > 0 ? candidates[0].src : null;
}
"""


async def process_site(browser, sido, sigungu, domain_url, code):
    try:
        page = await browser.new_page()
        await page.goto(domain_url, timeout=20000, wait_until="domcontentloaded")
        await asyncio.sleep(2)

        raw_src = await page.evaluate(FIND_LOGO_JS)
        final_url = page.url
        await page.close()

        if not raw_src:
            return False, "로고 URL 못 찾음"

        logo_url = urljoin(final_url, raw_src)
        result = download_image(logo_url, code)
        if result:
            path, size = result
            return True, f"{os.path.basename(path)} ({size}B)"
        return False, f"이미지 다운로드 실패: {logo_url}"

    except Exception as e:
        return False, f"{type(e).__name__}: {str(e)[:80]}"


async def main():
    code_map = load_code_map()
    success = 0
    fail = 0
    skip = 0

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            locale="ko-KR",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        )

        for sido, sigungu, domain_url in DOMAIN_MAP:
            code = get_code(code_map, sido, sigungu)

            if already_downloaded(code):
                print(f"  [SKIP] {sido} {sigungu} ({code})")
                skip += 1
                continue

            ok, msg = await process_site(context, sido, sigungu, domain_url, code)
            if ok:
                print(f"  [OK]   {sido} {sigungu} ({code}) -> {msg}")
                success += 1
            else:
                print(f"  [FAIL] {sido} {sigungu} ({code}) - {msg}")
                fail += 1

        await browser.close()

    print(f"\n완료: 성공 {success}, 실패 {fail}, 스킵 {skip}")
    print(f"저장 위치: {OUTPUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
