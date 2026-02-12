import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AppQueryProvider } from "./app/providers/query_provider";
import { router } from "./app/router/routes";
import "./app/styles/global.css";
// MSW 개발 환경에서만 활성화
const enableMocking = async () => {
  // if (import.meta.env.DEV) {
  //   const { worker } = await import("./mocks/browser");
  //   return worker.start({
  //     onUnhandledRequest: "bypass", // 미처리 요청은 실제 서버로 전달
  //   });
  // }
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
