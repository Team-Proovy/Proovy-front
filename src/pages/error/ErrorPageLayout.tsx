import { useNavigate } from "react-router-dom";

interface ErrorPageLayoutProps {
  statusCode: 401 | 403 | 404 | 500;
  title: string;
  description: string;
  primaryButtonText: string;
  primaryButtonPath: string;
  secondaryButtonText?: string;
  onSecondaryClick?: () => void;
}

export const ErrorPageLayout = ({
  statusCode,
  title,
  description,
  primaryButtonText,
  primaryButtonPath,
  secondaryButtonText,
  onSecondaryClick,
}: ErrorPageLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F8F9FA] px-4">
      <div className="flex w-full max-w-[560px] flex-col items-center rounded-[20px] border-[0.5px] border-[#D1D6DE] bg-white px-8 py-10 text-center">
        <p className="text-[40px] leading-[52px] font-bold text-[#2A6AFF]">
          {statusCode}
        </p>
        <h1 className="mt-2 text-[28px] leading-[36px] font-semibold text-black">
          {title}
        </h1>
        <p className="mt-3 text-[16px] leading-[24px] text-[#5D6470]">
          {description}
        </p>

        <div className="mt-8 flex w-full max-w-[360px] gap-3">
          {secondaryButtonText && onSecondaryClick && (
            <button
              type="button"
              onClick={onSecondaryClick}
              className="flex-1 rounded-[10px] border-[0.5px] border-[#D1D6DE] bg-white py-3 text-[15px] font-medium text-black transition-colors hover:bg-[#F1F4F8]"
            >
              {secondaryButtonText}
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(primaryButtonPath)}
            className="flex-1 rounded-[10px] bg-[#2A6AFF] py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#1A5AE8]"
          >
            {primaryButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
