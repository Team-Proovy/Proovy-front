import { authHandlers } from "./handlers/auth"; // 로그인은 실제 API 사용
import { userHandlers } from "./handlers/user";
import { notesHandlers } from "./handlers/notes";
import { assetsHandlers } from "./handlers/assets";
import { editorHandlers } from "./handlers/editor";
import { creditHandlers } from "./handlers/credit";
import { createBrowserRunFixtureServer } from "@/features/run/session/mocks";

// browser-run-v1 fixture run Server (대화 전송·SSE·대화 조회·정지). 1.93 handler를 그대로 쓴다.
const browserRunFixture = createBrowserRunFixtureServer();

// fixture 모드(VITE_API_MODE=fixture)의 API 핸들러. 대화 밖 화면(사용자·노트·스토리지·크레딧·도구·검색)은 개발 mock을 쓴다.
// authHandlers는 제외 - 카카오 로그인은 실제 백엔드 API 사용
// ⚠️ 순서 중요: 구체적 경로(editorHandlers: /api/notes/tools)가
//   와일드카드 경로(notesHandlers: /api/notes/:noteId)보다 앞에 와야 함
export const handlers = [
  ...browserRunFixture.handlers,
  ...authHandlers,
  ...userHandlers,
  ...editorHandlers,
  ...assetsHandlers,
  ...notesHandlers,
  ...creditHandlers,
];
