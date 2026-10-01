import React, { useEffect, useRef } from "react";
import { escapeHtml } from "../utils/escapeHtml";

function toLatLng(spot) {
  return { lat: Number(spot.mapY), lng: Number(spot.mapX) };
}

function getMapCenter(spots) {
  if (!spots.length) return { lat: 36.5, lng: 127.5, zoom: 7 };
  const lat = spots.reduce((s, sp) => s + toLatLng(sp).lat, 0) / spots.length;
  const lng = spots.reduce((s, sp) => s + toLatLng(sp).lng, 0) / spots.length;
  return { lat, lng, zoom: 13 };
}

function markerIconHtml(isSelected, rank) {
  const size = isSelected ? 34 : 26;
  return `<div style="
    width:${size}px;height:${size}px;border-radius:50%;
    background:${isSelected ? "#00a651" : "#ffffff"};
    color:${isSelected ? "#ffffff" : "#00843d"};
    border:2px solid #00843d;
    display:flex;align-items:center;justify-content:center;
    font-size:12px;font-weight:800;
    box-shadow:${isSelected ? "0 0 0 4px rgba(0,166,81,0.2),0 2px 6px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.25)"};
    cursor:pointer;
  ">${rank}</div>`;
}

export default function TourMap({ spots, selectedId, onMarkerClick }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  const validSpots = spots.filter((s) => s.mapX && s.mapY);

  // 지도 초기화 (최초 1회)
  useEffect(() => {
    if (!mapRef.current || !window.naver) return;
    const center = getMapCenter(validSpots);
    mapInstance.current = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(center.lat, center.lng),
      zoom: center.zoom,
      mapTypeId: naver.maps.MapTypeId.NORMAL,
    });
    infoWindowRef.current = new naver.maps.InfoWindow({ content: "" });

    return () => {
      mapInstance.current?.destroy();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 마커 갱신
  useEffect(() => {
    if (!mapInstance.current || !window.naver) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    validSpots.forEach((spot, index) => {
      const { lat, lng } = toLatLng(spot);
      const isSelected = selectedId === spot.id;
      const size = isSelected ? 34 : 26;

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(lat, lng),
        map: mapInstance.current,
        icon: {
          content: markerIconHtml(isSelected, index + 1),
          anchor: new naver.maps.Point(size / 2, size / 2),
        },
        title: spot.name,
        zIndex: isSelected ? 1000 : 0,
      });

      naver.maps.Event.addListener(marker, "click", () => {
        onMarkerClick?.(spot.id);
        infoWindowRef.current.setContent(
          `<div style="padding:8px 12px;font-size:13px;font-weight:700;max-width:200px;">${escapeHtml(spot.name)}</div>`
        );
        infoWindowRef.current.open(mapInstance.current, marker);
      });

      markersRef.current.push(marker);
    });

    if (validSpots.length > 0 && mapInstance.current) {
      const bounds = new naver.maps.LatLngBounds();
      validSpots.forEach((s) => {
        const { lat, lng } = toLatLng(s);
        bounds.extend(new naver.maps.LatLng(lat, lng));
      });
      mapInstance.current.fitBounds(bounds, { padding: 50 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spots, selectedId, onMarkerClick]);

  // 목록에서 선택한 여행지로 지도 중심 이동
  useEffect(() => {
    if (!mapInstance.current || !selectedId || !window.naver) return;
    const spot = validSpots.find((s) => s.id === selectedId);
    if (!spot) return;
    const { lat, lng } = toLatLng(spot);
    mapInstance.current.panTo(new naver.maps.LatLng(lat, lng));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  if (!validSpots.length) {
    return (
      <div className="tour-map-empty">
        <p>지도에 표시할 위치 정보가 없어요</p>
      </div>
    );
  }

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}
