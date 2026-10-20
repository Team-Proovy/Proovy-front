/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";
import { resolveApiMode } from "./src/app/api_mode";

// 개발 proxy의 기본 대상은 로컬 개발 Server다. 다른 Server로 보내려면
// .env.local 등에 DEV_API_PROXY_TARGET을 둔다(VITE_ 접두사가 없어 브라우저에 노출되지 않는다).
// 로컬 http Server를 전제로 한다. proxy는 브라우저 Origin을 그대로 넘기므로 Server가 localhost Origin을
// 허용해야 한다(Server local profile은 http://localhost:* 허용 — 브라우저를 127.0.0.1로 열면 POST가 403).
// 자체 서명 인증서 https는 검증 실패로 연결되지 않는다.
const DEFAULT_DEV_API_PROXY_TARGET = "http://localhost:8080";

// MSW worker(public/mockServiceWorker.js)는 개발 서버의 fixture 모드(VITE_API_MODE=fixture)에서만 쓴다.
// public 파일은 build 산출물로 그대로 복사되므로 운영 build에서는 지운다.
const excludeMswWorkerFromBuild = (): Plugin => {
  let outDir = "dist";
  return {
    name: "exclude-msw-worker-from-build",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      fs.rmSync(path.join(outDir, "mockServiceWorker.js"), { force: true });
    },
  };
};

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (command === "serve") {
    // 잘못된 VITE_API_MODE는 페이지 로드 전에 dev server 시작에서 실패시킨다.
    resolveApiMode(env.VITE_API_MODE);
  }
  const devApiProxyTarget =
    env.DEV_API_PROXY_TARGET || DEFAULT_DEV_API_PROXY_TARGET;

  return {
    plugins: [react(), tailwindcss(), excludeMswWorkerFromBuild()],
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
