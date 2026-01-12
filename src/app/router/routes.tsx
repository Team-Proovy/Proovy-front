import { createBrowserRouter } from "react-router-dom";
import { MathChatInput } from "../../features/editor/components/MathChatInput";
import HomePage from "../../pages/HomePage";
import { LoginPage } from "../../pages/LoginPage";
import WorkspacePage from "../../features/chat/pages/WorkspacePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/workspace",
    element: <WorkspacePage />,
  },
  {
    path: "/editor",
    element: (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-10">
        <MathChatInput />
      </div>
    ),
  },
]);
