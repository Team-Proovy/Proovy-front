import { CreditInfoContainer } from "./CreditInfoContainer";
import {
  CreditHistoryTable,
  type CreditHistoryItem,
} from "./CreditHistoryTable";

/**
 * CreditTabContent - 크레딧 사용내역 탭
 */
export const CreditTabContent = () => {
  // TODO: API 연결 후 실제 데이터로 교체
  const creditInfo = {
    plan: "무료",
    totalCredits: 1200,
    usedCredits: 663,
    dailyCredits: 100,
    dailyResetTime: "매일 00:00에 100으로 새로고침",
  };

  const creditHistory: CreditHistoryItem[] = [
    {
      id: 1,
      eventType: "메시지",
      detail: "메시지 문제 풀어주고 해설지 만들어줘",
      date: "2026-01-01 07:38",
      change: -100,
    },
    {
      id: 2,
      eventType: "ABC 이벤트 지급",
      detail: "-",
      date: "2026-01-01 07:38",
      change: 100,
    },
    {
      id: 3,
      eventType: "1월 구독 크레딧",
      detail: "-",
      date: "2026-01-01 07:38",
      change: 100,
    },
    {
      id: 4,
      eventType: "메시지",
      detail:
        "1번 문제는 어떤 개념을 사용해서 풀어야 하는지 분석해줘...1111111111111111",
      date: "2026-01-01 07:38",
      change: -100,
    },
    {
      id: 5,
      eventType: "메시지",
      detail: "1번 문제는 어떤 개념을 사용해서 풀어야 하는지 분석해줘...",
      date: "2026-01-01 07:38",
      change: -100,
    },
    {
      id: 6,
      eventType: "메시지",
      detail: "1번 문제는 어떤 개념을 사용해서 풀어야 하는지 분석해줘...",
      date: "2026-01-01 07:38",
      change: -100,
    },
    {
      id: 7,
      eventType: "메시지",
      detail: "1번 문제는 어떤 개념을 사용해서 풀어야 하는지 분석해줘...",
      date: "2026-01-01 07:38",
      change: -100,
    },
    {
      id: 8,
      eventType: "메시지",
      detail: "1번 문제는 어떤 개념을 사용해서 풀어야 하는지 분석해줘...",
      date: "2026-01-01 07:38",
      change: -100,
    },
    {
      id: 9,
      eventType: "메시지",
      detail: "1번 문제는 어떤 개념을 사용해서 풀어야 하는지 분석해줘...",
      date: "2026-01-01 07:38",
      change: -100,
    },
  ];

  return (
    <div className="flex flex-col">
      <h3 className="font-['Pretendard'] text-[20px] font-semibold text-black">
        크레딧 사용내역
      </h3>
      {/* 구분선 */}
      <div className="mt-[12px] mb-[12px] h-[0.5px] bg-[#D1D6DE]" />

      {/* 크레딧 정보 컨테이너 - 770x240 */}
      <CreditInfoContainer
        plan={creditInfo.plan}
        totalCredits={creditInfo.totalCredits}
        usedCredits={creditInfo.usedCredits}
        dailyCredits={creditInfo.dailyCredits}
        dailyResetTime={creditInfo.dailyResetTime}
      />

      {/* 크레딧 사용 내역 테이블 - 770x240 */}
      <div className="mt-[20px]">
        <CreditHistoryTable history={creditHistory} />
      </div>
    </div>
  );
};
