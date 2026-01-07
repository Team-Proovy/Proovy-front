import type { ReactNode } from "react";

interface ToolButtonProps {
  label?: string;
  icon?: ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ToolButton = ({
  label,
  icon,
  isActive = false,
  onClick,
  className = "",
}: ToolButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-blue-100 text-blue-600"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      } ${className}`}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {label && <span>{label}</span>}
    </button>
  );
};
