import { memo, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ActivityStatusIcon } from "./ActivityStatusIcon";
import type {
  PublicRunStatus,
  ReadBackProblem,
} from "@/shared/contracts/browser_run_v1";
import { SafeMarkdown } from "../response/SafeMarkdown";
import { getProblemTitle } from "../problem_label";
import {
  ACTIVITY_PHASE_TEXTS,
  CANCELING_TEXT,
  CHOICE_MARKS,
  READ_BACK_FIGURE_PREFIX,
  READ_BACK_LIST_LABEL,
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
 * Activity의 마지막 사건 seq. 진행 중이면 시작 seq다: `updatedSeq`는 n/m 갱신마다 올라
 * 그대로 쓰면 열린 Activity 사이에서 요약이 번갈아 바뀌어 다시 읽힌다. outcome 뒤 `updatedSeq`는 바뀌지 않는다.
 */
const getEventSeq = (item: ActivityBoxItem) =>
  item.phase === "running" ? item.startedSeq : item.updatedSeq;

/**
 * 박스 요약 = live region 문구. 문구가 바뀔 때만 읽히므로 다음 경우에만 바뀐다.
 *
 * - run이 CANCELING이면 "중단 중", CANCELED·FAILED면 run 결과("중단됨"·"실패"). 마지막 Activity가 완료였어도
 *   중단·실패한 run을 "완료"로 읽지 않고, Activity 없이 끝난 run도 최종 상태를 알린다.
 * - 그 밖에는 가장 최근 사건(시작 또는 outcome)이 일어난 Activity의 제목 + 단계(진행 중·완료·실패·취소됨).
 *   앞서 열린 Activity가 뒤 Activity 시작 이후에 끝나도 그 outcome을 알린다.
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
  const latest = activities.reduce<ActivityBoxItem | undefined>(
    (current, item) =>
      current && getEventSeq(current) > getEventSeq(item) ? current : item,
    undefined,
  );
  if (!latest) return { text: "", phase: "running" };
  return {
    text: `${getActivityTitle(latest)} ${ACTIVITY_PHASE_TEXTS[latest.phase]}`,
    phase: latest.phase,
  };
};

/** 줄 맨 앞에서 목록·제목·인용·코드 블록이 되는 표식 */
const LEADING_BLOCK_SYNTAX =
  /^(\s*)(#{1,6}(?=\s|$)|>|[-+*](?=\s|$)|\d{1,9}[.)](?=\s|$)|```|~~~|\|)/;

/**
 * 보기는 한 줄 inline 내용이다. 줄바꿈을 공백으로 바꾸고 맨 앞 블록 표식(`1) 3`, `- 2`, `# 4` 등)을
 * escape해 ① 옆에 목록·제목이 생기지 않게 한다. 인라인 수식(`$…$`)은 그대로 KaTeX로 그린다.
 */
const toInlineMarkdown = (text: string) =>
  text
    .replace(/\s*\n\s*/g, " ")
    .trim()
    .replace(LEADING_BLOCK_SYNTAX, (_match, space: string, marker: string) =>
      /^\d/.test(marker)
        ? `${space}${marker.slice(0, -1)}\\${marker.slice(-1)}`
        : `${space}\\${marker}`,
    );

/**
 * Read-back("이렇게 읽었어요")에서 읽은 문제: 번호·본문·보기·그림 설명. 수식은 SafeMarkdown(KaTeX)으로 그린다.
 * 답·단계는 계약상 오지 않는다. 사용자 확인을 기다리지 않는다(틀리면 정지).
 */
const ReadBackProblems = ({
  problems,
}: {
  problems: readonly ReadBackProblem[];
}) => (
  <ol
    aria-label={READ_BACK_LIST_LABEL}
    className="mt-[6px] ml-[24px] flex flex-col gap-[6px] rounded-[8px] border-[0.5px] border-[#D1D6DE] bg-white px-[10px] py-[8px] text-[13px] leading-[20px] text-[#2F3440]"
  >
    {problems.map((problem, index) => (
      <li
        key={index}
        data-read-back-problem
      >
        <p className="text-[12px] font-semibold text-[#6B7280]">
          {getProblemTitle(problem.problemNumber, index)}
        </p>
        <SafeMarkdown
          body={problem.questionText}
          className="break-words"
        />
        {!!problem.choices?.length && (
          <ol
            aria-label="보기"
            className="mt-[2px] flex flex-wrap gap-x-[12px] gap-y-[2px]"
          >
            {problem.choices.map((choice, choiceIndex) => (
              <li
                key={choiceIndex}
                className="flex items-baseline gap-[4px]"
              >
                <span aria-hidden>{CHOICE_MARKS[choiceIndex]}</span>
                <span className="sr-only">{`${choiceIndex + 1}번 보기`}</span>
                <SafeMarkdown
                  body={toInlineMarkdown(choice)}
                  className="[&_p]:my-0"
                />
              </li>
            ))}
          </ol>
        )}
        {problem.figureDescription && (
          <div className="mt-[2px] flex gap-[4px] text-[12px] text-[#6B7280]">
            <span className="shrink-0">{READ_BACK_FIGURE_PREFIX}:</span>
            <SafeMarkdown
              body={problem.figureDescription}
              className="min-w-0 [&_p]:my-0"
            />
          </div>
        )}
      </li>
    ))}
  </ol>
);

/**
 * 행 하나. `selectActivities`가 바뀌지 않은 Activity에 같은 view 객체를 주므로 memo로 다시 그리지 않는다
 * (Read-back 문제 20개의 KaTeX를 진행 frame마다 다시 파싱하지 않게).
 */
const ActivityRow = memo(function ActivityRow({
  item,
  isCanceling,
}: {
  item: ActivityBoxItem;
  isCanceling: boolean;
}) {
  const methodText = getActivityMethodText(item);
  const progressText = getActivityProgressText(item);
  const readBackProblems =
    item.kind === "read_back" ? (item.readBackProblems ?? []) : [];
  return (
    <li
      data-activity-id={item.activityId}
      data-activity-kind={item.kind}
    >
      <div className="flex items-center gap-[8px] text-[14px] leading-[20px]">
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
      </div>
      {readBackProblems.length > 0 && (
        <ReadBackProblems problems={readBackProblems} />
      )}
    </li>
  );
});

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
