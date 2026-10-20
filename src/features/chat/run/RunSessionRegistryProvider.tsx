import { useState } from "react";
import type { ReactNode } from "react";
import type { NoteId } from "@/shared/contracts/browser_run_v1";
import { runApi } from "@/features/run/api";
import type { RunApiClient } from "@/features/run/api";
import { createRunSession } from "@/features/run/session";
import type { RunSessionOptions } from "@/features/run/session";
import { RunSessionRegistryContext } from "./run_session_registry";
import type {
  RunSessionHandoff,
  RunSessionRegistry,
} from "./run_session_registry";

interface RunSessionRegistryProviderProps {
  children: ReactNode;
  /** 세션 옵션(테스트에서 api·timer 주입). noteId는 `create`가 정한다. */
  sessionOptions?: Omit<RunSessionOptions, "noteId">;
  api?: Pick<RunApiClient, "getConversationMessages">;
}

export const RunSessionRegistryProvider = ({
  children,
  sessionOptions,
  api = runApi,
}: RunSessionRegistryProviderProps) => {
  // 처음 받은 옵션으로 고정한다(세션 수명 동안 api·timer가 바뀌지 않는다).
  const [registry] = useState<RunSessionRegistry>(() => {
    const handoffs = new Map<NoteId, RunSessionHandoff>();
    return {
      create: (noteId = null) =>
        createRunSession({ ...sessionOptions, noteId }),
      api,
      handOff: (noteId, handoff) => {
        handoffs.set(noteId, handoff);
      },
      peek: (noteId) => handoffs.get(noteId),
      release: (noteId, handoff) => {
        if (handoffs.get(noteId) === handoff) handoffs.delete(noteId);
      },
    };
  });

  return (
    <RunSessionRegistryContext.Provider value={registry}>
      {children}
    </RunSessionRegistryContext.Provider>
  );
};
