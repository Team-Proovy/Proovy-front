export const FeatureGrid = () => {
  const features = [
    {
      title: "간편한 수식 입력",
      description:
        "수식 입력기를 통해 복잡한 수식도 간편하게 입력할 수 있습니다.",
      image: "/landing/feat_math.png",
    },
    {
      title: "바로 올리는 내 풀이",
      description:
        "캔버스를 통해 작성한 풀이를 바로 채팅에 첨부할 수 있습니다.",
      image: "/landing/feat_canvas.png",
    },
    {
      title: "더욱 내 상황에 맞는 답변",
      description:
        "저장소에 업로드되거나 생성된 파일을 참고하여 에이전트가 답변을 합니다.",
      image: "/landing/feat_context.png",
    },
    {
      title: "똑똑한 에이전트",
      description:
        "다양한 기능을 가지고 있는 에이전트를 통해 효율적으로 학습할 수 있습니다.",
      image: "/landing/feat_agent.png",
    },
  ];

  return (
    <section className="flex w-full justify-center bg-white px-[20px] py-[100px] md:py-[160px]">
      <div className="grid grid-cols-1 gap-[40px] md:grid-cols-2 lg:max-w-[1200px]">
        {features.map((feat, idx) => (
          <div
            key={idx}
            className="group flex w-full flex-col overflow-hidden rounded-[24px] bg-[#F4F7FF] p-[24px] transition-all hover:shadow-xl"
          >
            {/* Image Wrap - Fixed height container to keep text aligned, no background */}
            <div className="flex h-[180px] w-full items-center justify-center overflow-hidden">
              <img
                src={feat.image}
                alt={feat.title}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            {/* Text Wrap - Unified position and size */}
            <div className="mt-[20px] flex flex-col items-start text-left">
              <h3 className="font-['Pretendard'] text-[20px] font-bold tracking-tight text-black">
                {feat.title}
              </h3>
              <p className="mt-[8px] font-['Pretendard'] text-[15px] leading-relaxed font-medium text-[#4B5563]">
                {feat.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
