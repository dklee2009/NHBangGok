import React, { useState } from "react";
import "./SidoCard.css";

export default function SidoCard({ sido, isVisited, stampCount, onClick }) {
  const { short, name } = sido;
  const [err, setErr] = useState(false);
  const initial = (short || name).slice(0, 1);
  const bannerSrc = `/chars/sido-banners/${short}.jpg`;

  return (
    <button
      className={`sido-card ${isVisited ? "visited" : ""}`}
      onClick={onClick}
      title={name}
    >
      {!err ? (
        <img
          src={bannerSrc}
          alt={name}
          className="sido-banner-img"
          onError={() => setErr(true)}
          loading="lazy"
        />
      ) : (
        <div className="sido-banner-fallback">{initial}</div>
      )}

      {isVisited && <span className="sido-check-badge">✓</span>}

      <div className="sido-banner-overlay">
        <span className="sido-name">{short || name}</span>
        {isVisited && stampCount > 0 && (
          <span className="sido-count">{stampCount}개</span>
        )}
      </div>
    </button>
  );
}
