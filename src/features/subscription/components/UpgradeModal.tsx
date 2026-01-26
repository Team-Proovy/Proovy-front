import { X } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * UpgradeModal - 업그레이드 안내 모달
 *
 * 사이드바 "업그레이드" 버튼 클릭 시 열림
 * TODO: 실제 요금제 정보 및 결제 페이지 연동 필요
 */
export const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-[500px] rounded-[16px] bg-white p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-[#666] transition-colors hover:bg-[#F0F0F0]"
        >
          <X size={20} />
        </button>

        {/* 헤더 */}
        <div className="mb-6 text-center">
          <h2 className="text-[24px] font-bold text-[#333]">
            Pro로 업그레이드
          </h2>
          <p className="mt-2 text-[14px] text-[#666]">
            더 많은 기능을 사용해보세요
          </p>
        </div>

        {/* 요금제 비교 */}
        <div className="mb-6 flex gap-4">
          {/* Free 플랜 */}
          <div className="flex-1 rounded-[12px] border border-[#E5E5E5] p-4">
            <h3 className="text-[16px] font-semibold text-[#333]">Free</h3>
            <p className="mt-1 text-[24px] font-bold text-[#333]">₩0</p>
            <ul className="mt-4 space-y-2 text-[13px] text-[#666]">
              <li>✓ 월 200 크레딧</li>
              <li>✓ 기본 AI 응답</li>
              <li>✓ 5개 파일 저장</li>
            </ul>
          </div>

          {/* Pro 플랜 */}
          <div className="flex-1 rounded-[12px] border-2 border-[#2A6AFF] bg-[#F8FAFF] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-[#2A6AFF]">Pro</h3>
              <span className="rounded-full bg-[#2A6AFF] px-2 py-0.5 text-[10px] font-medium text-white">
                추천
              </span>
            </div>
            <p className="mt-1 text-[24px] font-bold text-[#333]">
              ₩9,900
              <span className="text-[14px] font-normal text-[#666]">/월</span>
            </p>
            <ul className="mt-4 space-y-2 text-[13px] text-[#666]">
              <li>✓ 무제한 크레딧</li>
              <li>✓ 고급 AI 응답</li>
              <li>✓ 무제한 파일 저장</li>
              <li>✓ 우선 지원</li>
            </ul>
          </div>
        </div>

        {/* 업그레이드 버튼 */}
        <button className="w-full rounded-[12px] bg-[#2A6AFF] py-3 text-[16px] font-semibold text-white transition-opacity hover:opacity-90">
          Pro 시작하기
        </button>

        <p className="mt-4 text-center text-[12px] text-[#999]">
          언제든지 취소할 수 있습니다
        </p>
      </div>
    </div>
  );
};
