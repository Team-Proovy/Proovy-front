import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth_store";

/**
 * ProtectedRoute - 로그인한 사용자만 접근 가능
 */
export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // 로그인 페이지로 리다이렉트하되, 현재 위치를 state로 넘겨서 로그인 후 돌아올 수 있게 함
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
};

/**
 * PublicRoute - 로그인하지 않은 사용자만 접근 가능 (로그인/회원가입/랜딩 등)
 * 로그인한 사용자가 접근하면 홈으로 리다이렉트
 */
export const PublicRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return (
      <Navigate
        to="/app/home"
        replace
      />
    );
  }

  return <Outlet />;
};
