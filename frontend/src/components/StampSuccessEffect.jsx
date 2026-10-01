import React from "react";
import "./StampSuccessEffect.css";

export default function StampSuccessEffect({ onComplete }) {
  return (
    <div className="stamp-success-effect" aria-hidden="true" onAnimationEnd={onComplete}>
      <img className="stamp-success-image" src="/stamp-mission-complete.webp?v=2" alt="" />
      <strong className="stamp-success-korean">쾅!</strong>
    </div>
  );
}
