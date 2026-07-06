# NH 농협은행 스탬프 투어

전국 농협은행 방문 기록 웹앱

## 시작하기

### 1. API 키 설정

**네이버 Maps:**
`frontend/index.html` 에서 `YOUR_NAVER_CLIENT_ID` 를 실제 Client ID로 교체

```html
src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=실제_CLIENT_ID&submodules=geocoder"
```

**공공데이터포털:**
`backend/.env` 파일에 API 키 입력

```
PUBLIC_DATA_API_KEY=실제_API_키
```

### 2. 백엔드 실행

```bash
cd backend
source ../venv/Scripts/activate   # Windows
uvicorn main:app --reload --port 8000
```

### 3. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속

## 기능

- 한국 시/도 단위 SVG 지도 (방문한 지역 색칠)
- 네이버맵으로 시/도 상세 지도 + 농협은행 마커
- GPS 100m 이내 감지 시 도장찍기 활성화
- localStorage 방문 기록 저장
