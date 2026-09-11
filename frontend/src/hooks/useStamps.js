import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE } from "../config";

const API = API_BASE;

// 시/도별 전체 시·군·구(권역) 수 — korea-sigungu.json 기준.
// "권역 달성률 = 방문한 시·군·구 수 / 전체 시·군·구 수" 계산에 사용.
export const SIDO_TOTAL_SIGUNGU = {
  "서울특별시": 25,
  "부산광역시": 16,
  "대구광역시": 8,
  "인천광역시": 10,
  "광주광역시": 5,
  "대전광역시": 5,
  "울산광역시": 5,
  "세종특별자치시": 1,
  "경기도": 42,
  "강원특별자치도": 18,
  "충청북도": 14,
  "충청남도": 16,
  "전북특별자치도": 15,
  "전라남도": 22,
  "경상북도": 24,
  "경상남도": 22,
  "제주특별자치도": 2,
};

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

  // 스탬프 추가. { ok: true } 또는 { ok: false, message, status } 반환.
  // message는 실패 원인을 구체적으로 설명하는 문자열로, 사용자에게 그대로 보여줄 수 있다.
  const addStamp = useCallback(async (sidoName, sigunguName, branchId, branchName) => {
    if (!token) return { ok: false, message: "로그인이 필요합니다. 다시 로그인해주세요.", status: null };
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
        return { ok: true };
      } else if (res.status === 409) {
        return { ok: true };
      } else {
        let detail = "";
        try {
          const data = await res.json();
          detail = data.detail || "";
        } catch {
          detail = await res.text().catch(() => "");
        }
        const message =
          res.status === 401
            ? "로그인이 만료되었습니다. 다시 로그인해주세요."
            : `스탬프 저장 실패 (서버 응답 ${res.status})${detail ? `: ${detail}` : ""}`;
        console.error("스탬프 추가 실패", res.status, detail);
        return { ok: false, message, status: res.status };
      }
    } catch (e) {
      console.error("스탬프 추가 실패", e);
      return {
        ok: false,
        message: `서버에 연결할 수 없습니다 (${e.message || "알 수 없는 오류"}). 인터넷 연결 또는 서버 상태를 확인해주세요.`,
        status: null,
      };
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

  // 시/도 권역 달성률 (0 ~ 1). 방문한 시·군·구 수 / 전체 시·군·구 수.
  const getSidoProgress = (sidoName) => {
    const total = SIDO_TOTAL_SIGUNGU[sidoName] || 1;
    const done = getVisitedSigungus(sidoName).length;
    return Math.max(0, Math.min(1, done / total));
  };

  // 시/도별 권역 진행 정보 { done, total, ratio }
  const getSidoProgressInfo = (sidoName) => {
    const total = SIDO_TOTAL_SIGUNGU[sidoName] || 1;
    const done = getVisitedSigungus(sidoName).length;
    return { done, total, ratio: Math.max(0, Math.min(1, done / total)) };
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
    getSidoProgress,
    getSidoProgressInfo,
    getTotalStamps,
  };
}