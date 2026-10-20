import {
  BROWSER_RUN_LIMITS,
  REQUESTED_OUTPUTS,
  REQUESTED_TASKS,
} from "@/shared/contracts/browser_run_v1";
import type {
  ConversationRunRequest,
  NoteId,
  RequestedOutput,
  RequestedTask,
  Uuid,
  ViewerFocus,
} from "@/shared/contracts/browser_run_v1";

/**
 * `POST /api/conversations` 요청 생성·검증 (browser-run-v1, closed body).
 *
 * - 새 질문마다 `createConversationRequest`로 새 `requestId`를 만든다. 같은 전송을 다시 보낼 때는
 *   만든 요청 객체를 그대로 다시 보낸다(같은 requestId·같은 의미 → Server가 기존 run을 replay).
 * - `text`·`latex` 길이는 Python `str.strip()` 집합으로 strip한 뒤 code point로 센다(JS `.length` 금지).
 * - 판정 기준은 fixture `requests/valid`·`requests/invalid`다. 구조 위반은 RUN4001, `video` output만 RUN4002다.
 */

// ---------------------------------------------------------------------------
// 생성
// ---------------------------------------------------------------------------

/** 사용자가 보낸 한 질문. `noteId`가 없으면 첫 질문이다(Server가 Note를 만든다). */
export interface ConversationQuestionInput {
  noteId?: NoteId | null;
  text: string;
  latex?: string | null;
  requestedTasks?: RequestedTask[];
  requestedOutputs?: RequestedOutput[];
  turnAttachmentIds?: Uuid[];
  viewerFocus?: ViewerFocus | null;
}

/**
 * 새 질문의 요청 body를 만들고 검증한다.
 * text·latex는 strip해서 보내고(Server도 strip 후 판정한다), strip 후 빈 latex와 없는 noteId는 키를 빼서 보낸다.
 */
export const createConversationRequest = (
  input: ConversationQuestionInput,
  generateRequestId: () => Uuid = createRequestId,
): ConversationRequestCheck => {
  const latex = input.latex == null ? "" : stripPythonWhitespace(input.latex);
  const request: ConversationRunRequest = {
    requestId: generateRequestId(),
    ...(input.noteId != null && { noteId: input.noteId }),
    text: stripPythonWhitespace(input.text),
    ...(latex && { latex }),
    ...(input.requestedTasks && { requestedTasks: [...input.requestedTasks] }),
    ...(input.requestedOutputs && {
      requestedOutputs: [...input.requestedOutputs],
    }),
    ...(input.turnAttachmentIds && {
      turnAttachmentIds: [...input.turnAttachmentIds],
    }),
    ...(input.viewerFocus && {
      viewerFocus: copyViewerFocus(input.viewerFocus),
    }),
  };
  return validateConversationRequest(request);
};

/** 소문자 canonical UUID v4. `crypto.randomUUID`가 없는 비보안 context(http LAN 등)도 지원한다. */
export const createRequestId = (): Uuid => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4),
    hex.slice(4, 6),
    hex.slice(6, 8),
    hex.slice(8, 10),
    hex.slice(10, 16),
  ]
    .map((part) => part.join(""))
    .join("-");
};

const copyViewerFocus = ({
  noteAssetId,
  page,
  selection,
}: ViewerFocus): ViewerFocus => ({
  noteAssetId,
  page,
  ...(selection && { selection: { ...selection } }),
});

// ---------------------------------------------------------------------------
// strip·길이
// ---------------------------------------------------------------------------

/**
 * Python `str.strip()`이 지우는 공백 집합(internal-run-v1과 같음).
 * Java `String.strip()`·JS `String.prototype.trim()`과 다르다(U+00A0·U+0085·U+202F·U+001C~U+001F 등).
 */
const STRIP_CODE_POINTS = new Set([
  0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x1c, 0x1d, 0x1e, 0x1f, 0x20, 0x85, 0xa0,
  0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007,
  0x2008, 0x2009, 0x200a, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000,
]);

// strip 집합은 모두 BMP라 UTF-16 단위로 양끝을 보면 된다(surrogate는 strip 대상이 아니다).
export const stripPythonWhitespace = (value: string) => {
  let start = 0;
  let end = value.length;
  while (start < end && STRIP_CODE_POINTS.has(value.charCodeAt(start))) start++;
  while (end > start && STRIP_CODE_POINTS.has(value.charCodeAt(end - 1))) end--;
  return value.slice(start, end);
};

/** code point 수 (astral 문자 하나 = 1) */
export const countCodePoints = (value: string) => [...value].length;

// ---------------------------------------------------------------------------
// 검증
// ---------------------------------------------------------------------------

export type RequestValidationCode = "RUN4001" | "RUN4002";

export interface RequestValidationIssue {
  /** 예: `text`, `viewerFocus.selection` */
  path: string;
  code: RequestValidationCode;
  reason: string;
}

export type ConversationRequestCheck =
  | { ok: true; request: ConversationRunRequest }
  | {
      ok: false;
      /** Server가 돌려줄 code. 구조 위반(RUN4001)이 하나라도 있으면 RUN4001이다. */
      code: RequestValidationCode;
      issues: RequestValidationIssue[];
    };

const REQUEST_KEYS = new Set([
  "requestId",
  "noteId",
  "text",
  "latex",
  "requestedTasks",
  "requestedOutputs",
  "turnAttachmentIds",
  "viewerFocus",
]);
const VIEWER_FOCUS_KEYS = new Set(["noteAssetId", "page", "selection"]);
const SELECTION_KEYS = ["left", "top", "right", "bottom"] as const;

// schema 패턴을 그대로 옮겼다. 끝은 `$` 대신 절대 끝 `(?![\s\S])`로 고정한다(CATALOG 형식 판정).
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?![\s\S])/;
const NOTE_ID_PATTERN = /^[1-9][0-9]{0,18}(?![\s\S])/;
const NOTE_ID_MAX = 9223372036854775807n;
const OPAQUE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}(?![\s\S])/;
/**
 * schema의 page는 상한이 없지만 Server는 Java int로 받는다. 판정이 갈리는 값은 보내지 않는다(1.75 후속 메모).
 */
const VIEWER_PAGE_MAX = 2147483647;

export const isUuid = (value: unknown): value is Uuid =>
  typeof value === "string" && UUID_PATTERN.test(value);

export const isNoteId = (value: unknown): value is NoteId =>
  typeof value === "string" &&
  NOTE_ID_PATTERN.test(value) &&
  BigInt(value) <= NOTE_ID_MAX;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** body를 보내기 전에 browser-run-v1 요청 계약(schema + 계약 검사)으로 검사한다. */
export const validateConversationRequest = (
  value: unknown,
): ConversationRequestCheck => {
  const issues: RequestValidationIssue[] = [];
  const reject = (
    path: string,
    reason: string,
    code: RequestValidationCode = "RUN4001",
  ) => issues.push({ path, code, reason });

  if (!isRecord(value)) {
    reject("", "요청 body는 객체여야 한다");
    return { ok: false, code: "RUN4001", issues };
  }

  for (const key of Object.keys(value)) {
    if (!REQUEST_KEYS.has(key)) reject(key, "요청에 없는 필드(closed body)");
  }

  if (!isUuid(value.requestId))
    reject("requestId", "소문자 canonical UUID가 아니다");

  // undefined 값은 JSON에 실리지 않으므로 키가 없는 것과 같다.
  if (value.noteId !== undefined && !isNoteId(value.noteId))
    reject("noteId", "선행 0 없는 10진 문자열 1..2^63-1이 아니다");

  checkBoundedText(value.text, "text", reject);
  if (value.latex != null) checkBoundedText(value.latex, "latex", reject);

  checkEnumArray(
    value.requestedTasks,
    "requestedTasks",
    REQUESTED_TASKS,
    reject,
  );
  checkEnumArray(
    value.requestedOutputs,
    "requestedOutputs",
    REQUESTED_OUTPUTS,
    reject,
  );
  if (
    Array.isArray(value.requestedOutputs) &&
    value.requestedOutputs.includes("video")
  )
    reject("requestedOutputs", "video는 Phase 1 미지원", "RUN4002");

  if (value.turnAttachmentIds !== undefined) {
    const ids = value.turnAttachmentIds;
    if (!Array.isArray(ids)) reject("turnAttachmentIds", "배열이 아니다");
    else {
      if (ids.length > BROWSER_RUN_LIMITS.turnAttachmentIdsWireMax)
        reject("turnAttachmentIds", "wire 상한 10개 초과");
      if (!ids.every(isUuid))
        reject("turnAttachmentIds", "항목이 소문자 canonical UUID가 아니다");
      if (new Set(ids).size !== ids.length)
        reject("turnAttachmentIds", "중복 항목");
    }
  }

  if (value.viewerFocus != null) checkViewerFocus(value.viewerFocus, reject);

  if (issues.length > 0) {
    const code = issues.some((issue) => issue.code === "RUN4001")
      ? "RUN4001"
      : "RUN4002";
    return { ok: false, code, issues };
  }
  return { ok: true, request: value as unknown as ConversationRunRequest };
};

type Reject = (
  path: string,
  reason: string,
  code?: RequestValidationCode,
) => void;

const checkBoundedText = (
  value: unknown,
  path: "text" | "latex",
  reject: Reject,
) => {
  if (typeof value !== "string") {
    reject(path, "문자열이 아니다");
    return;
  }
  const length = countCodePoints(stripPythonWhitespace(value));
  const max =
    path === "text"
      ? BROWSER_RUN_LIMITS.textMaxCodePoints
      : BROWSER_RUN_LIMITS.latexMaxCodePoints;
  if (length === 0) reject(path, "strip 후 비어 있다");
  else if (length > max) reject(path, `strip 후 ${max} code point 초과`);
};

const checkEnumArray = (
  value: unknown,
  path: string,
  allowed: readonly string[],
  reject: Reject,
) => {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    reject(path, "배열이 아니다");
    return;
  }
  if (!value.every((item) => allowed.includes(item)))
    reject(path, "알 수 없는 값");
  if (new Set(value).size !== value.length) reject(path, "중복 항목");
};

const checkViewerFocus = (value: unknown, reject: Reject) => {
  if (!isRecord(value)) {
    reject("viewerFocus", "객체가 아니다");
    return;
  }
  for (const key of Object.keys(value)) {
    if (!VIEWER_FOCUS_KEYS.has(key))
      reject(`viewerFocus.${key}`, "요청에 없는 필드(closed body)");
  }
  if (
    typeof value.noteAssetId !== "string" ||
    !OPAQUE_ID_PATTERN.test(value.noteAssetId)
  )
    reject("viewerFocus.noteAssetId", "opaque ID 형식이 아니다");
  if (
    typeof value.page !== "number" ||
    !Number.isInteger(value.page) ||
    value.page < 1 ||
    value.page > VIEWER_PAGE_MAX
  )
    reject("viewerFocus.page", "1-based 정수 page가 아니다");
  if (value.selection != null) checkSelection(value.selection, reject);
};

const checkSelection = (value: unknown, reject: Reject) => {
  const path = "viewerFocus.selection";
  if (!isRecord(value)) {
    reject(path, "객체가 아니다");
    return;
  }
  for (const key of Object.keys(value)) {
    if (!(SELECTION_KEYS as readonly string[]).includes(key))
      reject(`${path}.${key}`, "요청에 없는 필드(closed body)");
  }
  const { left, top, right, bottom } = value;
  if (
    !SELECTION_KEYS.every(
      (key) => typeof value[key] === "number" && Number.isFinite(value[key]),
    )
  ) {
    reject(path, "좌표가 숫자가 아니다");
    return;
  }
  const [l, t, r, b] = [left, top, right, bottom] as number[];
  // page-selection-v1: left·top ∈ [0, 1), right·bottom ∈ (0, 1]
  if (l < 0 || l >= 1 || t < 0 || t >= 1 || r <= 0 || r > 1 || b <= 0 || b > 1)
    reject(path, "좌표가 [0, 1] 범위 밖이다");
  if (l >= r || t >= b) reject(path, "left<right·top<bottom이 아니다");
};
