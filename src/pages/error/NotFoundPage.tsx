import { ErrorPageLayout } from "./ErrorPageLayout";

export const NotFoundPage = () => {
  return (
    <ErrorPageLayout
      statusCode={404}
      title="Page Not Found"
      description={
        "요청하신 페이지를 찾을 수 없습니다.\n주소를 확인하거나 다시 시도해 주세요."
      }
      primaryButtonText="홈으로"
      primaryButtonPath="/app/home"
    />
  );
};
