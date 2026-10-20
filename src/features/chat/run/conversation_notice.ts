import { BROWSER_RUN_LIMITS } from "@/shared/contracts/browser_run_v1";
import type { RunSessionProblem } from "@/features/run/session";

/**
 * 대화 화면 안내 문구 (S08). 응답 본문이 아닌 Front 고정 문구만 둔다.
 *
 * 용어: run을 멈춘 결과는 "중단됨", 진행 중 요청은 "중단 중"이다(Activity 하나의 취소는 "취소됨", 1.92).
 */

export const DRAFT_KEPT_TEXT = "보낸 질문은 입력창에 남겨 두었어요.";

export const STOP_BUTTON_LABEL = "답변 중단";
export const CANCELING_BUTTON_TEXT = "중단 중";
export const RUN_CANCELED_TITLE = "중단됨";
export const RUN_FAILED_TITLE = "답변을 완성하지 못했어요";
export const RUN_RECOVERABLE_HINT =
  "같은 질문을 다시 보내면 해결될 수 있어요. 질문을 입력창에 넣어 직접 보내 주세요.";
export const REFILL_QUESTION_BUTTON = "질문 다시 쓰기";
export const RUN_PENDING_TEXT = "답변을 준비하고 있어요";
export const HISTORY_LOADING_TEXT = "대화를 불러오는 중...";
export const HISTORY_EMPTY_TEXT = "대화를 시작해보세요";
export const LOAD_OLDER_BUTTON = "이전 대화 더 보기";
export const ACTIVE_RUN_INPUT_HINT =
  "답변이 끝나면 보낼 수 있어요. 지금은 다음 질문을 미리 써 둘 수 있어요.";
export const ATTACHMENT_NOT_SUPPORTED_TEXT =
  "파일 첨부·#파일 멘션·@도구 선택은 아직 질문과 함께 보낼 수 없어요. 빼고 보내 주세요.";

/** browser-run-v1 요청에 담을 수 없는 입력(첨부·#파일 멘션·@도구). 말없이 버리지 않고 전송을 막는다(S09·S11). */
export const hasUnsupportedParts = (data: {
  attachments: readonly unknown[];
  mentionedAssetIds: readonly unknown[];
  mentionedToolCodes: readonly unknown[];
}) =>
  data.attachments.length > 0 ||
  data.mentionedAssetIds.length > 0 ||
  data.mentionedToolCodes.length > 0;

export type ConversationNoticeTone = "info" | "warning" | "error";

/** 안내 아래 버튼: 재접속·이력 다시 조회·요금제 보기 */
export type ConversationNoticeAction =
  | "reconnect"
  | "retry_history"
  | "pricing";

export interface ConversationNotice {
  /** 같은 안내인지 구분(닫은 안내를 다시 띄우지 않을 때 쓴다) */
  key: string;
  tone: ConversationNoticeTone;
  title: string;
  description?: string;
  /** 요청 한도(RUN4291): 이 시각(epoch ms)까지 전송을 막고 남은 초를 보인다. */
  retryAt?: number | null;
  action?: ConversationNoticeAction;
  /** 사용자가 닫을 수 있는 안내(전송 거부 등). 세션 상태 안내는 상태가 바뀌어야 사라진다. */
  dismissible?: boolean;
}

const REJECTED_NOTICES: Record<
  string,
  Omit<ConversationNotice, "key" | "retryAt">
> = {
  RUN4291: {
    tone: "warning",
    title: "요청이 많아 잠시 기다려야 해요",
    description: DRAFT_KEPT_TEXT,
  },
  RUN4021: {
    tone: "warning",
    title: "사용 가능한 잔여 사용량이 부족해요",
    description: `요금제를 확인해 주세요. ${DRAFT_KEPT_TEXT}`,
    action: "pricing",
  },
  RUN4221: {
    tone: "error",
    title: "첨부 또는 참조한 자료를 사용할 수 없어요",
    description: DRAFT_KEPT_TEXT,
  },
  RUN4002: {
    tone: "error",
    title: "지원하지 않는 요청이에요",
    description: `지원하지 않는 요청 항목이 포함되어 있어요. ${DRAFT_KEPT_TEXT}`,
  },
  RUN4001: {
    tone: "error",
    title: "질문을 보낼 수 없어요",
    description: `요청 형식이 올바르지 않아요. ${DRAFT_KEPT_TEXT}`,
  },
  RUN4092: {
    tone: "error",
    title: "이미 처리된 요청이에요",
    description: `질문을 다시 보내 주세요. ${DRAFT_KEPT_TEXT}`,
  },
};

const SEND_FAILED: Omit<ConversationNotice, "key"> = {
  tone: "error",
  title: "질문을 보내지 못했어요",
  description: `잠시 후 다시 보내 주세요. ${DRAFT_KEPT_TEXT}`,
};

const formatLimit = (value: number) => value.toLocaleString("ko-KR");

/** 보내기 전 계약 검사 실패 (RUN4001·RUN4002) */
const describeInvalidRequest = (
  problem: Extract<RunSessionProblem, { kind: "invalid_request" }>,
): Omit<ConversationNotice, "key"> => {
  if (problem.code === "RUN4002") return REJECTED_NOTICES.RUN4002;
  const paths = new Set(problem.issues.map((issue) => issue.path));
  if (paths.has("text"))
    return {
      tone: "error",
      title: "질문을 보낼 수 없어요",
      description: `질문은 비어 있을 수 없고 ${formatLimit(BROWSER_RUN_LIMITS.textMaxCodePoints)}자를 넘을 수 없어요. ${DRAFT_KEPT_TEXT}`,
    };
  if (paths.has("latex"))
    return {
      tone: "error",
      title: "질문을 보낼 수 없어요",
      description: `수식은 ${formatLimit(BROWSER_RUN_LIMITS.latexMaxCodePoints)}자를 넘을 수 없어요. ${DRAFT_KEPT_TEXT}`,
    };
  return REJECTED_NOTICES.RUN4001;
};

/**
 * 세션 problem → 화면 안내. 안내가 필요 없는 problem(로그인 화면으로 보낸 unauthorized)은 null이다.
 * 접수 거부는 code별로 요청 한도·잔액 부족·미지원 요청을 구분한다. 어느 것도 자동으로 다시 보내지 않는다.
 */
export const describeProblem = (
  problem: RunSessionProblem,
): ConversationNotice | null => {
  switch (problem.kind) {
    case "invalid_request":
      return {
        key: `invalid:${problem.code}`,
        ...describeInvalidRequest(problem),
      };
    case "rejected": {
      const { code } = problem.detail;
      const notice = (code && REJECTED_NOTICES[code]) || SEND_FAILED;
      return {
        key: `rejected:${code ?? problem.detail.status}:${problem.retryAt ?? ""}`,
        ...notice,
        ...(code === "RUN4291" && { retryAt: problem.retryAt }),
      };
    }
    case "not_found":
      return {
        key: `not_found:${problem.during}`,
        tone: "error",
        title: "노트를 찾을 수 없어요",
        description:
          problem.during === "send"
            ? `노트가 삭제되었을 수 있어요. ${DRAFT_KEPT_TEXT}`
            : "노트가 삭제되었을 수 있어요.",
      };
    case "reconnect_exhausted":
    case "stream_rejected":
      return {
        key: problem.kind,
        tone: "warning",
        title: "답변 연결이 끊겼어요",
        description:
          "답변은 서버에서 계속 진행돼요. 다시 연결하면 이어서 볼 수 있어요.",
        action: "reconnect",
      };
    case "restore_failed":
      return {
        key: problem.kind,
        tone: "error",
        title: "대화를 불러오지 못했어요",
        action: "retry_history",
      };
    case "unexpected":
      return {
        key: problem.kind,
        tone: "error",
        title: "답변을 표시하지 못했어요",
        description: "페이지를 새로고침하면 이어서 볼 수 있어요.",
      };
    case "unauthorized":
      return null;
  }
};

/** 409 RUN4091: 이 Note의 진행 중 답변에 붙었고 보낸 질문은 입력창으로 돌려준다. */
export const ACTIVE_RUN_CONFLICT_NOTICE: ConversationNotice = {
  key: "active_run_conflict",
  tone: "info",
  title: "이 노트에서 진행 중인 답변이 있어요",
  description: `진행 중인 답변을 이어서 보여 드려요. ${DRAFT_KEPT_TEXT}`,
};

/** terminal 없이 끊겨 재접속을 기다리는 중 */
/** 홈: 접수 전에 재접속이 멈췄다. 같은 요청(requestId)으로 다시 연결해야 중복 질문이 생기지 않는다. */
export const HOME_STALLED_NOTICE: ConversationNotice = {
  key: "home_stalled",
  tone: "warning",
  title: "질문 전송 연결이 끊겼어요",
  description:
    "질문이 이미 접수됐을 수 있어요. 다시 연결하면 같은 질문으로 이어서 확인해요.",
  action: "reconnect",
};

export const RECONNECTING_NOTICE: ConversationNotice = {
  key: "reconnecting",
  tone: "info",
  title: "연결이 끊겨 다시 연결하는 중이에요",
};

export const ATTACHMENT_NOTICE: ConversationNotice = {
  key: "attachment_not_supported",
  tone: "warning",
  title: ATTACHMENT_NOT_SUPPORTED_TEXT,
};
