import { ErrorPageLayout } from "./ErrorPageLayout";

export const UnauthorizedPage = () => {
  return (
    <ErrorPageLayout
      statusCode={401}
      title="인증이 필요합니다"
      description="로그인 정보가 없거나 만료되었습니다. 다시 로그인해주세요."
      primaryButtonText="로그인 하러가기"
      primaryButtonPath="/login"
    />
  );
};
