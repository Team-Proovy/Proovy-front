/**
 * 툴바 버튼 스타일 상수
 *
 * 각 버튼의 상태별 스타일 정의:
 * - base: 기본 상태
 * - hover: 마우스 오버
 * - active: 클릭/선택됨
 */

// ============================================================
// 공통 레이아웃
// ============================================================

export const BUTTON_LAYOUT = {
  /** 클립 버튼: 56x32 원형 */
  clip: "w-[56px] h-[32px] rounded-[20px] pl-[15px] pr-[18px] py-[10px] shrink-0",

  /** 수식 입력기 버튼: 124x32 pill */
  math: "w-[124px] h-[32px] rounded-[20px] px-[35px] py-[12px] shrink-0",

  /** 캔버스 버튼: 100x32 pill */
  canvas: "w-[100px] h-[32px] rounded-[20px] px-[35px] py-[12px] shrink-0",

  /** 도구 버튼: 가변 너비 pill, 3열 구조 (아이콘 - 텍스트 - 드롭다운) */
  tool: "h-[32px] rounded-[20px] py-[12px] pl-[12px] pr-[17px] min-w-[120px] shrink-0 gap-[8px]",

  /** 전송 버튼: 30x32 사각형 */
  send: "w-[30px] h-[32px] rounded-[8px] px-[8px] py-[7px] shrink-0",

  /** Compact 버튼: 40x32 원형 (반응형 모드) */
  compact: "w-[40px] h-[32px] rounded-[20px] shrink-0",
} as const;

// ============================================================
// 버튼 색상 스타일 (Figma 디자인 기준)
// ============================================================

/**
 * 클립 버튼 스타일
 * - 기본: 연회색 배경, 회색 테두리
 * - hover: 연파란 배경, 테두리 없음
 * - active (클릭 중): 진파란 배경, 테두리 없음, 흰색 아이콘
 */
export const CLIP_BUTTON_STYLE = {
  base: "bg-[#F1F4F8] border border-[0.5px] border-[#D1D6DE] text-[#6B7280]",
  hover: "hover:bg-[#2A6AFF]/50 hover:border-transparent hover:text-white",
  active: "active:bg-[#2A6AFF] active:border-transparent active:text-white",
} as const;

/**
 * Compact 버튼 스타일 (반응형 모드)
 * - 기본: 회색 배경
 * - hover: 연회색 배경
 * - active: 진회색 배경
 * - selected: 파란 배경
 */
export const COMPACT_BUTTON_STYLE = {
  base: "bg-[#F1F4F8] border border-[0.5px] border-[#D1D6DE] text-[#6B7280]",
  hover: "hover:bg-[#2A6AFF]/50 hover:border-transparent hover:text-white",
  active: "active:bg-[#2A6AFF] active:border-transparent active:text-white",
} as const;

/**
 * 수식 입력기 / 캔버스 버튼 스타일
 * - 기본: 회색 배경
 * - hover: 연파란 배경
 * - active (클릭 중): 진파란 배경
 * - selected (선택됨): 진파란 배경 유지
 */
export const PILL_BUTTON_STYLE = {
  base: "bg-[#F1F4F8] border border-[0.5px] border-[#D1D6DE] text-[#6B7280]",
  hover: "hover:bg-[#2A6AFF]/50 hover:border-transparent hover:text-white",
  active: "active:bg-[#2A6AFF] active:border-transparent active:text-white",
} as const;

/**
 * 도구 버튼 스타일
 * - 기본: 회색 배경
 * - hover: 연파란 배경
 * - active (클릭 중): 진파란 배경
 * - selected (도구 선택됨): 주황색 배경 + 주황색 텍스트 (Figma #D27B2D)
 */
export const TOOL_BUTTON_STYLE = {
  base: "bg-[#F1F4F8] border border-[0.5px] border-[#D1D6DE] text-[#6B7280]",
  hover: "hover:bg-[#2A6AFF]/50 hover:border-transparent hover:text-white",
  active: "active:bg-[#2A6AFF] active:border-transparent active:text-white",
  selected:
    "!bg-[#D27B2D]/20 !border !border-[#D27B2D] !border-[0.5px] !text-[#D27B2D]",
} as const;

/**
 * 전송 버튼 스타일
 * - 기본 (비활성): 회색 배경, hover 효과 없음, 클릭 불가
 * - active (콘텐츠 있음): 파란 배경, 흰색 아이콘
 */
export const SEND_BUTTON_STYLE = {
  disabled:
    "bg-[#F1F4F8] border border-[0.5px] border-[#D1D6DE] text-[#6B7280] cursor-default pointer-events-none",
  enabled:
    "!bg-[#2A6AFF] !border-[#2A6AFF] !text-white cursor-pointer hover:!bg-[#2A6AFF]/50 active:!bg-[#1E5AE8]",
} as const;

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * 버튼 스타일 조합 헬퍼
 * @param layout 레이아웃 클래스
 * @param style 색상 스타일 객체
 * @param isActive 활성 상태 여부 (선택된 상태 - optional)
 */
export const getButtonClass = (
  layout: string,
  style: { base: string; hover: string; active: string },
  isActive: boolean = false,
): string => {
  // active는 CSS :active (클릭 중)로 항상 적용
  const baseClasses = `${layout} ${style.base} ${style.hover} ${style.active} transition-colors duration-200`;
  // isActive는 "선택된 상태"를 위한 추가 스타일 (필요시)
  return isActive
    ? `${baseClasses} !bg-[#2A6AFF] !border-transparent !text-white`
    : baseClasses;
};

/**
 * 도구 버튼 스타일 조합 (선택 시 주황색)
 * @param isSelected 도구 선택 여부
 */
export const getToolButtonClass = (isSelected: boolean = false): string => {
  const layout = BUTTON_LAYOUT.tool;
  const transition = "transition-colors duration-200";

  if (isSelected) {
    // 선택된 상태: 주황색 배경 + 주황색 텍스트
    return `${layout} ${TOOL_BUTTON_STYLE.selected}  ${transition}`;
  }
  // 기본 상태: 회색 배경, hover/active 시 파란색
  return `${layout} ${TOOL_BUTTON_STYLE.base} ${TOOL_BUTTON_STYLE.hover} ${TOOL_BUTTON_STYLE.active} ${transition}`;
};

/**
 * 전송 버튼 스타일 조합
 * @param hasContent 콘텐츠 존재 여부
 */
export const getSendButtonClass = (hasContent: boolean): string => {
  const layout = BUTTON_LAYOUT.send;
  const transition = "transition-colors duration-300 ease-out";

  if (hasContent) {
    return `${layout} ${SEND_BUTTON_STYLE.enabled} ${transition}`;
  }
  return `${layout} ${SEND_BUTTON_STYLE.disabled} ${transition}`;
};

/**
 * Compact 버튼 스타일 조합 (반응형 모드)
 * @param isActive 활성 상태 여부
 */
export const getCompactButtonClass = (isActive: boolean = false): string => {
  const layout = BUTTON_LAYOUT.compact;
  const transition = "transition-colors duration-200";

  if (isActive) {
    return `${layout} flex items-center justify-center bg-[#2A6AFF] text-white ${transition}`;
  }
  return `${layout} flex items-center justify-center ${COMPACT_BUTTON_STYLE.base} ${COMPACT_BUTTON_STYLE.hover} ${COMPACT_BUTTON_STYLE.active} ${transition}`;
};
