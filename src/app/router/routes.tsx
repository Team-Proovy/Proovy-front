import { createBrowserRouter } from "react-router-dom";

// Pages (특정 feature에 속하지 않는 독립 페이지)
import { LandingPage } from "../../pages/LandingPage";
import { HomePage } from "../../pages/HomePage";

// Features - Auth
import { LoginPage } from "../../features/auth/pages/LoginPage";
import { SignupPage } from "../../features/auth/pages/SignupPage";
import { KakaoCallbackPage } from "../../features/auth/pages/KakaoCallbackPage";

// Layouts
import { AppLayout } from "../../shared/layout/AppLayout";

// Features - Chat
import { ChatPage } from "../../features/chat/pages/ChatPage";

// Features - Notes
import { NotesPage } from "../../features/notes/pages/NotesPage";

// Features - Storage
import { StoragePage } from "../../features/storage/pages/StoragePage";

// Features - Subscription
import { PricingPage } from "../../features/subscription/pages/PricingPage";

export const router = createBrowserRouter([
  // ========================================
  // 🌐 Public Routes (인증 불필요)
  // ========================================
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/oauth/kakao/callback",
    element: <KakaoCallbackPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },

  // ========================================
  // 🔒 Protected Routes (인증 필요)
  // ========================================
  {
    path: "/app",
    element: <AppLayout />,
    children: [
      // 홈 - 새 노트 시작점
      {
        path: "home",
        element: <HomePage />,
      },
      // 노트 목록 - 전체 노트 리스트
      {
        path: "notes",
        element: <NotesPage />,
      },
      // 저장소 - 전체 파일 리스트
      {
        path: "storage",
        element: <StoragePage />,
      },
      // 대화방
      // ?panel=viewer|storage, ?file=fileId
      {
        path: "chat/:chatId",
        element: <ChatPage />,
      },
    ],
  },

  // 요금제 페이지 (Sidebar 없음)
  {
    path: "/pricing",
    element: <PricingPage />,
  },

  // 🧪 Mock 테스트 페이지 (개발 전용) - 동적 import로 프로덕션에서 제외
  ...(import.meta.env.DEV
    ? [
        {
          path: "/mock-test",
          lazy: async () => {
            const { default: MockTestPage } =
              await import("../../pages/MockTestPage");
            return { element: <MockTestPage /> };
          },
        },
      ]
    : []),
]);
