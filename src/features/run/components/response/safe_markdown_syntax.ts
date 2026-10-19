/**
 * SafeMarkdown v1 구문 처리 (렌더링 전 단계).
 *
 * 허용 목록과 marker 문법은 proovy-brain `contracts/safe_markdown.py`가 소유한다.
 * Brain이 이미 검증한 body만 오지만, Front는 그 검증에 기대지 않고 렌더링 단계에서 한 번 더 막는다.
 * - 허용 목록(`ALLOWED_TYPES`)의 문단·제목·목록·인용·강조·표·코드·http(s) 링크·수식만 요소로 그린다.
 * - 그 밖(raw HTML·이미지·참조 정의·참조 링크·각주·취소선·구분선 등)과 http(s)가 아닌 링크는
 *   원문 그대로 텍스트로 둔다. GFM task list 체크 상자도 `[x]` 텍스트로 둔다.
 * - `$$…$$`(`\[…\]`)는 문단 안에 있어도 display 수식으로 그린다.
 * - `[[source:<ref-id>]]` marker는 snapshot label 텍스트로 바꾼다(이동·삭제 표시는 S11).
 */

/** Brain `SOURCE_MARKER_PATTERN`과 같다. */
export const SOURCE_MARKER_PATTERN =
  /\[\[source:([A-Za-z0-9][A-Za-z0-9_.:-]{0,127})\]\]/g;

/** `\r\n`·단독 `\r`을 `\n`으로 바꾼다. */
export const normalizeLineBreaks = (text: string) =>
  text.replace(/\r\n?/g, "\n");

const isEscaped = (text: string, index: number) => {
  let backslashes = 0;
  for (let position = index - 1; text[position] === "\\"; position -= 1) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
};

const findMathClose = (text: string, start: number, delimiter: string) => {
  let index = start;
  for (;;) {
    index = text.indexOf(delimiter, index);
    if (index === -1 || !isEscaped(text, index)) return index;
    index += delimiter.length;
  }
};

/**
 * Brain `math_spans`와 같은 규칙으로 수식 구간을 찾아 remark-math가 읽는 `$`·`$$` 구분자로 맞춘다.
 * `\(…\)`는 `$…$`, `\[…\]`는 `$$…$$`가 된다. 닫히지 않은 opener 뒤는 그대로 둔다.
 */
export const normalizeMathDelimiters = (text: string) => {
  let result = "";
  let cursor = 0;
  let index = 0;
  while (index < text.length) {
    const opener = text.startsWith("$$", index)
      ? { open: "$$", close: "$$", replacement: "$$" }
      : text.startsWith("\\[", index)
        ? { open: "\\[", close: "\\]", replacement: "$$" }
        : text.startsWith("\\(", index)
          ? { open: "\\(", close: "\\)", replacement: "$" }
          : text[index] === "$" && !isEscaped(text, index)
            ? { open: "$", close: "$", replacement: "$" }
            : null;
    if (!opener) {
      index += 1;
      continue;
    }
    const close = findMathClose(text, index + opener.open.length, opener.close);
    if (close === -1) break;
    result +=
      text.slice(cursor, index) +
      opener.replacement +
      text.slice(index + opener.open.length, close) +
      opener.replacement;
    index = close + opener.close.length;
    cursor = index;
  }
  return result + text.slice(cursor);
};

/** body 안 `[start, end)` code point 범위를 자른다(anchor는 UTF-16 index가 아니다). */
export const sliceCodePoints = (text: string, start: number, end: number) =>
  Array.from(text).slice(start, end).join("");

/**
 * step anchor 구간을 따로 그릴 excerpt로 자른다.
 * 잘린 구간이 들여쓴 목록 안이어도 code block이 되지 않도록 줄머리 공백을 걷는다.
 */
export const sliceStepExcerpt = (body: string, start: number, end: number) =>
  normalizeLineBreaks(sliceCodePoints(body, start, end))
    .split("\n")
    .map((line) => line.trimStart())
    .join("\n")
    .trim();

// ---------------------------------------------------------------------------
// remark plugin
// ---------------------------------------------------------------------------

interface MdastPoint {
  offset?: number;
}

interface MdastNode {
  type: string;
  value?: string;
  url?: string;
  checked?: boolean | null;
  children?: MdastNode[];
  position?: { start: MdastPoint; end: MdastPoint };
  data?: Record<string, unknown>;
}

/** 요소로 그리는 mdast node. 여기 없는 node는 원문 텍스트로 되돌린다. */
const ALLOWED_TYPES = new Set([
  "root",
  "paragraph",
  "heading",
  "list",
  "listItem",
  "blockquote",
  "emphasis",
  "strong",
  "inlineCode",
  "code",
  "table",
  "tableRow",
  "tableCell",
  "link",
  "math",
  "inlineMath",
  "text",
  "break",
]);

/** phrasing이 아닌 자식을 받는 부모. 여기 text를 바로 두지 않고 문단으로 감싼다. */
const FLOW_PARENT_TYPES = new Set(["root", "blockquote", "listItem"]);

const SAFE_LINK_PATTERN = /^https?:\/\//i;

export const isSafeLinkUrl = (url: string | undefined | null) =>
  !!url && SAFE_LINK_PATTERN.test(url.trim());

const sourceTextOf = (node: MdastNode, source: string) => {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (start === undefined || end === undefined) return node.value ?? "";
  return source.slice(start, end);
};

const toSourceText = (
  node: MdastNode,
  parent: MdastNode,
  source: string,
): MdastNode => {
  const text: MdastNode = { type: "text", value: sourceTextOf(node, source) };
  return FLOW_PARENT_TYPES.has(parent.type)
    ? { type: "paragraph", children: [text] }
    : text;
};

const SOURCE_MARKER_CLASS_NAME =
  "mx-0.5 inline-flex rounded-[6px] bg-[#EEF2F8] px-1.5 py-0.5 align-middle text-[12px] text-[#4A5A78]";

const sourceMarkerNode = (label: string): MdastNode => ({
  type: "sourceMarker",
  children: [{ type: "text", value: label }],
  data: {
    hName: "span",
    hProperties: {
      className: SOURCE_MARKER_CLASS_NAME,
      "data-source-marker": "",
    },
  },
});

const splitSourceMarkers = (
  value: string,
  sourceLabels: ReadonlyMap<string, string>,
): MdastNode[] => {
  const nodes: MdastNode[] = [];
  let cursor = 0;
  for (const match of value.matchAll(SOURCE_MARKER_PATTERN)) {
    const start = match.index ?? 0;
    if (cursor < start)
      nodes.push({ type: "text", value: value.slice(cursor, start) });
    // catalog에 없는 marker는 Brain이 거부한다. 와도 id를 보이지 않고 지운다.
    const label = sourceLabels.get(match[1]);
    if (label) nodes.push(sourceMarkerNode(label));
    cursor = start + match[0].length;
  }
  if (cursor < value.length)
    nodes.push({ type: "text", value: value.slice(cursor) });
  return nodes;
};

/** GFM task list 항목의 체크 상자(`<input>`) 대신 `[x] `·`[ ] ` 텍스트를 둔다. */
const uncheckTaskListItem = (listItem: MdastNode) => {
  if (typeof listItem.checked !== "boolean") return;
  const marker: MdastNode = {
    type: "text",
    value: listItem.checked ? "[x] " : "[ ] ",
  };
  listItem.checked = null;
  const [first] = listItem.children ?? [];
  if (first?.type === "paragraph") first.children?.unshift(marker);
  else listItem.children?.unshift({ type: "paragraph", children: [marker] });
};

/** 문단 안 `$$…$$`도 display 수식으로 그리도록 rehype-katex용 class를 바꾼다. */
const markDisplayInlineMath = (node: MdastNode, source: string) => {
  if (!sourceTextOf(node, source).startsWith("$$")) return;
  node.data = {
    ...node.data,
    hProperties: { className: ["language-math", "math-display"] },
  };
};

const transformChildren = (
  parent: MdastNode,
  source: string,
  sourceLabels: ReadonlyMap<string, string>,
) => {
  if (!parent.children) return;
  parent.children = parent.children.flatMap((child) => {
    if (
      !ALLOWED_TYPES.has(child.type) ||
      (child.type === "link" && !isSafeLinkUrl(child.url))
    ) {
      const replaced = toSourceText(child, parent, source);
      transformChildren(replaced, source, sourceLabels);
      return replaced.type === "text"
        ? splitSourceMarkers(replaced.value ?? "", sourceLabels)
        : [replaced];
    }
    if (child.type === "text") {
      return splitSourceMarkers(child.value ?? "", sourceLabels);
    }
    if (child.type === "listItem") uncheckTaskListItem(child);
    if (child.type === "inlineMath") markDisplayInlineMath(child, source);
    transformChildren(child, source, sourceLabels);
    return [child];
  });
};

/**
 * 허용 목록 밖 node를 원문 텍스트로 되돌리고 source marker를 label로 바꾸는 remark plugin.
 * remark-math·remark-gfm 뒤에 둔다.
 * 수식(`math`·`inlineMath`) 안은 건드리지 않는다.
 */
export const remarkSafeMarkdown =
  (options: { sourceLabels: ReadonlyMap<string, string> }) =>
  (tree: MdastNode, file: { value: unknown }) => {
    transformChildren(tree, String(file.value), options.sourceLabels);
  };
