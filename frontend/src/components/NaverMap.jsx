import React, { useEffect, useRef } from "react";

function getMapCenter(branches) {
  if (!branches.length) return { lat: 36.5, lng: 127.5, zoom: 13 };
  const lat = branches.reduce((s, b) => s + b.lat, 0) / branches.length;
  const lng = branches.reduce((s, b) => s + b.lng, 0) / branches.length;
  return { lat, lng, zoom: 14 };
}

function branchIconHtml(isSelected, isNearby, branchName) {
  const bgColor = isNearby ? "#e8a000" : "#008542";
  const borderColor = isNearby ? "#ffb700" : "#005c2e";
  const circleSize = isSelected ? 42 : 34;
  const imgSize = Math.round(circleSize * 0.7);

  const shortName = branchName
    .replace("NH농협은행 ", "")
    .replace("농협은행 ", "");

  return `
    <div style="display:flex;align-items:center;gap:5px;cursor:pointer;">
      <div style="
        width:${circleSize}px;height:${circleSize}px;
        background:${bgColor};
        border-radius:50%;
        border:2.5px solid ${borderColor};
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
        flex-shrink:0;
      ">
        <img src="/cyber_symbol.gif"
          width="${imgSize}" height="${imgSize}"
          style="object-fit:contain;filter:brightness(0) invert(1);"
        />
      </div>
      <div style="
        background:white;
        color:#1a1a1a;
        font-size:11px;
        font-weight:700;
        padding:3px 7px;
        border-radius:8px;
        white-space:nowrap;
        box-shadow:0 1px 4px rgba(0,0,0,0.2);
        line-height:1.4;
      ">${shortName}</div>
    </div>
  `;
}

export default function NaverMap({
  sigunguName,
  branches,
  userPosition,
  onMarkerClick,
  selectedBranch,
  nearbyBranch,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const infoWindowRef = useRef(null);

  // 지도 초기화 (시군구 변경 시 재생성)
  useEffect(() => {
    if (!mapRef.current || !window.naver) return;

    if (mapInstance.current) {
      mapInstance.current.destroy();
      mapInstance.current = null;
      markersRef.current = [];
      userMarkerRef.current = null;
    }

    const center = getMapCenter(branches);
    mapInstance.current = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(center.lat, center.lng),
      zoom: center.zoom,
      mapTypeId: naver.maps.MapTypeId.NORMAL,
    });

    infoWindowRef.current = new naver.maps.InfoWindow({ content: "" });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, [sigunguName]);

  // 은행 마커 갱신
  useEffect(() => {
    if (!mapInstance.current || !window.naver) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    branches.forEach((branch) => {
      const isSelected = selectedBranch?.id === branch.id;
      const isNearby = nearbyBranch?.id === branch.id;
      const circleSize = isSelected ? 42 : 34;

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(branch.lat, branch.lng),
        map: mapInstance.current,
        icon: {
          content: branchIconHtml(isSelected, isNearby, branch.name),
          anchor: new naver.maps.Point(circleSize / 2, circleSize / 2),
        },
        title: branch.name,
        zIndex: isSelected ? 1000 : 0,
      });

      naver.maps.Event.addListener(marker, "click", () => {
        onMarkerClick(branch);
        infoWindowRef.current.setContent(
          `<div style="padding:10px 14px;font-size:13px;line-height:1.6;min-width:160px;">
            <b style="font-size:14px;">${branch.name}</b><br/>
            <span style="color:#555;">${branch.address}</span>
          </div>`
        );
        infoWindowRef.current.open(mapInstance.current, marker);
      });

      markersRef.current.push(marker);
    });

    // 모든 마커가 보이도록 지도 범위 조정
    if (branches.length > 0 && mapInstance.current) {
      const bounds = new naver.maps.LatLngBounds();
      branches.forEach((b) =>
        bounds.extend(new naver.maps.LatLng(b.lat, b.lng))
      );
      mapInstance.current.fitBounds(bounds, { padding: 60 });
    }
  }, [branches, selectedBranch, nearbyBranch, onMarkerClick]);

  // 사용자 현재 위치 마커
  useEffect(() => {
    if (!mapInstance.current || !userPosition || !window.naver) return;

    userMarkerRef.current?.setMap(null);
    userMarkerRef.current = new naver.maps.Marker({
      position: new naver.maps.LatLng(userPosition.lat, userPosition.lng),
      map: mapInstance.current,
      icon: {
        content: `<div style="
          background:#2979ff;border-radius:50%;
          width:18px;height:18px;
          border:3px solid white;
          box-shadow:0 0 0 6px rgba(41,121,255,0.25);
        "></div>`,
        anchor: new naver.maps.Point(9, 9),
      },
      title: "현재 위치",
      zIndex: 2000,
    });
  }, [userPosition]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}
