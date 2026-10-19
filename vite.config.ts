/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// 개발 proxy의 기본 대상은 로컬 개발 Server다. 다른 Server로 보내려면
// .env.local 등에 DEV_API_PROXY_TARGET을 둔다(VITE_ 접두사가 없어 브라우저에 노출되지 않는다).
const DEFAULT_DEV_API_PROXY_TARGET = "http://localhost:8080";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devApiProxyTarget =
    env.DEV_API_PROXY_TARGET || DEFAULT_DEV_API_PROXY_TARGET;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: devApiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: "jsdom",
      include: ["src/**/*.test.{ts,tsx}"],
      setupFiles: ["./src/test/setup_tests.ts"],
      restoreMocks: true,
    },
  };
});
