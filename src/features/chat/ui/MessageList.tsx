type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  messages: ChatMessage[];
};

export function MessageList({ messages }: Props) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 pb-[160px]">
      <div className="flex flex-col gap-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[560px]">
              <div
                className={[
                  "rounded-[14px] border-[0.5px] border-[#C6C6C6] bg-white px-4 py-3 text-sm leading-6",
                  m.role === "user" ? "rounded-tr-[6px]" : "rounded-tl-[6px]",
                ].join(" ")}
              >
                {m.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
