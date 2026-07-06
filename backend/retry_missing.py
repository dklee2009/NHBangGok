"""
4개 누락 로고 재시도 스크립트
"""
import asyncio
import os
import requests
from urllib.parse import urljoin
from playwright.async_api import async_playwright

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "logos")

MISSING = [
    ("대구광역시 중구",  "22010", [
        "https://www.jung.daegu.kr",
        "https://junggu.daegu.go.kr",
    ]),
    ("광주광역시 북구",  "24040", [
        "https://www.bukgu.gwangju.kr",
        "https://buk.gwangju.go.kr",
        "https://bukgu.gwangju.go.kr",
    ]),
    ("충청남도 아산시",  "34040", [
        "https://www.asan.go.kr",
    ]),
    ("경상남도 통영시",  "38050", [
        "https://www.tongyeong.go.kr",
        "https://www.city.tongyeong.go.kr",
    ]),
]

FIND_LOGO_JS = r"""
() => {
    const candidates = [];
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


def download_image(url, code):
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"}
    try:
        resp = requests.get(url, headers=headers, timeout=15, stream=True)
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
    except Exception as e:
        return None


async def try_site(context, url, code):
    try:
        page = await context.new_page()
        await page.goto(url, timeout=20000, wait_until="domcontentloaded")
        await asyncio.sleep(3)
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
        return False, f"다운로드 실패: {logo_url}"
    except Exception as e:
        return False, f"{type(e).__name__}: {str(e)[:80]}"


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            locale="ko-KR",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        )
        for label, code, urls in MISSING:
            for ext in (".svg", ".png", ".gif", ".jpg"):
                if os.path.exists(os.path.join(OUTPUT_DIR, code + ext)):
                    print(f"  [SKIP] {label} ({code})")
                    break
            else:
                ok = False
                for url in urls:
                    ok, msg = await try_site(context, url, code)
                    if ok:
                        print(f"  [OK]   {label} ({code}) -> {msg}")
                        break
                    else:
                        print(f"  [FAIL] {label} ({code}) @ {url} - {msg}")
                if not ok:
                    print(f"  [GIVE UP] {label} ({code})")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
