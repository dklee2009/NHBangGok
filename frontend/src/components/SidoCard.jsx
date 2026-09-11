import React, { useState } from "react";
import { MASCOT_LIST } from "../utils/koreaSigungu";
import "./SidoCard.css";

export default function SidoCard({ sido, index = 0, isVisited, stampCount, onClick }) {
  const { short, name } = sido;
  const mascotSrc = MASCOT_LIST[index % MASCOT_LIST.length];
  const [err, setErr] = useState(false);
  const initial = (short || name).slice(0, 1);

  return (
    <button
      className={`sido-card ${isVisited ? "visited" : ""}`}
      onClick={onClick}
      title={name}
    >
      {isVisited && <span className="sido-check-badge">✓</span>}

      <div className="sido-logo-wrap">
        {!err ? (
          <img
            src={mascotSrc}
            alt={name}
            className="sido-char-img"
            onError={() => setErr(true)}
            loading="lazy"
          />
        ) : (
          <div className="sido-logo-initial">{initial}</div>
        )}
      </div>

      <span className="sido-name">{short || name}</span>

      {isVisited && stampCount > 0 && (
        <span className="sido-count">{stampCount}개</span>
      )}
    </button>
  );
}
