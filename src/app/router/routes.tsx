import { createBrowserRouter } from "react-router-dom";

// Pages (특정 feature에 속하지 않는 독립 페이지)
import { LandingPage } from "../../pages/LandingPage";
import { HomePage } from "../../pages/HomePage";

// Features - Auth
import { LoginPage } from "../../features/auth/pages/LoginPage";
import { SignupPage } from "../../features/auth/pages/SignupPage";
import { KakaoCallbackPage } from "../../features/auth/pages/KakaoCallbackPage";
import { NaverCallbackPage } from "../../features/auth/pages/NaverCallbackPage";
import { GoogleCallbackPage } from "../../features/auth/pages/GoogleCallbackPage";

// Layouts
import { AppLayout } from "../../shared/layout/AppLayout";
import {
  ProtectedRoute,
  PublicRoute,
} from "../../shared/router/components/RouteGuards";

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
  // 🌐 Public Routes (인증 지향적이나 로그인이 필수는 아님)
  // ========================================
  {
    path: "/",
    element: <PublicRoute />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "signup",
        element: <SignupPage />,
      },
    ],
  },
  {
    path: "/oauth/kakao/callback",
    element: <KakaoCallbackPage />,
  },
  {
    path: "/oauth/naver/callback",
    element: <NaverCallbackPage />,
  },
  {
    path: "/oauth/google/callback",
    element: <GoogleCallbackPage />,
  },

  // ========================================
  // 🔒 Protected Routes (인증 필요)
  // ========================================
  {
    path: "/app",
    element: <ProtectedRoute />,
    children: [
      {
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
          {
            path: "chat/:noteId",
            element: <ChatPage />,
          },
        ],
      },
    ],
  },

  // 요금제 페이지 (Sidebar 없음)
  {
    path: "/pricing",
    element: <PricingPage />,
  },
]);
