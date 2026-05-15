export interface SSEv2Envelope {
  v: string;
  ts: string;
  seq: number;
  run_id: string;
  thread_id: string;
}

export interface SSEv2SessionMetadata extends SSEv2Envelope {
  event: "session.metadata";
  agent_id?: string;
}

export interface SSEv2RunStarted extends SSEv2Envelope {
  event: "run.started";
  stream_tokens?: boolean;
}

export interface SSEv2NodeStarted extends SSEv2Envelope {
  event: "node.started";
  node: string;
  node_path?: string;
}

export interface SSEv2NodeProgress extends SSEv2Envelope {
  event: "node.progress";
  node: string;
  message: string;
}

export interface SSEv2NodeCompleted extends SSEv2Envelope {
  event: "node.completed";
  node: string;
  status: string;
  duration_ms: number;
}

export interface SSEv2LLMMessageStarted extends SSEv2Envelope {
  event: "llm.message.started";
  message_id: string;
  node: string;
  role: string;
}

export interface SSEv2LLMTokenDelta extends SSEv2Envelope {
  event: "llm.token.delta";
  message_id: string;
  node: string;
  delta: string;
  index: number;
}

export interface SSEv2LLMMessageCompleted extends SSEv2Envelope {
  event: "llm.message.completed";
  message_id: string;
  finish_reason: string;
}

export interface SSEv2ChatMessage extends SSEv2Envelope {
  event: "chat.message";
  message_id: string;
  role: string;
  kind:
    | "status"
    | "assistant_partial"
    | "assistant_final"
    | "tool_result"
    | "review"
    | "suggestion"
    | "system_notice";
  content: unknown;
  node?: string;
}

export interface SSEv2ArtifactReady extends SSEv2Envelope {
  event: "artifact.ready";
  artifact_id: string;
  name: string;
  mime: string;
  path: string;
  size: number;
}

export interface SSEv2CreditUpdated extends SSEv2Envelope {
  event: "credit.updated";
  balance: number;
  total_cost: number;
  remaining: number;
}

export interface SSEv2Heartbeat extends SSEv2Envelope {
  event: "heartbeat";
  alive: boolean;
}

export interface SSEv2RunCompleted extends SSEv2Envelope {
  event: "run.completed";
  duration_ms: number;
  final_message_id?: string;
}

export interface SSEv2RunFailed extends SSEv2Envelope {
  event: "run.failed";
  code: string;
  message: string;
  retryable: boolean;
}

export type SSEEvent =
  | SSEv2SessionMetadata
  | SSEv2RunStarted
  | SSEv2NodeStarted
  | SSEv2NodeProgress
  | SSEv2NodeCompleted
  | SSEv2LLMMessageStarted
  | SSEv2LLMTokenDelta
  | SSEv2LLMMessageCompleted
  | SSEv2ChatMessage
  | SSEv2ArtifactReady
  | SSEv2CreditUpdated
  | SSEv2Heartbeat
  | SSEv2RunCompleted
  | SSEv2RunFailed;
