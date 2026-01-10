import { createBrowserRouter } from "react-router-dom";
import HomePage from "../../pages/HomePage";
import { MathChatInput } from "../../features/editor/components/MathChatInput";
import { LoginPage } from "../../pages/LoginPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },

  // 추후 로그인, 채팅 등 라우트 추가 예정
  {
    path: "/login",
    element: <LoginPage />,
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
