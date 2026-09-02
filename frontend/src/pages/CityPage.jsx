import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NaverMap from "../components/NaverMap";
import StampButton from "../components/StampButton";
import { useStamps } from "../hooks/useStamps";
import { useGeolocation } from "../hooks/useGeolocation";
import "./CityPage.css";

export default function CityPage() {
  const { sidoName, sigunguName } = useParams();
  const decodedSido = decodeURIComponent(sidoName);
  const decodedSigungu = decodeURIComponent(sigunguName);
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const { addStamp, hasSigunguVisited, getSigunguStampCount, visited } = useStamps();
  const { position, error: geoError, getNearbyBranch } = useGeolocation();

  const nearbyBranch = getNearbyBranch(branches, 100);
  const sigunguStamps = visited[decodedSido]?.[decodedSigungu] || [];
  const alreadyStamped = nearbyBranch
    ? sigunguStamps.some((s) => s.branchId === nearbyBranch.id)
    : false;

  useEffect(() => {
    async function fetchBranches() {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/banks/${encodeURIComponent(decodedSido)}?sigungu=${encodeURIComponent(decodedSigungu)}`;
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
  }, [decodedSido, decodedSigungu]);

  const handleMarkerClick = useCallback((branch) => {
    setSelectedBranch(branch);
  }, []);

  const handleStamp = (sido, branchId, branchName) => {
    addStamp(sido, decodedSigungu, branchId, branchName);
  };

  const stampCount = getSigunguStampCount(decodedSido, decodedSigungu);

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
          ← {decodedSido.replace("특별시","").replace("광역시","").replace("특별자치시","").replace("특별자치도","").replace("도","")}
        </button>
        <div className="city-title-area">
          <h1 className="city-title">{decodedSigungu}</h1>
          <span className="city-count">
            {loading ? "..." : `농협은행 ${branches.length}개`}
          </span>
        </div>
        <div className="city-stamp-info">
          <span className="stamp-badge">{stampCount}개 완료</span>
        </div>
      </header>

      <div className="map-container">
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
            selectedBranch={selectedBranch}
            nearbyBranch={nearbyBranch}
          />
        )}
      </div>

      <div className="bottom-panel">
        {geoError && <p className="geo-error">📍 위치 오류: {geoError}</p>}
        {position && (
          <p className="geo-status">
            📍 위치 확인됨 (정확도 ±{Math.round(position.accuracy)}m)
          </p>
        )}

        {selectedBranch && (
          <div className="selected-branch-info">
            <span className="branch-name">🏦 {selectedBranch.name}</span>
            <span className="branch-addr">{selectedBranch.address}</span>
          </div>
        )}

        <StampButton
          nearbyBranch={nearbyBranch}
          sidoName={decodedSido}
          onStamp={handleStamp}
          alreadyStamped={alreadyStamped}
        />

        <button className="recruit-cta-banner" onClick={openRecruitment}>
          <span className="recruit-cta-emoji">🤝</span>
          <span className="recruit-cta-text">NH농협의 가족이 되어보시겠어요?</span>
          <span className="recruit-cta-arrow">›</span>
        </button>
      </div>
    </div>
  );
}
