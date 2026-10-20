import type {
  AssistantMessageContent,
  AssistantResponseV1,
  ClarificationReason,
  ResponseDisposition,
  SolutionVerificationSummary,
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
      }
    : null;
