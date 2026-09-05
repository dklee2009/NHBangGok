import React, { useState } from "react";
import "./StampButton.css";

export default function StampButton({ nearbyBranch, sidoName, onStamp, alreadyStamped }) {
  const [stamping, setStamping] = useState(false);
  const [showEffect, setShowEffect] = useState(false);

  const handleStamp = async () => {
    if (!nearbyBranch || stamping) return;
    setStamping(true);
    setShowEffect(true);
    const ok = await onStamp(sidoName, nearbyBranch.id, nearbyBranch.name);
    if (!ok) {
      alert("스탬프 저장에 실패했어요. 네트워크 상태를 확인하고 다시 시도해주세요.");
    }
    setStamping(false);
    setShowEffect(false);
  };

  if (!nearbyBranch) {
    return (
      <div className="stamp-area inactive">
        <div className="stamp-btn disabled">
          <span className="stamp-icon">🏦</span>
          <span>100m 이내 농협은행 없음</span>
        </div>
        <p className="stamp-hint">지점 마커를 확인하고 가까이 다가가세요</p>
      </div>
    );
  }

  if (alreadyStamped) {
    return (
      <div className="stamp-area stamped">
        <div className="stamp-btn stamped-btn">
          <span className="stamp-icon">✅</span>
          <span>{nearbyBranch.name} 방문 완료!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="stamp-area active">
      <div className="nearby-info">
        <span className="nearby-label">근처 지점</span>
        <span className="nearby-name">{nearbyBranch.name}</span>
      </div>
      <button className="stamp-btn ready" onClick={handleStamp} disabled={stamping}>
        {showEffect ? (
          <span className="stamp-icon">✅</span>
        ) : (
          <span className="stamp-icon">🔴</span>
        )}
        <span>{stamping ? "도장 찍는 중..." : "도장 찍기!"}</span>
      </button>
    </div>
  );
}
