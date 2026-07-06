import React, { useState } from "react";
import { getInitialColor } from "../utils/sigunguLogo";
import "./SidoCard.css";

const LOGO_EXTS = ["png", "svg", "gif", "jpg"];

export default function SidoCard({ sido, isVisited, stampCount, onClick }) {
  const { name, code, short } = sido;
  const [extIdx, setExtIdx] = useState(0);
  const [noLogo, setNoLogo] = useState(false);

  const logoSrc = !noLogo && code ? `/logos/sido_${code}.${LOGO_EXTS[extIdx]}` : null;
  const initColor = getInitialColor(name);
  const initial = short ? short.slice(0, 1) : name.slice(0, 1);

  return (
    <button
      className={`sido-card ${isVisited ? "visited" : ""}`}
      onClick={onClick}
      title={name}
    >
      {isVisited && <span className="sido-check-badge">✓</span>}

      <div className="sido-logo-wrap">
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={name}
            className="sido-logo-img"
            onError={() => {
              if (extIdx + 1 < LOGO_EXTS.length) setExtIdx((i) => i + 1);
              else setNoLogo(true);
            }}
            loading="lazy"
          />
        ) : (
          <div className="sido-logo-initial" style={{ background: initColor }}>
            {initial}
          </div>
        )}
      </div>

      <span className="sido-name">{short || name}</span>

      {isVisited && stampCount > 0 && (
        <span className="sido-count">{stampCount}개</span>
      )}
    </button>
  );
}
