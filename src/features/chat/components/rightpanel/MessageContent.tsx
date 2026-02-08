import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MessageContentProps {
  content: string;
  className?: string;
}

/** 텍스트에서 $...$ (인라인) 및 $$...$$ (블록) LaTeX 구문을 파싱 */
const parseContent = (text: string) => {
  // $$...$$ (블록) 먼저, 그 다음 $...$ (인라인) 매칭
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  const parts: {
    type: "text" | "inline-math" | "block-math";
    value: string;
  }[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // 매치 이전 텍스트
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      // $$...$$ 블록 수식
      parts.push({ type: "block-math", value: match[1].trim() });
    } else if (match[2] !== undefined) {
      // $...$ 인라인 수식
      parts.push({ type: "inline-math", value: match[2].trim() });
    }

    lastIndex = match.index + match[0].length;
  }

  // 남은 텍스트
  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
};

/** LaTeX → HTML 렌더링 (에러 시 원본 텍스트 반환) */
const renderLatex = (latex: string, displayMode: boolean): string => {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
    });
  } catch {
    return displayMode ? `$$${latex}$$` : `$${latex}$`;
  }
};

/**
 * MessageContent - 메시지 내용 렌더링 컴포넌트
 *
 * $...$ → 인라인 수식, $$...$$ → 블록 수식으로 KaTeX 렌더링
 * 그 외 텍스트는 일반 텍스트로 표시
 */
export const MessageContent = ({
  content,
  className = "",
}: MessageContentProps) => {
  const parts = useMemo(() => parseContent(content), [content]);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.type === "text") {
          return <span key={i}>{part.value}</span>;
        }

        const isBlock = part.type === "block-math";
        const html = renderLatex(part.value, isBlock);

        if (isBlock) {
          return (
            <span
              key={i}
              className="my-2 block overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
};
