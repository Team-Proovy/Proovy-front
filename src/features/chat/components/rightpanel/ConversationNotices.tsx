import { Link } from "react-router-dom";
import { CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type {
  ConversationNotice,
  ConversationNoticeTone,
} from "../../run/conversation_notice";
import { useRetryCountdown } from "../../run/useRetryCountdown";

const TONE_STYLES: Record<ConversationNoticeTone, string> = {
  info: "border-[#C9D8FF] bg-[#F3F7FF] text-[#1E3A8A]",
  warning: "border-[#F5D48A] bg-[#FFF9EB] text-[#7A4B00]",
  error: "border-[#F3B4B4] bg-[#FFF4F4] text-[#8A1C1C]",
};

const TONE_ICONS = {
  info: Info,
  warning: TriangleAlert,
  error: CircleAlert,
} as const;

const ACTION_BUTTON_CLASS =
  "mt-[6px] inline-flex rounded-[8px] border-[0.5px] border-current px-[10px] py-[4px] text-[13px] font-semibold";

interface NoticeItemProps {
  notice: ConversationNotice;
  onReconnect?: () => void;
  onRetryHistory?: () => void;
  onDismiss?: () => void;
}

const NoticeItem = ({
  notice,
  onReconnect,
  onRetryHistory,
  onDismiss,
}: NoticeItemProps) => {
  const seconds = useRetryCountdown(notice.retryAt);
  const Icon = TONE_ICONS[notice.tone];

  return (
    <div
      role={notice.tone === "error" ? "alert" : "status"}
      data-notice={notice.key}
      className={cn(
        "flex w-full items-start gap-[8px] rounded-[12px] border-[0.5px] px-[12px] py-[8px] text-[14px] leading-[20px]",
        TONE_STYLES[notice.tone],
      )}
    >
      <Icon
        aria-hidden="true"
        size={16}
        className="mt-[2px] shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{notice.title}</p>
        {notice.retryAt != null && (
          <p>
            {seconds > 0
              ? `${seconds}초 뒤에 다시 보낼 수 있어요.`
              : "이제 다시 보낼 수 있어요."}
          </p>
        )}
        {notice.description && <p>{notice.description}</p>}
        {notice.action === "reconnect" && onReconnect && (
          <button
            type="button"
            onClick={onReconnect}
            className={ACTION_BUTTON_CLASS}
          >
            다시 연결
          </button>
        )}
        {notice.action === "retry_history" && onRetryHistory && (
          <button
            type="button"
            onClick={onRetryHistory}
            className={ACTION_BUTTON_CLASS}
          >
            다시 불러오기
          </button>
        )}
        {notice.action === "pricing" && (
          <Link
            to="/pricing"
            className={ACTION_BUTTON_CLASS}
          >
            요금제 보기
          </Link>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="안내 닫기"
          onClick={onDismiss}
          className="shrink-0 rounded p-[2px] opacity-70 hover:opacity-100"
        >
          <X
            aria-hidden="true"
            size={14}
          />
        </button>
      )}
    </div>
  );
};

interface ConversationNoticesProps {
  notices: readonly ConversationNotice[];
  onReconnect?: () => void;
  onRetryHistory?: () => void;
  /** `dismissible` 안내에만 닫기 버튼을 보인다. */
  onDismiss?: () => void;
  className?: string;
}

/**
 * 대화 화면 안내 목록 — 접수 거부(요청 한도·잔액 부족·미지원 요청)·연결·이력 조회 상태.
 * 오류는 `alert`, 그 밖은 `status`로 읽힌다. 아이콘과 제목 문구가 있어 색에만 의존하지 않는다.
 */
export const ConversationNotices = ({
  notices,
  onReconnect,
  onRetryHistory,
  onDismiss,
  className,
}: ConversationNoticesProps) => {
  if (notices.length === 0) return null;
  return (
    <div className={cn("flex w-full flex-col gap-[6px]", className)}>
      {notices.map((notice) => (
        <NoticeItem
          key={notice.key}
          notice={notice}
          onReconnect={onReconnect}
          onRetryHistory={onRetryHistory}
          onDismiss={notice.dismissible ? onDismiss : undefined}
        />
      ))}
    </div>
  );
};
