import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SigunguMap from "../components/SigunguMap";
import SigunguCard from "../components/SigunguCard";
import { useStamps } from "../hooks/useStamps";
import "./SigunguPage.css";

const SIDO_CODE = {
  "서울특별시":"11","부산광역시":"21","대구광역시":"22","인천광역시":"23",
  "광주광역시":"24","대전광역시":"25","울산광역시":"26","세종특별자치시":"29",
  "경기도":"31","강원특별자치도":"32","충청북도":"33","충청남도":"34",
  "전북특별자치도":"35","전라남도":"36","경상북도":"37","경상남도":"38","제주특별자치도":"39",
};

let cachedSigunguData = null;

export default function SigunguPage() {
  const { sidoName } = useParams();
  const decodedSido = decodeURIComponent(sidoName);
  const navigate = useNavigate();

  const [view, setView] = useState("map");
  const [sigungus, setSigungus] = useState([]); // [{ name, code, name_eng }, ...]

  const {
    hasSigunguVisited,
    getSigunguStampCount,
    getSidoStampCount,
    getVisitedSigungus,
  } = useStamps();

  useEffect(() => {
    async function load() {
      if (!cachedSigunguData) {
        const res = await fetch("/korea-sigungu.json");
        cachedSigunguData = await res.json();
      }
      const sidoCode = SIDO_CODE[decodedSido];
      const list = cachedSigunguData.features
        .filter((f) => f.properties.sido_code === sidoCode)
        .map((f) => ({
          name: f.properties.name,
          code: f.properties.code,
          name_eng: f.properties.name_eng,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "ko"));
      setSigungus(list);
    }
    load();
  }, [decodedSido]);

  const unitLabel = decodedSido.endsWith("도") ? "시/군" : "구";
  const sidoStampCount = getSidoStampCount(decodedSido);
  const visitedCount = getVisitedSigungus(decodedSido).length;

  const handleClick = (sigungu) => {
    navigate(`/city/${encodeURIComponent(decodedSido)}/${encodeURIComponent(sigungu.name)}`);
  };

  return (
    <div className="sigungu-page">
      <header className="sigungu-header">
        <button className="back-btn" onClick={() => navigate("/")}>
          ← 전국
        </button>
        <div className="sigungu-title-area">
          <h1 className="sigungu-title">{decodedSido}</h1>
          <span className="sigungu-subtitle">
            {visitedCount}/{sigungus.length} {unitLabel} 방문
          </span>
        </div>
        <div className="sigungu-stamp-info">
          <span className="stamp-badge">{sidoStampCount}개 완료</span>
        </div>
      </header>

      {/* 뷰 토글 */}
      <div className="view-toggle">
        <button
          className={`toggle-btn ${view === "map" ? "active" : ""}`}
          onClick={() => setView("map")}
        >
          🗺 지도
        </button>
        <button
          className={`toggle-btn ${view === "grid" ? "active" : ""}`}
          onClick={() => setView("grid")}
        >
          ☰ 목록
        </button>
      </div>

      {/* 지도 뷰 */}
      {view === "map" && (
        <div className="map-section">
          <SigunguMap
            sidoName={decodedSido}
            hasSigunguVisited={hasSigunguVisited}
            getSigunguStampCount={getSigunguStampCount}
          />
          <p className="guide-text">{unitLabel}를 클릭해 농협은행을 확인하세요</p>
        </div>
      )}

      {/* 그리드 뷰 */}
      {view === "grid" && (
        <div className="grid-section">
          <p className="grid-hint">가나다순 · {sigungus.length}개 {unitLabel}</p>
          <div className="sigungu-grid">
            {sigungus.map((sg) => (
              <SigunguCard
                key={sg.code}
                sigungu={sg}
                isVisited={hasSigunguVisited(decodedSido, sg.name)}
                stampCount={getSigunguStampCount(decodedSido, sg.name)}
                onClick={() => handleClick(sg)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
