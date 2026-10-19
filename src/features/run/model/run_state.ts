import type {
  ActivityFailureCode,
  ActivityKind,
  ActivityStatus,
  AssetUnderstandingOutcome,
  AssetUnderstandingReason,
  AssistantResponseV1,
  AttachmentFailureReason,
  BrowserFrame,
  CancelCause,
  ClarificationReason,
  ConversationPage,
  EventId,
  FailureCode,
  LimitedPage,
  NoteId,
  NoteRetrievalMatchStatus,
  PagePresentation,
  PageTarget,
  PublicRunStatus,
  RequestedTask,
  ResponseDisposition,
  Seq,
  SolutionVerificationSummary,
  StepProgress,
  Uuid,
} from "@/shared/contracts/browser_run_v1";

/**
 * browser-run-v1 run 하나의 화면 상태 (v1-only, React·네트워크 독립).
 *
 * - 입력은 stream frame과 대화 조회 응답 두 가지이며 같은 `runReducer`가 처리한다.
 * - 검증 전 본문·후보 답·raw delta·진행 퍼센트는 두지 않는다. 본문은 `response`(run.completed)에만 있다.
 * - terminal(`COMPLETED`·`FAILED`·`CANCELED`) 뒤에는 어떤 입력도 상태를 바꾸지 않는다.
 */

/** Activity의 저장된 단계. `running`은 아직 activity terminal을 받지 않은 상태다. */
export type ActivityPhase = "running" | ActivityOutcome;
export type ActivityOutcome = "completed" | "failed" | "canceled";

/** asset_understanding의 처리 page 수 (퍼센트가 아니다) */
export interface PageProgress {
  processedPages: number;
  totalPages: number;
}

/**
 * Activity 박스 하나. 같은 `activityId`는 같은 박스를 갱신하고, phase가 outcome이 되면 더 바뀌지 않는다.
 * kind별 필드는 그 kind에서만 채워지고 나머지는 `null`(배열은 빈 배열)이다.
 */
export interface ActivityEntry {
  activityId: string;
  kind: ActivityKind;
  /** `activity.started`의 계약 라벨(kind별 enum) */
  label: string;
  responsePageId: string | null;
  phase: ActivityPhase;
  /** 마지막 `activity.updated`의 진행 sub-state (in_progress·waiting·retrying). outcome이 정해지면 null */
  progressStatus: ActivityStatus | null;
  /** 공개 message. 진행 중에는 마지막 non-null 값, outcome이 정해지면 그 terminal payload 값(없으면 null) */
  message: string | null;
  /** code_execution·verification */
  methodLabel: string | null;
  /** verification 검사 진행 수 n/m */
  stepProgress: StepProgress | null;
  /** asset_understanding */
  pageProgress: PageProgress | null;
  targets: PageTarget[];
  reason: AssetUnderstandingReason | null;
  assetOutcome: AssetUnderstandingOutcome | null;
  /** note_retrieval */
  matchStatus: NoteRetrievalMatchStatus | null;
  limitedPages: LimitedPage[];
  /** code_execution 완료 소요 시간 */
  durationMs: number | null;
  /** `activity.failed`의 기술적 실패 code */
  failureCode: ActivityFailureCode | null;
  /** 처음 등장한 frame seq (순서 고정 기준) */
  startedSeq: Seq;
  /** 마지막으로 반영한 frame seq */
  updatedSeq: Seq;
}

/** `response.page.*`에서 받은 page 경계·순서. 제목·본문은 두지 않는다. */
export interface ResponsePageBoundary {
  responsePageId: string;
  pageIndex: number;
  presentation: PagePresentation;
  completed: boolean;
}

/** canonical 응답. `run.completed` payload(또는 대화 조회 COMPLETED assistant message)에서만 만든다. */
export interface CanonicalResponse {
  assistantMessageId: Uuid;
  responseDisposition: ResponseDisposition;
  clarificationReason: ClarificationReason | null;
  assistantResponse: AssistantResponseV1;
  verificationSummary: SolutionVerificationSummary[];
}

export interface RunFailureInfo {
  code: FailureCode;
  reason: AttachmentFailureReason | null;
  message: string;
  recoverable: boolean;
}

export interface RunCancelInfo {
  cause: CancelCause;
  message: string;
}

/** `run.created`의 식별자. 대화 조회로 초기화하면 아는 값만 채운다. */
export interface RunIdentity {
  requestId: Uuid | null;
  noteId: NoteId | null;
  userMessageId: Uuid | null;
  assistantMessageId: Uuid | null;
  requestedTasks: RequestedTask[];
}

export interface RunState {
  runId: Uuid | null;
  /** 아직 입력이 없으면 `null`. 내부 RETRYING은 wire에 없으므로 여기에도 없다. */
  status: PublicRunStatus | null;
  identity: RunIdentity;
  /** 마지막 처리 frame seq. 0은 아직 없음. */
  lastSeq: Seq;
  /** 재접속 cursor = 마지막 처리 frame `id`(`{runId}:{seq}`). heartbeat로는 바뀌지 않는다. */
  cursor: EventId | null;
  /** 처음 등장 순서로 고정된 activityId 목록 */
  activityOrder: string[];
  activities: Record<string, ActivityEntry>;
  /** pageIndex 순서 */
  pages: ResponsePageBoundary[];
  response: CanonicalResponse | null;
  failure: RunFailureInfo | null;
  cancel: RunCancelInfo | null;
}

/**
 * 대화 조회로 초기화한 뒤 stream을 어디서부터 받을지.
 * - `"replay"`(기본): cursor를 두지 않는다. cursor 없이 GET /events로 seq 1부터 받으면 Activity·page까지
 *   처음부터 받은 결과와 같다(재진입에서 Activity 복원, spec 08).
 * - `"cursor"`: 아직 cursor가 없을 때만 `activeRun.lastSeq`를 cursor로 둔다. 대화 조회에는 Activity가 없으므로
 *   그 앞에서 시작한 Activity 박스는 복원되지 않는다(status·결과만 필요할 때).
 * 어느 쪽이든 이미 cursor가 있으면 대화 조회가 cursor를 바꾸지 않는다.
 */
export type ConversationResume = "replay" | "cursor";

/**
 * reducer 입력.
 * - `frame`: SSE durable frame 하나 (POST·GET /events 공통).
 * - `conversation`: 대화 조회 응답으로 초기화·보강. 대상 run은 `runId` → 추적 중인 run → `activeRun` 순서다.
 *   activeRun이면 status를 앞으로만 옮기고, terminal assistant message면 그 결과로 terminal 상태를 만든다.
 *   cursor는 `resume`으로 정한다(`ConversationResume`).
 * - `heartbeat`: live heartbeat comment. 아무것도 바꾸지 않는다(cursor가 아니다).
 */
export type RunAction =
  | { type: "frame"; frame: BrowserFrame }
  | {
      type: "conversation";
      page: ConversationPage;
      runId?: Uuid;
      /** 기본 `"replay"` */
      resume?: ConversationResume;
    }
  | { type: "heartbeat" };

/** 화면용 Activity. terminal 시점에 열린 Activity는 run 결과에 맞춘 outcome으로 투영된다. */
export interface ActivityView extends Omit<ActivityEntry, "phase"> {
  phase: ActivityPhase;
  /** run terminal 때문에 닫힌 것으로 투영했으면 true (wire에 activity terminal이 없었다) */
  closedByRun: boolean;
}
