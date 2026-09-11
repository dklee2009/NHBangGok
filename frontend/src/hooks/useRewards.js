import { useState, useEffect, useCallback, useMemo } from "react";

// 전국 스탬프 로드맵 마일스톤.
// need: 달성에 필요한 총 스탬프 수 / points: 지급 NH포인트(상품권 등 비포인트 보상은 0) / mult: 부스트 배지
export const MILESTONES = [
  { id: "m1", need: 1,  reward: "NH Point 100P",        icon: "🪙", mult: null, points: 100 },
  { id: "m2", need: 3,  reward: "NH Point 300P",        icon: "💰", mult: null, points: 300 },
  { id: "m3", need: 6,  reward: "환율 수수료 면제",      icon: "💱", mult: null, points: 0 },
  { id: "m4", need: 10, reward: "농촌사랑상품권 1000원", icon: "🌾", mult: null, points: 0 },
  { id: "m5", need: 15, reward: "지역사랑상품권 5000원", icon: "🏘️", mult: null, points: 0 },
  { id: "m6", need: 25, reward: "온누리상품권 10000원",  icon: "🏪", mult: null, points: 0 },
];

const storageKey = (username) => `nh_rewards_${username || "guest"}`;

function readClaimed(username) {
  try {
    return new Set(JSON.parse(localStorage.getItem(storageKey(username)) || "[]"));
  } catch {
    return new Set();
  }
}

/**
 * 스탬프 총량에 따라 마일스톤 잠금이 해제되고,
 * 사용자가 직접 "받기"를 누르면 claimed 처리(localStorage에 유저별 저장)된다.
 */
export function useRewards(totalStamps, username) {
  const [claimed, setClaimed] = useState(() => readClaimed(username));

  // 로그인 유저가 바뀌면 해당 유저의 수령 기록을 다시 로드
  useEffect(() => {
    setClaimed(readClaimed(username));
  }, [username]);

  const persist = useCallback(
    (set) => {
      setClaimed(new Set(set));
      try {
        localStorage.setItem(storageKey(username), JSON.stringify([...set]));
      } catch {
        /* 저장 실패는 무시 (프라이빗 모드 등) */
      }
    },
    [username]
  );

  const nodes = useMemo(
    () =>
      MILESTONES.map((m) => {
        const unlocked = totalStamps >= m.need;
        const state = !unlocked
          ? "locked"
          : claimed.has(m.id)
          ? "claimed"
          : "claimable";
        return { ...m, state };
      }),
    [totalStamps, claimed]
  );

  const claim = useCallback(
    (id) => {
      const node = nodes.find((n) => n.id === id);
      if (!node || node.state !== "claimable") return;
      const set = new Set(claimed);
      set.add(id);
      persist(set);
    },
    [nodes, claimed, persist]
  );

  const claimAll = useCallback(() => {
    const set = new Set(claimed);
    let changed = false;
    nodes.forEach((n) => {
      if (n.state === "claimable") {
        set.add(n.id);
        changed = true;
      }
    });
    if (changed) persist(set);
  }, [nodes, claimed, persist]);

  const claimableCount = nodes.filter((n) => n.state === "claimable").length;
  const points = MILESTONES.reduce(
    (sum, m) => sum + (claimed.has(m.id) ? m.points : 0),
    0
  );
  const nextNode = nodes.find((n) => n.state === "locked") || null;

  return { nodes, claim, claimAll, claimableCount, points, nextNode };
}
