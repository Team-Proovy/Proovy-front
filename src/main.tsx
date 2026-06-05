import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AppQueryProvider } from "./app/providers/query_provider";
import { router } from "./app/router/routes";
import { ToastHost } from "@/shared/components/ui/ToastHost";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { RootErrorFallback } from "@/shared/components/RootErrorFallback";
import "./app/styles/global.css";

const enableMocking = async () => {
  if (import.meta.env.DEV) {
    const { worker } = await import("./mocks/browser");
    return worker.start({
      onUnhandledRequest: "bypass",
    });
  }

  return Promise.resolve();
};

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ErrorBoundary fallback={<RootErrorFallback />}>
        <AppQueryProvider>
          <RouterProvider router={router} />
          <ToastHost />
        </AppQueryProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
});
