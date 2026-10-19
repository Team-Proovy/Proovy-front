/**
 * browser-run-v1 공용 wire 타입 (S08 Front 공용)
 *
 * 계약 의미는 Proovy-server가 소유하고, 판정 기준은 proovy-brain artifact
 * `tests/fixtures/contracts/browser-run-v1`(consumer_version `browser-run-fixtures-v1`)이다.
 * 이 파일은 그 schema(`browser-run.schema.json`, `terminal-v2/browser.schema.json`)를 TS로 옮긴 것이다.
 * 검증된 사본과 pin은 `src/test/contracts/brain/`에 있고, `browser_run_types.test.ts`가
 * 여기 enum·필드 목록이 schema와 같은지 검사한다. 계약이 바뀌면 pin을 먼저 올린 뒤 이 파일을 고친다.
 *
 * - schema `required`가 아닌 필드는 optional(`?`)이고, `null`을 허용하는 필드만 `| null`이다.
 * - 응답·이벤트는 additive-tolerant다. 알 수 없는 추가 필드가 와도 무시한다(타입에 두지 않는다).
 * - 요청(`ConversationRunRequest`)은 closed다. 여기 없는 필드를 보내면 RUN4001이다.
 */

// ---------------------------------------------------------------------------
// 버전·고정 값
// ---------------------------------------------------------------------------

export const BROWSER_RUN_CONSUMER_VERSION = "browser-run-fixtures-v1";
export const BROWSER_RUN_CONTRACT_VERSION = "browser-run-v1";
/** 모든 durable frame의 `contractVersion` 값 */
export const FRAME_CONTRACT_VERSION = "brain-source-v1";
export type FrameContractVersion = typeof FRAME_CONTRACT_VERSION;

export const BROWSER_RUN_LIMITS = {
  /** strip 후 code point 수 상한 (JS `.length`가 아니다) */
  textMaxCodePoints: 10000,
  latexMaxCodePoints: 10000,
  turnAttachmentIdsWireMax: 10,
  heartbeatSeconds: 15,
  maxSeq: 9007199254740991,
} as const;

/** live 연결에서 15초마다 오는 SSE comment. id·data·event가 없어 cursor·frame이 아니다. */
export const HEARTBEAT_COMMENT = ": heartbeat\n\n";

// ---------------------------------------------------------------------------
// 식별자 (schema 패턴은 런타임 검사에서만 확인한다)
// ---------------------------------------------------------------------------

/** 소문자 canonical UUID */
export type Uuid = string;
/** 선행 0 없는 10진 문자열 1..9223372036854775807 (JSON number가 아니다) */
export type NoteId = string;
/** `[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}` */
export type OpaqueId = string;
/** 1..2^53-1 */
export type Seq = number;
/** SSE event id·재접속 cursor `{runId}:{seq}` */
export type EventId = string;
/** UTC ISO-8601 `YYYY-MM-DDTHH:mm:ss(.ffffff)?Z` */
export type OccurredAt = string;

// ---------------------------------------------------------------------------
// browser-run enum
// ---------------------------------------------------------------------------

/** 공개 run status. 내부 RETRYING은 RUNNING으로 투영되어 오며 여기에 없다. */
export const PUBLIC_RUN_STATUSES = [
  "PENDING",
  "RUNNING",
  "CANCELING",
  "COMPLETED",
  "FAILED",
  "CANCELED",
] as const;
export type PublicRunStatus = (typeof PUBLIC_RUN_STATUSES)[number];

/** 대화 조회 `activeRun`·RUN4091 대상이 되는 진행 중 status */
export const ACTIVE_RUN_STATUSES = ["PENDING", "RUNNING", "CANCELING"] as const;
export type ActiveRunStatus = (typeof ACTIVE_RUN_STATUSES)[number];

export const TERMINAL_RUN_STATUSES = [
  "COMPLETED",
  "FAILED",
  "CANCELED",
] as const;
export type TerminalRunStatus = (typeof TERMINAL_RUN_STATUSES)[number];

export const REQUESTED_TASKS = ["solve", "check", "explain"] as const;
export type RequestedTask = (typeof REQUESTED_TASKS)[number];

/** `video`는 알려진 값이지만 Phase 1에서는 RUN4002다. */
export const REQUESTED_OUTPUTS = ["text", "video"] as const;
export type RequestedOutput = (typeof REQUESTED_OUTPUTS)[number];

export const CANCEL_CAUSES = [
  "user_requested",
  "asset_deleting",
  "budget_exhausted",
] as const;
export type CancelCause = (typeof CANCEL_CAUSES)[number];

/** cause별 고정 취소 문구 (`run.canceled`·대화 조회 `assistant.cancel`) */
export const CANCEL_MESSAGES: Record<CancelCause, string> = {
  user_requested: "답변 생성을 중단했습니다.",
  asset_deleting: "참조한 파일이 삭제되어 답변 생성을 중단했습니다.",
  budget_exhausted: "처리 한도에 도달해 답변 생성을 중단했습니다.",
};

export const ATTACHMENT_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type AttachmentMime = (typeof ATTACHMENT_MIMES)[number];

export const RUN_CANCEL_OUTCOMES = [
  "accepted",
  "already_canceling",
  "already_terminal",
] as const;
export type RunCancelOutcome = (typeof RUN_CANCEL_OUTCOMES)[number];

export const CONVERSATION_MESSAGE_ROLES = ["user", "assistant"] as const;
export type ConversationMessageRole =
  (typeof CONVERSATION_MESSAGE_ROLES)[number];

export const CONVERSATION_MESSAGE_STATUSES = [
  "PENDING",
  "STREAMING",
  "COMPLETED",
  "FAILED",
  "CANCELED",
] as const;
export type ConversationMessageStatus =
  (typeof CONVERSATION_MESSAGE_STATUSES)[number];

/** stream 시작 전 오류 envelope의 code. 이 밖의 code는 browser-run 계약 밖이다. */
export const RUN_ERROR_CODES = [
  "AUTH4010",
  "AUTH4012",
  "AUTH4013",
  "RUN4001",
  "RUN4002",
  "RUN4003",
  "RUN4004",
  "RUN4021",
  "RUN4041",
  "RUN4091",
  "RUN4092",
  "RUN4221",
  "RUN4291",
] as const;
export type RunErrorCode = (typeof RUN_ERROR_CODES)[number];

/** code별 고정 오류 message */
export const RUN_ERROR_MESSAGES: Record<RunErrorCode, string> = {
  AUTH4010: "인증 토큰이 필요합니다.",
  AUTH4012: "토큰이 만료되었습니다.",
  AUTH4013: "유효하지 않은 토큰입니다.",
  RUN4001: "요청 형식이 올바르지 않습니다.",
  RUN4002: "지원하지 않는 요청 항목이 포함되어 있습니다.",
  RUN4003: "이벤트 재개 위치가 올바르지 않습니다.",
  RUN4004: "다른 실행의 이벤트 재개 위치입니다.",
  RUN4021: "사용 가능한 잔여 사용량이 부족합니다.",
  RUN4041: "대상을 찾을 수 없습니다.",
  RUN4091: "이 노트에서 진행 중인 답변이 있습니다.",
  RUN4092: "이미 사용된 요청 ID입니다.",
  RUN4221: "첨부 또는 참조한 자료를 사용할 수 없습니다.",
  RUN4291: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
};

export const SUCCESS_CODE = "COMMON200";
export const SUCCESS_MESSAGE = "요청에 성공했습니다.";

// ---------------------------------------------------------------------------
// terminal-v2 / activity-v1 / assistant-response-v1 enum
// ---------------------------------------------------------------------------

export const RESPONSE_DISPOSITIONS = [
  "substantive",
  "clarification_only",
  "unsupported_only",
] as const;
export type ResponseDisposition = (typeof RESPONSE_DISPOSITIONS)[number];

export const CLARIFICATION_REASONS = [
  "missing_input",
  "ambiguous_target",
  "limited_pages",
  "corpus_not_ready",
  "page_range_required",
  "page_range_unreadable",
] as const;
export type ClarificationReason = (typeof CLARIFICATION_REASONS)[number];

/** run 실패 code (`run.failed`·상태·대화 조회 failure) */
export const FAILURE_CODES = [
  "verification_failed",
  "budget_exceeded",
  "provider_error",
  "timeout",
  "storage_error",
  "internal_error",
  "invalid_attachment",
] as const;
export type FailureCode = (typeof FAILURE_CODES)[number];

/** `invalid_attachment` 실패의 sub-code */
export const ATTACHMENT_FAILURE_REASONS = [
  "unsupported_media_type",
  "signature_mismatch",
  "file_too_large",
  "image_decode_failed",
  "abnormal_dimensions",
  "pixel_limit_exceeded",
  "pdf_encrypted",
  "pdf_corrupt",
  "too_many_pages",
  "page_out_of_range",
  "bundle_count_exceeded",
  "bundle_bytes_exceeded",
  "bundle_empty",
] as const;
export type AttachmentFailureReason =
  (typeof ATTACHMENT_FAILURE_REASONS)[number];

export const MODEL_TIERS = ["main", "strong"] as const;
export type ModelTier = (typeof MODEL_TIERS)[number];

export const PAGE_PRESENTATIONS = ["main", "thread_like"] as const;
export type PagePresentation = (typeof PAGE_PRESENTATIONS)[number];

export const VERIFICATION_BADGES = [
  "verified",
  "partially_verified",
  "unverified",
] as const;
export type VerificationBadge = (typeof VERIFICATION_BADGES)[number];

export const STEP_MARK_STATUSES = [
  "verified",
  "failed",
  "unconfirmed",
] as const;
export type StepMarkStatus = (typeof STEP_MARK_STATUSES)[number];

export const SUMMARY_COVERAGES = ["direct", "supporting"] as const;
export type SummaryCoverage = (typeof SUMMARY_COVERAGES)[number];

export const QUOTE_ORIGINS = ["user_submission", "brain_candidate"] as const;
export type QuoteOrigin = (typeof QUOTE_ORIGINS)[number];

/** Activity box 누적 순서와 같은 kind 6종 */
export const ACTIVITY_KINDS = [
  "input_analysis",
  "solution_generation",
  "asset_understanding",
  "note_retrieval",
  "code_execution",
  "verification",
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/** `activity.updated`의 진행 중 sub-state (terminal outcome이 아니다) */
export const ACTIVITY_STATUSES = [
  "in_progress",
  "waiting",
  "retrying",
] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export const ACTIVITY_FAILURE_CODES = [
  "provider_error",
  "timeout",
  "storage_error",
  "internal_error",
] as const;
export type ActivityFailureCode = (typeof ACTIVITY_FAILURE_CODES)[number];

export const INPUT_ANALYSIS_LABELS = [
  "analyzing_input",
  "reading_input",
] as const;
export type InputAnalysisLabel = (typeof INPUT_ANALYSIS_LABELS)[number];

export const SOLUTION_GENERATION_LABELS = [
  "drafting_solution",
  "revising_solution",
] as const;
export type SolutionGenerationLabel =
  (typeof SOLUTION_GENERATION_LABELS)[number];

export const ASSET_UNDERSTANDING_LABELS = [
  "reading_pages",
  "summarizing_pages",
] as const;
export type AssetUnderstandingLabel =
  (typeof ASSET_UNDERSTANDING_LABELS)[number];

export const NOTE_RETRIEVAL_LABELS = ["searching_notes"] as const;
export type NoteRetrievalLabel = (typeof NOTE_RETRIEVAL_LABELS)[number];

export const CODE_EXECUTION_LABELS = [
  "running_calculation",
  "running_check_code",
] as const;
export type CodeExecutionLabel = (typeof CODE_EXECUTION_LABELS)[number];

export const VERIFICATION_LABELS = ["verifying_steps"] as const;
export type VerificationLabel = (typeof VERIFICATION_LABELS)[number];

export const ASSET_UNDERSTANDING_REASONS = [
  "viewer_focus",
  "turn_attachment",
  "retrieval_candidates",
  "page_range_summary",
] as const;
export type AssetUnderstandingReason =
  (typeof ASSET_UNDERSTANDING_REASONS)[number];

export const ASSET_UNDERSTANDING_OUTCOMES = [
  "scope_required",
  "unreadable_pages",
] as const;
export type AssetUnderstandingOutcome =
  (typeof ASSET_UNDERSTANDING_OUTCOMES)[number];

export const NOTE_RETRIEVAL_MATCH_STATUSES = [
  "matched",
  "no_relevant_content",
  "conflicting_content",
  "limited_pages_unresolved",
] as const;
export type NoteRetrievalMatchStatus =
  (typeof NOTE_RETRIEVAL_MATCH_STATUSES)[number];

// ---------------------------------------------------------------------------
// 요청 (closed)
// ---------------------------------------------------------------------------

/** page-selection-v1. 0..1 정규화 좌표, left<right·top<bottom은 계약 검사(RUN4001) */
export interface PageSelection {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface ViewerFocus {
  noteAssetId: OpaqueId;
  /** 1-based */
  page: number;
  selection?: PageSelection | null;
}

/** `POST /api/conversations` body. 첫 질문은 `noteId` 없이 보낸다. */
export interface ConversationRunRequest {
  requestId: Uuid;
  noteId?: NoteId;
  text: string;
  latex?: string | null;
  requestedTasks?: RequestedTask[];
  requestedOutputs?: RequestedOutput[];
  turnAttachmentIds?: Uuid[];
  viewerFocus?: ViewerFocus | null;
}

// ---------------------------------------------------------------------------
// 응답 envelope
// ---------------------------------------------------------------------------

export interface ApiSuccessResponse<T> {
  isSuccess: true;
  code: typeof SUCCESS_CODE;
  message: string;
  result: T;
}

export interface ActiveRunConflict {
  activeRunId: Uuid;
}

/**
 * stream 시작 전 오류 (`Accept: text/event-stream`이어도 JSON이다).
 * RUN4091만 `result.activeRunId`가 있고 나머지는 `result`가 없다.
 * RUN4291의 `Retry-After`는 body가 아니라 HTTP header다.
 */
export type RunErrorResponse = {
  [C in RunErrorCode]: {
    isSuccess: false;
    code: C;
    message: string;
  } & (C extends "RUN4091"
    ? { result: ActiveRunConflict }
    : { result?: never });
}[RunErrorCode];

// ---------------------------------------------------------------------------
// 상태·취소 (`GET /api/ai-runs/{runId}`, `POST /api/ai-runs/{runId}/cancel`)
// ---------------------------------------------------------------------------

export interface RunFailureSummary {
  code: FailureCode;
  reason: AttachmentFailureReason | null;
  recoverable: boolean;
}

/**
 * status별로 채워지는 필드가 정해져 있다(schema if/then).
 * PENDING·RUNNING: cancelable=true, CANCELING 이후: false. COMPLETED만 responseDisposition,
 * FAILED만 failure, terminal만 completedAt이 있다.
 */
export interface RunStatus {
  runId: Uuid;
  requestId: Uuid;
  noteId: NoteId;
  userMessageId: Uuid;
  assistantMessageId: Uuid;
  status: PublicRunStatus;
  cancelable: boolean;
  /** 응답 시점 마지막 durable seq. 그대로 cursor로 쓸 수 있다. */
  lastSeq: Seq;
  responseDisposition: ResponseDisposition | null;
  failure: RunFailureSummary | null;
  createdAt: OccurredAt;
  completedAt: OccurredAt | null;
}

export interface RunCancelResult {
  runId: Uuid;
  status: PublicRunStatus;
  outcome: RunCancelOutcome;
}

export type RunStatusResponse = ApiSuccessResponse<RunStatus>;
export type RunCancelResponse = ApiSuccessResponse<RunCancelResult>;

// ---------------------------------------------------------------------------
// 대화 조회 (`GET /api/conversations/{noteId}/messages?before&limit`)
// ---------------------------------------------------------------------------

export interface TurnAttachmentView {
  attachmentId: Uuid;
  mime: AttachmentMime;
  displayName: string | null;
}

export interface UserMessageContent {
  text: string;
  latex: string | null;
  requestedTasks: RequestedTask[];
  /** 접수된 run의 output은 Phase 1에서 `text`만 있다. */
  requestedOutputs: "text"[];
  turnAttachments: TurnAttachmentView[];
  viewerFocus: ViewerFocus | null;
}

export interface AssistantFailure {
  code: FailureCode;
  reason: AttachmentFailureReason | null;
  message: string;
  recoverable: boolean;
}

export interface AssistantCancel {
  cause: CancelCause;
  message: string;
}

/**
 * PENDING·STREAMING placeholder는 본문·failure·cancel이 모두 null이다(검증 전 본문 비공개).
 * COMPLETED는 responseDisposition·assistantResponse, FAILED는 failure, CANCELED는 cancel만 있다.
 */
export interface AssistantMessageContent {
  responseDisposition: ResponseDisposition | null;
  clarificationReason: ClarificationReason | null;
  assistantResponse: AssistantResponseV1 | null;
  verificationSummary: SolutionVerificationSummary[];
  failure: AssistantFailure | null;
  cancel: AssistantCancel | null;
}

export interface UserConversationMessage {
  messageId: Uuid;
  role: "user";
  status: "COMPLETED";
  runId: Uuid;
  createdAt: OccurredAt;
  user: UserMessageContent;
}

export interface AssistantConversationMessage {
  messageId: Uuid;
  role: "assistant";
  status: ConversationMessageStatus;
  runId: Uuid;
  createdAt: OccurredAt;
  assistant: AssistantMessageContent;
}

/** `role`로 구분한다. 메시지는 createdAt 오름차순이다. */
export type ConversationMessage =
  | UserConversationMessage
  | AssistantConversationMessage;

export interface ActiveRunSummary {
  runId: Uuid;
  status: ActiveRunStatus;
  /** 이어 받기 cursor `{runId}:{lastSeq}`의 seq */
  lastSeq: Seq;
}

export interface ConversationPage {
  noteId: NoteId;
  activeRun: ActiveRunSummary | null;
  /** 최대 100개 */
  messages: ConversationMessage[];
  /** 다음(더 이전) 페이지 조회용 messageId */
  nextBefore: Uuid | null;
}

export type ConversationPageResponse = ApiSuccessResponse<ConversationPage>;

// ---------------------------------------------------------------------------
// assistant response (assistant-response-v1, terminal-v2 `AssistantResponseV1`)
// ---------------------------------------------------------------------------

/** block 공개 body 안의 `[start, end)` code point 범위 (UTF-16 index가 아니다) */
export interface TextAnchor {
  start: number;
  end: number;
}

export interface StepMark {
  stepId: string;
  status: StepMarkStatus;
  /** `unconfirmed`는 사유가 있다. */
  reason?: string | null;
  /** 공개 body에 step 범위가 없으면 없다. */
  anchor?: TextAnchor | null;
}

export interface QuotedSpan {
  anchor: TextAnchor;
  origin: QuoteOrigin;
}

export interface SolutionBlock {
  blockId: string;
  body: string;
  kind: "solution";
  verification: VerificationBadge;
  solutionId?: string | null;
  claimIds?: string[];
  stepMarks?: StepMark[];
}

export interface CheckBlock {
  blockId: string;
  body: string;
  kind: "check";
  stepMarks?: StepMark[];
  firstErrorStepId?: string | null;
  quotedSpans?: QuotedSpan[];
}

export interface ExplanationBlock {
  blockId: string;
  body: string;
  kind: "explanation";
  solutionId?: string | null;
  claimIds?: string[];
}

export interface RichTextBlock {
  blockId: string;
  body: string;
  kind: "rich_text";
}

export interface NoticeBlock {
  blockId: string;
  body: string;
  kind: "notice";
}

/** `kind`로 구분하는 ResultBlock 5종 */
export type ResultBlock =
  | SolutionBlock
  | CheckBlock
  | ExplanationBlock
  | RichTextBlock
  | NoticeBlock;
export type ResultBlockKind = ResultBlock["kind"];

/** main 또는 thread_like section. 중첩되지 않는다. */
export interface ResponsePage {
  responsePageId: string;
  presentation: PagePresentation;
  title?: string | null;
  resultBlocks: ResultBlock[];
}

/** source chip. `displayLabelSnapshot`·`available`은 Server가 채운다. */
export interface SourceReference {
  sourceRefId: string;
  assetId: string;
  /** 1-based, inclusive */
  pageStart: number;
  pageEnd: number;
  displayLabelSnapshot: string;
  /** read-time 값. replay와 live에서 다를 수 있는 유일한 값이다. */
  available: boolean;
}

export interface AssistantResponseV1 {
  /** 1..20 */
  responsePages: ResponsePage[];
  sourceReferences?: SourceReference[];
  plainText: string;
}

export interface UnconfirmedStepSummary {
  stepId: string;
  reason: string;
}

export interface ClaimVerificationSummary {
  claimId: string;
  coverage: SummaryCoverage;
  methodLabel: string;
  unconfirmedSteps?: UnconfirmedStepSummary[];
}

/** `supporting`은 완전한 정답 보장이 아니다. */
export interface SolutionVerificationSummary {
  solutionId: string;
  overallCoverage: SummaryCoverage;
  claims: ClaimVerificationSummary[];
}

// ---------------------------------------------------------------------------
// activity payload (activity-v1 browser 투영)
// ---------------------------------------------------------------------------

/** 1-based inclusive page 범위 */
export interface PageTarget {
  assetId: string;
  pageStart: number;
  pageEnd: number;
}

export interface LimitedPage {
  assetId: string;
  page: number;
}

/** verification 검사 진행 수 n/m (퍼센트가 아니다) */
export interface StepProgress {
  checked: number;
  total: number;
}

// started: kind별 label과 시작 정보
export interface InputAnalysisStarted {
  activityId: string;
  responsePageId?: string | null;
  kind: "input_analysis";
  label: InputAnalysisLabel;
}

export interface SolutionGenerationStarted {
  activityId: string;
  responsePageId?: string | null;
  kind: "solution_generation";
  label: SolutionGenerationLabel;
}

export interface AssetUnderstandingStarted {
  activityId: string;
  responsePageId?: string | null;
  kind: "asset_understanding";
  label: AssetUnderstandingLabel;
  reason: AssetUnderstandingReason;
  targets: PageTarget[];
}

export interface NoteRetrievalStarted {
  activityId: string;
  responsePageId?: string | null;
  kind: "note_retrieval";
  label: NoteRetrievalLabel;
}

export interface CodeExecutionStarted {
  activityId: string;
  responsePageId?: string | null;
  kind: "code_execution";
  label: CodeExecutionLabel;
  methodLabel: string;
}

export interface VerificationStarted {
  activityId: string;
  responsePageId?: string | null;
  kind: "verification";
  label: VerificationLabel;
  methodLabel: string;
}

export type ActivityStartedPayload =
  | InputAnalysisStarted
  | SolutionGenerationStarted
  | AssetUnderstandingStarted
  | NoteRetrievalStarted
  | CodeExecutionStarted
  | VerificationStarted;

// updated
export interface InputAnalysisUpdated {
  activityId: string;
  status?: ActivityStatus | null;
  message?: string | null;
  kind: "input_analysis";
}

export interface SolutionGenerationUpdated {
  activityId: string;
  status?: ActivityStatus | null;
  message?: string | null;
  kind: "solution_generation";
}

export interface AssetUnderstandingUpdated {
  activityId: string;
  status?: ActivityStatus | null;
  message?: string | null;
  kind: "asset_understanding";
  processedPages: number;
  totalPages: number;
}

export interface NoteRetrievalUpdated {
  activityId: string;
  status?: ActivityStatus | null;
  message?: string | null;
  kind: "note_retrieval";
}

export interface CodeExecutionUpdated {
  activityId: string;
  status?: ActivityStatus | null;
  message?: string | null;
  kind: "code_execution";
  methodLabel: string;
}

export interface VerificationUpdated {
  activityId: string;
  status?: ActivityStatus | null;
  message?: string | null;
  kind: "verification";
  methodLabel: string;
  progress: StepProgress;
}

export type ActivityUpdatedPayload =
  | InputAnalysisUpdated
  | SolutionGenerationUpdated
  | AssetUnderstandingUpdated
  | NoteRetrievalUpdated
  | CodeExecutionUpdated
  | VerificationUpdated;

// completed: 정상 판정(no match·unreadable 등)도 completed다.
export interface InputAnalysisCompleted {
  activityId: string;
  message?: string | null;
  kind: "input_analysis";
}

export interface SolutionGenerationCompleted {
  activityId: string;
  message?: string | null;
  kind: "solution_generation";
}

export interface AssetUnderstandingCompleted {
  activityId: string;
  message?: string | null;
  kind: "asset_understanding";
  processedPages: number;
  totalPages: number;
  outcome?: AssetUnderstandingOutcome | null;
}

export interface NoteRetrievalCompleted {
  activityId: string;
  message?: string | null;
  kind: "note_retrieval";
  matchStatus: NoteRetrievalMatchStatus;
  pages?: LimitedPage[];
}

export interface CodeExecutionCompleted {
  activityId: string;
  message?: string | null;
  kind: "code_execution";
  methodLabel: string;
  durationMs?: number | null;
}

export interface VerificationCompleted {
  activityId: string;
  message?: string | null;
  kind: "verification";
  methodLabel: string;
  progress: StepProgress;
}

export type ActivityCompletedPayload =
  | InputAnalysisCompleted
  | SolutionGenerationCompleted
  | AssetUnderstandingCompleted
  | NoteRetrievalCompleted
  | CodeExecutionCompleted
  | VerificationCompleted;

// failed: 기술적 실패만
export interface InputAnalysisFailed {
  activityId: string;
  code: ActivityFailureCode;
  message?: string | null;
  kind: "input_analysis";
}

export interface SolutionGenerationFailed {
  activityId: string;
  code: ActivityFailureCode;
  message?: string | null;
  kind: "solution_generation";
}

export interface AssetUnderstandingFailed {
  activityId: string;
  code: ActivityFailureCode;
  message?: string | null;
  kind: "asset_understanding";
}

export interface NoteRetrievalFailed {
  activityId: string;
  code: ActivityFailureCode;
  message?: string | null;
  kind: "note_retrieval";
}

export interface CodeExecutionFailed {
  activityId: string;
  code: ActivityFailureCode;
  message?: string | null;
  kind: "code_execution";
  methodLabel: string;
}

export interface VerificationFailed {
  activityId: string;
  code: ActivityFailureCode;
  message?: string | null;
  kind: "verification";
  methodLabel: string;
}

export type ActivityFailedPayload =
  | InputAnalysisFailed
  | SolutionGenerationFailed
  | AssetUnderstandingFailed
  | NoteRetrievalFailed
  | CodeExecutionFailed
  | VerificationFailed;

// canceled
export interface InputAnalysisCanceled {
  activityId: string;
  message?: string | null;
  kind: "input_analysis";
}

export interface SolutionGenerationCanceled {
  activityId: string;
  message?: string | null;
  kind: "solution_generation";
}

export interface AssetUnderstandingCanceled {
  activityId: string;
  message?: string | null;
  kind: "asset_understanding";
}

export interface NoteRetrievalCanceled {
  activityId: string;
  message?: string | null;
  kind: "note_retrieval";
}

export interface CodeExecutionCanceled {
  activityId: string;
  message?: string | null;
  kind: "code_execution";
  methodLabel: string;
}

export interface VerificationCanceled {
  activityId: string;
  message?: string | null;
  kind: "verification";
  methodLabel: string;
}

export type ActivityCanceledPayload =
  | InputAnalysisCanceled
  | SolutionGenerationCanceled
  | AssetUnderstandingCanceled
  | NoteRetrievalCanceled
  | CodeExecutionCanceled
  | VerificationCanceled;

// ---------------------------------------------------------------------------
// Server 소유 payload
// ---------------------------------------------------------------------------

export interface RunCreatedPayload {
  requestId: Uuid;
  /** 첫 질문이면 Server가 만든 Note id */
  noteId: NoteId;
  userMessageId: Uuid;
  assistantMessageId: Uuid;
  status: "PENDING";
  requestedTasks: RequestedTask[];
  requestedOutputs: "text"[];
}

export interface ResponsePageStartedPayload {
  assistantMessageId: Uuid;
  responsePageId: string;
  presentation: PagePresentation;
  title?: string | null;
  /** 0..19 */
  pageIndex: number;
}

export interface ResponsePageCompletedPayload {
  assistantMessageId: Uuid;
  responsePageId: string;
  pageIndex: number;
}

export interface RunCancelingPayload {
  assistantMessageId: Uuid;
  status: "CANCELING";
}

export interface RunCanceledPayload {
  assistantMessageId: Uuid;
  status: "CANCELED";
  cause: CancelCause;
  /** cause별 고정 문구 (`CANCEL_MESSAGES`) */
  message: string;
}

// ---------------------------------------------------------------------------
// terminal payload (terminal-v2 browser)
// ---------------------------------------------------------------------------

/** canonical 응답은 이 payload에서만 만든다. */
export interface RunCompletedPayload {
  responseDisposition: ResponseDisposition;
  clarificationReason?: ClarificationReason | null;
  assistantResponse: AssistantResponseV1;
  model: string;
  tier: ModelTier;
  verificationSummary?: SolutionVerificationSummary[];
  assistantMessageId: string;
}

export interface RunFailedPayload {
  code: FailureCode;
  reason?: AttachmentFailureReason | null;
  message: string;
  recoverable: boolean;
  assistantMessageId: string;
}

// ---------------------------------------------------------------------------
// frame envelope
// ---------------------------------------------------------------------------

/** SSE `data` JSON. SSE `event`는 `type`, SSE `id`는 `{runId}:{seq}`와 같다. */
export interface BrowserFrameEnvelope<TType extends string, TPayload> {
  contractVersion: FrameContractVersion;
  runId: Uuid;
  seq: Seq;
  occurredAt: OccurredAt;
  type: TType;
  payload: TPayload;
}

export type RunCreatedFrame = BrowserFrameEnvelope<
  "run.created",
  RunCreatedPayload
>;
export type ResponsePageStartedFrame = BrowserFrameEnvelope<
  "response.page.started",
  ResponsePageStartedPayload
>;
export type ResponsePageCompletedFrame = BrowserFrameEnvelope<
  "response.page.completed",
  ResponsePageCompletedPayload
>;
export type RunCancelingFrame = BrowserFrameEnvelope<
  "run.canceling",
  RunCancelingPayload
>;
export type RunCanceledFrame = BrowserFrameEnvelope<
  "run.canceled",
  RunCanceledPayload
>;

export type ActivityStartedFrame = BrowserFrameEnvelope<
  "activity.started",
  ActivityStartedPayload
>;
export type ActivityUpdatedFrame = BrowserFrameEnvelope<
  "activity.updated",
  ActivityUpdatedPayload
>;
export type ActivityCompletedFrame = BrowserFrameEnvelope<
  "activity.completed",
  ActivityCompletedPayload
>;
export type ActivityFailedFrame = BrowserFrameEnvelope<
  "activity.failed",
  ActivityFailedPayload
>;
export type ActivityCanceledFrame = BrowserFrameEnvelope<
  "activity.canceled",
  ActivityCanceledPayload
>;

export type RunCompletedFrame = BrowserFrameEnvelope<
  "run.completed",
  RunCompletedPayload
>;
export type RunFailedFrame = BrowserFrameEnvelope<
  "run.failed",
  RunFailedPayload
>;

export type ServerOwnedFrame =
  | RunCreatedFrame
  | ResponsePageStartedFrame
  | ResponsePageCompletedFrame
  | RunCancelingFrame
  | RunCanceledFrame;

export type ActivityFrame =
  | ActivityStartedFrame
  | ActivityUpdatedFrame
  | ActivityCompletedFrame
  | ActivityFailedFrame
  | ActivityCanceledFrame;

export type TerminalFrame =
  | RunCompletedFrame
  | RunFailedFrame
  | RunCanceledFrame;

/** `type`으로 구분하는 durable frame 12종 */
export type BrowserFrame =
  | ServerOwnedFrame
  | ActivityFrame
  | RunCompletedFrame
  | RunFailedFrame;
export type BrowserFrameType = BrowserFrame["type"];

export const BROWSER_FRAME_TYPES = [
  "run.created",
  "activity.started",
  "activity.updated",
  "activity.completed",
  "activity.failed",
  "activity.canceled",
  "response.page.started",
  "response.page.completed",
  "run.canceling",
  "run.completed",
  "run.failed",
  "run.canceled",
] as const satisfies readonly BrowserFrameType[];

export const TERMINAL_FRAME_TYPES = [
  "run.completed",
  "run.failed",
  "run.canceled",
] as const satisfies readonly TerminalFrame["type"][];

export const isTerminalFrame = (frame: BrowserFrame): frame is TerminalFrame =>
  (TERMINAL_FRAME_TYPES as readonly string[]).includes(frame.type);

export const toEventId = (runId: Uuid, seq: Seq): EventId => `${runId}:${seq}`;
