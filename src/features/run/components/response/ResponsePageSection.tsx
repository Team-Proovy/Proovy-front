import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ResponsePage } from "@/shared/contracts/browser_run_v1";
import { cn } from "@/shared/utils/cn";
import { ResultBlockView } from "./ResultBlockView";
import { THREAD_SECTION_DEFAULT_TITLE } from "./response_labels";

interface ResponsePageSectionProps {
  page: ResponsePage;
  sourceLabels: ReadonlyMap<string, string>;
}

const ResultBlockList = ({ page, sourceLabels }: ResponsePageSectionProps) => (
  <div className="flex flex-col gap-3">
    {page.resultBlocks.map((block) => (
      <ResultBlockView
        key={block.blockId}
        block={block}
        sourceLabels={sourceLabels}
      />
    ))}
  </div>
);

/** main page: 항상 펼친 상태다. */
const MainPageSection = ({ page, sourceLabels }: ResponsePageSectionProps) => {
  const titleId = useId();
  return (
    <section
      data-presentation="main"
      aria-labelledby={page.title ? titleId : undefined}
    >
      {page.title && (
        <h3
          id={titleId}
          className="mb-1.5 text-[15px] font-semibold"
        >
          {page.title}
        </h3>
      )}
      <ResultBlockList
        page={page}
        sourceLabels={sourceLabels}
      />
    </section>
  );
};

/**
 * thread_like page: 같은 메시지 안 접이식 section이다.
 * 새 Note·message·run·route가 아니며 접힘 상태는 이 컴포넌트 로컬 상태다. 처음에는 접혀 있다.
 */
const ThreadLikePageSection = ({
  page,
  sourceLabels,
}: ResponsePageSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const title = page.title || THREAD_SECTION_DEFAULT_TITLE;

  return (
    <section
      data-presentation="thread_like"
      aria-label={title}
      className="rounded-[10px] border border-[#E3E8F0]"
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        aria-label={`${title} ${expanded ? "접기" : "펼치기"}`}
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[14px] font-semibold"
      >
        <span>{title}</span>
        <span className="flex items-center gap-1 text-[12px] font-normal text-[#4A5A78]">
          {expanded ? "접기" : "펼치기"}
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </span>
      </button>
      <div
        id={contentId}
        hidden={!expanded}
        className="border-t border-[#E3E8F0] px-3 py-2"
      >
        <ResultBlockList
          page={page}
          sourceLabels={sourceLabels}
        />
      </div>
    </section>
  );
};

/** response page 하나. page는 중첩되지 않는다. */
export const ResponsePageSection = (props: ResponsePageSectionProps) =>
  props.page.presentation === "main" ? (
    <MainPageSection {...props} />
  ) : (
    <ThreadLikePageSection {...props} />
  );
