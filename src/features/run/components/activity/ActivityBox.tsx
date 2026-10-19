import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ActivityStatusIcon } from "./ActivityStatusIcon";
import {
  CANCELING_TEXT,
  getActivityMethodText,
  getActivityProgressText,
  getActivityStatusText,
  getActivityTitle,
} from "./activity_labels";
import type { ActivityBoxItem, ActivityBoxProps } from "./activity_types";

const BOX_TITLE = "진행 상황";

/**
 * 박스 요약 = live region 문구. 마지막 Activity의 제목과 상태, run이 CANCELING이면 "중단 중"만 담는다.
 * 진행 수(n/m)는 넣지 않아 검사 진행이 오를 때마다 스크린리더가 다시 읽지 않는다.
 */
const getSummaryText = (
  activities: readonly ActivityBoxItem[],
  isCanceling: boolean,
) => {
  if (isCanceling) return CANCELING_TEXT;
  const latest = activities.at(-1);
  if (!latest) return "";
  return `${getActivityTitle(latest)} ${getActivityStatusText(latest, false)}`;
};

const ActivityRow = ({
  item,
  isCanceling,
}: {
  item: ActivityBoxItem;
  isCanceling: boolean;
}) => {
  const details = [getActivityMethodText(item), getActivityProgressText(item)];
  return (
    <li
      className="flex items-center gap-[8px] text-[14px] leading-[20px]"
      data-activity-id={item.activityId}
    >
      <ActivityStatusIcon phase={item.phase} />
      <span className="min-w-0 flex-1 text-[#111827]">
        {getActivityTitle(item)}
        {details.map(
          (detail) =>
            detail && (
              <span
                key={detail}
                className="text-[#6B7280]"
              >
                {` · ${detail}`}
              </span>
            ),
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
 * - live region은 polite `status` 하나다. 요약 문구가 바뀔 때(새 Activity·outcome·중단 중)만 읽힌다.
 */
export const ActivityBox = ({
  activities,
  runStatus,
  defaultExpanded = true,
}: ActivityBoxProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const listId = useId();
  const isCanceling = runStatus === "CANCELING";

  if (activities.length === 0 && !isCanceling) return null;

  const summary = getSummaryText(activities, isCanceling);
  const summaryPhase = isCanceling
    ? "running"
    : (activities.at(-1)?.phase ?? "running");

  return (
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
          <ActivityStatusIcon phase={summaryPhase} />
          <span className="truncate">{summary}</span>
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
      <p
        role="status"
        className="sr-only"
      >
        {summary}
      </p>
    </div>
  );
};
