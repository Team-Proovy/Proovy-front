import {
  Children,
  cloneElement,
  isValidElement,
  useMemo,
  type ReactNode,
} from "react";
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

/**
 * 브래킷 내부 문자열이 실제 수식으로 볼 수 있는 표현인지 판별합니다.
 * 마크다운 링크 텍스트나 일반 문장을 수식으로 오인하는 것을 최소화합니다.
 */
const isMathLikeBracketExpression = (expression: string) => {
  const trimmedExpression = expression.trim();
  if (!trimmedExpression) return false;

  // 한글/일반 문장 기반 텍스트는 브래킷 수식 변환에서 제외
  if (/[^0-9A-Za-z\s\\{}()[\]^_+\-*/=<>≤≥|.,:]/.test(trimmedExpression)) {
    return false;
  }

  const hasMathOperator = /[=<>≤≥+\-*/^_]/.test(trimmedExpression);
  const hasMathCommand = /\\[a-zA-Z]+/.test(trimmedExpression);

  return hasMathOperator || hasMathCommand;
};

/**
 * HTML 엔티티를 디코딩합니다.
 * 범용 엔티티를 처리하기 위해 브라우저 파서를 사용합니다.
 */
const decodeCommonHtmlEntities = (text: string) =>
  (() => {
    if (!text.includes("&") || typeof document === "undefined") {
      return text;
    }

    const textArea = document.createElement("textarea");
    textArea.innerHTML = text;
    return textArea.value;
  })();

/** 수식 경계 공백 보정 시 인접 텍스트 문자인지 판별합니다. */
const isWordLikeChar = (char: string | undefined) =>
  !!char && /[A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ]/.test(char);

/**
 * `$...$` 구간이 실제 인라인 수식으로 볼 수 있는지 판별합니다.
 * 통화/가격 문구(`$100`) 등 오탐을 방지합니다.
 */
const isLikelyInlineMathExpression = (expression: string) => {
  const trimmedExpression = expression.trim();
  if (!trimmedExpression) return false;

  // 숫자/단어만 있는 경우는 수식으로 보지 않음 (예: $100, $discount)
  if (/^[0-9A-Za-z.,\s]+$/.test(trimmedExpression)) {
    return false;
  }

  const hasMathOperator = /[=<>≤≥+\-*/^_]/.test(trimmedExpression);
  const hasMathCommand = /\\[a-zA-Z]+/.test(trimmedExpression);
  const hasMathStructure = /[{}()[\]]/.test(trimmedExpression);

  return hasMathOperator || hasMathCommand || hasMathStructure;
};

/**
 * 인라인 수식 앞뒤 공백이 누락된 경우 가독성을 위해 공백을 보정합니다.
 * 스트리밍 토큰 조립 시 `$a<b$와$c>d$` 형태를 `$a<b$ 와 $c>d$`로 정규화합니다.
 */
const normalizeInlineMathBoundarySpacing = (text: string) => {
  const inlineMathRegex = /\$([^$\n]+)\$/g;
  let lastIndex = 0;
  let result = "";

  for (const match of text.matchAll(inlineMathRegex)) {
    const mathSegment = match[0];
    const expression = match[1] ?? "";
    const start = match.index ?? 0;
    const end = start + mathSegment.length;

    result += text.slice(lastIndex, start);

    if (!isLikelyInlineMathExpression(expression)) {
      result += mathSegment;
      lastIndex = end;
      continue;
    }

    const prevChar = start > 0 ? text[start - 1] : undefined;
    const nextChar = end < text.length ? text[end] : undefined;

    if (isWordLikeChar(prevChar)) {
      result += " ";
    }

    result += mathSegment;

    if (isWordLikeChar(nextChar)) {
      result += " ";
    }

    lastIndex = end;
  }

  result += text.slice(lastIndex);
  return result;
};

/**
 * AI 응답 문자열을 마크다운/수식 렌더링 친화적으로 정규화합니다.
 * - HTML 엔티티 디코딩
 * - `<br>` → 마크다운 줄바꿈 변환
 * - LaTeX delimiter 통일
 * - 브래킷 수식 휴리스틱 변환
 * - 인라인 수식 경계 공백 보정
 * - 순서 목록 번호 그룹별 재정렬
 */
const normalizeMessageMarkdown = (rawContent: string) => {
  const withDecodedEntities = decodeCommonHtmlEntities(rawContent);
  const withLineBreaks = withDecodedEntities.replace(/<br\s*\/?>/gi, "  \n");

  const withMathDelimiters = withLineBreaks
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, expression: string) => {
      const trimmedExpression = expression.trim();
      return trimmedExpression ? `$${trimmedExpression}$` : "";
    })
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, expression: string) => {
      const trimmedExpression = expression.trim();
      return trimmedExpression ? `$$${trimmedExpression}$$` : "";
    });

  const withCanonicalLatexDelimiters = withMathDelimiters
    .replace(/\$\$\s+([\s\S]*?)\s+\$\$/g, (_match, expression: string) => {
      const trimmedExpression = expression.trim();
      return trimmedExpression ? `$$${trimmedExpression}$$` : "";
    })
    .replace(/\$\s+([^\n$]+?)\s+\$/g, (_match, expression: string) => {
      const trimmedExpression = expression.trim();
      return trimmedExpression ? `$${trimmedExpression}$` : "";
    });

  const withBracketMathNormalized = withCanonicalLatexDelimiters.replace(
    /\[([^\]\n]+)\](?!\()/g,
    (match, expression: string) => {
      const trimmedExpression = expression.trim();
      if (!isMathLikeBracketExpression(trimmedExpression)) {
        return match;
      }
      return `$${trimmedExpression}$`;
    },
  );

  const withInlineMathSpacing = normalizeInlineMathBoundarySpacing(
    withBracketMathNormalized,
  );

  let orderedIndex = 0;
  let isInOrderedListGroup = false;

  const normalizedLines = withInlineMathSpacing.split("\n").map((line) => {
    if (/^\s*\d+\.\s+/.test(line)) {
      orderedIndex = isInOrderedListGroup ? orderedIndex + 1 : 1;
      isInOrderedListGroup = true;
      return line.replace(/^(\s*)\d+\.\s+/, `$1${orderedIndex}. `);
    }

    isInOrderedListGroup = false;
    return line;
  });

  return normalizedLines.join("\n");
};

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
  const normalizedContent = useMemo(
    () => normalizeMessageMarkdown(content),
    [content],
  );

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
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
};
