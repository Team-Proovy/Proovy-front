import { createBrowserRouter } from "react-router-dom";
import HomePage from "../../pages/HomePage";
import { MathChatInput } from "../../features/editor/components/MathChatInput";
import { LoginPage } from "../../pages/LoginPage";
import { TestPage } from "../../pages/TestPage";

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

  {
    // 홈페이지에 있는 예시 제시문 클릭시 다른 페이지의 input 태그로 해당 텍스트가
    // 잘 들어가는 지 확인하기 위한 테스트 페이지 입니다.
    path: "/testPage",
    element: <TestPage />,
  },
]);
