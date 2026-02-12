export const FeatureGrid = () => {
  const features = [
    {
      title: "간편한 수식 입력",
      description:
        "수식 입력기를 통해 복잡한 수식도 간편하게 입력할 수 있습니다.",
      image:
        "https://proovy-public.s3.ap-northeast-2.amazonaws.com/landing/feat_math.png", // Placeholder/Expected path
    },
    {
      title: "바로 올리는 내 풀이",
      description:
        "캔버스를 통해 작성한 풀이를 바로 채팅에 첨부할 수 있습니다.",
      image:
        "https://proovy-public.s3.ap-northeast-2.amazonaws.com/landing/feat_canvas.png",
    },
    {
      title: "더욱 내 상황에 맞는 답변",
      description:
        "저장소에 업로드되거나 생성된 파일을 참고하여 에이전트가 답변을 합니다.",
      image:
        "https://proovy-public.s3.ap-northeast-2.amazonaws.com/landing/feat_context.png",
    },
    {
      title: "똑똑한 에이전트",
      description:
        "다양한 기능을 가지고 있는 에이전트를 통해 효율적으로 학습할 수 있습니다.",
      image:
        "https://proovy-public.s3.ap-northeast-2.amazonaws.com/landing/feat_agent.png",
    },
  ];

  return (
    <section className="flex w-full justify-center bg-white px-[20px] py-[80px]">
      <div className="grid grid-cols-1 gap-[24px] md:grid-cols-2 lg:max-w-[1064px]">
        {features.map((feat, idx) => (
          <div
            key={idx}
            className="group flex h-[280px] w-full flex-col rounded-[20px] bg-[#F1F4F8] p-[30px] transition-all hover:shadow-lg md:w-[520px]"
          >
            <div className="flex-1 overflow-hidden rounded-[10px] bg-white/50">
              {/* Illustration placeholder */}
              <div className="flex h-full items-center justify-center text-gray-400">
                [Feature Illustration {idx + 1}]
              </div>
            </div>
            <div className="mt-[24px]">
              <h3 className="font-['Pretendard'] text-[22px] font-bold text-black">
                {feat.title}
              </h3>
              <p className="mt-[8px] font-['Pretendard'] text-[16px] font-medium text-[#383838]">
                {feat.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
