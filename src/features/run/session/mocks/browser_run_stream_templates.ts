import type {
  BrowserFrame,
  TerminalRunStatus,
  Uuid,
} from "@/shared/contracts/browser_run_v1";

/**
 * browser-run-v1 `streams/valid` fixture (1.88 pin 사본)를 mock run의 frame 원본으로 쓴다.
 * `node:fs`가 아니라 `import.meta.glob`으로 읽어 vitest와 브라우저 fixture 모드(Vite) 양쪽에서 같은 값을 쓴다.
 * schema 검사는 테스트(`browser_run_mock_server.test.ts`)가 한다.
 */

export interface StreamTemplate {
  name: string;
  runId: Uuid;
  finalStatus: TerminalRunStatus;
  frames: BrowserFrame[];
}

interface RawStreamFixture {
  runId: Uuid;
  finalStatus: TerminalRunStatus;
  frames: BrowserFrame[];
}

const modules = import.meta.glob<RawStreamFixture>(
  "/src/test/contracts/brain/browser-run-v1/streams/valid/*.json",
  { eager: true, import: "default" },
);

const templates = new Map<string, StreamTemplate>(
  Object.entries(modules).map(([path, raw]) => {
    const name = path.slice(path.lastIndexOf("/") + 1, -".json".length);
    return [
      name,
      {
        name,
        runId: raw.runId,
        finalStatus: raw.finalStatus,
        frames: raw.frames,
      },
    ];
  }),
);

/** 사용할 수 있는 template 이름(`streams/valid` 파일명) */
export const STREAM_TEMPLATE_NAMES = [...templates.keys()].sort();

export type StreamTemplateName =
  | "substantive-completed"
  | "substantive-with-source"
  | "clarification-completed"
  | "unsupported-only-completed"
  | "failed-verification"
  | "failed-invalid-attachment"
  | "canceled-running"
  | "canceled-pending"
  | "canceled-asset-deleting"
  | "replay-source-unavailable";

/** template의 깊은 복사본 */
export const getStreamTemplate = (name: StreamTemplateName): StreamTemplate => {
  const template = templates.get(name);
  if (!template) throw new Error(`stream fixture 없음: ${name}`);
  return structuredClone(template);
};
