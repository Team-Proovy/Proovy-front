import { ErrorPageLayout } from "./ErrorPageLayout";

export const NotFoundPage = () => {
  return (
    <ErrorPageLayout
      statusCode={404}
      title="페이지를 찾을 수 없습니다"
      description="입력한 주소가 잘못되었거나 페이지가 이동/삭제되었습니다."
      primaryButtonText="홈으로 이동"
      primaryButtonPath="/app/home"
      secondaryButtonText="이전 페이지"
      onSecondaryClick={() => window.history.back()}
    />
  );
};
