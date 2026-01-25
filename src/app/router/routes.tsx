import { createBrowserRouter } from "react-router-dom";
import HomePage from "../../pages/HomePage";
import { ChatInput } from "../../features/editor/components/ChatInput";
import { LoginPage } from "../../pages/LoginPage";
import WorkspacePage from "../../features/chat/pages/WorkspacePage";
import RepositoryPage from "../../pages/RepositoryPage";

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
    path: "/repository",
    element: <RepositoryPage />,
  },
  {
    path: "/editor",
    element: (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-[50px] bg-gray-50 p-10">
        <ChatInput />
      </div>
    ),
  },
]);
