import React, { useState } from "react";
import "./SidoCard.css";

const CHAR_MAP = {
  olly: { src: "/chars/olly.png", bg: "#E8F5EE", accent: "#008542" },
  nari: { src: "/chars/nari.png", bg: "#FFFDE7", accent: "#D4940A" },
  lami: { src: "/chars/lami.png", bg: "#FCE4EC", accent: "#C2185B" },
  dori: { src: "/chars/dori.png", bg: "#FFF3E0", accent: "#795548" },
  coco: { src: "/chars/coco.png", bg: "#E8EAF6", accent: "#3F51B5" },
};

export default function SidoCard({ sido, charKey = "olly", isVisited, stampCount, onClick }) {
  const { short, name } = sido;
  const char   = CHAR_MAP[charKey] || CHAR_MAP.olly;
  const [err, setErr] = useState(false);
  const initial = (short || name).slice(0, 1);

  return (
    <button
      className={`sido-card ${isVisited ? "visited" : ""}`}
      onClick={onClick}
      title={name}
      style={isVisited ? { borderColor: char.accent, boxShadow: `0 4px 16px ${char.accent}28` } : {}}
    >
      {isVisited && (
        <span className="sido-check-badge" style={{ background: char.accent }}>✓</span>
      )}

      <div className="sido-logo-wrap" style={{ background: char.bg }}>
        {!err ? (
          <img
            src={char.src}
            alt={charKey}
            className="sido-char-img"
            onError={() => setErr(true)}
            loading="lazy"
          />
        ) : (
          <div className="sido-logo-initial" style={{ background: char.accent }}>
            {initial}
          </div>
        )}
      </div>

      <span className="sido-name" style={isVisited ? { color: char.accent } : {}}>
        {short || name}
      </span>

      {isVisited && stampCount > 0 && (
        <span className="sido-count" style={{ background: char.accent }}>{stampCount}개</span>
      )}
    </button>
  );
}
