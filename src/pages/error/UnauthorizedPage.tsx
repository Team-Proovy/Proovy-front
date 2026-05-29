import { ErrorPageLayout } from "./ErrorPageLayout";

export const UnauthorizedPage = () => {
  return (
    <ErrorPageLayout
      statusCode={401}
      title="Unauthorized"
      description={"인증 정보가 없거나 만료되었습니다.\n다시 로그인해 주세요."}
      primaryButtonText="로그인하기"
      primaryButtonPath="/login"
    />
  );
};
