import type { PublicRunStatus } from "@/shared/contracts/browser_run_v1";
import type { ActivityPhase, ActivityView } from "@/features/run/model";

/** spinner / check / X / minus에 대응하는 Activity 단계 (1.90 `ActivityPhase`) */
export type ActivityBoxPhase = ActivityPhase;

/**
 * Activity 박스가 그리는 항목 하나.
 *
 * 1.90 `ActivityView`에서 박스가 쓰는 필드만 고른 것이라 `selectActivities(state)` 결과를 그대로 넘길 수 있다.
 * 공개 `message`·`failureCode`처럼 박스가 쓰지 않는 필드는 받지 않는다: 표시 문구는 계약 라벨에서 정한 고정 문구만 쓴다.
 */
export type ActivityBoxItem = Pick<
  ActivityView,
  | "activityId"
  | "kind"
  | "label"
  | "phase"
  | "progressStatus"
  | "methodLabel"
  | "stepProgress"
  | "pageProgress"
  | "startedSeq"
  | "updatedSeq"
>;

export interface ActivityBoxProps {
  /** 처음 등장 순서대로 정렬된 Activity 목록 */
  activities: readonly ActivityBoxItem[];
  /**
   * run 공개 상태. `CANCELING`이면 "중단 중", `CANCELED`·`FAILED`면 요약이 run 결과("중단됨"·"실패")다.
   * live region이 첫 문구부터 읽히도록 박스는 run이 시작될 때(Activity가 없을 때)부터 mount해 둔다.
   */
  runStatus: PublicRunStatus | null;
  /** 처음 펼침 여부 (기본 펼침). 이후 접기/펼치기는 박스 로컬 상태다. */
  defaultExpanded?: boolean;
}
