import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
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
};

const shortSido = (s) =>
  s
    .replace("특별시", "")
    .replace("광역시", "")
    .replace("특별자치시", "")
    .replace("특별자치도", "")
    .replace("도", "");

export default function TourPage() {
  const { sidoName } = useParams();
  const decodedSido = decodeURIComponent(sidoName);
  const navigate = useNavigate();

  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, error: null, data: null });
    fetch(`${API_BASE}/api/tour/${encodeURIComponent(decodedSido)}`)
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
  }, [decodedSido]);

  const { loading, error, data } = state;
  const spots = data?.spots || [];

  const openMap = (name) => {
    window.open(
      `https://map.naver.com/p/search/${encodeURIComponent(name)}`,
      "_blank",
      "noopener,noreferrer"
    );
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
        <div className="tour-title-area">
          <h1 className="tour-title">{shortSido(decodedSido)} 추천 여행지</h1>
          <span className="tour-subtitle">
            {loading
              ? "불러오는 중..."
              : data?.available
              ? `한국관광공사 인기 여행지 ${spots.length}곳`
              : "추천 정보 준비 중"}
          </span>
        </div>
      </header>

      <div className="tour-body">
        {loading && (
          <div className="tour-status">
            <div className="loading-spinner" />
            <p>{shortSido(decodedSido)} 여행지를 찾고 있어요...</p>
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
            <p className="tour-empty-emoji">🧭</p>
            <p>이 지역의 추천 여행지 정보를 준비 중이에요.</p>
          </div>
        )}

        {!loading && !error && spots.length > 0 && (
          <>
            <p className="tour-hint">
              카드를 누르면 네이버 지도에서 위치를 볼 수 있어요
              {data?.baseYm ? ` · ${data.baseYm.slice(0, 4)}년 ${data.baseYm.slice(4)}월 기준` : ""}
            </p>
            <ul className="tour-list">
              {spots.map((s, i) => (
                <li key={s.id} className="tour-card" onClick={() => openMap(s.name)}>
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
                  <span className="tour-go">›</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
