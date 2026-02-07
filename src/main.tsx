import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AppQueryProvider } from "./app/providers/query_provider";
import { router } from "./app/router/routes";
import "./app/styles/global.css";

// MSW는 개발 환경이면서 VITE_MSW_ENABLED=true일 때만 활성화
// DEV 환경에서 VITE_MSW_ENABLED가 미설정이면 기본값 true로 동작
const isMswEnabled = (): boolean => {
  const raw = import.meta.env.VITE_MSW_ENABLED;
  // 미설정이거나 빈 문자열이면 DEV 환경에서는 true, 프로덕션에서는 false
  if (raw === undefined || raw === "") return import.meta.env.DEV;
  return String(raw).toLowerCase() === "true";
};

const enableMocking = async () => {
  if (import.meta.env.DEV && isMswEnabled()) {
    const { worker } = await import("./mocks/browser");
    return worker.start({
      onUnhandledRequest: "bypass", // 미처리 요청은 실제 서버로 전달
    });
  }
  return Promise.resolve();
};

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AppQueryProvider>
        <RouterProvider router={router} />
      </AppQueryProvider>
    </StrictMode>,
  );
});
