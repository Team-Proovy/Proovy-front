import type {
  AssuranceScope,
  ClarificationReason,
  StepCheckResult,
  StepKind,
  StepMarkStatus,
  SummaryCoverage,
  VerificationBadge,
} from "@/shared/contracts/browser_run_v1";

/** 응답 화면 고정 문구. 응답 본문이 아닌 Front 안내만 둔다. */

export const STEP_STATUS_LABELS: Record<StepMarkStatus, string> = {
  verified: "검증됨",
  failed: "오류",
  unconfirmed: "확인되지 않음",
};

export const VERIFICATION_BADGE_LABELS: Record<VerificationBadge, string> = {
  verified: "검증된 풀이",
  partially_verified: "일부만 검증된 풀이",
  unverified: "검증되지 않은 풀이",
};

/** 미검증 안내. verified 풀이에는 붙지 않는다. */
export const UNVERIFIED_NOTICES: Record<
  Exclude<VerificationBadge, "verified">,
  string
> = {
  partially_verified:
    "일부 단계나 주장은 확인되지 않았습니다. 확인되지 않은 범위를 함께 살펴 주세요.",
  unverified:
    "이 풀이는 검증을 마치지 못했습니다. 답을 그대로 쓰기 전에 직접 확인해 주세요.",
};

export const CHECK_UNCONFIRMED_NOTICE =
  "일부 단계는 확인되지 않았습니다. 확인되지 않은 단계는 판정이 없는 상태입니다.";

export const COVERAGE_LABELS: Record<SummaryCoverage, string> = {
  direct: "직접 검증",
  supporting: "보조 검사",
};

/** supporting은 보조 검사 통과만 뜻하고 완전한 정답 보장이 아니다. */
export const COVERAGE_DESCRIPTIONS: Record<SummaryCoverage, string> = {
  direct: "계산과 결과를 직접 실행해 확인했습니다.",
  supporting: "보조 검사를 통과했습니다. 완전한 정답을 보장하지는 않습니다.",
};

export const CLARIFICATION_TITLE = "추가 정보가 필요합니다";

export const CLARIFICATION_REASON_LABELS: Record<ClarificationReason, string> =
  {
    missing_input: "풀이에 필요한 입력이 부족합니다.",
    ambiguous_target: "어떤 대상을 말하는지 분명하지 않습니다.",
    limited_pages: "읽을 수 있는 페이지 범위가 제한되어 있습니다.",
    corpus_not_ready: "자료가 아직 준비되지 않았습니다.",
    page_range_required: "페이지 범위를 지정해 주세요.",
    page_range_unreadable: "지정한 페이지를 읽을 수 없습니다.",
  };

export const UNSUPPORTED_TITLE = "지원하지 않는 요청입니다";

export const NOTICE_TITLE = "안내";

export const VERIFICATION_SUMMARY_TITLE = "검증 요약";

export const THREAD_SECTION_DEFAULT_TITLE = "자세히 보기";

/** 보증 범위 배지(응답·문제). 단계 수(n/m)는 배지 본문에 넣지 않는다. */
export const ASSURANCE_SCOPE_LABELS: Record<AssuranceScope, string> = {
  verified: "검증됨",
  unverified: "미검증",
  not_applicable: "검증 대상 아님",
};

/** 배지 옆 보조 설명(스크린리더·툴팁). 무엇을 보증하는지 짧게 적는다. */
export const ASSURANCE_SCOPE_DESCRIPTIONS: Record<AssuranceScope, string> = {
  verified:
    "독립 풀이와 답이 일치하고 단계의 식을 검산했습니다. 설명 문장은 검산 대상이 아닙니다.",
  unverified:
    "검증을 마치지 못했습니다. 답을 그대로 쓰기 전에 직접 확인해 주세요.",
  not_applicable: "증명·설명처럼 답을 검산하는 대상이 아닙니다.",
};

/** `responseKind === "re_explanation"`: 보증 범위 배지 옆 별도 표시 */
export const RE_EXPLANATION_LABEL = "추가 설명";
export const RE_EXPLANATION_DESCRIPTION =
  "앞서 드린 풀이를 다시 설명한 답변입니다. 이 설명 자체는 새로 검증하지 않았습니다.";

export const STEP_CHECK_SECTION_TITLE = "단계별 검산";

/**
 * ADR 0017 §3: 설명 문장의 논리는 검산 대상이 아니다. "검산 통과"는 그 단계의 식만 확인했다는 뜻임을
 * 단계 목록과 함께 항상 보인다.
 */
export const STEP_CHECK_SCOPE_NOTICE =
  "검산은 각 단계의 식만 확인합니다. 설명 문장의 논리는 검산 대상이 아닙니다.";

/** 결과는 그 단계의 식에 대한 것이다(설명 문장이 아니다) — 문구에 "식"을 넣어 범위를 드러낸다. */
export const STEP_CHECK_RESULT_LABELS: Record<StepCheckResult, string> = {
  verified: "식 검산 통과",
  falsified: "식 검산 실패",
  unparseable: "식 검산 안 됨",
  not_checked: "검산 대상 아님",
};

export const STEP_KIND_LABELS: Record<StepKind, string> = {
  define: "정의",
  given: "조건",
  claim: "계산",
  case: "경우 나눔",
  choose: "보기 선택",
  argue: "설명",
};

export const STEP_WITHHELD_TEXT = "정답 숨김 설정으로 단계 내용을 가렸습니다.";
export const SOLUTION_HIDDEN_TEXT =
  "풀이 숨김 설정으로 단계를 보여 주지 않습니다.";
export const NO_CHECKABLE_STEPS_TEXT = "검산할 단계가 없습니다.";

export const CROSS_CHECK_TEXTS = {
  agrees: "다른 방법으로 구한 답과 일치합니다.",
  disagrees: "다른 방법으로 구한 답과 일치하지 않습니다.",
  stepCheckIncomplete: "단계 검산을 끝까지 마치지 못했습니다.",
} as const;
