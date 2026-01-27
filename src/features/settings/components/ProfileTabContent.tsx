/**
 * ProfileTabContent - 내 프로필 탭
 */
export const ProfileTabContent = () => {
  return (
    <div className="flex flex-col">
      <h3 className="font-['Pretendard'] text-[20px] font-semibold text-black">
        내 프로필
      </h3>
      {/* 구분선 */}
      <div className="mt-[12px] mb-[40px] h-[1px] bg-[#D1D6DE]" />

      {/* TODO: 프로필 컨텐츠 구현 */}
      <div className="flex items-start gap-[40px]">
        {/* 프로필 이미지 영역 */}
        <div className="flex flex-col items-center gap-[12px]">
          <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-[#FEE500]">
            {/* 카카오 아이콘 placeholder */}
            <span className="text-[40px]">💬</span>
          </div>
        </div>

        {/* 프로필 정보 */}
        <div className="flex flex-1 flex-col gap-[20px]">
          <ProfileField
            label="이메일"
            value="user@example.com"
            readonly
          />
          <ProfileField
            label="이름"
            placeholder="이름을 입력하세요"
          />
          <ProfileField
            label="닉네임"
            placeholder="닉네임을 입력하세요"
          />
        </div>
      </div>

      {/* 회원 탈퇴 */}
      <div className="mt-auto border-t border-[#E5E5E5] pt-[24px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-['Pretendard'] text-[16px] font-medium text-black">
              회원 탈퇴
            </p>
            <p className="mt-[4px] font-['Pretendard'] text-[14px] text-[#6B7280]">
              Proovy에서 계정을 영구적으로 삭제합니다.
            </p>
          </div>
          <button className="font-['Pretendard'] text-[14px] font-medium text-[#2A6AFF] hover:underline">
            탈퇴하기
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 프로필 입력 필드
 */
const ProfileField = ({
  label,
  value,
  placeholder,
  readonly = false,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  readonly?: boolean;
}) => {
  return (
    <div className="flex flex-col gap-[8px]">
      <label className="font-['Pretendard'] text-[14px] text-[#6B7280]">
        {label}
      </label>
      {readonly ? (
        <p className="font-['Pretendard'] text-[16px] text-[#2F3440]">
          {value}
        </p>
      ) : (
        <input
          type="text"
          defaultValue={value}
          placeholder={placeholder}
          className="w-full rounded-[8px] border border-[#D1D6DE] bg-[#F9FAFB] px-[16px] py-[12px] font-['Pretendard'] text-[16px] text-[#2F3440] transition-colors outline-none focus:border-[#2A6AFF]"
        />
      )}
    </div>
  );
};
