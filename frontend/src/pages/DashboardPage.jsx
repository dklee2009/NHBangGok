import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStamps } from "../hooks/useStamps";
import { useAuth } from "../contexts/AuthContext";
import { CATEGORIES, CATEGORY_BY_KEY } from "../utils/categories";
import "./DashboardPage.css";

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [category, setCategory] = useState("bank");
  const {
    visited,
    getTotalStamps,
    getVisitedSidos,
    getSidoStampCount,
    getSidoProgressInfo,
  } = useStamps();

  const totalStamps = getTotalStamps();
  const visitedSidos = getVisitedSidos();
  const visitedCount = visitedSidos.length;
  const progressPct = Math.round((visitedCount / 17) * 100);

  const allStamps = [];
  Object.entries(visited).forEach(([sido, sigungus]) => {
    Object.entries(sigungus).forEach(([sigungu, stamps]) => {
      stamps.forEach((s) => {
        if (!s.branchId) return;
        allStamps.push({ ...s, sido, sigungu });
      });
    });
  });
  allStamps.sort((a, b) => new Date(b.visitedAt) - new Date(a.visitedAt));

  // category가 없는 옛 스탬프는 은행 조회 시절 데이터이므로 은행으로 분류한다.
  const categoryOf = (s) => (CATEGORY_BY_KEY[s.category] ? s.category : "bank");
  const categoryCounts = Object.fromEntries(
    CATEGORIES.map((c) => [c.key, allStamps.filter((s) => categoryOf(s) === c.key).length])
  );
  const filteredStamps = allStamps.filter((s) => categoryOf(s) === category);
  const activeCategory = CATEGORY_BY_KEY[category];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <button className="back-btn" onClick={() => navigate("/")}>
          ← 홈
        </button>
        <div className="dashboard-title-area">
          <h1 className="dashboard-title">나의 스탬프 대시보드</h1>
          <span className="dashboard-subtitle">{user?.username}님의 방문 기록</span>
        </div>
      </header>

      <div className="dashboard-body">
        <div className="dash-summary-card">
          <div className="dash-stats">
            <div className="dash-stat">
              <span className="dash-stat-num">{totalStamps}</span>
              <span className="dash-stat-desc">총 스탬프</span>
            </div>
            <div className="dash-stat-divider" />
            <div className="dash-stat">
              <span className="dash-stat-num">{visitedCount}</span>
              <span className="dash-stat-desc">방문 지역</span>
            </div>
            <div className="dash-stat-divider" />
            <div className="dash-stat">
              <span className="dash-stat-num">{progressPct}%</span>
              <span className="dash-stat-desc">달성률</span>
            </div>
          </div>
          <div className="dash-progress-bar-wrap">
            <div className="dash-progress-bar-fill" style={{ width: `${Math.max(progressPct, 2)}%` }} />
          </div>
          <p className="dash-progress-label">전국 17개 시/도 중 {visitedCount}곳 방문</p>
        </div>

        <section className="dash-section">
          <h2 className="dash-section-title">방문 지역</h2>
          {visitedSidos.length === 0 ? (
            <p className="dash-empty">아직 방문한 지역이 없어요</p>
          ) : (
            <div className="dash-region-list">
              {visitedSidos.map((sido) => {
                const info = getSidoProgressInfo(sido);
                const pct = Math.round(info.ratio * 100);
                return (
                  <button
                    key={sido}
                    type="button"
                    className="dash-region-card"
                    onClick={() => navigate(`/sido/${encodeURIComponent(sido)}`)}
                  >
                    <div className="dash-region-head">
                      <span className="dash-region-name">{sido}</span>
                      <span className="dash-region-count">{getSidoStampCount(sido)}개</span>
                    </div>
                    <div className="dash-region-bar-wrap">
                      <div className="dash-region-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="dash-region-sub">
                      {info.done}/{info.total} 시·군·구 · {pct}%
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="dash-section">
          <h2 className="dash-section-title">스탬프를 찍은 곳 ({allStamps.length})</h2>
          <div className="dash-cat-tabs" role="tablist">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={category === c.key}
                className={`dash-cat-tab${category === c.key ? " active" : ""}`}
                style={category === c.key ? { background: c.color } : undefined}
                onClick={() => setCategory(c.key)}
              >
                <span className="dash-cat-tab-icon">{c.icon}</span>
                <span>{c.label}</span>
                <span className="dash-cat-tab-count">{categoryCounts[c.key]}</span>
              </button>
            ))}
          </div>
          {filteredStamps.length === 0 ? (
            <p className="dash-empty">아직 {activeCategory.label} 스탬프가 없어요</p>
          ) : (
            <ul className="dash-stamp-list">
              {filteredStamps.map((s) => {
                const cat = CATEGORY_BY_KEY[categoryOf(s)];
                return (
                  <li key={`${s.category}-${s.branchId}`} className="dash-stamp-item">
                    <span className="dash-stamp-icon" style={{ color: cat.color }}>
                      {cat.icon}
                    </span>
                    <div className="dash-stamp-body">
                      <span className="dash-stamp-name">{s.branchName}</span>
                      <span className="dash-stamp-region">
                        {s.sido} {s.sigungu}
                      </span>
                    </div>
                    <span className="dash-stamp-date">{formatDate(s.visitedAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
