import React, { useState } from "react";
import { getInitialColor } from "../utils/sigunguLogo";
import "./SigunguCard.css";

const LOGO_EXTS = ["png", "svg", "gif", "jpg"];

export default function SigunguCard({ sigungu, isVisited, stampCount, onClick }) {
  const { name, code } = sigungu;
  const [extIdx, setExtIdx] = useState(0);
  const [noLogo, setNoLogo] = useState(false);

  const logoSrc = !noLogo && code ? `/logos/${code}.${LOGO_EXTS[extIdx]}` : null;
  const initColor = getInitialColor(name);
  const initial = name ? name.slice(0, 1) : "?";

  const handleLogoError = () => {
    if (extIdx + 1 < LOGO_EXTS.length) {
      setExtIdx((i) => i + 1);
    } else {
      setNoLogo(true);
    }
  };

  return (
    <button
      className={`sigungu-card ${isVisited ? "visited" : ""}`}
      onClick={onClick}
      title={name}
    >
      {isVisited && <span className="card-check-badge">✓</span>}

      <div className="card-logo-wrap">
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={name}
            className="card-logo-img"
            onError={handleLogoError}
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
