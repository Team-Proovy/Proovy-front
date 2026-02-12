import { authHandlers } from "./handlers/auth"; // 로그인은 실제 API 사용
import { userHandlers } from "./handlers/user";
import { notesHandlers } from "./handlers/notes";
import { assetsHandlers } from "./handlers/assets";
import { editorHandlers } from "./handlers/editor";
import { creditHandlers } from "./handlers/credit";

// 모든 API 핸들러 통합
// authHandlers는 제외 - 카카오 로그인은 실제 백엔드 API 사용
// ⚠️ 순서 중요: 구체적 경로(editorHandlers: /api/notes/tools)가
//   와일드카드 경로(notesHandlers: /api/notes/:noteId)보다 앞에 와야 함
export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...editorHandlers,
  ...assetsHandlers,
  ...notesHandlers,
  ...creditHandlers,
];
