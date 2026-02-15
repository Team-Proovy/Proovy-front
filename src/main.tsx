import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AppQueryProvider } from "./app/providers/query_provider";
import { router } from "./app/router/routes";
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
      <AppQueryProvider>
        <RouterProvider router={router} />
      </AppQueryProvider>
    </StrictMode>,
  );
});
