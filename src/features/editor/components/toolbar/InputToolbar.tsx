import { ToolButton } from "./ToolButton";

interface InputToolbarProps {
  isMathOpen: boolean;
  onToggleMath: () => void;
  onSend: () => void;
}

// 아이콘 컴포넌트들 (나중에 별도 파일로 분리 가능)
const IconClip = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-gray-400"
  >
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const IconSend = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-gray-400"
  >
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </svg>
);

export const InputToolbar = ({
  isMathOpen,
  onToggleMath,
  onSend,
}: InputToolbarProps) => {
  return (
    <div className="flex items-center justify-between px-3 pt-1 pb-2">
      <div className="flex items-center gap-3">
        {/* ClipButton */}
        <ToolButton
          icon={<IconClip />}
          className="px-2"
        />

        {/* MathInputButton */}
        <ToolButton
          label="수식 입력기"
          isActive={isMathOpen}
          onClick={onToggleMath}
        />

        {/* CanvasButton */}
        <ToolButton label="캔버스" />

        {/* ToolsButton */}
        <ToolButton label="도구" />
      </div>

      {/* SendButton */}
      <ToolButton
        icon={<IconSend />}
        onClick={onSend}
        className="p-2 !text-gray-400 hover:!bg-blue-400 hover:!text-white"
      />
    </div>
  );
};
