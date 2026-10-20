import type {
  ActivityKind,
  ActivityStatus,
  AssetUnderstandingLabel,
  CodeExecutionLabel,
  InputAnalysisLabel,
  NoteRetrievalLabel,
  SolutionGenerationLabel,
  VerificationLabel,
} from "@/shared/contracts/browser_run_v1";
import type { ActivityBoxItem, ActivityBoxPhase } from "./activity_types";

/**
 * Activity 박스 표시 문구.
 *
 * 문구는 계약 enum(kind·label·phase·status)에서만 고른다. 서버 공개 `message`와 단계 내용·후보 답·
 * 통과/실패 판정은 쓰지 않고, 진행은 측정한 수(n/m)로만 보여 준다(퍼센트·순환 문구 없음).
 */

export const ACTIVITY_KIND_TITLES: Record<ActivityKind, string> = {
  input_analysis: "입력 분석",
  solution_generation: "풀이 생성",
  asset_understanding: "자료 이해",
  note_retrieval: "노트 검색",
  code_execution: "코드 실행",
  verification: "검증",
};

/** kind별 계약 label enum의 고정 문구. 모르는 label은 kind 제목만 쓴다. */
const ACTIVITY_LABEL_TEXTS: Record<
  | InputAnalysisLabel
  | SolutionGenerationLabel
  | AssetUnderstandingLabel
  | NoteRetrievalLabel
  | CodeExecutionLabel
  | VerificationLabel,
  string
> = {
  analyzing_input: "입력 분석",
  reading_input: "입력 읽기",
  drafting_solution: "풀이 작성",
  revising_solution: "풀이 수정",
  reading_pages: "페이지 읽기",
  summarizing_pages: "페이지 요약",
  searching_notes: "노트 검색",
  running_calculation: "계산 실행",
  running_check_code: "확인 코드 실행",
  verifying_steps: "단계 검증",
};

export const ACTIVITY_PHASE_TEXTS: Record<ActivityBoxPhase, string> = {
  running: "진행 중",
  completed: "완료",
  failed: "실패",
  canceled: "취소됨",
};

export const CANCELING_TEXT = "중단 중";

/** run이 Activity outcome과 따로 끝났을 때의 박스 요약 문구 */
export const RUN_OUTCOME_TEXTS = {
  CANCELED: "중단됨",
  FAILED: "실패",
} as const;

/** running 중 sub-state 보조 문구. in_progress는 "진행 중"과 같아 따로 붙이지 않는다. */
const PROGRESS_STATUS_TEXTS: Partial<Record<ActivityStatus, string>> = {
  waiting: "대기 중",
  retrying: "다시 시도 중",
};

export const getActivityTitle = (
  item: Pick<ActivityBoxItem, "kind" | "label">,
) =>
  Object.hasOwn(ACTIVITY_LABEL_TEXTS, item.label)
    ? ACTIVITY_LABEL_TEXTS[item.label as keyof typeof ACTIVITY_LABEL_TEXTS]
    : ACTIVITY_KIND_TITLES[item.kind];

/** run이 CANCELING이면 아직 열린 Activity도 "중단 중"으로 읽힌다. */
export const getActivityStatusText = (
  item: Pick<ActivityBoxItem, "phase" | "progressStatus">,
  isCanceling: boolean,
) => {
  if (item.phase !== "running") return ACTIVITY_PHASE_TEXTS[item.phase];
  if (isCanceling) return CANCELING_TEXT;
  const subStatus =
    item.progressStatus && PROGRESS_STATUS_TEXTS[item.progressStatus];
  return subStatus ?? ACTIVITY_PHASE_TEXTS.running;
};

/** 측정한 수만 보여 준다. verification은 n/m 단계, asset_understanding은 n/m 페이지. */
export const getActivityProgressText = (
  item: Pick<ActivityBoxItem, "kind" | "stepProgress" | "pageProgress">,
) => {
  if (item.kind === "verification" && item.stepProgress) {
    return `${item.stepProgress.checked}/${item.stepProgress.total}단계 확인`;
  }
  if (item.kind === "asset_understanding" && item.pageProgress) {
    return `${item.pageProgress.processedPages}/${item.pageProgress.totalPages}페이지`;
  }
  return null;
};

/** code_execution·verification의 안전한 방법 라벨 */
export const getActivityMethodText = (
  item: Pick<ActivityBoxItem, "kind" | "methodLabel">,
) =>
  item.kind === "code_execution" || item.kind === "verification"
    ? item.methodLabel || null
    : null;
