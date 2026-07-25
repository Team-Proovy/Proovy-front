import { createBrowserRouter } from "react-router-dom";

// Pages
import { LandingPage } from "@/pages/LandingPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { SignupPage } from "@/pages/auth/SignupPage";
import { KakaoCallbackPage } from "@/pages/auth/KakaoCallbackPage";
import { NaverCallbackPage } from "@/pages/auth/NaverCallbackPage";
import { ChatPage } from "@/pages/ChatPage";
import { StoragePage } from "@/pages/StoragePage";
import { PricingPage } from "@/pages/PricingPage";
import { UnauthorizedPage } from "@/pages/error/UnauthorizedPage";
import { ForbiddenPage } from "@/pages/error/ForbiddenPage";
import { NotFoundPage } from "@/pages/error/NotFoundPage";
import { ServerErrorPage } from "@/pages/error/ServerErrorPage";

// Layouts
import { AppLayout } from "@/shared/layout/AppLayout";
import {
  ProtectedRoute,
  PublicRoute,
} from "@/shared/router/components/RouteGuards";
import { RootRoute } from "@/shared/router/RootRoute";
import { RouteErrorBoundary } from "@/shared/router/RouteErrorBoundary";

export const router = createBrowserRouter([
  {
    element: <RootRoute />,
    // 라우트 트리 내부에서 throw된 렌더/로더 에러를 잡아 500 페이지로 폴백
    errorElement: <RouteErrorBoundary />,
    children: [
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
      {
        path: "/error/401",
        element: <UnauthorizedPage />,
      },
      {
        path: "/error/403",
        element: <ForbiddenPage />,
      },
      {
        path: "/error/404",
        element: <NotFoundPage />,
      },
      {
        path: "/error/500",
        element: <ServerErrorPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
