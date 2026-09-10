import React, { useState } from "react";
import { getInitialColor } from "../utils/sigunguLogo";
import { MASCOT_LIST } from "../utils/koreaSigungu";
import "./SigunguCard.css";

export default function SigunguCard({ sigungu, index, isVisited, stampCount, onClick }) {
  const { name } = sigungu;
  const [noLogo, setNoLogo] = useState(false);

  const mascotSrc = MASCOT_LIST[index % MASCOT_LIST.length];
  const initColor = getInitialColor(name);
  const initial = name ? name.slice(0, 1) : "?";

  return (
    <button
      className={`sigungu-card ${isVisited ? "visited" : ""}`}
      onClick={onClick}
      title={name}
    >
      {isVisited && <span className="card-check-badge">✓</span>}

      <div className="card-logo-wrap">
        {!noLogo ? (
          <img
            src={mascotSrc}
            alt={name}
            className="card-logo-img"
            onError={() => setNoLogo(true)}
            loading="lazy"
          />
        ) : (
          <div className="card-logo-initial" style={{ background: initColor }}>
            {initial}
          </div>
        )}
      </div>

      <span className="card-name">{name}</span>

      {isVisited && stampCount > 0 && (
        <span className="card-count">{stampCount}개</span>
      )}
    </button>
  );
}
