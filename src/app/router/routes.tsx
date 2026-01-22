import { createBrowserRouter } from "react-router-dom";
import HomePage from "../../pages/HomePage";
import { ChatInput } from "../../features/editor/components/ChatInput";
import { LoginPage } from "../../pages/LoginPage";
import { TestPage } from "../../pages/TestPage";
import WorkspacePage from "../../features/chat/pages/WorkspacePage";

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
    path: "/workspace",
    element: <WorkspacePage />,
  },
  {
    path: "/chatting",
    element: <WorkspacePage />,
  },
  {
    path: "/editor",
    element: (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-[50px] bg-gray-50 p-10">
        <ChatInput />
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
