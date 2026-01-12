import { NewChatIcon } from "./SidebarIcons";

type ViewerFileBarProps = { fileName: string };
type ChatTitleBarProps = { title: string };

export function ViewerTabsBar() {
  return (
    <div
      className="h-[40px] border-[0.5px] border-[#C6C6C6] bg-white"
      style={{ flex: "43 1 0%" }}
    >
      <div className="flex h-full items-center justify-center gap-8">
        <button className="relative flex h-[40px] w-[70px] items-center justify-center text-center text-base leading-6 font-semibold tracking-[-0.002px] text-[#2A6AFF]">
          Viewer
          <div className="absolute right-0 bottom-0 left-0 h-[2px] bg-[#2A6AFF]" />
        </button>
        <button className="flex h-[40px] items-center justify-center text-center text-base leading-6 font-semibold tracking-[-0.002px] text-[#6B6B6B]">
          Storage
        </button>
      </div>
    </div>
  );
}

export function ViewerFileBar({ fileName }: ViewerFileBarProps) {
  return (
    <div className="h-[40px] w-full rounded-bl-[12px] border-r-[0.5px] border-b-[0.5px] border-l-[0.5px] border-[#C6C6C6] bg-white">
      <div className="flex h-full items-center justify-center text-sm font-semibold">
        {fileName}
      </div>
    </div>
  );
}

export function ChatTopBlankBar() {
  return (
    <div
      className="h-[40px] border-[0.5px] border-[#C6C6C6] bg-white"
      style={{ flex: "48 1 0%" }}
    />
  );
}

export function ChatTitleBar({ title }: ChatTitleBarProps) {
  return (
    <div className="relative h-[40px] w-full rounded-br-[20px] border-x-[0.5px] border-b-[0.5px] border-[#C6C6C6] bg-white">
      <div className="flex h-full items-center justify-center text-sm font-semibold">
        {title}
      </div>
      <button
        type="button"
        className="absolute top-[2px] right-[41px] flex h-[36px] items-center gap-2 px-2"
        onClick={() => console.log("새 채팅 클릭")}
      >
        <NewChatIcon className="h-[22.085px] w-[23.059px]" />
        <span
          className="text-sm leading-5 font-medium text-black"
          style={{ fontFamily: "Pretendard" }}
        >
          새 채팅
        </span>
      </button>
    </div>
  );
}
