import type { ReactNode } from "react";

type Props = {
  ariaLabel: string;
  size: "40" | "36";
  isActive?: boolean;
  onClick?: () => void;
  children: ReactNode;
};

export function SidebarIconButton({
  ariaLabel,
  size,
  isActive,
  onClick,
  children,
}: Props) {
  const sizeClass = size === "40" ? "h-[40px] w-[40px]" : "h-[36px] w-[36px]";

  // 보관함 버튼만 별도 패딩 스펙이 있었음(6.703/6.717/7.762 등)
  // → 실제로는 “아이콘 클릭 영역”을 맞추는 게 목적이므로,
  //    필요 시 storage 버튼에서만 className 확장하는 방식으로 운영 권장.
  //    지금은 기본형(가운데 정렬)로 두고, storage는 children에서 스택을 맞춤.
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={[
        sizeClass,
        "flex items-center justify-center",
        "rounded-[8px]",
        "cursor-pointer transition select-none",
        "hover:bg-black/5",
        "active:scale-[0.98]",
        "focus:ring-2 focus:ring-[#2A6AFF]/40 focus:outline-none",
        isActive ? "bg-black/5" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
