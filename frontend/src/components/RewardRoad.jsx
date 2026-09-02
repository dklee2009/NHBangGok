import React, { useRef, useState } from "react";
import "./RewardRoad.css";

// 노드 3개씩 끊어 지그재그(뱀 모양) 경로로 배치
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function RewardRoad({ rewards, totalStamps, onGoCollect }) {
  const { nodes, claim, claimAll, claimableCount, points, nextNode } = rewards;
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const fireToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  };

  const handleNode = (n) => {
    if (n.state !== "claimable") return;
    claim(n.id);
    fireToast(`🎉 ${n.reward} 획득!`);
  };

  const handleCta = () => {
    if (claimableCount > 0) {
      claimAll();
      fireToast(`🎁 보상 ${claimableCount}개를 받았어요!`);
    } else {
      onGoCollect?.();
    }
  };

  const rows = chunk(nodes, 3);
  const remain = nextNode ? Math.max(0, nextNode.need - totalStamps) : 0;
  const bubble =
    claimableCount > 0
      ? `받을 보상이 ${claimableCount}개 있어!`
      : nextNode
      ? `다음 보상까지 ${remain}개!`
      : "전국 보상을 전부 모았어! 🎉";

  return (
    <div className="reward-road">
      {/* 헤더 — 참고 UI의 "매일 출석하면…" 영역 */}
      <div className="rw-head">
        <div className="rw-head-txt">
          <h2 className="rw-title">전국 스탬프 로드맵</h2>
          <p className="rw-sub">스탬프를 모아 NH포인트와 배지를 받으세요</p>
          {points > 0 && (
            <span className="rw-points">
              보유 NH포인트 <b>{points.toLocaleString()}P</b>
            </span>
          )}
        </div>
        <div className="rw-mascot">
          <div className="rw-bubble">{bubble}</div>
          <img
            src="/chars/nari.png"
            alt=""
            className="rw-mascot-img"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      </div>

      {/* 마일스톤 경로 */}
      <div className="rw-road">
        {rows.map((row, ri) => (
          <div className={`rw-row ${ri % 2 ? "rev" : ""}`} key={ri}>
            {row.map((n) => (
              <button
                key={n.id}
                className={`rw-node ${n.state}`}
                onClick={() => handleNode(n)}
                disabled={n.state !== "claimable"}
              >
                {n.mult && (
                  <span className={`rw-mult ${n.mult === "X3" ? "hot" : ""}`}>
                    {n.mult}
                  </span>
                )}
                <span className="rw-circle">
                  <span className="rw-ico">
                    {n.state === "claimed"
                      ? "✓"
                      : n.state === "locked"
                      ? "🔒"
                      : n.icon}
                  </span>
                  {n.state === "claimed" && (
                    <span className="rw-doneflag">완료</span>
                  )}
                </span>
                <span className="rw-need">{n.need}개</span>
                <span className="rw-reward">{n.reward}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* 참고 UI의 "포인트 더 받기" CTA */}
      <button
        className={`rw-cta ${claimableCount > 0 ? "ready" : ""}`}
        onClick={handleCta}
      >
        {claimableCount > 0
          ? `🎁 보상 ${claimableCount}개 받기`
          : "스탬프 모으러 가기"}
      </button>

      {toast && <div className="rw-toast">{toast}</div>}
    </div>
  );
}
