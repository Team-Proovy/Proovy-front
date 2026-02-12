import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Proovy는 어떤 서비스인가요?",
    answer:
      "Proovy는 이공계 대학생들을 위한 퍼스널 AI 튜터로, 수식 입력, 문서 분석, 풀이 과정 생성 등 학습 효율을 극대화해주는 도구입니다.",
  },
  {
    question: "Proovy의 답변이 정확한 이유는 무엇인가요?",
    answer:
      "최신 논문 및 전공 서적 데이터를 기반으로 학습된 모델과, 사용자가 직접 업로드한 파일을 참고하는 RAG(Retrieval-Augmented Generation) 기술을 사용하기 때문입니다.",
  },
  {
    question: "Proovy 이용은 무료인가요?",
    answer:
      "네, 기본적으로 무료 플랜을 통해 매일 일정량의 크레딧을 제공합니다. 더 많은 기능과 저장 공간이 필요한 경우 유료 플랜으로 업그레이드할 수 있습니다.",
  },
  {
    question: "Proovy 이용에 대한 궁금증이 있으면 어떻게 하나요?",
    answer:
      "서비스 내 고객센터 혹은 도움말 섹션을 통해 문의를 남겨주시면 빠르게 답변해 드립니다.",
  },
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="flex w-full scroll-mt-[80px] flex-col items-center bg-white px-[20px] py-[100px]"
    >
      <h2 className="mb-[60px] font-['Pretendard'] text-[32px] font-bold text-black md:text-[36px]">
        자주 묻는 질문
      </h2>

      <div className="flex w-full max-w-[800px] flex-col gap-[16px]">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="overflow-hidden rounded-[12px] bg-white shadow-[0px_4px_10px_0px_rgba(0,0,0,0.05)] transition-all"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="flex w-full items-center justify-between px-[40px] py-[22px] text-left"
            >
              <div className="flex items-center gap-[28px] font-['Pretendard'] text-[18px] font-bold md:text-[20px]">
                <span className="text-[#2A6AFF]">Q.</span>
                <span className="text-black">{faq.question}</span>
              </div>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transform transition-transform ${openIndex === idx ? "rotate-180" : ""}`}
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="#6B7280"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {openIndex === idx && (
              <div className="px-[40px] pb-[22px] font-['Pretendard'] text-[16px] leading-[1.6] text-gray-600">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
