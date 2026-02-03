// TODO: 실제 메시지 타입 정의 필요
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatMessagesProps {
  messages: Message[];
}

export const ChatMessages = ({ messages }: ChatMessagesProps) => {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        대화를 시작해보세요
      </div>
    );
  }

  return (
    <div className="flex flex-1 justify-center overflow-x-hidden overflow-y-auto">
      {/* 가운데 정렬 컨테이너 - ChatInput과 동일한 max-width */}
      <div className="w-full max-w-[660px] min-w-[270px] space-y-4 px-[20px] py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
