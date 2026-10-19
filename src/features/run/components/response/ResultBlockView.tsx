import { Check, CircleHelp, Info, X } from "lucide-react";
import type {
  CheckBlock,
  ResultBlock,
  SolutionBlock,
  StepMark,
  StepMarkStatus,
} from "@/shared/contracts/browser_run_v1";
import { cn } from "@/shared/utils/cn";
import { SafeMarkdown } from "./SafeMarkdown";
import { sliceStepExcerpt } from "./safe_markdown_syntax";
import {
  CHECK_UNCONFIRMED_NOTICE,
  NOTICE_TITLE,
  STEP_STATUS_LABELS,
  UNVERIFIED_NOTICES,
  VERIFICATION_BADGE_LABELS,
} from "./response_labels";

const STEP_STATUS_STYLES: Record<StepMarkStatus, string> = {
  verified: "border-[#B9DEC6] bg-[#F1FAF4] text-[#24704A]",
  failed: "border-[#F1C1C1] bg-[#FDF3F3] text-[#A23434]",
  unconfirmed: "border-[#E8D8A8] bg-[#FDF9EC] text-[#80661C]",
};

const StepStatusIcon = ({ status }: { status: StepMarkStatus }) => {
  const Icon =
    status === "verified" ? Check : status === "failed" ? X : CircleHelp;
  return (
    <Icon
      aria-hidden
      className="size-3.5 shrink-0"
    />
  );
};

interface StepMarkListProps {
  body: string;
  stepMarks: StepMark[];
  firstErrorStepId?: string | null;
  sourceLabels: ReadonlyMap<string, string>;
}

/** solution·check의 step별 상태 마커. step id 대신 순서 번호를 보인다. */
const StepMarkList = ({
  body,
  stepMarks,
  firstErrorStepId,
  sourceLabels,
}: StepMarkListProps) => (
  <ol
    aria-label="단계별 검증 상태"
    className="mt-2 flex flex-col gap-1.5"
  >
    {stepMarks.map((stepMark, index) => (
      <li
        key={stepMark.stepId}
        data-step-status={stepMark.status}
        className={cn(
          "rounded-[8px] border px-2.5 py-1.5 text-[13px]",
          STEP_STATUS_STYLES[stepMark.status],
        )}
      >
        <div className="flex items-center gap-1.5 font-medium">
          <StepStatusIcon status={stepMark.status} />
          <span>
            {index + 1}단계: {STEP_STATUS_LABELS[stepMark.status]}
          </span>
          {stepMark.stepId === firstErrorStepId && (
            <span className="rounded bg-white/70 px-1 text-[12px]">
              첫 오류
            </span>
          )}
        </div>
        {stepMark.anchor && (
          <SafeMarkdown
            body={sliceStepExcerpt(
              body,
              stepMark.anchor.start,
              stepMark.anchor.end,
            )}
            sourceLabels={sourceLabels}
            className="mt-1 text-[#1F2937]"
          />
        )}
        {stepMark.status === "unconfirmed" && stepMark.reason && (
          <p className="mt-1">확인되지 않은 이유: {stepMark.reason}</p>
        )}
      </li>
    ))}
  </ol>
);

const UnverifiedNotice = ({ children }: { children: string }) => (
  <p
    role="note"
    className="mt-2 rounded-[8px] bg-[#FDF9EC] px-2.5 py-1.5 text-[13px] text-[#80661C]"
  >
    {children}
  </p>
);

const SolutionBlockView = ({
  block,
  sourceLabels,
}: {
  block: SolutionBlock;
  sourceLabels: ReadonlyMap<string, string>;
}) => (
  <>
    <p
      data-verification={block.verification}
      className="mb-1 text-[12px] font-semibold text-[#4A5A78]"
    >
      {VERIFICATION_BADGE_LABELS[block.verification]}
    </p>
    <SafeMarkdown
      body={block.body}
      sourceLabels={sourceLabels}
    />
    {block.verification !== "verified" && (
      <UnverifiedNotice>
        {UNVERIFIED_NOTICES[block.verification]}
      </UnverifiedNotice>
    )}
    {!!block.stepMarks?.length && (
      <StepMarkList
        body={block.body}
        stepMarks={block.stepMarks}
        sourceLabels={sourceLabels}
      />
    )}
  </>
);

const CheckBlockView = ({
  block,
  sourceLabels,
}: {
  block: CheckBlock;
  sourceLabels: ReadonlyMap<string, string>;
}) => (
  <>
    <SafeMarkdown
      body={block.body}
      sourceLabels={sourceLabels}
    />
    {block.stepMarks?.some((stepMark) => stepMark.status === "unconfirmed") && (
      <UnverifiedNotice>{CHECK_UNCONFIRMED_NOTICE}</UnverifiedNotice>
    )}
    {!!block.stepMarks?.length && (
      <StepMarkList
        body={block.body}
        stepMarks={block.stepMarks}
        firstErrorStepId={block.firstErrorStepId}
        sourceLabels={sourceLabels}
      />
    )}
  </>
);

interface ResultBlockViewProps {
  block: ResultBlock;
  sourceLabels: ReadonlyMap<string, string>;
}

/** ResultBlock 5종 중 하나를 그린다. 공개 body와 step 상태만 쓰고 id·참조는 보이지 않는다. */
export const ResultBlockView = ({
  block,
  sourceLabels,
}: ResultBlockViewProps) => {
  switch (block.kind) {
    case "solution":
      return (
        <div data-block-kind="solution">
          <SolutionBlockView
            block={block}
            sourceLabels={sourceLabels}
          />
        </div>
      );
    case "check":
      return (
        <div data-block-kind="check">
          <CheckBlockView
            block={block}
            sourceLabels={sourceLabels}
          />
        </div>
      );
    case "notice":
      return (
        <div
          data-block-kind="notice"
          role="note"
          aria-label={NOTICE_TITLE}
          className="flex gap-2 rounded-[10px] border border-[#D6DEEB] bg-[#F5F8FC] px-3 py-2 text-[14px]"
        >
          <Info
            aria-hidden
            className="mt-1 size-4 shrink-0 text-[#4A5A78]"
          />
          <SafeMarkdown
            body={block.body}
            sourceLabels={sourceLabels}
          />
        </div>
      );
    case "explanation":
    case "rich_text":
      return (
        <div data-block-kind={block.kind}>
          <SafeMarkdown
            body={block.body}
            sourceLabels={sourceLabels}
          />
        </div>
      );
  }
};
