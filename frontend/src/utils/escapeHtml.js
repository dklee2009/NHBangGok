// 지도 마커·말풍선처럼 HTML 문자열로 그리는 곳에 지점/여행지 이름을 넣을 때 사용한다.
// "충주시청<출>"의 <출>이 태그로 해석돼 사라지거나 화면이 깨지는 것을 막는다.
const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}
