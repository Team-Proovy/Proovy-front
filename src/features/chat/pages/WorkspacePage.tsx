import { AppLayout } from "../../../shared/layout/app_layout";
import {
  ViewerTabsBar,
  ViewerFileBar,
  ChatTopBlankBar,
  ChatTitleBar,
} from "../ui/WorkspaceBars";
import { MessageList } from "../ui/MessageList";
import { ChatInput } from "../ui/ChatInput";

export default function WorkspacePage() {
  return (
    <AppLayout>
      <div className="flex h-screen w-full">
        <div className="ml-[18px] flex flex-1 flex-col">
          {/* 상단 첫 번째 줄: ViewerTabsBar + ChatTopBlankBar */}
          <div className="flex">
            <ViewerTabsBar />
            <ChatTopBlankBar />
          </div>

          {/* 상단 두 번째 줄 및 메인 콘텐츠 */}
          <div className="flex flex-1">
            <section
              className="flex h-full flex-col"
              style={{ flex: "43 1 0%" }}
            >
              <ViewerFileBar fileName="discrete_math_HW2.pdf" />
              <div className="flex-1 border-r-[0.5px] border-[#C6C6C6]" />
            </section>

            <section
              className="flex h-full flex-col bg-[#F5F5F5]"
              style={{ flex: "48 1 0%" }}
            >
              <ChatTitleBar title="이산수학 과제2 3단원" />
              <div className="relative flex flex-1 flex-col">
                <MessageList messages={[]} />
                <ChatInput
                  placeholder="@을 통해 도구를 선택하거나, 요청을 입력하세요."
                  onSend={() => {}}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
