import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as d3 from "d3";
import "./SigunguMap.css";

// 시/도 이름 → GeoJSON sido_code 매핑
const SIDO_CODE = {
  "서울특별시":     "11",
  "부산광역시":     "21",
  "대구광역시":     "22",
  "인천광역시":     "23",
  "광주광역시":     "24",
  "대전광역시":     "25",
  "울산광역시":     "26",
  "세종특별자치시": "29",
  "경기도":         "31",
  "강원특별자치도": "32",
  "충청북도":       "33",
  "충청남도":       "34",
  "전북특별자치도": "35",
  "전라남도":       "36",
  "경상북도":       "37",
  "경상남도":       "38",
  "제주특별자치도": "39",
};

const WIDTH = 500;
const HEIGHT = 520;

// 시군구 GeoJSON은 한번만 fetch해서 모듈 캐시에 저장
let cachedData = null;
async function fetchSigunguData() {
  if (cachedData) return cachedData;
  const res = await fetch("/korea-sigungu.json");
  cachedData = await res.json();
  return cachedData;
}

export default function SigunguMap({ sidoName, hasSigunguVisited, getSigunguStampCount }) {
  const navigate = useNavigate();
  const [paths, setPaths] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchSigunguData().then((data) => {
      if (cancelled) return;

      const sidoCode = SIDO_CODE[sidoName];
      const filtered = {
        type: "FeatureCollection",
        features: data.features.filter(
          (f) => f.properties.sido_code === sidoCode
        ),
      };

      if (filtered.features.length === 0) {
        setLoading(false);
        return;
      }

      const projection = d3.geoMercator().fitSize([WIDTH, HEIGHT], filtered);
      const pathGen = d3.geoPath().projection(projection);

      const computed = filtered.features.map((feat) => ({
        code: feat.properties.code,
        name: feat.properties.name,   // 한국어 이름 (UTF-8)
        nameEng: feat.properties.name_eng,
        d: pathGen(feat),
        centroid: pathGen.centroid(feat),
      }));

      setPaths(computed);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [sidoName]);

  const handleClick = (sigungu) => {
    navigate(`/city/${encodeURIComponent(sidoName)}/${encodeURIComponent(sigungu.name)}`);
  };

  if (loading) {
    return (
      <div className="sigungu-loading">
        <div className="skeleton-spinner" />
        <p>지도 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="sigungu-map-wrapper">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
        className="sigungu-map-svg"
      >
        {paths.map((sg) => {
          const isVisited = hasSigunguVisited(sidoName, sg.name);
          const isHovered = hovered === sg.code;
          const count = getSigunguStampCount(sidoName, sg.name);
          const [cx, cy] = sg.centroid;
          const isNaN_cx = isNaN(cx) || isNaN(cy);

          return (
            <g
              key={sg.code}
              onClick={() => handleClick(sg)}
              onMouseEnter={() => setHovered(sg.code)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              <path
                d={sg.d}
                className={[
                  "sigungu-path",
                  isVisited ? "sigungu-visited" : "sigungu-unvisited",
                  isHovered ? "sigungu-hovered" : "",
                ].join(" ")}
              />
              {!isNaN_cx && (
                <text
                  x={cx}
                  y={cy}
                  className={`sigungu-label ${isVisited ? "sigungu-label-visited" : ""}`}
                  pointerEvents="none"
                >
                  {sg.name}
                </text>
              )}
              {isVisited && count > 0 && !isNaN_cx && (
                <text
                  x={cx}
                  y={cy + 13}
                  className="sigungu-stamp-count"
                  pointerEvents="none"
                >
                  {count}개
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div className="sigungu-tooltip">
          {paths.find((p) => p.code === hovered)?.name}
          {hasSigunguVisited(sidoName, paths.find((p) => p.code === hovered)?.name || "")
            ? " ✓"
            : " — 클릭해서 선택"}
        </div>
      )}
    </div>
  );
}
