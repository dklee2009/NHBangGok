import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomeButton.css";

/** 두 단계 이상 들어간 화면의 헤더에서 메인(홈)으로 바로 돌아가는 아이콘 버튼 */
export default function HomeButton() {
  const navigate = useNavigate();
  return (
    <button type="button" className="home-btn" onClick={() => navigate("/")} aria-label="홈으로" title="홈으로">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
