import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";

interface SocialCallbackLayoutProps {
  errorMsg?: string | null;
  onRetry?: () => void;
  isLoading?: boolean;
}

export const SocialCallbackLayout = ({
  errorMsg,
  onRetry,
  isLoading = true,
}: SocialCallbackLayoutProps) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white">
      <div className="text-center">
        {errorMsg && (
          <h2 className="mb-4 text-xl font-bold text-gray-800">로그인 오류</h2>
        )}
        {isLoading && !errorMsg && <LoadingSpinner size={80} />}
      </div>
      {errorMsg && (
        <div className="max-w-md rounded-lg bg-red-50 p-4 text-center text-red-600">
          {errorMsg}
          <div className="mt-4">
            <button
              onClick={handleRetry}
              className="cursor-pointer rounded-[8px] bg-[#2A6AFF] px-[16px] py-[8px] font-['Pretendard'] text-[14px] font-semibold text-white transition-all duration-200 hover:bg-[#1A5AE8] active:bg-[#1546B3]"
            >
              로그인 페이지로 돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
