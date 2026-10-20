import type {
  ClarificationReason,
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
