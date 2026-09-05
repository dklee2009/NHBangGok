import React from "react";
import StampButton from "../components/StampButton";
import StampSuccessEffect from "../components/StampSuccessEffect";
import "./StampTestPage.css";

const mockBranch = {
  id: 1,
  name: "농협은행 제주중앙지점",
};

export default function StampTestPage() {
  const [showStampEffect, setShowStampEffect] = React.useState(false);

  const handleStamp = async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 260));
    return true;
  };

  const handleStampEffect = () => {
    setShowStampEffect(true);
    window.setTimeout(() => setShowStampEffect(false), 1000);
  };

  return (
    <div className="stamp-test-page">
      <div className="stamp-test-header">
        <p className="eyebrow">UI PREVIEW</p>
        <h1>도장 효과 테스트 페이지</h1>
        <p className="subtitle">GPS 없이도 스탬프 버튼과 애니메이션을 미리 확인할 수 있습니다.</p>
      </div>

      <div className="stamp-test-map-preview">
        <div className="stamp-test-map-lines" />
        <span className="stamp-test-map-label">지도 중앙 효과 미리보기</span>
        {showStampEffect && <StampSuccessEffect />}
      </div>

      <div className="stamp-test-grid">
        <section className="stamp-demo-card">
          <div className="card-label">1. 도장 찍기 상태</div>
          <StampButton nearbyBranch={mockBranch} sidoName="제주" onStamp={handleStamp} onStampEffect={handleStampEffect} alreadyStamped={false} />
        </section>

        <section className="stamp-demo-card">
          <div className="card-label">2. 방문 완료 상태</div>
          <StampButton nearbyBranch={mockBranch} sidoName="제주" onStamp={handleStamp} alreadyStamped={true} />
        </section>

        <section className="stamp-demo-card">
          <div className="card-label">3. 지점 없음 상태</div>
          <StampButton nearbyBranch={null} sidoName="제주" onStamp={handleStamp} alreadyStamped={false} />
        </section>
      </div>
    </div>
  );
}
