// 배포 시 Render 등에서 VITE_API_URL 환경변수로 백엔드 주소를 지정.
// 로컬 개발 환경에서는 기본값으로 로컬 백엔드를 사용.
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
