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
        <div className="mb-[100px] md:mb-[160px]">
          <HeroSection />
        </div>

        <div className="flex flex-col gap-[100px] md:gap-[180px]">
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
              imageSrc="/landing/illust_viewer_detail.png"
              imageAlt="Viewer and AI Tutor"
            />
          </div>

          <FeatureSection
            title={["PC, 태블릿", "어디서든 자유롭게"]}
            description={[
              "기기에 구애받지 않고 언제 어디서나 프루비를",
              "사용할 수 있어요.",
            ]}
            imageSrc="/landing/illust_viewer_laptop.png"
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
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};
