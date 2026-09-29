import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NaverMap from "../components/NaverMap";
import StampButton from "../components/StampButton";
import StampSuccessEffect from "../components/StampSuccessEffect";
import { useStamps } from "../hooks/useStamps";
import { useGeolocation } from "../hooks/useGeolocation";
import { API_BASE } from "../config";
import { shortSido } from "../utils/sido";
import { CATEGORIES, CATEGORY_BY_KEY } from "../utils/categories";
import "./CityPage.css";

export default function CityPage() {
  const { sidoName, sigunguName } = useParams();
  const decodedSido = decodeURIComponent(sidoName);
  const decodedSigungu = decodeURIComponent(sigunguName);
  const navigate = useNavigate();

  const [category, setCategory] = useState("bank");
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  // 바텀시트가 내려가는 동안에도 내용이 유지되도록 마지막으로 선택한 지점을 보관한다.
  const [sheetBranch, setSheetBranch] = useState(null);
  const [showStampEffect, setShowStampEffect] = useState(false);
  const [showTourPrompt, setShowTourPrompt] = useState(false);

  const { addStamp, hasSigunguVisited, getSigunguStampCount, visited } = useStamps();
  const { position, error: geoError, getNearbyBranch, getDistanceToBranch } = useGeolocation();

  const categoryMeta = CATEGORY_BY_KEY[category];
  const STAMP_RADIUS_METERS = 1000;
  const nearbyBranch = getNearbyBranch(branches, STAMP_RADIUS_METERS);
  const sigunguStamps = (visited[decodedSido]?.[decodedSigungu] || []).filter(
    (s) => s.category === category
  );

  // 도장 패널(바텀시트)은 지도에서 지점 마커를 클릭했을 때만 올라오며, 선택한 지점을 기준으로 표시한다.
  // 단, 실제 도장 찍기(위치 인증)는 선택한 지점이 실제로 GPS 반경 이내에 있을 때만 허용한다.
  const displayBranch = selectedBranch || sheetBranch;
  const displayDistance = getDistanceToBranch(displayBranch);
  const canStamp = displayDistance != null && displayDistance <= STAMP_RADIUS_METERS;
  const alreadyStamped = displayBranch
    ? sigunguStamps.some((s) => s.branchId === displayBranch.id)
    : false;

  useEffect(() => {
    setSelectedBranch(null);
    setSheetBranch(null);
    async function fetchBranches() {
      setLoading(true);
      setError(null);
      try {
        const url = `${API_BASE}/api/banks/${encodeURIComponent(decodedSido)}?sigungu=${encodeURIComponent(decodedSigungu)}&category=${category}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("지점 정보를 불러올 수 없습니다.");
        const data = await res.json();
        setBranches(data.branches);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBranches();
  }, [decodedSido, decodedSigungu, category]);

  const handleMarkerClick = useCallback((branch) => {
    setSelectedBranch(branch);
    setSheetBranch(branch);
  }, []);

  const handleMapClick = useCallback(() => {
    setSelectedBranch(null);
  }, []);

  const handleStamp = (sido, branchId, branchName) => {
    return addStamp(sido, decodedSigungu, branchId, branchName, category);
  };

  const handleStampEffect = () => {
    setShowStampEffect(true);
  };

  const handleStampEffectComplete = () => {
    setShowStampEffect(false);
    window.setTimeout(() => setShowTourPrompt(true), 500);
  };

  const dismissTourPrompt = () => setShowTourPrompt(false);

  const goTour = () =>
    navigate(`/tour/${encodeURIComponent(decodedSido)}/${encodeURIComponent(decodedSigungu)}`);

  const stampCount = getSigunguStampCount(decodedSido, decodedSigungu, category);

  const openRecruitment = () => {
    const searchName = decodedSigungu.replace(/(시|군|구)$/, "");
    const url = `https://with.nonghyup.com/jbnf/jbnfLst.do?srcJbnfTinm=${encodeURIComponent(searchName)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="city-page">
      <header className="city-header">
        <button
          className="back-btn"
          onClick={() => navigate(`/sido/${encodeURIComponent(decodedSido)}`)}
        >
          ← {shortSido(decodedSido)}
        </button>
        <div className="city-title-area">
          <h1 className="city-title">{decodedSigungu}</h1>
          <span className="city-count">
            {loading ? "..." : `${categoryMeta.label} ${branches.length}개`}
          </span>
        </div>
        <div className="city-stamp-info">
          <span className="stamp-badge">{stampCount}개 완료</span>
        </div>
      </header>

      <div className="category-tabs">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`category-tab${category === c.key ? " active" : ""}`}
            style={category === c.key ? { background: c.color } : undefined}
            onClick={() => setCategory(c.key)}
          >
            <span className="category-tab-icon">{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      <div className="map-container">
        {showStampEffect && <StampSuccessEffect onComplete={handleStampEffectComplete} />}
        {loading && (
          <div className="map-loading">
            <div className="loading-spinner" />
            <p>지점 정보 불러오는 중...</p>
          </div>
        )}
        {error && (
          <div className="map-error">
            <p>⚠️ {error}</p>
            <button onClick={() => window.location.reload()}>다시 시도</button>
          </div>
        )}
        {!loading && !error && (
          <NaverMap
            sidoName={decodedSido}
            sigunguName={decodedSigungu}
            branches={branches}
            userPosition={position}
            onMarkerClick={handleMarkerClick}
            onMapClick={handleMapClick}
            selectedBranch={selectedBranch}
            nearbyBranch={nearbyBranch}
            categoryColor={categoryMeta.color}
          />
        )}

        {!loading && !error && !selectedBranch && (
          <div className="map-floating-status">
            {geoError ? (
              <span className="geo-error">📍 위치 오류: {geoError}</span>
            ) : position ? (
              <span className="geo-status">
                📍 위치 확인됨 (정확도 ±{Math.round(position.accuracy)}m)
              </span>
            ) : null}
            <span className="map-floating-hint">지점 마커를 눌러 도장을 찍어보세요</span>
          </div>
        )}

        <div
          className={`bottom-panel${selectedBranch ? " open" : ""}`}
          aria-hidden={!selectedBranch}
        >
          <div className="bottom-panel-handle" />

          {displayBranch && (
            <div className="selected-branch-info">
              <span className="branch-name">{categoryMeta.icon} {displayBranch.name}</span>
              <span className="branch-addr">{displayBranch.address}</span>
            </div>
          )}

          <StampButton
            branch={displayBranch}
            canStamp={canStamp}
            sidoName={decodedSido}
            onStamp={handleStamp}
            onStampEffect={handleStampEffect}
            alreadyStamped={alreadyStamped}
            categoryLabel={categoryMeta.label}
          />

          <button className="city-tour-cta-banner" onClick={goTour}>
            <span className="city-tour-cta-emoji">🧭</span>
            <span className="city-tour-cta-text">
              <b>{decodedSigungu}</b> 인기 여행지 추천받기
            </span>
            <span className="city-tour-cta-arrow">›</span>
          </button>

          <button className="recruit-cta-banner" onClick={openRecruitment}>
            <span className="recruit-cta-emoji">🤝</span>
            <span className="recruit-cta-text">NH농협의 가족이 되어보시겠어요?</span>
            <span className="recruit-cta-arrow">›</span>
          </button>
        </div>
      </div>

      {showTourPrompt && (
        <div className="tour-modal-overlay" onClick={dismissTourPrompt}>
          <div className="tour-modal" onClick={(event) => event.stopPropagation()}>
            <div className="tour-modal-icon">🧳</div>
            <h2 className="tour-modal-title">
              {decodedSigungu} 여행지를<br />추천해드릴까요?
            </h2>
            <p className="tour-modal-desc">
              한국관광공사 데이터로 뽑은<br />이 지역 인기 여행지를 보여드려요
            </p>
            <div className="tour-modal-actions">
              <button className="tour-modal-btn ghost" onClick={dismissTourPrompt}>
                다음에
              </button>
              <button
                className="tour-modal-btn primary"
                onClick={() => {
                  dismissTourPrompt();
                  goTour();
                }}
              >
                여행지 추천받기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
