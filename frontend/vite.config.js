import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// /login, /city/... 같은 경로로 바로 들어오거나 새로고침해도 앱이 뜨도록
// 빌드 결과의 index.html을 404.html로도 복사한다 (정적 호스팅의 404 대체 페이지).
function spaFallback() {
  return {
    name: "spa-fallback-404",
    apply: "build",
    closeBundle() {
      const dist = resolve(__dirname, "dist");
      copyFileSync(resolve(dist, "index.html"), resolve(dist, "404.html"));
    },
  };
}

export default defineConfig({
  plugins: [react(), spaFallback()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
