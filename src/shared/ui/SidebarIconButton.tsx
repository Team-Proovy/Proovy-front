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
  const sizeClass = size === "40" ? "h-[40px] w-[40px]" : "h-[40px] w-[40px]";

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={[
        sizeClass,
        "flex cursor-pointer items-center justify-center rounded-[8px] transition select-none hover:bg-black/5 focus:ring-2 focus:ring-[#2A6AFF]/40 focus:outline-none active:scale-[0.98]",
        isActive ? "bg-black/5" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
