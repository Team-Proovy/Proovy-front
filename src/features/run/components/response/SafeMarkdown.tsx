import { useMemo } from "react";
import ReactMarkdown, { type Components, type Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/shared/utils/cn";
import {
  isSafeLinkUrl,
  normalizeLineBreaks,
  normalizeMathDelimiters,
  remarkSafeMarkdown,
} from "./safe_markdown_syntax";

const EMPTY_SOURCE_LABELS: ReadonlyMap<string, string> = new Map();

/** KaTeX는 `trust: false`로 `\href`·`\includegraphics` 등 외부 자원 명령을 그리지 않는다. */
const KATEX_OPTIONS = { throwOnError: false, strict: "ignore", trust: false };

/** plugin을 거친 뒤에도 http(s)가 아닌 URL은 버린다(이중 방어). */
const safeUrlTransform = (url: string) => (isSafeLinkUrl(url) ? url : "");

const COMPONENTS: Components = {
  h1: ({ children }) => (
    <h4 className="my-2 text-[16px] font-semibold">{children}</h4>
  ),
  h2: ({ children }) => (
    <h4 className="my-2 text-[15px] font-semibold">{children}</h4>
  ),
  h3: ({ children }) => (
    <h5 className="my-2 text-[15px] font-semibold">{children}</h5>
  ),
  p: ({ children }) => <p className="my-1">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal pl-5">{children}</ol>,
  li: ({ children }) => <li className="my-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-gray-300 pl-3 text-gray-600">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-gray-100 px-1 py-0.5 text-[0.9em]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded bg-gray-50 p-3 text-sm">
      {children}
    </pre>
  ),
  a: ({ href, children }) =>
    href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="text-blue-600 underline"
      >
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-gray-200 bg-gray-50 px-2 py-1 text-left">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-200 px-2 py-1">{children}</td>
  ),
};

interface SafeMarkdownProps {
  /** ResultBlock `body` (SafeMarkdown v1) */
  body: string;
  /** `sourceRefId` → `displayLabelSnapshot`. 없는 marker는 지운다. */
  sourceLabels?: ReadonlyMap<string, string>;
  className?: string;
}

/**
 * SafeMarkdown - canonical 응답 block body 렌더러
 *
 * raw HTML·이미지·임의 embed·http(s)가 아닌 링크를 요소로 만들지 않고 원문 텍스트로 보인다.
 * KaTeX 수식(`$…$`, `$$…$$`, `\(…\)`, `\[…\]`)은 그린다.
 */
export const SafeMarkdown = ({
  body,
  sourceLabels = EMPTY_SOURCE_LABELS,
  className,
}: SafeMarkdownProps) => {
  const markdown = useMemo(
    () => normalizeMathDelimiters(normalizeLineBreaks(body)),
    [body],
  );
  const remarkPlugins = useMemo<Options["remarkPlugins"]>(
    () => [remarkMath, remarkGfm, [remarkSafeMarkdown, { sourceLabels }]],
    [sourceLabels],
  );

  return (
    <div className={cn("break-words", className)}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={[[rehypeKatex, KATEX_OPTIONS]]}
        components={COMPONENTS}
        urlTransform={safeUrlTransform}
        skipHtml
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};
