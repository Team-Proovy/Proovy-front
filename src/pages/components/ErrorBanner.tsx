interface ErrorBannerProps {
  message: string;
  onClose: () => void;
}

/** 상단 에러 배너 */
export const ErrorBanner = ({ message, onClose }: ErrorBannerProps) => (
  <div className="flex items-center justify-between bg-red-50 px-4 py-3 text-sm text-red-700">
    <span>{message}</span>
    <button
      onClick={onClose}
      className="ml-4 font-medium text-red-700 underline"
    >
      닫기
    </button>
  </div>
);
