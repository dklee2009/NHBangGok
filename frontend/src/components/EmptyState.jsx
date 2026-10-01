import React from "react";
import "./EmptyState.css";

/** 데이터가 없을 때 캐릭터 그림과 함께 다음 행동을 안내하는 빈 화면 */
export default function EmptyState({ image, title, description, actionLabel, onAction, compact = false }) {
  return (
    <div className={`empty-state${compact ? " compact" : ""}`}>
      {image && <img className="empty-state-image" src={image} alt="" />}
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-desc">{description}</p>}
      {actionLabel && onAction && (
        <button type="button" className="empty-state-action" onClick={onAction}>
          {actionLabel}
          <span aria-hidden="true">›</span>
        </button>
      )}
    </div>
  );
}
