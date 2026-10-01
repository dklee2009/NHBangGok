import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import "./Tutorial.css";

const SPOT_PADDING = 8;
const CARD_GAP = 14;
const CARD_MIN_SPACE = 210; // 설명 카드를 대상 위/아래에 놓기 위해 필요한 최소 공간(px)

/**
 * 화면 요소를 하나씩 강조하며 설명하는 코치마크 튜토리얼.
 * steps: [{ target?: CSS 선택자, title, body, image? }] — target이 없으면 화면 가운데 안내 카드로 표시
 */
export default function Tutorial({ steps, onClose }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  const measure = useCallback(() => {
    const el = step.target && document.querySelector(step.target);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // 단계가 바뀌면 대상 요소를 화면 가운데로 스크롤하고 위치를 잰다.
  useLayoutEffect(() => {
    const el = step.target && document.querySelector(step.target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    measure();
  }, [step, measure]);

  // 스크롤 애니메이션·화면 회전·리사이즈 중에도 강조 영역이 대상을 따라가게 한다.
  useEffect(() => {
    let frame = 0;
    const onChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", onChange, true);
    window.addEventListener("resize", onChange);
    // 부드러운 스크롤은 scroll 이벤트가 끝까지 오지 않는 브라우저가 있어 잠시 더 따라간다.
    const settle = window.setTimeout(measure, 450);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener("scroll", onChange, true);
      window.removeEventListener("resize", onChange);
    };
  }, [measure]);

  const next = useCallback(() => {
    if (isLast) onClose();
    else setIndex((i) => i + 1);
  }, [isLast, onClose]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  const spot = rect && {
    top: rect.top - SPOT_PADDING,
    left: rect.left - SPOT_PADDING,
    width: rect.width + SPOT_PADDING * 2,
    height: rect.height + SPOT_PADDING * 2,
  };

  // 설명 카드는 대상 아래 공간이 넉넉하면 아래, 아니면 위에 두고,
  // 지도처럼 대상이 화면 대부분을 차지하면 화면 아래쪽에 겹쳐 띄운다.
  let cardStyle;
  let placement = "center";
  if (spot) {
    const vh = window.innerHeight;
    const spaceBelow = vh - (spot.top + spot.height);
    if (spaceBelow >= CARD_MIN_SPACE) {
      placement = "below";
      cardStyle = { top: spot.top + spot.height + CARD_GAP };
    } else if (spot.top >= CARD_MIN_SPACE) {
      placement = "above";
      cardStyle = { bottom: vh - spot.top + CARD_GAP };
    } else {
      placement = "overlay";
      cardStyle = { bottom: 16 };
    }
  }

  return (
    <div className="tutorial-root" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      {spot ? (
        <div className="tutorial-spot" style={spot} />
      ) : (
        <div className="tutorial-dim" />
      )}

      <div className={`tutorial-card tutorial-card-${placement}`} style={cardStyle}>
        {step.image && <img className="tutorial-card-image" src={step.image} alt="" />}
        <p className="tutorial-step-count">{index + 1} / {steps.length}</p>
        <h3 id="tutorial-title" className="tutorial-title">{step.title}</h3>
        <p className="tutorial-body">{step.body}</p>

        <div className="tutorial-dots" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s.title} className={`tutorial-dot${i === index ? " active" : ""}`} />
          ))}
        </div>

        <div className="tutorial-actions">
          {!isLast && (
            <button type="button" className="tutorial-skip" onClick={onClose}>
              건너뛰기
            </button>
          )}
          <div className="tutorial-nav">
            {index > 0 && (
              <button type="button" className="tutorial-prev" onClick={prev}>
                이전
              </button>
            )}
            <button type="button" className="tutorial-next" onClick={next} autoFocus>
              {isLast ? "시작하기" : "다음"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
