import { ErrorPageLayout } from "./ErrorPageLayout";

export const ServerErrorPage = () => {
  return (
    <ErrorPageLayout
      statusCode={500}
      title="서버 오류가 발생했습니다"
      description="일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      primaryButtonText="홈으로 이동"
      primaryButtonPath="/app/home"
      secondaryButtonText="다시 시도"
      onSecondaryClick={() => window.location.reload()}
    />
  );
};
