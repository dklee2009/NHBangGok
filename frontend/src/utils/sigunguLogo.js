// 시/도 코드 → 파일명 prefix 번호 매핑
const SIDO_NUM = {
  "11": "01", "21": "02", "22": "03", "23": "04", "24": "05",
  "25": "06", "26": "07", "29": "08", "31": "09", "32": "10",
  "33": "11", "34": "12", "35": "13", "36": "14", "37": "15",
  "38": "16", "39": "17",
};

/**
 * 시군구 name_eng + code → Wikipedia Commons 로고 URL 생성
 * 파일명 형식: {도번호}-{순번}-{slug}-ko.svg
 */
export function getSigunguLogoUrl(code, nameEng) {
  if (!code || !nameEng) return null;
  const sidoCode = code.slice(0, 2);
  const sidoNum = SIDO_NUM[sidoCode];
  if (!sidoNum) return null;

  const districtNum = Math.floor(parseInt(code.slice(2), 10) / 10);
  const districtStr = String(districtNum).padStart(2, "0");

  // slug: 소문자 변환 → 하이픈 제거 → 행정 접미사 제거
  const slug = nameEng
    .toLowerCase()
    .replace(/-/g, "")
    .replace(/\s/g, "")
    .replace(/(gu|si|gun|do|city|province|special|metropolitan|autonomous|selfgoverning)$/g, "");

  const filename = `${sidoNum}-${districtStr}-${slug}-ko.svg`;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;
}

/**
 * 이름 첫 글자 기반 색상 생성 (폴백용)
 */
export function getInitialColor(name) {
  if (!name) return "#78909c";
  const colors = [
    "#1565c0","#00838f","#2e7d32","#6a1b9a","#c62828",
    "#e65100","#0277bd","#00695c","#558b2f","#4527a0",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
