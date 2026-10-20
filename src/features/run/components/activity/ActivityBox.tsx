import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ActivityStatusIcon } from "./ActivityStatusIcon";
import type { PublicRunStatus } from "@/shared/contracts/browser_run_v1";
import {
  ACTIVITY_PHASE_TEXTS,
  CANCELING_TEXT,
  RUN_OUTCOME_TEXTS,
  getActivityMethodText,
  getActivityProgressText,
  getActivityStatusText,
  getActivityTitle,
} from "./activity_labels";
import type {
  ActivityBoxItem,
  ActivityBoxPhase,
  ActivityBoxProps,
} from "./activity_types";

const BOX_TITLE = "진행 상황";

/**
 * 박스 요약 = live region 문구. 문구가 바뀔 때만 읽히므로 다음 경우에만 바뀐다.
 *
 * - run이 CANCELING이면 "중단 중", CANCELED·FAILED면 run 결과("중단됨"·"실패"). 마지막 Activity가 완료였어도
 *   중단·실패한 run을 "완료"로 읽지 않고, Activity 없이 끝난 run도 최종 상태를 알린다.
 * - 그 밖에는 마지막 Activity의 제목 + 단계(진행 중·완료·실패·취소됨) = 새 Activity 또는 outcome.
 *
 * 진행 수(n/m)와 sub-state(대기 중·다시 시도 중)는 넣지 않는다. 진행이 오르거나 retrying을 오갈 때마다
 * 스크린리더가 다시 읽지 않도록 그것들은 목록 행에만 표시한다.
 */
const getSummary = (
  activities: readonly ActivityBoxItem[],
  runStatus: PublicRunStatus | null,
): { text: string; phase: ActivityBoxPhase } => {
  if (runStatus === "CANCELING") {
    return { text: CANCELING_TEXT, phase: "running" };
  }
  if (runStatus === "CANCELED") {
    return { text: RUN_OUTCOME_TEXTS.CANCELED, phase: "canceled" };
  }
  if (runStatus === "FAILED") {
    return { text: RUN_OUTCOME_TEXTS.FAILED, phase: "failed" };
  }
  const latest = activities.at(-1);
  if (!latest) return { text: "", phase: "running" };
  return {
    text: `${getActivityTitle(latest)} ${ACTIVITY_PHASE_TEXTS[latest.phase]}`,
    phase: latest.phase,
  };
};

const ActivityRow = ({
  item,
  isCanceling,
}: {
  item: ActivityBoxItem;
  isCanceling: boolean;
}) => {
  const methodText = getActivityMethodText(item);
  const progressText = getActivityProgressText(item);
  return (
    <li
      className="flex items-center gap-[8px] text-[14px] leading-[20px]"
      data-activity-id={item.activityId}
    >
      <ActivityStatusIcon phase={item.phase} />
      <span className="min-w-0 flex-1 text-[#111827]">
        {getActivityTitle(item)}
        {methodText && (
          <span className="text-[#6B7280]">{` · ${methodText}`}</span>
        )}
        {progressText && (
          <span className="text-[#6B7280]">{` · ${progressText}`}</span>
        )}
      </span>
      <span className="shrink-0 font-medium text-[#374151]">
        {getActivityStatusText(item, isCanceling)}
      </span>
    </li>
  );
};

/**
 * 실제 진행 Activity를 처음 등장한 순서대로 누적하는 박스.
 *
 * - 상태마다 아이콘 모양 + 텍스트 문구가 있어 색에 의존하지 않는다.
 * - 박스 전체를 header 버튼으로 접고 편다(`aria-expanded`). 접어도 요약과 live region은 남는다.
 * - live region은 polite `status` 하나다. 요약 문구(`getSummary`)가 바뀔 때만 읽힌다.
 *   처음부터 문구를 담고 생긴 live region은 스크린리더가 읽지 않으므로, 박스가 보이지 않을 때도
 *   빈 status를 mount해 두고 문구만 바꾼다.
 */
export const ActivityBox = ({
  activities,
  runStatus,
  defaultExpanded = true,
}: ActivityBoxProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const listId = useId();
  const isCanceling = runStatus === "CANCELING";

  const isVisible = activities.length > 0 || isCanceling;
  const summary = getSummary(activities, runStatus);

  return (
    <>
      {isVisible && (
        <div className="w-full rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-[#F3F5F8] p-[10px]">
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={listId}
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex w-full items-center gap-[8px] text-left text-[14px] leading-[20px] font-medium text-[#374151]"
          >
            <ChevronDown
              aria-hidden="true"
              size={16}
              className={`shrink-0 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
            />
            <span>{BOX_TITLE}</span>
            <span className="ml-auto flex min-w-0 items-center gap-[6px] text-[#6B7280]">
              <ActivityStatusIcon phase={summary.phase} />
              <span className="truncate">{summary.text}</span>
            </span>
          </button>
          <ol
            id={listId}
            hidden={!isExpanded}
            aria-label={BOX_TITLE}
            className="mt-[8px] flex flex-col gap-[6px]"
          >
            {activities.map((item) => (
              <ActivityRow
                key={item.activityId}
                item={item}
                isCanceling={isCanceling}
              />
            ))}
          </ol>
        </div>
      )}
      <p
        role="status"
        className="sr-only"
      >
        {summary.text}
      </p>
    </>
  );
};
