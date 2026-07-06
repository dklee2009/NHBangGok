import { useState, useEffect } from "react";

const STORAGE_KEY = "nh_stamp_tour_v2";

// 저장 구조: { "서울특별시": { "종로구": [{ branchId, branchName, visitedAt }] } }

export function useStamps() {
  const [visited, setVisited] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visited));
  }, [visited]);

  // 도장 추가 (시/도 + 시/군/구 + 지점)
  const addStamp = (sidoName, sigunguName, branchId, branchName) => {
    setVisited((prev) => {
      const sido = prev[sidoName] || {};
      const sigungu = sido[sigunguName] || [];
      if (sigungu.some((s) => s.branchId === branchId)) return prev;
      return {
        ...prev,
        [sidoName]: {
          ...sido,
          [sigunguName]: [
            ...sigungu,
            { branchId, branchName, visitedAt: new Date().toISOString() },
          ],
        },
      };
    });
  };

  // 시/도 방문 여부 (하나 이상의 시/군/구에 도장이 있으면 true)
  const hasSidoVisited = (sidoName) => {
    const sido = visited[sidoName];
    if (!sido) return false;
    return Object.values(sido).some((arr) => arr.length > 0);
  };

  // 시/군/구 방문 여부
  const hasSigunguVisited = (sidoName, sigunguName) => {
    return !!visited[sidoName]?.[sigunguName]?.length;
  };

  // 시/도 내 도장 총 개수
  const getSidoStampCount = (sidoName) => {
    const sido = visited[sidoName];
    if (!sido) return 0;
    return Object.values(sido).reduce((sum, arr) => sum + arr.length, 0);
  };

  // 시/군/구 도장 개수
  const getSigunguStampCount = (sidoName, sigunguName) => {
    return visited[sidoName]?.[sigunguName]?.length || 0;
  };

  // 방문한 시/도 목록
  const getVisitedSidos = () => {
    return Object.keys(visited).filter((k) => hasSidoVisited(k));
  };

  // 방문한 시/군/구 목록 (특정 시/도 내)
  const getVisitedSigungus = (sidoName) => {
    const sido = visited[sidoName];
    if (!sido) return [];
    return Object.keys(sido).filter((k) => sido[k].length > 0);
  };

  // 전체 도장 수
  const getTotalStamps = () => {
    return Object.values(visited).reduce((sum, sido) => {
      return sum + Object.values(sido).reduce((s2, arr) => s2 + arr.length, 0);
    }, 0);
  };

  return {
    visited,
    addStamp,
    hasSidoVisited,
    hasSigunguVisited,
    getSidoStampCount,
    getSigunguStampCount,
    getVisitedSidos,
    getVisitedSigungus,
    getTotalStamps,
  };
}
