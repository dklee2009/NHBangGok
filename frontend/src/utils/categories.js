// 지도에서 찾을 수 있는 NH농협 장소 분류. CityPage의 탭과 백엔드 /api/banks
// 엔드포인트의 category 쿼리 파라미터(bank | mart | gas)가 이 key를 그대로 공유한다.
export const CATEGORIES = [
  { key: "bank", label: "농협은행", icon: "🏦", color: "#008542" },
  { key: "mart", label: "하나로마트", icon: "🛒", color: "#e67e22" },
  { key: "gas", label: "농협주유소", icon: "⛽", color: "#1565c0" },
];

export const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));
