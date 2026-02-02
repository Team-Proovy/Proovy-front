// import { authHandlers } from "./handlers/auth"; // 로그인은 실제 API 사용
import { userHandlers } from "./handlers/user";
import { notesHandlers } from "./handlers/notes";
import { assetsHandlers } from "./handlers/assets";

// 모든 API 핸들러 통합
// authHandlers는 제외 - 카카오 로그인은 실제 백엔드 API 사용
export const handlers = [
  // ...authHandlers,
  ...userHandlers,
  ...notesHandlers,
  ...assetsHandlers,
];
