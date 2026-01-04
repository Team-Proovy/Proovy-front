import { createBrowserRouter } from "react-router-dom";
import HomePage from "../../pages/HomePage";
import TestPage from "../../pages/test_page";
export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },

  // 추후 로그인, 채팅 등 라우트 추가 예정
]);
