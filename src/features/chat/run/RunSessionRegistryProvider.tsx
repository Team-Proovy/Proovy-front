import { useState } from "react";
import type { ReactNode } from "react";
import type { NoteId } from "@/shared/contracts/browser_run_v1";
import { runApi } from "@/features/run/api";
import type { RunApiClient } from "@/features/run/api";
import { selectIsTerminal } from "@/features/run/model";
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
    /** detached handoff의 정리 구독 */
    const watchers = new Map<RunSessionHandoff, () => void>();

    const remove = (noteId: NoteId, handoff: RunSessionHandoff) => {
      if (handoffs.get(noteId) !== handoff) return false;
      handoffs.delete(noteId);
      watchers.get(handoff)?.();
      watchers.delete(handoff);
      return true;
    };

    return {
      create: (noteId = null) =>
        createRunSession({ ...sessionOptions, noteId }),
      api,
      handOff: (noteId, handoff, { detached = false } = {}) => {
        const previous = handoffs.get(noteId);
        if (previous && previous !== handoff) {
          remove(noteId, previous);
          if (previous.session !== handoff.session) previous.session.dispose();
        }
        handoffs.set(noteId, handoff);
        if (!detached || watchers.has(handoff)) return;
        const settle = () => {
          const { run, connection } = handoff.session.getSnapshot();
          const done =
            connection === "stopped" ||
            (connection === "idle" && selectIsTerminal(run));
          if (done && remove(noteId, handoff)) handoff.session.dispose();
        };
        watchers.set(handoff, handoff.session.subscribe(settle));
        settle();
      },
      peek: (noteId) => handoffs.get(noteId),
      release: (noteId, handoff) => {
        remove(noteId, handoff);
      },
    };
  });

  return (
    <RunSessionRegistryContext.Provider value={registry}>
      {children}
    </RunSessionRegistryContext.Provider>
  );
};
