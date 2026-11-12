import {
  MessageSquareText,
  ShieldCheck,
  ShieldMinus,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import type {
  AssuranceScope,
  ResponseKind,
} from "@/shared/contracts/browser_run_v1";
import { cn } from "@/shared/utils/cn";
import {
  ASSURANCE_SCOPE_DESCRIPTIONS,
  ASSURANCE_SCOPE_LABELS,
  RE_EXPLANATION_DESCRIPTION,
  RE_EXPLANATION_LABEL,
} from "./response_labels";

/** design.system: semantic success·warning, gray, primary 색을 옅은 배경 + 진한 글자로 쓴다(대비 4.5:1 이상). */
const SCOPE_STYLES: Record<
  AssuranceScope,
  { icon: LucideIcon; className: string }
> = {
  verified: {
    icon: ShieldCheck,
    className: "border-[#0AA63E]/40 bg-[#0AA63E]/10 text-[#07762C]",
  },
  unverified: {
    icon: ShieldAlert,
    className: "border-[#E2A242]/50 bg-[#E2A242]/15 text-[#7A4E0B]",
  },
  not_applicable: {
    icon: ShieldMinus,
    className: "border-[#D1D6DE] bg-[#F1F4F8] text-[#4D4D4D]",
  },
};

const BADGE_BASE =
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] leading-[18px] font-semibold";

interface AssuranceBadgeProps {
  scope: AssuranceScope;
  className?: string;
}

/**
 * 보증 범위 배지 하나: 아이콘 모양 + 문구라 색에 의존하지 않는다.
 * 본문은 세 문구(검증됨·미검증·검증 대상 아님)뿐이고 단계 수(n/m)를 넣지 않는다.
 */
export const AssuranceBadge = ({ scope, className }: AssuranceBadgeProps) => {
  const { icon: Icon, className: tone } = SCOPE_STYLES[scope];
  return (
    <span
      data-assurance-scope={scope}
      title={ASSURANCE_SCOPE_DESCRIPTIONS[scope]}
      className={cn(BADGE_BASE, tone, className)}
    >
      <Icon
        aria-hidden
        className="size-3.5 shrink-0"
      />
      {ASSURANCE_SCOPE_LABELS[scope]}
    </span>
  );
};

interface ResponseAssuranceHeaderProps {
  assuranceScope: AssuranceScope;
  responseKind: ResponseKind;
}

/**
 * 응답 맨 위 배지 줄. 응답 배지 옆에 재설명이면 "추가 설명"을 따로 붙인다.
 * 배지 의미 설명은 화면에서 한 줄로 함께 보인다(툴팁에만 두지 않는다).
 */
export const ResponseAssuranceHeader = ({
  assuranceScope,
  responseKind,
}: ResponseAssuranceHeaderProps) => {
  const isReExplanation = responseKind === "re_explanation";
  return (
    <div
      data-response-kind={responseKind}
      className="flex flex-col gap-1"
    >
      <div
        role="group"
        aria-label="응답 검증 상태"
        className="flex flex-wrap items-center gap-1.5"
      >
        <AssuranceBadge scope={assuranceScope} />
        {isReExplanation && (
          <span
            data-re-explanation
            title={RE_EXPLANATION_DESCRIPTION}
            className={cn(
              BADGE_BASE,
              "border-[#2A6AFF]/30 bg-[#2A6AFF]/10 text-[#1428A0]",
            )}
          >
            <MessageSquareText
              aria-hidden
              className="size-3.5 shrink-0"
            />
            {RE_EXPLANATION_LABEL}
          </span>
        )}
      </div>
      <p className="text-[12px] leading-[18px] text-[#6B7280]">
        {isReExplanation
          ? RE_EXPLANATION_DESCRIPTION
          : ASSURANCE_SCOPE_DESCRIPTIONS[assuranceScope]}
      </p>
    </div>
  );
};
