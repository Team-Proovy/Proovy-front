import { X } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SettingsModal - 설정 모달
 *
 * 사이드바 하단 설정 아이콘 클릭 시 열림
 * - 내 프로필 탭
 * - 구독 정보 탭
 * - 크레딧 사용내역 탭
 */
export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative flex h-[500px] w-[700px] overflow-hidden rounded-[16px] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 왼쪽 사이드 메뉴 */}
        <div className="flex w-[200px] flex-col border-r border-[#E5E5E5] bg-[#F9F9F9] p-4">
          <h2 className="mb-6 text-[18px] font-semibold text-[#333]">설정</h2>

          <nav className="flex flex-col gap-1">
            <SettingsMenuItem
              icon="👤"
              label="내 프로필"
              isActive
            />
            <SettingsMenuItem
              icon="💳"
              label="구독 정보"
            />
            <SettingsMenuItem
              icon="📊"
              label="크레딧 사용내역"
            />
          </nav>

          {/* 로그아웃 버튼 */}
          <button className="mt-auto rounded-[8px] bg-[#FFE066] px-4 py-2 text-[14px] font-medium text-[#333] transition-opacity hover:opacity-80">
            로그아웃
          </button>
        </div>

        {/* 오른쪽 컨텐츠 영역 */}
        <div className="flex flex-1 flex-col p-6">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1 text-[#666] transition-colors hover:bg-[#F0F0F0]"
          >
            <X size={20} />
          </button>

          {/* 프로필 섹션 */}
          <div className="flex items-start gap-6">
            {/* 프로필 이미지 */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-[#4CAF50] text-[24px] font-bold text-white">
                유진
              </div>
              <div className="h-[40px] w-[40px] rounded-full bg-[#FEE500]" />
            </div>

            {/* 프로필 정보 */}
            <div className="flex flex-1 flex-col gap-4">
              <h3 className="text-[18px] font-semibold text-[#333]">
                내 프로필
              </h3>

              <div className="flex flex-col gap-3">
                <ProfileField
                  label="이메일"
                  value="user@example.com"
                />
                <ProfileField
                  label="이름"
                  value=""
                  placeholder="이름을 입력하세요"
                />
                <ProfileField
                  label="닉네임"
                  value=""
                  placeholder="닉네임을 입력하세요"
                />
              </div>

              {/* 회원 탈퇴 */}
              <div className="mt-4 border-t border-[#E5E5E5] pt-4">
                <p className="text-[14px] font-medium text-[#333]">회원 탈퇴</p>
                <p className="mt-1 text-[12px] text-[#999]">
                  Proovy에서 계정을 영구적으로 삭제합니다.
                </p>
                <button className="mt-2 text-[14px] font-medium text-[#2A6AFF] hover:underline">
                  탈퇴하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 설정 메뉴 아이템
const SettingsMenuItem = ({
  icon,
  label,
  isActive = false,
}: {
  icon: string;
  label: string;
  isActive?: boolean;
}) => {
  return (
    <button
      className={`flex items-center gap-2 rounded-[8px] px-3 py-2 text-left text-[14px] transition-colors ${
        isActive
          ? "bg-white font-medium text-[#333] shadow-sm"
          : "text-[#666] hover:bg-white/50"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
};

// 프로필 필드 컴포넌트
const ProfileField = ({
  label,
  value,
  placeholder,
}: {
  label: string;
  value: string;
  placeholder?: string;
}) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[12px] text-[#999]">{label}</label>
      {value ? (
        <p className="text-[14px] text-[#333]">{value}</p>
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          className="rounded-[8px] border border-[#E5E5E5] px-3 py-2 text-[14px] outline-none focus:border-[#2A6AFF]"
        />
      )}
    </div>
  );
};
