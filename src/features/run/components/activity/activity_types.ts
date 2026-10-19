import type {
  ActivityKind,
  ActivityStatus,
  PublicRunStatus,
  StepProgress,
} from "@/shared/contracts/browser_run_v1";

/** spinner / check / X / minus에 대응하는 Activity 단계 (1.90 `ActivityPhase`와 같다) */
export type ActivityBoxPhase = "running" | "completed" | "failed" | "canceled";

/**
 * Activity 박스가 그리는 항목 하나.
 *
 * 1.90 `ActivityView`(`src/features/run/model`)의 구조적 부분집합이라 `selectActivities(state)` 결과를
 * 그대로 넘길 수 있다. 공개 `message`·`failureCode`처럼 박스가 쓰지 않는 필드는 받지 않는다:
 * 표시 문구는 계약 라벨에서 정한 고정 문구만 쓴다.
 */
export interface ActivityBoxItem {
  activityId: string;
  kind: ActivityKind;
  /** `activity.started`의 계약 라벨(kind별 enum) */
  label: string;
  phase: ActivityBoxPhase;
  /** 마지막 `activity.updated`의 진행 sub-state */
  progressStatus: ActivityStatus | null;
  /** code_execution·verification의 안전한 방법 라벨 */
  methodLabel: string | null;
  /** verification 검사 진행 수 n/m */
  stepProgress: StepProgress | null;
  /** asset_understanding 처리 page 수 */
  pageProgress: { processedPages: number; totalPages: number } | null;
}

export interface ActivityBoxProps {
  /** 처음 등장 순서대로 정렬된 Activity 목록 */
  activities: readonly ActivityBoxItem[];
  /** run 공개 상태. `CANCELING`이면 "중단 중"을 표시한다. */
  runStatus: PublicRunStatus | null;
  /** 처음 펼침 여부 (기본 펼침). 이후 접기/펼치기는 박스 로컬 상태다. */
  defaultExpanded?: boolean;
}
