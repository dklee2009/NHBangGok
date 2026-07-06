import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as d3 from "d3";
import "./KoreaMap.css";

// GeoJSON name_eng → 앱에서 사용하는 시/도 한글명 매핑
const ENG_TO_KOR = {
  Seoul:             "서울특별시",
  Busan:             "부산광역시",
  Daegu:             "대구광역시",
  Incheon:           "인천광역시",
  Gwangju:           "광주광역시",
  Daejeon:           "대전광역시",
  Ulsan:             "울산광역시",
  Sejongsi:          "세종특별자치시",
  "Gyeonggi-do":     "경기도",
  "Gangwon-do":      "강원특별자치도",
  "Chungcheongbuk-do": "충청북도",
  "Chungcheongnam-do": "충청남도",
  "Jeollabuk-do":    "전북특별자치도",
  "Jeollanam-do":    "전라남도",
  "Gyeongsangbuk-do": "경상북도",
  "Gyeongsangnam-do": "경상남도",
  "Jeju-do":         "제주특별자치도",
};

// 지도에 표시할 짧은 이름
const SHORT_NAME = {
  "서울특별시":     "서울",
  "부산광역시":     "부산",
  "대구광역시":     "대구",
  "인천광역시":     "인천",
  "광주광역시":     "광주",
  "대전광역시":     "대전",
  "울산광역시":     "울산",
  "세종특별자치시": "세종",
  "경기도":         "경기",
  "강원특별자치도": "강원",
  "충청북도":       "충북",
  "충청남도":       "충남",
  "전북특별자치도": "전북",
  "전라남도":       "전남",
  "경상북도":       "경북",
  "경상남도":       "경남",
  "제주특별자치도": "제주",
};

const WIDTH = 500;
const HEIGHT = 580;

export default function KoreaMap({ visited, getStampCount }) {
  const navigate = useNavigate();
  const [geoData, setGeoData] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [paths, setPaths] = useState([]);
  const [centroids, setCentroids] = useState({});

  useEffect(() => {
    fetch("/korea-provinces.json")
      .then((r) => r.json())
      .then(setGeoData);
  }, []);

  useEffect(() => {
    if (!geoData) return;

    const projection = d3
      .geoMercator()
      .fitSize([WIDTH, HEIGHT], geoData);

    const pathGen = d3.geoPath().projection(projection);

    const computed = geoData.features.map((feat) => {
      const korName = ENG_TO_KOR[feat.properties.name_eng] || feat.properties.name_eng;
      return {
        id: feat.properties.code,
        name: korName,
        d: pathGen(feat),
        centroid: pathGen.centroid(feat),
      };
    });

    setPaths(computed);

    const c = {};
    computed.forEach((p) => { c[p.name] = p.centroid; });
    setCentroids(c);
  }, [geoData]);

  const handleClick = (sido) => {
    navigate(`/sido/${encodeURIComponent(sido)}`);
  };

  return (
    <div className="korea-map-wrapper">
      {!geoData && (
        <div className="map-skeleton">
          <div className="skeleton-spinner" />
          <p>지도 불러오는 중...</p>
        </div>
      )}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
        className="korea-map-svg"
      >
        <defs>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        {paths.map((sido) => {
          const isVisited = visited(sido.name);
          const isHovered = hovered === sido.id;
          const count = getStampCount(sido.name);
          const [cx, cy] = sido.centroid;

          return (
            <g
              key={sido.id}
              onClick={() => handleClick(sido.name)}
              onMouseEnter={() => setHovered(sido.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              <path
                d={sido.d}
                className={[
                  "sido-path",
                  isVisited ? "sido-visited" : "sido-unvisited",
                  isHovered ? "sido-hovered" : "",
                ].join(" ")}
              />
              {/* 지역 이름 */}
              <text
                x={cx}
                y={cy}
                className={`sido-label ${isVisited ? "sido-label-visited" : ""}`}
                pointerEvents="none"
              >
                {SHORT_NAME[sido.name] || sido.name}
              </text>
              {/* 방문 횟수 배지 */}
              {isVisited && count > 0 && (
                <text
                  x={cx}
                  y={cy + 13}
                  className="sido-stamp-count"
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
        <div className="map-tooltip">
          {paths.find((p) => p.id === hovered)?.name}
          {visited(paths.find((p) => p.id === hovered)?.name || "")
            ? ` ✓ (${getStampCount(paths.find((p) => p.id === hovered)?.name || "")}개)`
            : " — 클릭해서 방문"}
        </div>
      )}
    </div>
  );
}
