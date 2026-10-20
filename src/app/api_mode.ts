/**
 * 개발 서버의 API 모드.
 * - `server`(기본): vite proxy로 실제 Server(기본 http://localhost:8080)에 보낸다.
 * - `fixture`: MSW가 browser-run-v1 fixture handler와 그 밖의 개발 mock으로 응답한다.
 */
export type ApiMode = "server" | "fixture";

/** `VITE_API_MODE` 값을 읽는다. 오타가 조용히 다른 모드로 가지 않게 모르는 값은 거부한다. */
export const resolveApiMode = (value: string | undefined): ApiMode => {
  if (value === undefined || value === "" || value === "server") {
    return "server";
  }
  if (value === "fixture") {
    return "fixture";
  }
  throw new Error(
    `VITE_API_MODE는 "server" 또는 "fixture"여야 합니다 (받은 값: "${value}").`,
  );
};
