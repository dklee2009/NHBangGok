import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import HomeButton from "../components/HomeButton";
import TourMap from "../components/TourMap";
import EmptyState from "../components/EmptyState";
import { API_BASE } from "../config";
import { shortSido } from "../utils/sido";
import "./TourPage.css";

const CAT_ICON = {
  자연관광: "🌳",
  문화관광: "🎭",
  역사관광: "🏛️",
  레저스포츠: "🏄",
  체험관광: "🎡",
  쇼핑: "🛍️",
  숙박: "🏨",
  음식: "🍽️",
  기타관광: "🧭",
};

const CAT_CLASS = {
  자연관광: "nature",
  문화관광: "culture",
  역사관광: "history",
  레저스포츠: "leisure",
  체험관광: "experience",
  쇼핑: "shopping",
  숙박: "stay",
  음식: "food",
  기타관광: "etc",
};

export default function TourPage() {
  const { sidoName, sigunguName } = useParams();
  const decodedSido = decodeURIComponent(sidoName);
  const decodedSigungu = sigunguName ? decodeURIComponent(sigunguName) : null;
  const navigate = useNavigate();

  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [selectedId, setSelectedId] = useState(null);
  const cardRefs = useRef({});

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, error: null, data: null });
    setSelectedId(null);
    const path = decodedSigungu
      ? `/api/tour/${encodeURIComponent(decodedSido)}/${encodeURIComponent(decodedSigungu)}`
      : `/api/tour/${encodeURIComponent(decodedSido)}`;
    fetch(`${API_BASE}${path}`)
      .then((r) => {
        if (!r.ok) throw new Error("추천 정보를 불러오지 못했어요.");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setState({ loading: false, error: null, data });
      })
      .catch((e) => {
        if (!cancelled) setState({ loading: false, error: e.message, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [decodedSido, decodedSigungu]);

  const { loading, error, data } = state;
  const spots = data?.spots || [];
  const isSigunguScope = data?.scope === "sigungu";
  const titleArea = isSigunguScope ? data.sigungu : shortSido(decodedSido);

  const openMap = (name) => {
    window.open(
      `https://map.naver.com/p/search/${encodeURIComponent(name)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleCardClick = (spotId) => {
    setSelectedId(spotId);
  };

  const handleMarkerClick = (spotId) => {
    setSelectedId(spotId);
    cardRefs.current[spotId]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const handleOpenExternal = (e, name) => {
    e.stopPropagation();
    openMap(name);
  };

  return (
    <div className="tour-page">
      <header className="tour-header">
        <button
          className="back-btn"
          onClick={() => navigate(`/sido/${encodeURIComponent(decodedSido)}`)}
        >
          ← {shortSido(decodedSido)}
        </button>
        <HomeButton />
        <div className="tour-title-area">
          <h1 className="tour-title">{titleArea} 추천 여행지</h1>
          <span className="tour-subtitle">
            {loading
              ? "불러오는 중..."
              : data?.available
              ? `한국관광공사 인기 여행지 ${spots.length}곳${
                  decodedSigungu && !isSigunguScope ? ` · ${shortSido(decodedSido)} 전체 기준` : ""
                }`
              : "추천 정보 준비 중"}
          </span>
        </div>
      </header>

      <div className="tour-body">
        {loading && (
          <div className="tour-status">
            <div className="loading-spinner" />
            <p>{decodedSigungu || shortSido(decodedSido)} 여행지를 찾고 있어요...</p>
          </div>
        )}

        {!loading && error && (
          <div className="tour-status">
            <p>⚠️ {error}</p>
            <button className="tour-retry" onClick={() => navigate(0)}>
              다시 시도
            </button>
          </div>
        )}

        {!loading && !error && !spots.length && (
          <div className="tour-status">
            <EmptyState
              image="/chars/단지한복.webp"
              title="추천 여행지를 준비 중이에요"
              description="이 지역은 아직 관광 데이터가 없어요. 다른 지역의 인기 여행지를 둘러보세요."
              actionLabel={`${shortSido(decodedSido)} 지역 둘러보기`}
              onAction={() => navigate(`/sido/${encodeURIComponent(decodedSido)}`)}
            />
          </div>
        )}

        {!loading && !error && spots.length > 0 && (
          <>
            <div className="tour-map-pane">
              <TourMap spots={spots} selectedId={selectedId} onMarkerClick={handleMarkerClick} />
            </div>
            <div className="tour-list-pane">
              <p className="tour-hint">
                카드를 누르면 지도에서 위치를 확인할 수 있어요
                {data?.baseYm ? ` · ${data.baseYm.slice(0, 4)}년 ${data.baseYm.slice(4)}월 기준` : ""}
              </p>
              <ul className="tour-list">
                {spots.map((s, i) => (
                  <li
                    key={s.id}
                    ref={(el) => { cardRefs.current[s.id] = el; }}
                    className={`tour-card${selectedId === s.id ? " selected" : ""}`}
                    onClick={() => handleCardClick(s.id)}
                  >
                    <div className={`tour-card-image tour-card-image-${CAT_CLASS[s.categorySub] || "default"}`}>
                      <span className="tour-card-image-fallback" aria-hidden="true">
                        {CAT_ICON[s.categorySub] || "📍"}
                      </span>
                      {s.image && (
                        <img
                          src={s.image}
                          alt=""
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      )}
                    </div>
                    <span className="tour-rank">{i + 1}</span>
                    <div className="tour-card-body">
                      <span className="tour-name">{s.name}</span>
                      <div className="tour-meta">
                        {s.sigungu && <span className="tour-sigungu">{s.sigungu}</span>}
                        {s.categorySub && (
                          <span className="tour-cat">
                            {CAT_ICON[s.categorySub] || "📍"} {s.categorySub}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="tour-go"
                      onClick={(e) => handleOpenExternal(e, s.name)}
                      aria-label="네이버 지도에서 열기"
                    >
                      ›
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
