import { useNavigate } from "react-router-dom";
import { ProovyIcon } from "@/shared/components/icons/ProovyIcon";

interface ErrorPageLayoutProps {
  statusCode: 401 | 403 | 404 | 500;
  title: string;
  description: string;
  primaryButtonText: string;
  primaryButtonPath: string;
}

export const ErrorPageLayout = ({
  statusCode,
  title,
  description,
  primaryButtonText,
  primaryButtonPath,
}: ErrorPageLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        {/* Proovy 마스코트 */}
        <ProovyIcon className="h-40 w-40" />

        {/* 상태 코드 + 제목 */}
        <div className="mt-20 flex flex-col items-center gap-14">
          <p className="font-[Pretendard] text-[128px] leading-13 font-semibold tracking-[-0.02%] text-[#2A6AFF]">
            {statusCode}
          </p>
          <p className="font-[Pretendard] text-[64px] leading-13 font-semibold tracking-[-0.02%] whitespace-nowrap text-black">
            {title}
          </p>
        </div>

        {/* 설명 */}
        <p className="mt-6 max-w-117.25 text-center font-[Pretendard] text-[16px] leading-6.5 font-normal whitespace-pre-line text-black">
          {description}
        </p>

        {/* 홈으로 버튼 */}
        <button
          type="button"
          onClick={() => navigate(primaryButtonPath)}
          className="mt-20 flex h-13 w-70 items-center justify-center rounded-xl border-[0.5px] border-[#D1D6DE] bg-white font-[Pretendard] text-[20px] font-semibold text-black transition-all duration-300 hover:border-transparent hover:text-[#2A6AFF] hover:shadow-[0px_4px_40px_0px_rgba(0,0,0,0.25)] active:border-transparent active:bg-[#2A6AFF] active:text-white active:shadow-[0px_4px_40px_0px_rgba(0,0,0,0.25)]"
        >
          {primaryButtonText}
        </button>
      </div>
    </div>
  );
};
