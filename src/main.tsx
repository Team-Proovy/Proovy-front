import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AppQueryProvider } from "./app/providers/query_provider";
import { router } from "./app/router/routes";
import { resolveApiMode } from "./app/api_mode";
import { ToastHost } from "@/shared/components/ui/ToastHost";
import "./app/styles/global.css";

// fixture 모드는 개발 서버에서 VITE_API_MODE=fixture로만 켠다. 기본은 실제 Server(vite proxy)다.
// 잘못된 값은 vite.config.ts가 dev server 시작 때 거부한다.
// 운영 build에서는 DEV가 false라 이 분기와 MSW가 bundle에 들어가지 않는다.
const startFixtureMode = async () => {
  if (
    import.meta.env.DEV &&
    resolveApiMode(import.meta.env.VITE_API_MODE) === "fixture"
  ) {
    const { worker } = await import("./mocks/browser");
    await worker.start({
      onUnhandledRequest: "bypass",
    });
  }
};

startFixtureMode().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AppQueryProvider>
        <RouterProvider router={router} />
        <ToastHost />
      </AppQueryProvider>
    </StrictMode>,
  );
});
