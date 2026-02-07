import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AppQueryProvider } from "./app/providers/query_provider";
import { router } from "./app/router/routes";
import "./app/styles/global.css";

// MSW는 개발 환경이면서 VITE_MSW_ENABLED=true일 때만 활성화
const isMswEnabled = (): boolean => {
  const raw = import.meta.env.VITE_MSW_ENABLED;
  if (raw === undefined || raw === "") return false;
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
