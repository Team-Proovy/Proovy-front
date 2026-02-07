/**
 * contenteditable div에서 메시지 텍스트 추출
 * - 텍스트 노드: 그대로 포함
 * - math-field: LaTeX 값을 $...$ 형태로 포함
 */
export const extractMessageContent = (
  container: HTMLDivElement | null,
): string => {
  if (!container) return "";

  const parts: string[] = [];

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) parts.push(text);
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;

      // math-field: LaTeX 값 추출
      if (el.tagName?.toLowerCase() === "math-field") {
        const mf = el as unknown as { value?: string };
        const latex = mf?.value;
        if (latex) {
          parts.push(`$${latex}$`);
        }
        return;
      }

      // math-field-wrapper 내부의 math-field는 재귀 시 처리됨
      for (const child of Array.from(node.childNodes)) {
        walk(child);
      }
    }
  };

  for (const child of Array.from(container.childNodes)) {
    walk(child);
  }

  return parts.join(" ").trim();
};
