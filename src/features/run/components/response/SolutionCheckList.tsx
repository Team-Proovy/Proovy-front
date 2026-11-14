import { useId, useState } from "react";
import {
  Check,
  ChevronDown,
  CircleHelp,
  Minus,
  X,
  type LucideIcon,
} from "lucide-react";
import type {
  CheckableStep,
  SolutionCheck,
  StepCheckResult,
} from "@/shared/contracts/browser_run_v1";
import { cn } from "@/shared/utils/cn";
import { AssuranceBadge } from "./AssuranceBadges";
import { SafeMarkdown } from "./SafeMarkdown";
import { formatSympyStatement } from "./sympy_statement";
import {
  CROSS_CHECK_TEXTS,
  NO_CHECKABLE_STEPS_TEXT,
  SOLUTION_HIDDEN_TEXT,
  STEP_CHECK_RESULT_LABELS,
  STEP_CHECK_SCOPE_NOTICE,
  STEP_CHECK_SECTION_TITLE,
  STEP_KIND_LABELS,
  STEP_WITHHELD_TEXT,
} from "./response_labels";
import { getProblemTitle } from "../problem_label";

/** ✓ ✗ ? − 모양과 문구를 함께 쓴다(색에 의존하지 않는다). */
const RESULT_STYLES: Record<
  StepCheckResult,
  { icon: LucideIcon; className: string }
> = {
  verified: { icon: Check, className: "text-[#07762C]" },
  falsified: { icon: X, className: "text-[#B42330]" },
  unparseable: { icon: CircleHelp, className: "text-[#7A4E0B]" },
  not_checked: { icon: Minus, className: "text-[#6B7280]" },
};

/**
 * 단계 설명. 계약상(2.07 plan 28) Brain이 `[[source:…]]` 출처 표식을 먼저 지우고 나서 SafeMarkdown 검사를 하므로
 * `safe_markdown`·`plain_text` 어느 쪽에도 출처 표식이 없다(solutionChecks에는 출처 목록도 없다).
 * 그래서 sourceLabels를 넘기지 않는다.
 */
const StepDescription = ({ step }: { step: CheckableStep }) => {
  if (step.withheld || !step.description)
    return (
      <p className="text-[#6B7280]">
        {step.withheld ? STEP_WITHHELD_TEXT : null}
      </p>
    );
  if (step.descriptionFormat === "plain_text")
    return (
      <p
        data-description-format="plain_text"
        className="break-words whitespace-pre-wrap"
      >
        {step.description}
      </p>
    );
  return (
    <SafeMarkdown
      body={step.description}
      className="break-words"
    />
  );
};

const StepRow = ({ step, order }: { step: CheckableStep; order: number }) => {
  const { icon: Icon, className } = RESULT_STYLES[step.checkResult];
  const formula = step.withheld
    ? null
    : formatSympyStatement(step.sympyStatement);
  return (
    <li
      data-check-result={step.checkResult}
      data-withheld={step.withheld || undefined}
      className="flex gap-2 border-t border-[#E3E7ED] py-2 first:border-t-0"
    >
      <Icon
        aria-hidden
        strokeWidth={2.5}
        className={cn("mt-0.5 size-4 shrink-0", className)}
      />
      <div className="min-w-0 flex-1 text-[13px] leading-[20px]">
        <p className="flex flex-wrap items-center gap-x-1.5 text-[12px] text-[#6B7280]">
          <span>
            {order}단계 · {STEP_KIND_LABELS[step.stepKind]}
          </span>
          <span className={cn("font-semibold", className)}>
            {STEP_CHECK_RESULT_LABELS[step.checkResult]}
          </span>
        </p>
        <div className="text-[#2F3440]">
          <StepDescription step={step} />
        </div>
        {formula && (
          <p className="mt-0.5 text-[12px] text-[#6B7280]">
            <span className="sr-only">검산식 </span>
            <code className="font-mono break-all">{formula}</code>
          </p>
        )}
      </div>
    </li>
  );
};

const SolutionCheckBody = ({ check }: { check: SolutionCheck }) => (
  <div className="px-3 pb-2">
    {check.crossCheck && (
      <p className="py-1 text-[12px] text-[#6B7280]">
        {check.crossCheck.independentAnswerAgrees
          ? CROSS_CHECK_TEXTS.agrees
          : CROSS_CHECK_TEXTS.disagrees}
        {!check.crossCheck.stepCheckCompleted &&
          ` ${CROSS_CHECK_TEXTS.stepCheckIncomplete}`}
      </p>
    )}
    {check.disclosure === "hide_solution" ? (
      <p className="py-1 text-[13px] text-[#6B7280]">{SOLUTION_HIDDEN_TEXT}</p>
    ) : check.checkableSteps.length === 0 ? (
      <p className="py-1 text-[13px] text-[#6B7280]">
        {NO_CHECKABLE_STEPS_TEXT}
      </p>
    ) : (
      <ol aria-label="단계별 검산 결과">
        {check.checkableSteps.map((step, index) => (
          <StepRow
            key={step.stepIndex}
            step={step}
            order={index + 1}
          />
        ))}
      </ol>
    )}
  </div>
);

/**
 * 문제 하나의 접이식 검산 상세. 처음에는 접혀 있고, 접힌 동안 단계를 그리지 않는다(KaTeX 비용).
 * 머리글에는 문제 제목과 문제 배지만 있고 단계 수는 보이지 않는다.
 */
const SolutionCheckItem = ({
  check,
  index,
}: {
  check: SolutionCheck;
  index: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const title = getProblemTitle(check.problemNumber, index);
  return (
    <li
      data-disclosure={check.disclosure}
      className="rounded-[8px] border border-[#E3E7ED] bg-white"
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-[#2F3440]"
      >
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 transition-transform",
            !expanded && "-rotate-90",
          )}
        />
        <span className="min-w-0 flex-1 truncate">{title}</span>
        <AssuranceBadge scope={check.assuranceScope} />
      </button>
      <div
        id={contentId}
        hidden={!expanded}
      >
        {expanded && <SolutionCheckBody check={check} />}
      </div>
    </li>
  );
};

interface SolutionCheckListProps {
  solutionChecks: SolutionCheck[];
}

/** 단계별 검산 상세. 문제마다(Read-back 순서) 접이식 하나씩이다. */
export const SolutionCheckList = ({
  solutionChecks,
}: SolutionCheckListProps) => {
  const titleId = useId();
  if (solutionChecks.length === 0) return null;
  return (
    <section
      aria-labelledby={titleId}
      className="rounded-[10px] bg-[#F1F4F8] px-3 py-2"
    >
      <h3
        id={titleId}
        className="mb-1.5 text-[13px] font-semibold"
      >
        {STEP_CHECK_SECTION_TITLE}
      </h3>
      <p
        data-step-check-scope
        className="mb-1.5 text-[12px] leading-[18px] text-[#6B7280]"
      >
        {STEP_CHECK_SCOPE_NOTICE}
      </p>
      <ul className="flex flex-col gap-1.5">
        {solutionChecks.map((check, index) => (
          <SolutionCheckItem
            key={`${index}-${check.problemNumber ?? ""}`}
            check={check}
            index={index}
          />
        ))}
      </ul>
    </section>
  );
};
