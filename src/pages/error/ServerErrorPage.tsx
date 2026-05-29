import { ErrorPageLayout } from "./ErrorPageLayout";

export const ServerErrorPage = () => {
  return (
    <ErrorPageLayout
      statusCode={500}
      title="Server Error"
      description={"일시적인 오류가 발생했습니다.\n잠시 후 다시 시도해 주세요."}
      primaryButtonText="홈으로"
      primaryButtonPath="/app/home"
    />
  );
};
