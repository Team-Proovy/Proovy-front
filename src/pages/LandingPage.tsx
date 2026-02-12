import { LandingHeader } from "../features/landing/components/LandingHeader";
import { HeroSection } from "../features/landing/components/HeroSection";
import { FeatureSection } from "../features/landing/components/FeatureSection";
import { FeatureGrid } from "../features/landing/components/FeatureGrid";
import { CTASection } from "../features/landing/components/CTASection";
import { FAQSection } from "../features/landing/components/FAQSection";
import { LandingFooter } from "../features/landing/components/LandingFooter";

export const LandingPage = () => {
  return (
    <div className="flex w-full flex-col bg-white">
      <LandingHeader />

      <main className="w-full">
        <HeroSection />

        <div
          id="intro"
          className="scroll-mt-[80px]"
        >
          <FeatureSection
            title={["뷰어를 함께 보면서", "AI튜터에게 질문하기"]}
            description={[
              "뷰어로 볼 파일을 업로드하면 AI튜터와 함께 보면서",
              "대화할 수 있어요.",
            ]}
            imageSrc="https://proovy-public.s3.ap-northeast-2.amazonaws.com/landing/illust_viewer.png"
            imageAlt="Viewer and AI Tutor"
          />
        </div>

        <FeatureSection
          title={["궁금한 문제는", "선택해서 바로 물어보기"]}
          description={[
            "어떤 형태의 파일이든 프루비는 정확히 인식해",
            "문제를 같이 풀 수 있어요.",
          ]}
          imageSrc="https://proovy-public.s3.ap-northeast-2.amazonaws.com/landing/illust_laptop.png"
          isReversed
          imageAlt="Problem Selection"
        />

        <FeatureGrid />

        <div
          id="pricing"
          className="scroll-mt-[80px]"
        >
          <CTASection />
        </div>

        <FAQSection />
      </main>

      <LandingFooter />
    </div>
  );
};
