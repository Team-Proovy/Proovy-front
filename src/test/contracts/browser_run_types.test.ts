import { describe, expect, it } from "vitest";
import * as wire from "@/shared/contracts/browser_run_v1";
import { browserRunSchema, terminalBrowserSchema } from "./browser_run_schema";
import type { JsonSchemaDocument, JsonSchemaNode } from "./browser_run_schema";
import { readContractJson, readContractText } from "./browser_run_fixtures";

/**
 * 공용 wire 타입(`browser_run_v1.ts`)이 pin한 schema와 어긋나지 않는지 검사한다.
 *
 * - enum 상수 배열 = schema enum
 * - 객체 타입마다 `shapeOf<T>()(keys, required)`로 필드 목록을 적는다. 목록이 TS 타입의 key·필수 key와
 *   다르면 `tsc -b`(pnpm build)가 실패하고, 목록이 schema `properties`·`required`와 다르면 이 테스트가 실패한다.
 */

type RequiredKeys<T> = {
  [K in keyof T]-?: Partial<Pick<T, K>> extends Pick<T, K> ? never : K;
}[keyof T];
type IsSameUnion<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : false
  : false;

const shapeOf =
  <T>() =>
  <
    const K extends readonly (keyof T)[],
    const R extends readonly RequiredKeys<T>[],
  >(
    keys: K &
      (IsSameUnion<K[number], keyof T> extends true
        ? unknown
        : ["타입의 모든 key를 나열해야 한다", Exclude<keyof T, K[number]>]),
    required: R &
      (IsSameUnion<R[number], RequiredKeys<T>> extends true
        ? unknown
        : [
            "타입의 필수 key를 모두 나열해야 한다",
            Exclude<RequiredKeys<T>, R[number]>,
          ]),
  ) => ({ keys: [...keys].map(String), required: [...required].map(String) });

const sortStrings = (values: readonly unknown[]) =>
  [...values].map(String).sort();

const definitionOf = (
  schema: JsonSchemaDocument,
  name: string,
): JsonSchemaNode => {
  const definition = schema.$defs[name];
  if (!definition) throw new Error(`schema 정의 없음: ${name}`);
  return definition;
};

const browserDef = (name: string) => definitionOf(browserRunSchema, name);
const terminalDef = (name: string) => definitionOf(terminalBrowserSchema, name);

const refName = (node: unknown) =>
  String((node as { $ref: string }).$ref)
    .split("/")
    .pop()!;

/** `allOf`의 `if {field: const} then {other: const}` 쌍을 모은다. */
const collectConstPairs = (
  definition: JsonSchemaNode,
  ifField: string,
  thenField: string,
) => {
  const pairs: Record<string, unknown> = {};
  for (const rule of (definition.allOf ?? []) as JsonSchemaNode[]) {
    const ifValue = (rule.if as JsonSchemaNode | undefined)?.properties?.[
      ifField
    ]?.const;
    const thenValue = (rule.then as JsonSchemaNode | undefined)?.properties?.[
      thenField
    ]?.const;
    if (typeof ifValue === "string" && thenValue !== undefined)
      pairs[ifValue] = thenValue;
  }
  return pairs;
};

describe("상수·버전", () => {
  const manifest = readContractJson<{
    consumer_version: string;
    contract_version: string;
    frame_contract_version: string;
    limits: Record<string, number>;
  }>("manifest.json");

  it("버전 상수가 manifest와 같다", () => {
    expect(wire.BROWSER_RUN_CONSUMER_VERSION).toBe(manifest.consumer_version);
    expect(wire.BROWSER_RUN_CONTRACT_VERSION).toBe(manifest.contract_version);
    expect(wire.FRAME_CONTRACT_VERSION).toBe(manifest.frame_contract_version);
    expect(
      browserDef("RunCreatedFrame").properties!.contractVersion.const,
    ).toBe(wire.FRAME_CONTRACT_VERSION);
  });

  it("limits가 manifest와 같다", () => {
    expect(wire.BROWSER_RUN_LIMITS).toEqual({
      textMaxCodePoints: manifest.limits.text_max_code_points,
      latexMaxCodePoints: manifest.limits.latex_max_code_points,
      turnAttachmentIdsWireMax: manifest.limits.turn_attachment_ids_wire_max,
      heartbeatSeconds: manifest.limits.heartbeat_seconds,
      maxSeq: manifest.limits.max_seq,
    });
  });

  it("heartbeat comment 원문이 같다", () => {
    expect(wire.HEARTBEAT_COMMENT).toBe(readContractText("heartbeat.txt"));
  });

  it("성공 envelope 고정 값이 같다", () => {
    const envelope = browserDef("RunStatusResponse").properties!;
    expect(envelope.code.const).toBe(wire.SUCCESS_CODE);
    expect(envelope.message.const).toBe(wire.SUCCESS_MESSAGE);
  });

  it("code별 오류 message와 cause별 취소 message가 같다", () => {
    expect(
      collectConstPairs(browserDef("ErrorResponse"), "code", "message"),
    ).toEqual(wire.RUN_ERROR_MESSAGES);
    expect(
      collectConstPairs(browserDef("RunCanceledPayload"), "cause", "message"),
    ).toEqual(wire.CANCEL_MESSAGES);
    expect(
      collectConstPairs(browserDef("AssistantCancel"), "cause", "message"),
    ).toEqual(wire.CANCEL_MESSAGES);
  });
});

describe("enum", () => {
  it("공개 run status는 PENDING|RUNNING|CANCELING|COMPLETED|FAILED|CANCELED뿐이다", () => {
    expect(wire.PUBLIC_RUN_STATUSES).toEqual([
      "PENDING",
      "RUNNING",
      "CANCELING",
      "COMPLETED",
      "FAILED",
      "CANCELED",
    ]);
    expect(sortStrings(wire.TERMINAL_RUN_STATUSES)).toEqual(
      sortStrings(
        wire.PUBLIC_RUN_STATUSES.filter(
          (status) =>
            !(wire.ACTIVE_RUN_STATUSES as readonly string[]).includes(status),
        ),
      ),
    );
  });

  const enumCases: [string, readonly string[], unknown[] | undefined][] = [
    [
      "PublicRunStatus",
      wire.PUBLIC_RUN_STATUSES,
      browserDef("PublicRunStatus").enum,
    ],
    [
      "ActiveRunStatus",
      wire.ACTIVE_RUN_STATUSES,
      browserDef("ActiveRunStatus").enum,
    ],
    ["RequestedTask", wire.REQUESTED_TASKS, browserDef("RequestedTask").enum],
    [
      "RequestedOutput",
      wire.REQUESTED_OUTPUTS,
      browserDef("RequestedOutput").enum,
    ],
    ["CancelCause", wire.CANCEL_CAUSES, browserDef("CancelCause").enum],
    [
      "AttachmentMime",
      wire.ATTACHMENT_MIMES,
      browserDef("AttachmentMime").enum,
    ],
    [
      "RunCancelResult.outcome",
      wire.RUN_CANCEL_OUTCOMES,
      browserDef("RunCancelResult").properties!.outcome.enum,
    ],
    [
      "ConversationMessage.role",
      wire.CONVERSATION_MESSAGE_ROLES,
      browserDef("ConversationMessage").properties!.role.enum,
    ],
    [
      "ConversationMessage.status",
      wire.CONVERSATION_MESSAGE_STATUSES,
      browserDef("ConversationMessage").properties!.status.enum,
    ],
    [
      "ErrorResponse.code",
      wire.RUN_ERROR_CODES,
      browserDef("ErrorResponse").properties!.code.enum,
    ],
    [
      "ResponseDisposition",
      wire.RESPONSE_DISPOSITIONS,
      terminalDef("ResponseDisposition").enum,
    ],
    [
      "ClarificationReason",
      wire.CLARIFICATION_REASONS,
      terminalDef("ClarificationReason").enum,
    ],
    ["FailureCode", wire.FAILURE_CODES, terminalDef("FailureCode").enum],
    [
      "AttachmentFailureReason",
      wire.ATTACHMENT_FAILURE_REASONS,
      terminalDef("AttachmentFailureReason").enum,
    ],
    ["ModelTier", wire.MODEL_TIERS, terminalDef("ModelTier").enum],
    [
      "PagePresentation",
      wire.PAGE_PRESENTATIONS,
      terminalDef("PagePresentation").enum,
    ],
    [
      "VerificationBadge",
      wire.VERIFICATION_BADGES,
      terminalDef("VerificationBadge").enum,
    ],
    [
      "StepMarkStatus",
      wire.STEP_MARK_STATUSES,
      terminalDef("StepMarkStatus").enum,
    ],
    [
      "SummaryCoverage",
      wire.SUMMARY_COVERAGES,
      terminalDef("SummaryCoverage").enum,
    ],
    ["QuoteOrigin", wire.QUOTE_ORIGINS, terminalDef("QuoteOrigin").enum],
    [
      "ActivityStatus",
      wire.ACTIVITY_STATUSES,
      terminalDef("ActivityStatus").enum,
    ],
    [
      "ActivityFailureCode",
      wire.ACTIVITY_FAILURE_CODES,
      terminalDef("ActivityFailureCode").enum,
    ],
    [
      "InputAnalysisLabel",
      wire.INPUT_ANALYSIS_LABELS,
      terminalDef("InputAnalysisLabel").enum,
    ],
    [
      "SolutionGenerationLabel",
      wire.SOLUTION_GENERATION_LABELS,
      terminalDef("SolutionGenerationLabel").enum,
    ],
    [
      "AssetUnderstandingLabel",
      wire.ASSET_UNDERSTANDING_LABELS,
      terminalDef("AssetUnderstandingLabel").enum,
    ],
    [
      "NoteRetrievalLabel",
      wire.NOTE_RETRIEVAL_LABELS,
      terminalDef("NoteRetrievalLabel").enum,
    ],
    [
      "CodeExecutionLabel",
      wire.CODE_EXECUTION_LABELS,
      terminalDef("CodeExecutionLabel").enum,
    ],
    [
      "VerificationLabel",
      wire.VERIFICATION_LABELS,
      terminalDef("VerificationLabel").enum,
    ],
    [
      "AssetUnderstandingReason",
      wire.ASSET_UNDERSTANDING_REASONS,
      terminalDef("AssetUnderstandingReason").enum,
    ],
    [
      "AssetUnderstandingOutcome",
      wire.ASSET_UNDERSTANDING_OUTCOMES,
      terminalDef("AssetUnderstandingOutcome").enum,
    ],
    [
      "NoteRetrievalMatchStatus",
      wire.NOTE_RETRIEVAL_MATCH_STATUSES,
      terminalDef("NoteRetrievalMatchStatus").enum,
    ],
  ];

  it.each(enumCases)("%s", (_name, actual, expected) => {
    expect(expected).toBeDefined();
    expect(sortStrings(actual)).toEqual(sortStrings(expected!));
  });

  it("Activity kind 6종이 schema 순서와 같다", () => {
    const startedPayloads = terminalDef("ActivityStartedEvent").properties!
      .payload.oneOf as unknown[];
    const kinds = startedPayloads.map(
      (payloadRef) => terminalDef(refName(payloadRef)).properties!.kind.const,
    );
    expect(wire.ACTIVITY_KINDS).toEqual(kinds);
  });

  it("frame type 12종이 schema와 같다", () => {
    const serverOwnedFrames = browserDef("ServerOwnedFrame").oneOf as unknown[];
    const terminalFrames = terminalBrowserSchema.oneOf as unknown[];
    const frameTypes = [
      ...serverOwnedFrames.map(
        (ref) => browserDef(refName(ref)).properties!.type.const,
      ),
      ...terminalFrames.map(
        (ref) => terminalDef(refName(ref)).properties!.type.const,
      ),
    ];
    expect(sortStrings(wire.BROWSER_FRAME_TYPES)).toEqual(
      sortStrings(frameTypes),
    );
    expect(sortStrings(wire.TERMINAL_FRAME_TYPES)).toEqual([
      "run.canceled",
      "run.completed",
      "run.failed",
    ]);
  });
});

describe("객체 필드 목록", () => {
  const envelopeKeys = [
    "contractVersion",
    "runId",
    "seq",
    "occurredAt",
    "type",
    "payload",
  ] as const;

  const browserShapes = {
    PageSelection: shapeOf<wire.PageSelection>()(
      ["left", "top", "right", "bottom"],
      ["left", "top", "right", "bottom"],
    ),
    ViewerFocus: shapeOf<wire.ViewerFocus>()(
      ["noteAssetId", "page", "selection"],
      ["noteAssetId", "page"],
    ),
    ConversationRunRequest: shapeOf<wire.ConversationRunRequest>()(
      [
        "requestId",
        "noteId",
        "text",
        "latex",
        "requestedTasks",
        "requestedOutputs",
        "turnAttachmentIds",
        "viewerFocus",
      ],
      ["requestId", "text"],
    ),
    ActiveRunConflict: shapeOf<wire.ActiveRunConflict>()(
      ["activeRunId"],
      ["activeRunId"],
    ),
    RunFailureSummary: shapeOf<wire.RunFailureSummary>()(
      ["code", "reason", "recoverable"],
      ["code", "reason", "recoverable"],
    ),
    RunStatus: shapeOf<wire.RunStatus>()(
      [
        "runId",
        "requestId",
        "noteId",
        "userMessageId",
        "assistantMessageId",
        "status",
        "cancelable",
        "lastSeq",
        "responseDisposition",
        "failure",
        "createdAt",
        "completedAt",
      ],
      [
        "runId",
        "requestId",
        "noteId",
        "userMessageId",
        "assistantMessageId",
        "status",
        "cancelable",
        "lastSeq",
        "responseDisposition",
        "failure",
        "createdAt",
        "completedAt",
      ],
    ),
    RunCancelResult: shapeOf<wire.RunCancelResult>()(
      ["runId", "status", "outcome"],
      ["runId", "status", "outcome"],
    ),
    TurnAttachmentView: shapeOf<wire.TurnAttachmentView>()(
      ["attachmentId", "mime", "displayName"],
      ["attachmentId", "mime", "displayName"],
    ),
    UserMessageContent: shapeOf<wire.UserMessageContent>()(
      [
        "text",
        "latex",
        "requestedTasks",
        "requestedOutputs",
        "turnAttachments",
        "viewerFocus",
      ],
      [
        "text",
        "latex",
        "requestedTasks",
        "requestedOutputs",
        "turnAttachments",
        "viewerFocus",
      ],
    ),
    AssistantFailure: shapeOf<wire.AssistantFailure>()(
      ["code", "reason", "message", "recoverable"],
      ["code", "reason", "message", "recoverable"],
    ),
    AssistantCancel: shapeOf<wire.AssistantCancel>()(
      ["cause", "message"],
      ["cause", "message"],
    ),
    AssistantMessageContent: shapeOf<wire.AssistantMessageContent>()(
      [
        "responseDisposition",
        "clarificationReason",
        "assistantResponse",
        "verificationSummary",
        "failure",
        "cancel",
      ],
      [
        "responseDisposition",
        "clarificationReason",
        "assistantResponse",
        "verificationSummary",
        "failure",
        "cancel",
      ],
    ),
    ActiveRunSummary: shapeOf<wire.ActiveRunSummary>()(
      ["runId", "status", "lastSeq"],
      ["runId", "status", "lastSeq"],
    ),
    ConversationPage: shapeOf<wire.ConversationPage>()(
      ["noteId", "activeRun", "messages", "nextBefore"],
      ["noteId", "activeRun", "messages", "nextBefore"],
    ),
    RunStatusResponse: shapeOf<wire.RunStatusResponse>()(
      ["isSuccess", "code", "message", "result"],
      ["isSuccess", "code", "message", "result"],
    ),
    RunCancelResponse: shapeOf<wire.RunCancelResponse>()(
      ["isSuccess", "code", "message", "result"],
      ["isSuccess", "code", "message", "result"],
    ),
    ConversationPageResponse: shapeOf<wire.ConversationPageResponse>()(
      ["isSuccess", "code", "message", "result"],
      ["isSuccess", "code", "message", "result"],
    ),
    RunCreatedPayload: shapeOf<wire.RunCreatedPayload>()(
      [
        "requestId",
        "noteId",
        "userMessageId",
        "assistantMessageId",
        "status",
        "requestedTasks",
        "requestedOutputs",
      ],
      [
        "requestId",
        "noteId",
        "userMessageId",
        "assistantMessageId",
        "status",
        "requestedTasks",
        "requestedOutputs",
      ],
    ),
    ResponsePageStartedPayload: shapeOf<wire.ResponsePageStartedPayload>()(
      [
        "assistantMessageId",
        "responsePageId",
        "presentation",
        "title",
        "pageIndex",
      ],
      ["assistantMessageId", "responsePageId", "presentation", "pageIndex"],
    ),
    ResponsePageCompletedPayload: shapeOf<wire.ResponsePageCompletedPayload>()(
      ["assistantMessageId", "responsePageId", "pageIndex"],
      ["assistantMessageId", "responsePageId", "pageIndex"],
    ),
    RunCancelingPayload: shapeOf<wire.RunCancelingPayload>()(
      ["assistantMessageId", "status"],
      ["assistantMessageId", "status"],
    ),
    RunCanceledPayload: shapeOf<wire.RunCanceledPayload>()(
      ["assistantMessageId", "status", "cause", "message"],
      ["assistantMessageId", "status", "cause", "message"],
    ),
    RunCreatedFrame: shapeOf<wire.RunCreatedFrame>()(
      envelopeKeys,
      envelopeKeys,
    ),
    ResponsePageStartedFrame: shapeOf<wire.ResponsePageStartedFrame>()(
      envelopeKeys,
      envelopeKeys,
    ),
    ResponsePageCompletedFrame: shapeOf<wire.ResponsePageCompletedFrame>()(
      envelopeKeys,
      envelopeKeys,
    ),
    RunCancelingFrame: shapeOf<wire.RunCancelingFrame>()(
      envelopeKeys,
      envelopeKeys,
    ),
    RunCanceledFrame: shapeOf<wire.RunCanceledFrame>()(
      envelopeKeys,
      envelopeKeys,
    ),
  };

  const startedBase = [
    "activityId",
    "responsePageId",
    "kind",
    "label",
  ] as const;
  const updatedBase = ["activityId", "status", "message", "kind"] as const;
  const closedBase = ["activityId", "message", "kind"] as const;
  const failedBase = ["activityId", "code", "message", "kind"] as const;

  const terminalShapes = {
    AssistantResponseV1: shapeOf<wire.AssistantResponseV1>()(
      ["responsePages", "sourceReferences", "plainText"],
      ["responsePages", "plainText"],
    ),
    ResponsePage: shapeOf<wire.ResponsePage>()(
      ["responsePageId", "presentation", "title", "resultBlocks"],
      ["responsePageId", "presentation", "resultBlocks"],
    ),
    SolutionBlock: shapeOf<wire.SolutionBlock>()(
      [
        "blockId",
        "body",
        "kind",
        "verification",
        "solutionId",
        "claimIds",
        "stepMarks",
      ],
      ["blockId", "body", "verification", "kind"],
    ),
    CheckBlock: shapeOf<wire.CheckBlock>()(
      [
        "blockId",
        "body",
        "kind",
        "stepMarks",
        "firstErrorStepId",
        "quotedSpans",
      ],
      ["blockId", "body", "kind"],
    ),
    ExplanationBlock: shapeOf<wire.ExplanationBlock>()(
      ["blockId", "body", "kind", "solutionId", "claimIds"],
      ["blockId", "body", "kind"],
    ),
    RichTextBlock: shapeOf<wire.RichTextBlock>()(
      ["blockId", "body", "kind"],
      ["blockId", "body", "kind"],
    ),
    NoticeBlock: shapeOf<wire.NoticeBlock>()(
      ["blockId", "body", "kind"],
      ["blockId", "body", "kind"],
    ),
    SourceReference: shapeOf<wire.SourceReference>()(
      [
        "sourceRefId",
        "assetId",
        "pageStart",
        "pageEnd",
        "displayLabelSnapshot",
        "available",
      ],
      [
        "sourceRefId",
        "assetId",
        "pageStart",
        "pageEnd",
        "displayLabelSnapshot",
        "available",
      ],
    ),
    StepMark: shapeOf<wire.StepMark>()(
      ["stepId", "status", "reason", "anchor"],
      ["stepId", "status"],
    ),
    TextAnchor: shapeOf<wire.TextAnchor>()(["start", "end"], ["start", "end"]),
    QuotedSpan: shapeOf<wire.QuotedSpan>()(
      ["anchor", "origin"],
      ["anchor", "origin"],
    ),
    SolutionVerificationSummary: shapeOf<wire.SolutionVerificationSummary>()(
      ["solutionId", "overallCoverage", "claims"],
      ["solutionId", "overallCoverage", "claims"],
    ),
    ClaimVerificationSummary: shapeOf<wire.ClaimVerificationSummary>()(
      ["claimId", "coverage", "methodLabel", "unconfirmedSteps"],
      ["claimId", "coverage", "methodLabel"],
    ),
    UnconfirmedStepSummary: shapeOf<wire.UnconfirmedStepSummary>()(
      ["stepId", "reason"],
      ["stepId", "reason"],
    ),
    PageTarget: shapeOf<wire.PageTarget>()(
      ["assetId", "pageStart", "pageEnd"],
      ["assetId", "pageStart", "pageEnd"],
    ),
    LimitedPage: shapeOf<wire.LimitedPage>()(
      ["assetId", "page"],
      ["assetId", "page"],
    ),
    StepProgress: shapeOf<wire.StepProgress>()(
      ["checked", "total"],
      ["checked", "total"],
    ),
    RunCompletedPayload: shapeOf<wire.RunCompletedPayload>()(
      [
        "responseDisposition",
        "clarificationReason",
        "assistantResponse",
        "model",
        "tier",
        "verificationSummary",
        "assistantMessageId",
      ],
      [
        "responseDisposition",
        "assistantResponse",
        "model",
        "tier",
        "assistantMessageId",
      ],
    ),
    RunFailedPayload: shapeOf<wire.RunFailedPayload>()(
      ["code", "reason", "message", "recoverable", "assistantMessageId"],
      ["code", "message", "recoverable", "assistantMessageId"],
    ),
    ActivityStartedEvent: shapeOf<wire.ActivityStartedFrame>()(
      envelopeKeys,
      envelopeKeys,
    ),
    ActivityUpdatedEvent: shapeOf<wire.ActivityUpdatedFrame>()(
      envelopeKeys,
      envelopeKeys,
    ),
    ActivityCompletedEvent: shapeOf<wire.ActivityCompletedFrame>()(
      envelopeKeys,
      envelopeKeys,
    ),
    ActivityFailedEvent: shapeOf<wire.ActivityFailedFrame>()(
      envelopeKeys,
      envelopeKeys,
    ),
    ActivityCanceledEvent: shapeOf<wire.ActivityCanceledFrame>()(
      envelopeKeys,
      envelopeKeys,
    ),
    RunCompletedEvent: shapeOf<wire.RunCompletedFrame>()(
      envelopeKeys,
      envelopeKeys,
    ),
    RunFailedEvent: shapeOf<wire.RunFailedFrame>()(envelopeKeys, envelopeKeys),

    InputAnalysisStarted: shapeOf<wire.InputAnalysisStarted>()(startedBase, [
      "activityId",
      "kind",
      "label",
    ]),
    SolutionGenerationStarted: shapeOf<wire.SolutionGenerationStarted>()(
      startedBase,
      ["activityId", "kind", "label"],
    ),
    AssetUnderstandingStarted: shapeOf<wire.AssetUnderstandingStarted>()(
      [...startedBase, "reason", "targets"],
      ["activityId", "kind", "label", "reason", "targets"],
    ),
    NoteRetrievalStarted: shapeOf<wire.NoteRetrievalStarted>()(startedBase, [
      "activityId",
      "kind",
      "label",
    ]),
    CodeExecutionStarted: shapeOf<wire.CodeExecutionStarted>()(
      [...startedBase, "methodLabel"],
      ["activityId", "kind", "label", "methodLabel"],
    ),
    VerificationStarted: shapeOf<wire.VerificationStarted>()(
      [...startedBase, "methodLabel"],
      ["activityId", "kind", "label", "methodLabel"],
    ),

    InputAnalysisUpdated: shapeOf<wire.InputAnalysisUpdated>()(updatedBase, [
      "activityId",
      "kind",
    ]),
    SolutionGenerationUpdated: shapeOf<wire.SolutionGenerationUpdated>()(
      updatedBase,
      ["activityId", "kind"],
    ),
    AssetUnderstandingUpdated: shapeOf<wire.AssetUnderstandingUpdated>()(
      [...updatedBase, "processedPages", "totalPages"],
      ["activityId", "kind", "processedPages", "totalPages"],
    ),
    NoteRetrievalUpdated: shapeOf<wire.NoteRetrievalUpdated>()(updatedBase, [
      "activityId",
      "kind",
    ]),
    CodeExecutionUpdated: shapeOf<wire.CodeExecutionUpdated>()(
      [...updatedBase, "methodLabel"],
      ["activityId", "kind", "methodLabel"],
    ),
    VerificationUpdated: shapeOf<wire.VerificationUpdated>()(
      [...updatedBase, "methodLabel", "progress"],
      ["activityId", "kind", "methodLabel", "progress"],
    ),

    InputAnalysisCompleted: shapeOf<wire.InputAnalysisCompleted>()(closedBase, [
      "activityId",
      "kind",
    ]),
    SolutionGenerationCompleted: shapeOf<wire.SolutionGenerationCompleted>()(
      closedBase,
      ["activityId", "kind"],
    ),
    AssetUnderstandingCompleted: shapeOf<wire.AssetUnderstandingCompleted>()(
      [...closedBase, "processedPages", "totalPages", "outcome"],
      ["activityId", "kind", "processedPages", "totalPages"],
    ),
    NoteRetrievalCompleted: shapeOf<wire.NoteRetrievalCompleted>()(
      [...closedBase, "matchStatus", "pages"],
      ["activityId", "kind", "matchStatus"],
    ),
    CodeExecutionCompleted: shapeOf<wire.CodeExecutionCompleted>()(
      [...closedBase, "methodLabel", "durationMs"],
      ["activityId", "kind", "methodLabel"],
    ),
    VerificationCompleted: shapeOf<wire.VerificationCompleted>()(
      [...closedBase, "methodLabel", "progress"],
      ["activityId", "kind", "methodLabel", "progress"],
    ),

    InputAnalysisFailed: shapeOf<wire.InputAnalysisFailed>()(failedBase, [
      "activityId",
      "code",
      "kind",
    ]),
    SolutionGenerationFailed: shapeOf<wire.SolutionGenerationFailed>()(
      failedBase,
      ["activityId", "code", "kind"],
    ),
    AssetUnderstandingFailed: shapeOf<wire.AssetUnderstandingFailed>()(
      failedBase,
      ["activityId", "code", "kind"],
    ),
    NoteRetrievalFailed: shapeOf<wire.NoteRetrievalFailed>()(failedBase, [
      "activityId",
      "code",
      "kind",
    ]),
    CodeExecutionFailed: shapeOf<wire.CodeExecutionFailed>()(
      [...failedBase, "methodLabel"],
      ["activityId", "code", "kind", "methodLabel"],
    ),
    VerificationFailed: shapeOf<wire.VerificationFailed>()(
      [...failedBase, "methodLabel"],
      ["activityId", "code", "kind", "methodLabel"],
    ),

    InputAnalysisCanceled: shapeOf<wire.InputAnalysisCanceled>()(closedBase, [
      "activityId",
      "kind",
    ]),
    SolutionGenerationCanceled: shapeOf<wire.SolutionGenerationCanceled>()(
      closedBase,
      ["activityId", "kind"],
    ),
    AssetUnderstandingCanceled: shapeOf<wire.AssetUnderstandingCanceled>()(
      closedBase,
      ["activityId", "kind"],
    ),
    NoteRetrievalCanceled: shapeOf<wire.NoteRetrievalCanceled>()(closedBase, [
      "activityId",
      "kind",
    ]),
    CodeExecutionCanceled: shapeOf<wire.CodeExecutionCanceled>()(
      [...closedBase, "methodLabel"],
      ["activityId", "kind", "methodLabel"],
    ),
    VerificationCanceled: shapeOf<wire.VerificationCanceled>()(
      [...closedBase, "methodLabel"],
      ["activityId", "kind", "methodLabel"],
    ),
  };

  const expectSameShape = (
    definition: JsonSchemaNode,
    shape: { keys: string[]; required: string[] },
  ) => {
    expect(sortStrings(shape.keys)).toEqual(
      sortStrings(Object.keys(definition.properties ?? {})),
    );
    expect(sortStrings(shape.required)).toEqual(
      sortStrings(definition.required ?? []),
    );
  };

  it.each(Object.entries(browserShapes))("browser-run %s", (name, shape) => {
    expectSameShape(browserDef(name), shape);
  });

  it.each(Object.entries(terminalShapes))("terminal-v2 %s", (name, shape) => {
    expectSameShape(terminalDef(name), shape);
  });

  it("terminal-v2 객체 정의를 모두 TS 타입으로 옮겼다", () => {
    const objectDefinitions = Object.entries(terminalBrowserSchema.$defs)
      .filter(([, definition]) => definition.type === "object")
      .map(([name]) => name);
    expect(sortStrings(Object.keys(terminalShapes))).toEqual(
      sortStrings(objectDefinitions),
    );
  });

  it("ConversationMessage는 role별 interface로 나뉜다", () => {
    const definition = browserDef("ConversationMessage");
    const commonKeys = [
      "messageId",
      "role",
      "status",
      "runId",
      "createdAt",
    ] as const;
    const userShape = shapeOf<wire.UserConversationMessage>()(
      [...commonKeys, "user"],
      [...commonKeys, "user"],
    );
    const assistantShape = shapeOf<wire.AssistantConversationMessage>()(
      [...commonKeys, "assistant"],
      [...commonKeys, "assistant"],
    );

    // role별 interface의 필드를 합치면 schema properties이고, 공통 필수 필드는 schema required다.
    expect(
      sortStrings([...new Set([...userShape.keys, ...assistantShape.keys])]),
    ).toEqual(sortStrings(Object.keys(definition.properties!)));
    expect(sortStrings(definition.required!)).toEqual(sortStrings(commonKeys));
    expect(userShape.required).toContain("user");
    expect(assistantShape.required).toContain("assistant");
  });
});
