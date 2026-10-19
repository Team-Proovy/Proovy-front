import Ajv2020 from "ajv/dist/2020";
import type { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import path from "node:path";
import type {
  BrowserFrame,
  ConversationPageResponse,
  ConversationRunRequest,
  RunCancelResponse,
  RunErrorResponse,
  RunStatusResponse,
} from "@/shared/contracts/browser_run_v1";
import { CONTRACT_MIRROR_DIR } from "./contract_mirror";

/**
 * browser-run-v1 schema 기반 런타임 검사 (테스트 전용).
 * manifest `schema_registry`처럼 terminal-v2 browser schema를 등록한 Ajv(draft 2020-12)로 검사한다.
 * 응답·이벤트는 additive-tolerant(알 수 없는 필드 허용), 요청은 closed, 내부 키는 schema가 거부한다.
 */

export const BROWSER_RUN_SCHEMA_ID =
  "https://proovy.invalid/contracts/browser-run-v1/schemas/browser-run.schema.json";
export const TERMINAL_BROWSER_SCHEMA_ID =
  "https://proovy.invalid/contracts/terminal-v2/browser.schema.json";

export interface JsonSchemaDocument {
  $defs: Record<string, JsonSchemaNode>;
  [keyword: string]: unknown;
}

export interface JsonSchemaNode {
  enum?: unknown[];
  const?: unknown;
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
  [keyword: string]: unknown;
}

const readSchema = (relativePath: string) =>
  JSON.parse(
    readFileSync(path.join(CONTRACT_MIRROR_DIR, relativePath), "utf8"),
  ) as JsonSchemaDocument;

export const browserRunSchema = readSchema(
  "browser-run-v1/schemas/browser-run.schema.json",
);
export const terminalBrowserSchema = readSchema(
  "terminal-v2/browser.schema.json",
);

/** schema 이름 → 통과한 값의 TS 타입 */
export interface WireSchemaTypes {
  ConversationRunRequest: ConversationRunRequest;
  ErrorResponse: RunErrorResponse;
  RunStatusResponse: RunStatusResponse;
  RunCancelResponse: RunCancelResponse;
  ConversationPageResponse: ConversationPageResponse;
  BrowserFrame: BrowserFrame;
}
export type WireSchemaName = keyof WireSchemaTypes;

const createAjv = () => {
  // strictTypes·strictRequired는 schema 작성 스타일 검사다. 내부 키 금지(`not: {required: [...]}`)가
  // 이 형태라 사본(고칠 수 없다)에 걸리므로 끄고, 나머지 strict 검사(알 수 없는 keyword 등)는 유지한다.
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictTypes: false,
    strictRequired: false,
  });
  addFormats(ajv);
  ajv.addSchema(terminalBrowserSchema, TERMINAL_BROWSER_SCHEMA_ID);
  ajv.addSchema(browserRunSchema);
  return ajv;
};

let ajvInstance: Ajv2020 | undefined;
const validatorCache = new Map<string, ValidateFunction>();

/** browser-run schema의 `$defs` 하나에 대한 validator */
export const getDefinitionValidator = (definitionName: string) => {
  const cached = validatorCache.get(definitionName);
  if (cached) return cached;
  ajvInstance ??= createAjv();
  const validator = ajvInstance.getSchema(
    `${BROWSER_RUN_SCHEMA_ID}#/$defs/${definitionName}`,
  );
  if (!validator) throw new Error(`schema 정의 없음: ${definitionName}`);
  validatorCache.set(definitionName, validator);
  return validator;
};

export type WireValidationResult<N extends WireSchemaName> =
  | { isValid: true; value: WireSchemaTypes[N] }
  | { isValid: false; errors: string[] };

export const validateWire = <N extends WireSchemaName>(
  schemaName: N,
  value: unknown,
): WireValidationResult<N> => {
  const validator = getDefinitionValidator(schemaName);
  if (validator(value)) {
    return { isValid: true, value: value as WireSchemaTypes[N] };
  }
  const errors = (validator.errors ?? []).map(
    (error) => `${error.instancePath || "/"} ${error.message ?? error.keyword}`,
  );
  return { isValid: false, errors };
};

export const isWire = <N extends WireSchemaName>(
  schemaName: N,
  value: unknown,
): value is WireSchemaTypes[N] => validateWire(schemaName, value).isValid;

/** schema를 통과하면 타입을 붙여 돌려주고, 아니면 위반 내용으로 throw한다. */
export const parseWire = <N extends WireSchemaName>(
  schemaName: N,
  value: unknown,
  label: string = schemaName,
): WireSchemaTypes[N] => {
  const result = validateWire(schemaName, value);
  if (!result.isValid) {
    throw new Error(
      `${label}이(가) ${schemaName} schema를 통과하지 못함:\n${result.errors.join("\n")}`,
    );
  }
  return result.value;
};
