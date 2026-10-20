import { authHandlers } from "./handlers/auth"; // 로그인은 실제 API 사용
import { userHandlers } from "./handlers/user";
import { notesHandlers } from "./handlers/notes";
import { assetsHandlers } from "./handlers/assets";
import { editorHandlers } from "./handlers/editor";
import { creditHandlers } from "./handlers/credit";
import { createBrowserRunFixtureServer } from "@/features/run/session/mocks";

// browser-run-v1 fixture run Server (대화 전송·SSE·대화 조회·정지). 구형 editor mock의
// `POST /api/conversations`보다 먼저 와야 새 대화 화면이 v1 경로를 쓴다. 모드 전환은 1.95에서 명시화한다.
const browserRunFixture = createBrowserRunFixtureServer();

// 모든 API 핸들러 통합
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
