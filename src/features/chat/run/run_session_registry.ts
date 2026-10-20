import { createContext, useContext } from "react";
import type { NoteId, Uuid } from "@/shared/contracts/browser_run_v1";
import type { RunApiClient } from "@/features/run/api";
import type { RunSession, RunSessionInput } from "@/features/run/session";

/**
 * 화면 이동보다 위에서 run 세션을 넘겨 주는 registry (S08 첫 질문).
 *
 * 홈 첫 질문은 noteId 없이 보내고 `run.created`의 noteId로 Note 화면에 간다. 이동 중에도 같은 stream을
 * 이어 받도록 홈이 만든 세션을 noteId로 맡겨 두고, Note 화면이 그 세션을 이어 받는다(`peek` → `release`).
 * 맡긴 세션이 없으면 Note 화면이 새 세션을 만든다.
 */

/** 화면이 보낸 질문. user 메시지가 대화 조회에 나오기 전까지 이 입력으로 그린다. */
export type SentInputs = ReadonlyMap<Uuid, RunSessionInput>;

export interface RunSessionHandoff {
  session: RunSession;
  /** requestId → 보낸 입력 */
  inputs: SentInputs;
}

export interface RunSessionRegistry {
  /** 세션을 만든다(noteId가 없으면 첫 질문용). */
  create: (noteId?: NoteId | null) => RunSession;
  /** 대화 조회 API (Note 화면 이력) */
  api: Pick<RunApiClient, "getConversationMessages">;
  /**
   * 첫 질문 세션을 Note 화면에 맡긴다. 같은 noteId에 다른 세션이 맡겨져 있으면 그 세션은 연결을 끊는다.
   * `detached`(홈을 떠난 뒤 접수)면 아무도 이어 받지 않은 채 run이 끝나거나 연결이 멈출 때 정리한다
   * (그 Note에 들어가면 대화 조회로 복원한다).
   */
  handOff: (
    noteId: NoteId,
    handoff: RunSessionHandoff,
    options?: { detached?: boolean },
  ) => void;
  /** 맡긴 세션을 본다(지우지 않는다 — StrictMode에서 state 초기화가 두 번 불려도 같은 값). */
  peek: (noteId: NoteId) => RunSessionHandoff | undefined;
  /** 이어 받은 세션을 registry에서 뺀다. 그 사이 다른 세션이 맡겨졌으면 그대로 둔다. */
  release: (noteId: NoteId, handoff: RunSessionHandoff) => void;
}

export const RunSessionRegistryContext =
  createContext<RunSessionRegistry | null>(null);

export const useRunSessionRegistry = () => {
  const registry = useContext(RunSessionRegistryContext);
  if (!registry)
    throw new Error("RunSessionRegistryProvider 안에서 사용해야 합니다.");
  return registry;
};
