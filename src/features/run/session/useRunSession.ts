import { useSyncExternalStore } from "react";
import type { RunSession, RunSessionSnapshot } from "./run_session";

/**
 * run 세션 snapshot 구독. snapshot은 바뀔 때만 새 객체다.
 * 세션 수명(생성·`restore()`·`dispose()`)은 호출한 쪽이 정한다 — 첫 질문처럼 Note 이동 중에도 같은 stream을
 * 이어 받아야 하면 세션을 화면 이동보다 위에서 들고 있는다.
 */
export const useRunSession = (session: RunSession): RunSessionSnapshot =>
  useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getSnapshot,
  );
