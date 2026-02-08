/**
 * contentEditable DOM에서 텍스트, LaTeX, 멘션된 에셋 ID를 추출
 *
 * - math-field → LaTeX 값 ($...$)
 * - span[data-asset-id] → 에셋 ID 수집
 * - br → 줄바꿈
 */
export const extractInputContent = (inputEl: HTMLDivElement) => {
  const parts: string[] = [];
  const latexParts: string[] = [];
  const assetIds = new Set<number>();

  const walk = (node: Node) => {
    // 텍스트 노드
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.textContent || "");
      return;
    }

    if (!(node instanceof HTMLElement)) return;

    const tag = node.tagName.toLowerCase();

    // <style>, <button> 등 무시할 요소
    if (tag === "style" || tag === "button") return;

    // math-field 요소 → LaTeX 추출
    if (tag === "math-field") {
      const latex = (node as any).value || "";
      if (latex) {
        parts.push(`$${latex}$`);
        latexParts.push(latex);
      }
      return;
    }

    // #파일 멘션 span → data-asset-id 수집
    const assetId = node.dataset?.assetId;
    if (assetId) {
      const parsed = Number(assetId);
      if (!Number.isNaN(parsed)) assetIds.add(parsed);
      parts.push(node.textContent || "");
      return;
    }

    // BR → 줄바꿈
    if (tag === "br") {
      parts.push("\n");
      return;
    }

    // 기타 요소 (math-field-wrapper 등) → 자식 순회
    for (const child of node.childNodes) {
      walk(child);
    }
  };

  for (const child of inputEl.childNodes) {
    walk(child);
  }

  return {
    text: parts.join("").trim(),
    latex: latexParts.length > 0 ? latexParts.join("; ") : undefined,
    mentionedAssetIds: Array.from(assetIds),
  };
};
