interface FeatureSectionProps {
  title: string[];
  description: string[];
  imageSrc?: string;
  isReversed?: boolean;
  imageAlt?: string;
  children?: React.ReactNode;
}

export const FeatureSection = ({
  title,
  description,
  imageSrc,
  isReversed = false,
  imageAlt = "Feature Image",
  children,
}: FeatureSectionProps) => {
  return (
    <section
      className={`flex w-full flex-col items-center justify-center px-[20px] py-[100px] md:px-[92px] ${isReversed ? "md:flex-row-reverse" : "md:flex-row"} gap-[60px] md:gap-[160px]`}
    >
      <div className="flex max-w-[440px] flex-col text-center md:text-left">
        <h2 className="font-['Pretendard'] text-[32px] leading-[1.3] font-bold text-black md:text-[36px]">
          {title.map((line, idx) => (
            <span
              key={idx}
              className="block"
            >
              {line}
            </span>
          ))}
        </h2>
        <p className="mt-[24px] font-['Pretendard'] text-[16px] leading-[1.6] text-[#383838] md:text-[18px]">
          {description.map((line, idx) => (
            <span
              key={idx}
              className="block"
            >
              {line}
            </span>
          ))}
        </p>
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-full max-w-[800px] object-contain"
          />
        ) : (
          children
        )}
      </div>
    </section>
  );
};
