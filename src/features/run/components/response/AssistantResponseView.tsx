import { useMemo } from "react";
import { CircleAlert, MessageCircleQuestion } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { CompletedAssistantResponse } from "./completed_response";
import { ResponseAssuranceHeader } from "./AssuranceBadges";
import { ResponsePageSection } from "./ResponsePageSection";
import { SolutionCheckList } from "./SolutionCheckList";
import { VerificationSummaryView } from "./VerificationSummaryView";
import {
  CLARIFICATION_REASON_LABELS,
  CLARIFICATION_TITLE,
  UNSUPPORTED_TITLE,
} from "./response_labels";

const DispositionHeader = ({
  response,
}: {
  response: CompletedAssistantResponse;
}) => {
  if (response.responseDisposition === "clarification_only") {
    return (
      <div className="flex items-start gap-1.5 text-[13px] text-[#4A5A78]">
        <MessageCircleQuestion
          aria-hidden
          className="mt-0.5 size-4 shrink-0"
        />
        <p>
          <span className="font-semibold">{CLARIFICATION_TITLE}</span>
          {response.clarificationReason &&
            ` · ${CLARIFICATION_REASON_LABELS[response.clarificationReason]}`}
        </p>
      </div>
    );
  }
  if (response.responseDisposition === "unsupported_only") {
    return (
      <div className="flex items-start gap-1.5 text-[13px] text-[#4A5A78]">
        <CircleAlert
          aria-hidden
          className="mt-0.5 size-4 shrink-0"
        />
        <p className="font-semibold">{UNSUPPORTED_TITLE}</p>
      </div>
    );
  }
  return null;
};

interface AssistantResponseViewProps {
  response: CompletedAssistantResponse;
  className?: string;
}

/** v1.1 확장 세 필드가 모두 있으면 그 값, 아니면 null(확장 이전 응답) */
const getAssurance = (response: CompletedAssistantResponse) =>
  response.responseKind && response.assuranceScope && response.solutionChecks
    ? {
        responseKind: response.responseKind,
        assuranceScope: response.assuranceScope,
        solutionChecks: response.solutionChecks,
      }
    : null;

/**
 * AssistantResponseView - canonical 응답 한 메시지
 *
 * response page를 순서대로(main 펼침, thread_like 접이식) 그리고 검증 요약을 붙인다.
 * 공개 block body·step 상태·source label만 보이며 `plainText`·id·model은 그리지 않는다.
 * unsupported_only는 고정 미지원 안내만 두고 검증·출처를 그리지 않는다.
 *
 * v1.1 확장이 있는 substantive 응답: 맨 위에 보증 범위 배지(+재설명이면 "추가 설명"), 본문 뒤에 문제별
 * 단계 검산 접이식을 붙인다. 이때 Phase 1 검증 요약·solution block 배지는 그리지 않는다.
 * 확장이 없으면 지금처럼 Phase 1 표시를 그린다.
 */
export const AssistantResponseView = ({
  response,
  className,
}: AssistantResponseViewProps) => {
  const { assistantResponse, responseDisposition } = response;
  const sourceLabels = useMemo(
    () =>
      new Map(
        responseDisposition === "unsupported_only"
          ? []
          : (assistantResponse.sourceReferences ?? []).map((reference) => [
              reference.sourceRefId,
              reference.displayLabelSnapshot,
            ]),
      ),
    [assistantResponse.sourceReferences, responseDisposition],
  );
  const assurance =
    responseDisposition === "substantive" ? getAssurance(response) : null;
  const verificationSummary =
    responseDisposition === "substantive" && !assurance
      ? (response.verificationSummary ?? [])
      : [];

  return (
    <article
      aria-label="AI 응답"
      data-disposition={responseDisposition}
      className={cn(
        "flex flex-col gap-3 text-[15px] leading-relaxed",
        className,
      )}
    >
      <DispositionHeader response={response} />
      {assurance && (
        <ResponseAssuranceHeader
          assuranceScope={assurance.assuranceScope}
          responseKind={assurance.responseKind}
        />
      )}
      {assistantResponse.responsePages.map((page) => (
        <ResponsePageSection
          key={page.responsePageId}
          page={page}
          sourceLabels={sourceLabels}
          showLegacyVerification={!assurance}
        />
      ))}
      {assurance && (
        <SolutionCheckList solutionChecks={assurance.solutionChecks} />
      )}
      {verificationSummary.length > 0 && (
        <VerificationSummaryView summaries={verificationSummary} />
      )}
    </article>
  );
};
