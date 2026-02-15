import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface MessageContentProps {
  content: string;
  className?: string;
  enableFileMentionChip?: boolean;
}

const FILE_MENTION_REGEX =
  /#([\w\d가-힣ㄱ-ㅎㅏ-ㅣ\s()\-_.]+?\.(?:pdf|png|jpe?g|webp|gif|bmp|svg|txt|docx?|pptx?|xlsx?|csv|hwp|hwpx))/gi;

const renderMentionChipsInText = (text: string): ReactNode => {
  const parts = text.split(FILE_MENTION_REGEX);

  if (parts.length === 1) {
    return text;
  }

  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <span
          key={`mention-chip-${index}-${part}`}
          className="inline-flex rounded-[6px] bg-[#DDE7FA] px-1.5 py-0.5 align-middle text-[#3A5BA9]"
        >
          #{part}
        </span>
      );
    }

    return part;
  });
};

const applyMentionChipToChildren = (children: ReactNode): ReactNode =>
  Children.map(children, (child) => {
    if (typeof child === "string") {
      return renderMentionChipsInText(child);
    }

    if (
      isValidElement<{ children?: ReactNode }>(child) &&
      child.props.children !== undefined
    ) {
      return cloneElement(child, {
        children: applyMentionChipToChildren(child.props.children),
      });
    }

    return child;
  });

/**
 * MessageContent - 메시지 내용 렌더링 컴포넌트
 *
 * 마크다운 + GFM + 수식($...$, $$...$$)을 렌더링
 */
export const MessageContent = ({
  content,
  className = "",
  enableFileMentionChip = false,
}: MessageContentProps) => {
  const renderContent = (children: ReactNode) =>
    enableFileMentionChip ? applyMentionChipToChildren(children) : children;

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="my-2 text-[18px] font-semibold">
              {renderContent(children)}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="my-2 text-[16px] font-semibold">
              {renderContent(children)}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="my-2 text-[15px] font-semibold">
              {renderContent(children)}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-1">{renderContent(children)}</p>
          ),
          br: () => <br />,
          ul: ({ children }) => (
            <ul className="my-2 list-disc pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal pl-5">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="my-1">{renderContent(children)}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-gray-300 pl-3 text-gray-600">
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children }) => (
            <code
              className={`rounded bg-gray-100 px-1 py-0.5 text-[0.9em] ${codeClassName ?? ""}`}
            >
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded bg-gray-50 p-3 text-sm">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              {renderContent(children)}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-200 bg-gray-50 px-2 py-1 text-left">
              {renderContent(children)}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-200 px-2 py-1">
              {renderContent(children)}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
