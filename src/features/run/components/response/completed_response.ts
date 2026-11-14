import {
  pickCompletionExtension,
  type AssistantMessageContent,
  type AssuranceScope,
  type AssistantResponseV1,
  type ClarificationReason,
  type ResponseDisposition,
  type ResponseKind,
  type SolutionCheck,
  type SolutionVerificationSummary,
} from "@/shared/contracts/browser_run_v1";

/**
 * terminal commit 뒤 canonical 응답. `RunCompletedPayload`를 그대로 넘길 수 있고,
 * 대화 조회 메시지는 `toCompletedAssistantResponse`로 바꿔 넘긴다.
 */
export interface CompletedAssistantResponse {
  responseDisposition: ResponseDisposition;
  clarificationReason?: ClarificationReason | null;
  assistantResponse: AssistantResponseV1;
  verificationSummary?: SolutionVerificationSummary[];
  /** v1.1 확장. 셋이 모두 있을 때만 배지·단계 검산을 그린다. 없으면 확장 이전 응답처럼 그린다. */
  responseKind?: ResponseKind | null;
  assuranceScope?: AssuranceScope | null;
  solutionChecks?: SolutionCheck[] | null;
}

/** COMPLETED 대화 메시지만 canonical 응답이 있다. 그 밖(placeholder·실패·취소)은 null이다. */
export const toCompletedAssistantResponse = (
  content: AssistantMessageContent,
): CompletedAssistantResponse | null =>
  content.responseDisposition && content.assistantResponse
    ? {
        responseDisposition: content.responseDisposition,
        clarificationReason: content.clarificationReason,
        assistantResponse: content.assistantResponse,
        verificationSummary: content.verificationSummary,
        ...(pickCompletionExtension(content).extension ?? {
          responseKind: null,
          assuranceScope: null,
          solutionChecks: null,
        }),
      }
    : null;
