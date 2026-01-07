import { createBrowserRouter } from "react-router-dom";
import HomePage from "../../pages/home_page";
import WorkspacePage from "../../features/chat/pages/WorkspacePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/workspace",
    element: <WorkspacePage />,
  },
  // 추후 로그인, 채팅 등 라우트 추가 예정
]);
