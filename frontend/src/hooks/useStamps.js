import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

const API = "http://localhost:8000";

export function useStamps() {
  const { token } = useAuth();
  const [visited, setVisited] = useState({});
  const [loading, setLoading] = useState(false);

  // 서버에서 스탬프 데이터 로드
  const fetchStamps = useCallback(async () => {
    if (!token) { setVisited({}); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/stamps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVisited(data.visited || {});
      }
    } catch (e) {
      console.error("스탬프 로드 실패", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchStamps(); }, [fetchStamps]);

  // 스탬프 추가
  const addStamp = useCallback(async (sidoName, sigunguName, branchId, branchName) => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/stamps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sido_name: sidoName, sigungu_name: sigunguName, branch_id: branchId, branch_name: branchName }),
      });
      if (res.ok) {
        // 로컬 상태 즉시 업데이트 (재요청 없이)
        setVisited((prev) => {
          const sido = prev[sidoName] || {};
          const sigungu = sido[sigunguName] || [];
          if (sigungu.some((s) => s.branchId === branchId)) return prev;
          return {
            ...prev,
            [sidoName]: {
              ...sido,
              [sigunguName]: [...sigungu, { branchId, branchName, visitedAt: new Date().toISOString() }],
            },
          };
        });
      } else if (res.status !== 409) {
        console.error("스탬프 추가 실패", await res.text());
      }
    } catch (e) {
      console.error("스탬프 추가 실패", e);
    }
  }, [token]);

  const hasSidoVisited = (sidoName) =>
    Object.values(visited[sidoName] || {}).some((arr) => arr.length > 0);

  const hasSigunguVisited = (sidoName, sigunguName) =>
    !!visited[sidoName]?.[sigunguName]?.length;

  const getSidoStampCount = (sidoName) =>
    Object.values(visited[sidoName] || {}).reduce((s, arr) => s + arr.length, 0);

  const getSigunguStampCount = (sidoName, sigunguName) =>
    visited[sidoName]?.[sigunguName]?.length || 0;

  const getVisitedSidos = () =>
    Object.keys(visited).filter((k) => hasSidoVisited(k));

  const getVisitedSigungus = (sidoName) => {
    const sido = visited[sidoName];
    if (!sido) return [];
    return Object.keys(sido).filter((k) => sido[k].length > 0);
  };

  const getTotalStamps = () =>
    Object.values(visited).reduce((sum, sido) =>
      sum + Object.values(sido).reduce((s2, arr) => s2 + arr.length, 0), 0);

  return {
    visited,
    loading,
    addStamp,
    fetchStamps,
    hasSidoVisited,
    hasSigunguVisited,
    getSidoStampCount,
    getSigunguStampCount,
    getVisitedSidos,
    getVisitedSigungus,
    getTotalStamps,
  };
}