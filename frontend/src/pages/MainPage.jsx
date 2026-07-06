import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import KoreaMap from "../components/KoreaMap";
import SidoCard from "../components/SidoCard";
import { useStamps } from "../hooks/useStamps";
import "./MainPage.css";

const SIDO_LIST = [
  { name: "서울특별시",     code: "11", short: "서울" },
  { name: "부산광역시",     code: "21", short: "부산" },
  { name: "대구광역시",     code: "22", short: "대구" },
  { name: "인천광역시",     code: "23", short: "인천" },
  { name: "광주광역시",     code: "24", short: "광주" },
  { name: "대전광역시",     code: "25", short: "대전" },
  { name: "울산광역시",     code: "26", short: "울산" },
  { name: "세종특별자치시", code: "29", short: "세종" },
  { name: "경기도",         code: "31", short: "경기" },
  { name: "강원특별자치도", code: "32", short: "강원" },
  { name: "충청북도",       code: "33", short: "충북" },
  { name: "충청남도",       code: "34", short: "충남" },
  { name: "전북특별자치도", code: "35", short: "전북" },
  { name: "전라남도",       code: "36", short: "전남" },
  { name: "경상북도",       code: "37", short: "경북" },
  { name: "경상남도",       code: "38", short: "경남" },
  { name: "제주특별자치도", code: "39", short: "제주" },
];

export default function MainPage() {
  const [view, setView] = useState("map");
  const navigate = useNavigate();
  const { hasSidoVisited, getSidoStampCount, getTotalStamps, getVisitedSidos } = useStamps();

  const totalStamps = getTotalStamps();
  const visitedSidos = getVisitedSidos();

  const handleSidoClick = (sido) => {
    navigate(`/sido/${encodeURIComponent(sido.name)}`);
  };

  return (
    <div className="main-page">
      <header className="main-header">
        <div className="logo-area">
          <img src="/cyber_symbol.gif" alt="NH" className="header-nh-mark" />
          <div>
            <h1 className="logo-title">NH 스탬프 투어</h1>
            <p className="logo-sub">전국 농협은행 방문 기록</p>
          </div>
        </div>
        <div className="stamp-summary">
          <div className="summary-item">
            <span className="summary-num">{totalStamps}</span>
            <span className="summary-label">총 도장</span>
          </div>
          <div className="summary-divider" />
          <div className="summary-item">
            <span className="summary-num">{visitedSidos.length}</span>
            <span className="summary-label">방문 지역</span>
          </div>
        </div>
      </header>

      {/* 뷰 토글 */}
      <div className="main-view-toggle">
        <button
          className={`main-toggle-btn ${view === "map" ? "active" : ""}`}
          onClick={() => setView("map")}
        >
          🗺 지도
        </button>
        <button
          className={`main-toggle-btn ${view === "grid" ? "active" : ""}`}
          onClick={() => setView("grid")}
        >
          ☰ 목록
        </button>
      </div>

      {/* 지도 뷰 */}
      {view === "map" && (
        <>
          <div className="map-section">
            <KoreaMap visited={hasSidoVisited} getStampCount={getSidoStampCount} />
          </div>
          <div className="guide-section">
            <p className="guide-text">지도에서 시/도를 클릭해 시/군/구를 선택하세요</p>
            <div className="legend">
              <span className="legend-item">
                <span className="legend-box unvisited" /> 미방문
              </span>
              <span className="legend-item">
                <span className="legend-box visited" /> 방문 완료
              </span>
            </div>
          </div>
        </>
      )}

      {/* 목록 뷰 */}
      {view === "grid" && (
        <div className="sido-grid-section">
          <p className="grid-hint">전국 17개 시/도</p>
          <div className="sido-grid">
            {SIDO_LIST.map((sido) => (
              <SidoCard
                key={sido.code}
                sido={sido}
                isVisited={hasSidoVisited(sido.name)}
                stampCount={getSidoStampCount(sido.name)}
                onClick={() => handleSidoClick(sido)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 방문 지역 요약 (지도 뷰에서만) */}
      {view === "map" && visitedSidos.length > 0 && (
        <div className="visited-list">
          <h2 className="visited-title">방문한 지역</h2>
          <div className="visited-chips">
            {visitedSidos.map((sido) => (
              <span key={sido} className="visited-chip">
                {sido} ({getSidoStampCount(sido)}개)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
