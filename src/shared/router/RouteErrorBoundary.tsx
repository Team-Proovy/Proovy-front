import { useEffect } from "react";
import { useRouteError } from "react-router-dom";
import { ServerErrorPage } from "@/pages/error/ServerErrorPage";

/**
 * 라우트 트리 내부에서 throw된 렌더/로더 에러를 잡는 경계.
 *
 * 라우터 컨텍스트 안에서 렌더되므로 기존 500 에러 페이지를 그대로 재활용한다.
 * (errorElement로 연결 → useNavigate 등 라우터 훅 정상 동작)
 */
export const RouteErrorBoundary = () => {
  const error = useRouteError();

  useEffect(() => {
    // TODO: 추후 Sentry 등 외부 에러 로깅 연동 지점
    console.error("[RouteError]", error);
  }, [error]);

  return <ServerErrorPage />;
};
