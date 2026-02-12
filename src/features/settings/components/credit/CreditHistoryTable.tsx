export interface CreditHistoryItem {
  id: number;
  eventType: string;
  detail: string;
  date: string;
  change: number;
}

interface CreditHistoryTableProps {
  history: CreditHistoryItem[];
}

/**
 * 크레딧 사용 내역 테이블 - 770x240
 */
export const CreditHistoryTable = ({ history }: CreditHistoryTableProps) => {
  return (
    <div className="flex h-[240px] w-full flex-col overflow-hidden rounded-[12px] border border-[0.5px] border-[#D1D6DE]">
      {/* 테이블 헤더 */}
      <div className="grid grid-cols-[120px_1fr_150px_100px] gap-[10px] rounded-t-[12px] bg-[#F1F4F8] px-[23px] py-[7px]">
        <span className="font-['Pretendard'] text-[12px] font-medium text-[#6B7280]">
          이벤트 내용
        </span>
        <span className="font-['Pretendard'] text-[12px] font-medium text-[#6B7280]">
          세부사항
        </span>
        <span className="font-['Pretendard'] text-[12px] font-medium text-[#6B7280]">
          날짜
        </span>
        <span className="text-right font-['Pretendard'] text-[12px] font-medium text-[#6B7280]">
          크레딧 변경
        </span>
      </div>

      {/* 테이블 바디 - 스크롤 가능 */}
      <div className="flex-1 overflow-y-auto px-[23px] py-[15px]">
        {history.map((item) => (
          <div
            key={item.id}
            className="mb-[10px] grid grid-cols-[120px_1fr_150px_100px] gap-[10px]"
          >
            <span className="font-['Pretendard'] text-[12px] font-semibold text-black">
              {item.eventType}
            </span>
            <span className="truncate font-['Pretendard'] text-[12px] font-normal text-black">
              {item.detail}
            </span>
            <span className="font-['Pretendard'] text-[12px] font-normal text-[#6B7280]">
              {item.date}
            </span>
            <span
              className={`text-right font-['Pretendard'] text-[12px] font-medium ${
                item.change > 0 ? "text-[#0AA63E]" : "text-[#DC3545]"
              }`}
            >
              {item.change > 0 ? `+${item.change}` : item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
