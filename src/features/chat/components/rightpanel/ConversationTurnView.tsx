import { CircleSlash, LoaderCircle, OctagonAlert } from "lucide-react";
import {
  ProfileIcon,
  SubscriptionIcon,
} from "@/shared/components/icons/SettingsIcons";
import { ActivityBox } from "@/features/run/components/activity";
import {
  AssistantResponseView,
  SafeMarkdown,
  toCompletedAssistantResponse,
} from "@/features/run/components/response";
import { selectActivities, selectIsActive } from "@/features/run/model";
import type { RunState } from "@/features/run/model";
import type {
  AssistantCancel,
  AssistantFailure,
} from "@/shared/contracts/browser_run_v1";
import {
  REFILL_QUESTION_BUTTON,
  RUN_CANCELED_TITLE,
  RUN_FAILED_TITLE,
  RUN_PENDING_TEXT,
  RUN_RECOVERABLE_HINT,
} from "../../run/conversation_notice";
import type {
  ConversationTurn,
  TurnAssistant,
  TurnUser,
} from "../../run/conversation_turns";

/** 입력창은 수식 여러 개를 `"; "`로 이어 latex에 싣는다. */
const LATEX_SEPARATOR = "; ";

/** 사용자 질문. text의 `$…$` 수식을 그리고, text에 없는 수식만 수식 줄로 덧붙인다. */
const UserBubble = ({ user }: { user: TurnUser }) => {
  const missing = (user.latex ?? "")
    .split(LATEX_SEPARATOR)
    .map((part) => part.trim())
    .filter((part) => part && !user.text.includes(part));
  const body = [user.text, ...missing.map((part) => `$$${part}$$`)].join(
    "\n\n",
  );
  return (
    <div className="flex items-start justify-end gap-[12px]">
      <div
        aria-label="내 질문"
        className="max-w-[400px] min-w-0 overflow-hidden rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-white p-[10px] text-[14px] leading-[20px] font-medium text-black"
      >
        <SafeMarkdown body={body} />
      </div>
      <div className="shrink-0">
        <ProfileIcon
          size={40}
          color="#2A6AFF"
        />
      </div>
    </div>
  );
};

const PendingLine = () => (
  <div className="flex items-center gap-[8px] text-[14px] leading-[20px] text-[#6B7280]">
    <LoaderCircle
      aria-hidden="true"
      size={16}
      className="animate-spin motion-reduce:animate-none"
    />
    <span>{RUN_PENDING_TEXT}</span>
  </div>
);

interface OutcomeProps {
  onRefill?: () => void;
}

const FailureView = ({
  failure,
  onRefill,
}: { failure: AssistantFailure } & OutcomeProps) => (
  <div
    data-outcome="failed"
    className="flex items-start gap-[8px] rounded-[12px] border-[0.5px] border-[#F3B4B4] bg-[#FFF4F4] p-[10px] text-[14px] leading-[20px] text-[#8A1C1C]"
  >
    <OctagonAlert
      aria-hidden="true"
      size={16}
      className="mt-[2px] shrink-0"
    />
    <div className="min-w-0">
      <p className="font-semibold">{RUN_FAILED_TITLE}</p>
      <p>{failure.message}</p>
      {failure.recoverable && (
        <>
          <p className="mt-[4px] text-[13px]">{RUN_RECOVERABLE_HINT}</p>
          {onRefill && (
            <button
              type="button"
              onClick={onRefill}
              className="mt-[6px] rounded-[8px] border-[0.5px] border-current px-[10px] py-[4px] text-[13px] font-semibold"
            >
              {REFILL_QUESTION_BUTTON}
            </button>
          )}
        </>
      )}
    </div>
  </div>
);

const CanceledView = ({ cancel }: { cancel: AssistantCancel }) => (
  <div
    data-outcome="canceled"
    className="flex items-start gap-[8px] rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-[#F3F5F8] p-[10px] text-[14px] leading-[20px] text-[#374151]"
  >
    <CircleSlash
      aria-hidden="true"
      size={16}
      className="mt-[2px] shrink-0"
    />
    <p>
      <span className="font-semibold">{RUN_CANCELED_TITLE}</span>
      {` · ${cancel.message}`}
    </p>
  </div>
);

/**
 * 이 화면이 받은 run. Activity 박스는 run 시작부터(Activity 0개여도) mount해 live region을 유지하고,
 * terminal 뒤에도 남겨 진행 기록을 보인다. 본문은 COMPLETED의 canonical 응답만 그린다(검증 전 본문 없음).
 */
const LiveAssistant = ({ run, onRefill }: { run: RunState } & OutcomeProps) => {
  const activities = selectActivities(run);
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-[10px]">
      <ActivityBox
        activities={activities}
        runStatus={run.status}
      />
      {(run.status === null || selectIsActive(run)) &&
        activities.length === 0 &&
        run.status !== "CANCELING" && <PendingLine />}
      {run.status === "COMPLETED" && run.response && (
        <AssistantResponseView response={run.response} />
      )}
      {run.status === "FAILED" && run.failure && (
        <FailureView
          failure={run.failure}
          onRefill={onRefill}
        />
      )}
      {run.status === "CANCELED" && run.cancel && (
        <CanceledView cancel={run.cancel} />
      )}
    </div>
  );
};

const AssistantBody = ({
  assistant,
  onRefill,
}: { assistant: TurnAssistant } & OutcomeProps) => {
  if (assistant.kind === "live")
    return (
      <LiveAssistant
        run={assistant.run}
        onRefill={onRefill}
      />
    );
  if (assistant.kind === "pending")
    return (
      <div className="flex min-w-0 flex-1 flex-col">
        <PendingLine />
      </div>
    );

  const { message } = assistant;
  const response = toCompletedAssistantResponse(message.assistant);
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {message.status === "COMPLETED" && response && (
        <AssistantResponseView response={response} />
      )}
      {message.status === "FAILED" && message.assistant.failure && (
        <FailureView
          failure={message.assistant.failure}
          onRefill={onRefill}
        />
      )}
      {message.status === "CANCELED" && message.assistant.cancel && (
        <CanceledView cancel={message.assistant.cancel} />
      )}
      {(message.status === "PENDING" || message.status === "STREAMING") && (
        <PendingLine />
      )}
    </div>
  );
};

interface ConversationTurnViewProps {
  turn: ConversationTurn;
  /** recoverable 실패에서 질문을 입력창에 다시 넣는다(보내지는 않는다). */
  onRefill?: (text: string) => void;
}

/** 질문 하나와 그 답변 */
export const ConversationTurnView = ({
  turn,
  onRefill,
}: ConversationTurnViewProps) => {
  const { user, assistant } = turn;
  const refill = user && onRefill ? () => onRefill(user.text) : undefined;
  return (
    <div
      data-turn={turn.key}
      className="flex flex-col gap-[12px]"
    >
      {user && <UserBubble user={user} />}
      {assistant && (
        <div className="flex items-start justify-start gap-[12px]">
          <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[40px] border-[0.5px] border-[#D1D6DE] bg-white">
            <SubscriptionIcon
              size={40}
              isActive={true}
            />
          </div>
          <div className="w-full min-w-0 overflow-hidden rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-white p-[10px] text-gray-900">
            <AssistantBody
              assistant={assistant}
              onRefill={refill}
            />
          </div>
        </div>
      )}
    </div>
  );
};
