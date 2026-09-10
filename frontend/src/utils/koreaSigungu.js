// 시/도 이름 → sido_code (korea-sigungu.json 매칭용)
export const SIDO_CODE = {
  "서울특별시": "11", "부산광역시": "21", "대구광역시": "22", "인천광역시": "23",
  "광주광역시": "24", "대전광역시": "25", "울산광역시": "26", "세종특별자치시": "29",
  "경기도": "31", "강원특별자치도": "32", "충청북도": "33", "충청남도": "34",
  "전북특별자치도": "35", "전라남도": "36", "경상북도": "37", "경상남도": "38", "제주특별자치도": "39",
};

// 서울 구 목록과 전국 지도 마커에서 순서대로 번갈아 쓰는 한복 컨셉 마스코트
export const MASCOT_LIST = [
  "/chars/mascots/dino.png",
  "/chars/mascots/duck.png",
  "/chars/mascots/dog.png",
  "/chars/mascots/pig.png",
  "/chars/mascots/elephant.png",
];

let cachedSigunguData = null;

async function loadSigunguData() {
  if (!cachedSigunguData) {
    const res = await fetch("/korea-sigungu.json");
    cachedSigunguData = await res.json();
  }
  return cachedSigunguData;
}

// 특정 시/도의 시군구 목록을 구 목록 화면과 동일한 가나다순으로 반환
export async function getSigunguList(sidoName) {
  const data = await loadSigunguData();
  const sidoCode = SIDO_CODE[sidoName];
  if (!sidoCode) return [];
  return data.features
    .filter((f) => f.properties.sido_code === sidoCode)
    .map((f) => ({
      name: f.properties.name,
      code: f.properties.code,
      name_eng: f.properties.name_eng,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}
