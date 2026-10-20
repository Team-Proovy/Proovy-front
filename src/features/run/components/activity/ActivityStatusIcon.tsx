import { Check, LoaderCircle, Minus, X, type LucideIcon } from "lucide-react";
import type { ActivityBoxPhase } from "./activity_types";

const PHASE_ICONS: Record<
  ActivityBoxPhase,
  { icon: LucideIcon; color: string }
> = {
  running: { icon: LoaderCircle, color: "text-[#2A6AFF]" },
  completed: { icon: Check, color: "text-[#16A34A]" },
  failed: { icon: X, color: "text-[#DC2626]" },
  canceled: { icon: Minus, color: "text-[#6B7280]" },
};

interface ActivityStatusIconProps {
  phase: ActivityBoxPhase;
}

/**
 * Activity 단계 아이콘: running spinner, completed check, failed X, canceled minus.
 *
 * 모양 자체가 색 외 단서다. 의미는 옆의 상태 문구가 전달하므로 아이콘은 보조 기술에서 숨긴다.
 * `data-phase`로 어떤 모양을 그렸는지 테스트에서 확인한다.
 */
export const ActivityStatusIcon = ({ phase }: ActivityStatusIconProps) => {
  const { icon: Icon, color } = PHASE_ICONS[phase];
  return (
    <Icon
      aria-hidden="true"
      data-phase={phase}
      size={16}
      strokeWidth={2.5}
      className={`shrink-0 ${color} ${phase === "running" ? "animate-spin motion-reduce:animate-none" : ""}`}
    />
  );
};
