import { ErrorPageLayout } from "./ErrorPageLayout";

export const ForbiddenPage = () => {
  return (
    <ErrorPageLayout
      statusCode={403}
      title="접근 권한이 없습니다"
      description="요청한 페이지에 접근할 수 있는 권한이 없습니다."
      primaryButtonText="홈으로 이동"
      primaryButtonPath="/app/home"
      secondaryButtonText="이전 페이지"
      onSecondaryClick={() => window.history.back()}
    />
  );
};
