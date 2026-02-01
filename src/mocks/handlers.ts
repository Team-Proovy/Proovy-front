import { authHandlers } from "./handlers/auth";
import { userHandlers } from "./handlers/user";
import { notesHandlers } from "./handlers/notes";
import { assetsHandlers } from "./handlers/assets";

// 모든 API 핸들러 통합
export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...notesHandlers,
  ...assetsHandlers,
];
