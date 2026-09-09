import React, { useState } from "react";
import { getInitialColor } from "../utils/sigunguLogo";
import "./SigunguCard.css";

const LOGO_EXTS = ["png", "svg", "gif", "jpg"];

// 서울 일부 구는 공식 지점 로고 대신 한복 컨셉 캐릭터 이미지를 사용
const SEOUL_MASCOT_LIST = [
  "/chars/seoul/dino.png",
  "/chars/seoul/duck.png",
  "/chars/seoul/dog.png",
  "/chars/seoul/pig.png",
  "/chars/seoul/elephant.png",
];
export default function SigunguCard({ sigungu, sidoName, index, isVisited, stampCount, onClick }) {
  const { name, code } = sigungu;
  const [extIdx, setExtIdx] = useState(0);
  const [noLogo, setNoLogo] = useState(false);

  const mascotSrc =
    sidoName === "서울특별시" ? SEOUL_MASCOT_LIST[index % SEOUL_MASCOT_LIST.length] : null;
  const logoSrc = noLogo ? null : mascotSrc || (code ? `/logos/${code}.${LOGO_EXTS[extIdx]}` : null);
  const initColor = getInitialColor(name);
  const initial = name ? name.slice(0, 1) : "?";

  const handleLogoError = () => {
    if (mascotSrc) {
      setNoLogo(true);
      return;
    }
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
