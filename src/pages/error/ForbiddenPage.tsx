import { ErrorPageLayout } from "./ErrorPageLayout";

export const ForbiddenPage = () => {
  return (
    <ErrorPageLayout
      statusCode={403}
      title="Forbidden"
      description={
        "요청한 페이지에 접근할 수 있는 권한이 없습니다.\n홈으로 돌아가 주세요."
      }
      primaryButtonText="홈으로"
      primaryButtonPath="/app/home"
    />
  );
};
