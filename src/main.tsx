import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./app/styles/global.css";
import { AppQueryProvider } from "./app/providers/query_provider";
import { router } from "./app/router/routes";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppQueryProvider>
      <RouterProvider router={router} />
    </AppQueryProvider>
  </StrictMode>,
);
