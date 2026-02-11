interface ProfileFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  readonly?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

/**
 * 프로필 입력 필드
 * - 레이블과 입력 칸 사이: 8px
 * - 필드 간 간격: 20px (부모에서 gap-[20px] 적용)
 */
export const ProfileField = ({
  label,
  value,
  placeholder,
  readonly = false,
  onChange,
  onBlur,
}: ProfileFieldProps) => {
  return (
    <div className="flex flex-col gap-[8px]">
      {/* 레이블: Pretendard Medium, 14px, line-height 20px */}
      <label className="font-['Pretendard'] text-[14px] leading-[20px] font-medium text-black">
        {label}
      </label>
      {/* 입력 칸: 배경 #F1F4F8, border-radius 8px */}
      {readonly ? (
        <div className="w-full rounded-[8px] bg-[#F1F4F8] px-[16px] py-[12px] font-['Pretendard'] text-[16px] text-[#2F3440]">
          {value}
        </div>
      ) : (
        <input
          type="text"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className="w-full rounded-[8px] bg-[#F1F4F8] px-[16px] py-[12px] font-['Pretendard'] text-[16px] text-[#2F3440] transition-colors outline-none placeholder:text-[#9CA3AF] focus:ring-1 focus:ring-[#2A6AFF]"
        />
      )}
    </div>
  );
};
