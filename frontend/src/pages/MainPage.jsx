import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import KoreaMap from "../components/KoreaMap";
import SidoCard from "../components/SidoCard";
import RewardRoad from "../components/RewardRoad";
import { useStamps } from "../hooks/useStamps";
import { useRewards } from "../hooks/useRewards";
import { useAuth } from "../contexts/AuthContext";
import "./MainPage.css";

export const CHARS = {
  olly: { src: "/chars/olly.png", bg: "#E8F5EE", accent: "#008542", name: "올리" },
  nari: { src: "/chars/nari.png", bg: "#FFFDE7", accent: "#E6960A", name: "나리" },
  lami: { src: "/chars/lami.png", bg: "#FCE4EC", accent: "#D6336C", name: "라미" },
  dori: { src: "/chars/dori.png", bg: "#FFF3E0", accent: "#8D6E63", name: "돌이" },
  coco: { src: "/chars/coco.png", bg: "#E8EAF6", accent: "#5C6BC0", name: "코코" },
};

const SIDO_LIST = [
  { name: "서울특별시",     code: "11", short: "서울",  char: "lami" },
  { name: "부산광역시",     code: "21", short: "부산",  char: "lami" },
  { name: "대구광역시",     code: "22", short: "대구",  char: "coco" },
  { name: "인천광역시",     code: "23", short: "인천",  char: "dori" },
  { name: "광주광역시",     code: "24", short: "광주",  char: "nari" },
  { name: "대전광역시",     code: "25", short: "대전",  char: "dori" },
  { name: "울산광역시",     code: "26", short: "울산",  char: "coco" },
  { name: "세종특별자치시", code: "29", short: "세종",  char: "dori" },
  { name: "경기도",         code: "31", short: "경기",  char: "olly" },
  { name: "강원특별자치도", code: "32", short: "강원",  char: "olly" },
  { name: "충청북도",       code: "33", short: "충북",  char: "dori" },
  { name: "충청남도",       code: "34", short: "충남",  char: "dori" },
  { name: "전북특별자치도", code: "35", short: "전북",  char: "nari" },
  { name: "전라남도",       code: "36", short: "전남",  char: "nari" },
  { name: "경상북도",       code: "37", short: "경북",  char: "coco" },
  { name: "경상남도",       code: "38", short: "경남",  char: "coco" },
  { name: "제주특별자치도", code: "39", short: "제주",  char: "nari" },
];

const PARADE = ["lami", "dori", "olly", "nari", "coco"];

export default function MainPage() {
  const [view, setView] = useState("map");
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    hasSidoVisited,
    getSidoStampCount,
    getSidoProgress,
    getTotalStamps,
    getVisitedSidos,
  } = useStamps();

  const totalStamps  = getTotalStamps();
  const visitedSidos = getVisitedSidos();
  const visitedCount = visitedSidos.length;
  const progressPct  = Math.round((visitedCount / 17) * 100);

  const rewards = useRewards(totalStamps, user?.username);

  const handleSidoClick = (sido) => {
    navigate(`/sido/${encodeURIComponent(sido.name)}`);
  };

  return (
    <div className="main-page">

      {/* ── 히어로 헤더 ── */}
      <header className="main-header">
        <div className="hero-brand">
          <div className="hero-badge">
            <img src="/cyber_symbol.gif" alt="NH" className="header-nh-mark" />
            <span>NH농협은행</span>
          </div>
          <h1 className="hero-title">스탬프 투어</h1>
          <p className="hero-sub">스탬프를 모으며 전국을 여행해요</p>
          <div className="hero-user">
            <span className="hero-username">{user?.username}</span>
            <button className="hero-logout" onClick={logout}>로그아웃</button>
          </div>
        </div>
        <img
          src={CHARS.olly.src}
          alt="올리"
          className="header-olly"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      </header>

      {/* ── 진행 카드 ── */}
      <div className="progress-card">
        <p className="progress-card-label">나의 스탬프 현황</p>
        <div className="progress-stats">
          <div className="stat-item">
            <span className="stat-num">{totalStamps}</span>
            <span className="stat-unit">개</span>
            <span className="stat-desc">총 스탬프</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">{visitedCount}</span>
            <span className="stat-unit">곳</span>
            <span className="stat-desc">방문 지역</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">{progressPct}</span>
            <span className="stat-unit">%</span>
            <span className="stat-desc">달성률</span>
          </div>
        </div>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${Math.max(progressPct, 2)}%` }} />
        </div>
        <p className="progress-bar-label">
          {visitedCount === 0
            ? "지도에서 지역을 클릭해 시작하세요"
            : `${17 - visitedCount}개 지역이 남았어요`}
        </p>
      </div>

      {/* ── 보상 티저 ── */}
      <button
        className={`reward-teaser ${rewards.claimableCount > 0 ? "hot" : ""}`}
        onClick={() => setView("reward")}
      >
        <span className="rt-ico">🎁</span>
        <span className="rt-txt">
          {rewards.claimableCount > 0 ? (
            <>
              <b>{rewards.claimableCount}개</b>의 보상이 기다리고 있어요
            </>
          ) : rewards.nextNode ? (
            <>
              다음 보상까지 스탬프{" "}
              <b>{Math.max(0, rewards.nextNode.need - totalStamps)}개</b>
            </>
          ) : (
            <>전국 보상을 모두 획득했어요 🎉</>
          )}
        </span>
        {rewards.points > 0 && (
          <span className="rt-points">{rewards.points.toLocaleString()}P</span>
        )}
        <span className="rt-arrow">›</span>
      </button>

      {/* ── 뷰 토글 ── */}
      <div className="main-view-toggle">
        <button className={`main-toggle-btn ${view === "map" ? "active" : ""}`} onClick={() => setView("map")}>
          🗺 지도
        </button>
        <button className={`main-toggle-btn ${view === "grid" ? "active" : ""}`} onClick={() => setView("grid")}>
          ☰ 목록
        </button>
        <button className={`main-toggle-btn ${view === "reward" ? "active" : ""}`} onClick={() => setView("reward")}>
          🎁 보상{rewards.claimableCount > 0 ? ` (${rewards.claimableCount})` : ""}
        </button>
      </div>

      {/* ── 보상 뷰 ── */}
      {view === "reward" && (
        <div className="reward-section">
          <RewardRoad
            rewards={rewards}
            totalStamps={totalStamps}
            onGoCollect={() => setView("map")}
          />
        </div>
      )}

      {/* ── 지도 뷰 ── */}
      {view === "map" && (
        <>
          <div className="map-section">
            <KoreaMap
              getStampCount={getSidoStampCount}
              getProgress={getSidoProgress}
            />
          </div>
          <div className="guide-section">
            <p className="guide-text">
              시/도를 클릭해 시/군/구를 선택하세요 · 권역을 모을수록 색이 진해져요
            </p>
            <div className="legend">
              <span className="legend-grad-label">0%</span>
              <span className="legend-grad" />
              <span className="legend-grad-label">100%</span>
              <span className="legend-grad-caption">권역 달성률</span>
            </div>
          </div>
          {visitedSidos.length > 0 && (
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
        </>
      )}

      {/* ── 목록 뷰 ── */}
      {view === "grid" && (
        <div className="sido-grid-section">

          {/* 캐릭터 배너 */}
          <div className="char-banner">
            <div className="char-banner-imgs">
              <img
                src="/chars/group.png"
                alt="NH 5인방"
                className="banner-group-img"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
            <div className="char-banner-body">
              <p className="char-banner-title">전국 17개 시·도를<br />모두 방문해보세요!</p>
              <p className="char-banner-desc">NH 5인방이 응원해요 🎉</p>
            </div>
          </div>

          {/* 시/도 그리드 */}
          <p className="grid-hint">지역을 선택하세요</p>
          <div className="sido-grid">
            {SIDO_LIST.map((sido) => (
              <SidoCard
                key={sido.code}
                sido={sido}
                charKey={sido.char}
                isVisited={hasSidoVisited(sido.name)}
                stampCount={getSidoStampCount(sido.name)}
                onClick={() => handleSidoClick(sido)}
              />
            ))}
          </div>

          {/* 캐릭터 퍼레이드 */}
          <div className="char-parade">
            <p className="parade-label">NH 5인방이 함께해요!</p>
            <div className="parade-row">
              {PARADE.map((key) => {
                const c = CHARS[key];
                return (
                  <div key={key} className={`parade-item ${key === "olly" ? "main" : ""}`}>
                    <div
                      className={`parade-circle ${key === "olly" ? "main" : ""}`}
                      style={{ background: c.bg, borderColor: key === "olly" ? c.accent : "#ddd" }}
                    >
                      <img
                        src={c.src}
                        alt={c.name}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    </div>
                    <span
                      className="parade-name"
                      style={key === "olly" ? { color: c.accent, fontWeight: 800 } : {}}
                    >
                      {c.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
