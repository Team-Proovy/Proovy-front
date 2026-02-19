import { http, HttpResponse, delay } from "msw";
import type { ApiResponse } from "../../shared/api/shared_types";
import type {
  ToolDto,
  ToolListResult,
  ChatAssetDto,
  CreateConversationRequest,
  ConversationDetailResponse,
  ConversationSearchResponse,
  ConversationSearchItem,
  CanvasImageUploadRequest,
  CanvasImageUploadResponse,
} from "../../features/editor/types/editor_types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ============================================================
// 목 데이터
// ============================================================

/** #멘션용 에셋 목 데이터 — 노트에 업로드된 파일 시뮬레이션 */
export const mockNoteAssets: Record<number, ChatAssetDto[]> = {
  // noteId: 1 — 이산수학 과제 관련 파일들
  1: [
    {
      assetId: 101,
      fileName: "discrete_math_HW2.pdf",
      fileSize: 1_048_576,
      mimeType: "application/pdf",
      fileType: "pdf",
      source: "upload",
      ocrStatus: "completed",
      thumbnailUrl: "https://placehold.co/240x140/e2e8f0/475569?text=PDF",
      createdAt: "2025-01-05T10:00:00",
    },
    {
      assetId: 102,
      fileName: "midterm_solutions.pdf",
      fileSize: 2_340_000,
      mimeType: "application/pdf",
      fileType: "pdf",
      source: "upload",
      ocrStatus: "completed",
      thumbnailUrl: "https://placehold.co/240x140/e2e8f0/475569?text=PDF",
      createdAt: "2025-01-05T11:30:00",
    },
    {
      assetId: 103,
      fileName: "graph_theory_notes.png",
      fileSize: 450_000,
      mimeType: "image/png",
      fileType: "image",
      source: "upload",
      ocrStatus: "completed",
      thumbnailUrl: "https://placehold.co/240x140/dbeafe/1e40af?text=Image",
      createdAt: "2025-01-05T12:00:00",
    },
  ],
  // noteId: 2 — 미적분학 관련 파일들
  2: [
    {
      assetId: 201,
      fileName: "calculus_chapter3.pdf",
      fileSize: 3_200_000,
      mimeType: "application/pdf",
      fileType: "pdf",
      source: "upload",
      ocrStatus: "completed",
      thumbnailUrl: "https://placehold.co/240x140/e2e8f0/475569?text=PDF",
      createdAt: "2025-01-03T09:30:00",
    },
    {
      assetId: 202,
      fileName: "integral_formula_sheet.pdf",
      fileSize: 520_000,
      mimeType: "application/pdf",
      fileType: "pdf",
      source: "upload",
      ocrStatus: "completed",
      thumbnailUrl: "https://placehold.co/240x140/e2e8f0/475569?text=PDF",
      createdAt: "2025-01-03T10:00:00",
    },
  ],
  // noteId: 3 — 선형대수학
  3: [
    {
      assetId: 301,
      fileName: "linear_algebra_exam.pdf",
      fileSize: 1_800_000,
      mimeType: "application/pdf",
      fileType: "pdf",
      source: "upload",
      ocrStatus: "completed",
      thumbnailUrl: "https://placehold.co/240x140/e2e8f0/475569?text=PDF",
      createdAt: "2025-01-01T14:30:00",
    },
  ],
  4: [
    {
      assetId: 401,
      fileName: "linear_algebra_exam.pdf",
      fileSize: 1_800_000,
      mimeType: "application/pdf",
      fileType: "pdf",
      source: "upload",
      ocrStatus: "completed",
      thumbnailUrl: "https://placehold.co/240x140/e2e8f0/475569?text=PDF",
      createdAt: "2025-01-01T14:30:00",
    },
  ],
};

const mockTools: ToolDto[] = [
  {
    toolId: 1,
    toolCode: "GRAPH",
    name: "용어",
    description: "수학 함수나 데이터를 시각적으로 그래프로 표현합니다.",
    iconType: "chart_line",
    isActive: true,
    displayOrder: 1,
  },
  {
    toolId: 2,
    toolCode: "SOLUTION",
    name: "해설지 생성하기",
    description: "문제에 대한 상세한 풀이 해설을 생성합니다.",
    iconType: "file_text",
    isActive: true,
    displayOrder: 2,
  },
  {
    toolId: 3,
    toolCode: "CANVAS",
    name: "캔버스 열기",
    description: "자유롭게 그릴 수 있는 캔버스를 엽니다.",
    iconType: "copy_plus",
    isActive: true,
    displayOrder: 3,
  },
  {
    toolId: 4,
    toolCode: "CODE_CHECK",
    name: "코드 검산 진행하기",
    description: "코드를 실행하여 계산을 검증합니다.",
    iconType: "code",
    isActive: true,
    displayOrder: 4,
  },
];

// ============================================================
// 대화 ID 카운터
// ============================================================
let conversationIdCounter = 100;
let messageIdCounter = 200;
let canvasAssetIdCounter = 500;

// ============================================================
// 핸들러
// ============================================================

export const editorHandlers = [
  /** GET /api/notes/tools - 도구 목록 조회 */
  http.get(`${BASE_URL}/api/notes/tools`, async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const query = url.searchParams.get("query");

    let filteredTools = mockTools.filter((t) => t.isActive);

    if (query) {
      filteredTools = filteredTools.filter((t) =>
        t.name.toLowerCase().includes(query.toLowerCase()),
      );
    }

    return HttpResponse.json<ApiResponse<ToolListResult>>({
      isSuccess: true,
      code: "200",
      message: "도구 목록 조회 성공",
      result: { tools: filteredTools },
    });
  }),

  /** POST /api/conversations - 대화 생성 (SSE 스트리밍 / JSON) */
  http.post<never, CreateConversationRequest>(
    `${BASE_URL}/api/conversations`,
    async ({ request }) => {
      const url = new URL(request.url);
      const isStream = url.searchParams.get("isStream") !== "false";
      const body = await request.json();

      const now = new Date().toISOString();
      const convId = ++conversationIdCounter;
      const userMsgId = ++messageIdCounter;
      const assistantMsgId = ++messageIdCounter;

      const userText = body.text || "";

      // Mock AI 응답 생성
      const aiContent = [
        `# 풀이 요약`,
        `"${userText.slice(0, 30)}..."에 대한 마크다운 스트리밍 테스트입니다.`,
        ``,
        `## 핵심 포인트`,
        `- 조건을 정리하고`,
        `- 적절한 공식을 적용한 다음`,
        `- 결과를 검산합니다.`,
        ``,
        `## 수식`,
        `인라인 수식: $a^2 + b^2 = c^2$`,
        `블록 수식:`,
        `$$\\int_0^1 x^2\\,dx = \\frac{1}{3}$$`,
        ``,
        `## 코드 블록`,
        "```ts",
        "const add = (a: number, b: number) => a + b;",
        "console.log(add(1, 2));",
        "```",
        ``,
        `## 테이블`,
        `| 단계 | 설명 |`,
        `| --- | --- |`,
        `| 1 | 조건 정리 |`,
        `| 2 | 공식 적용 |`,
        `| 3 | 결과 검산 |`,
        ``,
        `> 추가 질문이 있으면 언제든 알려주세요.`,
      ].join("\n");

      // 비-스트리밍: 기존 JSON 응답
      if (!isStream) {
        await delay(800);
        return HttpResponse.json<
          ApiResponse<{
            conversationId: number;
            userMessage: {
              messageId: number;
              content: string;
              mentionedAssets: { assetId: number; fileName: string }[];
              mentionedTools: string[];
              createdAt: string;
            };
            assistantMessage: {
              messageId: number;
              content: string;
              usedTools: string[];
              status: string;
              createdAt: string;
            };
          }>
        >({
          isSuccess: true,
          code: "CONV2010",
          message: "대화 생성 성공",
          result: {
            conversationId: convId,
            userMessage: {
              messageId: userMsgId,
              content: userText,
              mentionedAssets:
                body.mentionedAssetIds?.map((id: number) => ({
                  assetId: id,
                  fileName: `file_${id}.pdf`,
                })) || [],
              mentionedTools: body.chosenFeatures || [],
              createdAt: now,
            },
            assistantMessage: {
              messageId: assistantMsgId,
              content: aiContent,
              usedTools: body.chosenFeatures || [],
              status: "COMPLETED",
              createdAt: now,
            },
          },
        });
      }

      // SSE 스트리밍 응답 (실제 서버 형식)
      const encoder = new TextEncoder();
      const threadId = crypto.randomUUID();
      const runId = crypto.randomUUID();

      // 진행 상황 시뮬레이션 단계
      const statusSteps = [
        { node: "Intent", status: "질문의 의도를 분석하고 있습니다." },
        {
          node: "Solve_Analysis",
          status: "문제를 분석하고 필요한 정보를 정리하고 있습니다.",
        },
        {
          node: "Solve_Writer",
          status: "풀이 결과를 정리하여 답변을 작성하고 있습니다.",
        },
        {
          node: "Solution",
          status: "풀이 과정을 정리하고 있습니다.",
        },
        {
          node: "Check",
          status: "답이 올바른지 검산하고 있습니다.",
        },
      ];

      const stream = new ReadableStream({
        async start(controller) {
          // 1. thread_id 이벤트
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "thread_id", thread_id: threadId, run_id: runId })}\n\n`,
            ),
          );

          // 2. message(custom) 이벤트 — 진행 상황
          for (const step of statusSteps) {
            await new Promise((r) => setTimeout(r, 600));
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "message", content: { type: "custom", content: "", tool_calls: [], tool_call_id: null, run_id: runId, response_metadata: {}, custom_data: step } })}\n\n`,
              ),
            );
          }

          // 3. token 이벤트 — AI 응답을 한 글자씩 전송
          for (const char of aiContent) {
            await new Promise((r) => setTimeout(r, 20));
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "token", content: char })}\n\n`,
              ),
            );
          }

          // 4. message(ai) 이벤트 — 최종 응답
          await new Promise((r) => setTimeout(r, 50));
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "message", content: { type: "ai", content: aiContent, tool_calls: [], tool_call_id: null, run_id: runId, response_metadata: {}, custom_data: {} } })}\n\n`,
            ),
          );

          // 5. [DONE] 시그널
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));

          controller.close();
        },
      });

      return new HttpResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    },
  ),

  /** POST /stream/v2 - SSE v2 이벤트 스트리밍 */
  http.post<never, { message?: string; text?: string; streamTokens?: boolean }>(
    `${BASE_URL}/stream/v2`,
    async ({ request }) => {
      const body = await request.json();
      const userText = body.message ?? body.text ?? "";
      const streamTokens = body.streamTokens !== false;

      const aiContent = [
        `# 풀이 요약`,
        `"${userText.slice(0, 30)}..."에 대한 v2 스트리밍 테스트입니다.`,
        ``,
        `## 핵심 포인트`,
        `- 조건 정리`,
        `- 공식 적용`,
        `- 결과 검산`,
      ].join("\n");

      const statusSteps = [
        { node: "Intent", message: "질문의 의도를 분석하고 있습니다." },
        {
          node: "Solve",
          message: "문제를 분석하고 필요한 정보를 정리하고 있습니다.",
        },
        {
          node: "Check",
          message: "답이 올바른지 검산하고 있습니다.",
        },
      ];

      const encoder = new TextEncoder();
      const runId = crypto.randomUUID();
      const threadId = crypto.randomUUID();
      let seq = 0;

      const stream = new ReadableStream({
        async start(controller) {
          const emit = (event: string, payload: Record<string, unknown>) => {
            seq += 1;
            const data = {
              v: "2.0",
              ts: new Date().toISOString(),
              seq,
              run_id: runId,
              thread_id: threadId,
              ...payload,
            };

            controller.enqueue(
              encoder.encode(
                `id: ${runId}:${seq}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
              ),
            );
          };

          emit("session.metadata", {
            agent_id: "tutor",
            capabilities: {
              token_stream: true,
              heartbeat: true,
              terminal_event: true,
            },
          });
          emit("run.started", { stream_tokens: streamTokens });

          for (const step of statusSteps) {
            await new Promise((r) => setTimeout(r, 450));
            emit("node.progress", step);
          }

          const llmMessageId = "m_llm_1";
          if (streamTokens) {
            emit("llm.message.started", {
              message_id: llmMessageId,
              node: "FinalResponse",
              role: "assistant",
            });

            let index = 0;
            for (const delta of aiContent) {
              await new Promise((r) => setTimeout(r, 15));
              emit("llm.token.delta", {
                message_id: llmMessageId,
                node: "FinalResponse",
                delta,
                index,
              });
              index += 1;
            }

            emit("llm.message.completed", {
              message_id: llmMessageId,
              finish_reason: "stop",
            });
          }

          emit("chat.message", {
            message_id: "m_chat_1",
            role: "assistant",
            kind: "assistant_final",
            content: aiContent,
            node: "FinalResponse",
          });

          emit("run.completed", {
            duration_ms: 3200,
            final_message_id: "m_chat_1",
          });

          controller.close();
        },
      });

      return new HttpResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    },
  ),

  /** GET /api/conversations/search - 대화 검색 */
  http.get(`${BASE_URL}/api/conversations/search`, async ({ request }) => {
    await delay(400);

    const url = new URL(request.url);
    const query = url.searchParams.get("query") || "";
    const page = parseInt(url.searchParams.get("page") || "0", 10);
    const size = parseInt(url.searchParams.get("size") || "20", 10);

    if (query.length < 2) {
      return HttpResponse.json(
        {
          isSuccess: false,
          code: "STORAGE4003",
          message: "검색어는 최소 2자 이상부터 입력 가능합니다.",
          result: null,
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    const mockResults: ConversationSearchItem[] = [
      {
        conversationId: 101,
        noteId: 1,
        noteTitle: "이산수학 과제 풀이",
        userMessage: {
          text: `${query}에 대한 질문입니다.`,
          preview: `${query}에 대한 질문입니다.`,
          highlight: `...${query}에 대한 질문입니다...`,
        },
        assistantMessage: {
          text: `${query}에 대해 답변드립니다. 이 문제는 기본 개념을 적용하면 풀 수 있습니다.`,
          preview: `${query}에 대해 답변드립니다. 이 문제는 기본 개념을 적용하면 풀 수 있습니다.`,
          highlight: `...${query}에 대해 답변드립니다. 이 문제는...`,
        },
        mentionedFiles: [],
        mentionedTools: [],
        relevance: 0.95,
        createdAt: now,
      },
      {
        conversationId: 102,
        noteId: 2,
        noteTitle: "미적분학 중간고사 대비",
        userMessage: {
          text: `${query} 관련 문제를 풀어줘`,
          preview: `${query} 관련 문제를 풀어줘`,
          highlight: `...${query} 관련 문제를 풀어줘...`,
        },
        assistantMessage: {
          text: `${query} 관련 문제의 풀이 과정을 설명드리겠습니다.`,
          preview: `${query} 관련 문제의 풀이 과정을 설명드리겠습니다.`,
          highlight: `...${query} 관련 문제의 풀이 과정을...`,
        },
        mentionedFiles: [{ assetId: 201, fileName: "calculus_chapter3.pdf" }],
        mentionedTools: ["SOLUTION"],
        relevance: 0.82,
        createdAt: now,
      },
    ];

    return HttpResponse.json<ApiResponse<ConversationSearchResponse>>({
      isSuccess: true,
      code: "CONV2000",
      message: "대화 검색 성공",
      result: {
        conversations: mockResults,
        pageInfo: {
          page,
          size,
          totalElements: mockResults.length,
          totalPages: 1,
          hasNext: false,
          hasPrevious: page > 0,
        },
        searchMetadata: {
          query,
          totalMatches: mockResults.length,
          searchTimeMs: 45,
        },
      },
    });
  }),

  /** GET /api/conversations/{conversationId} - 대화 상세 조회 */
  http.get(
    `${BASE_URL}/api/conversations/:conversationId`,
    async ({ params }) => {
      await delay(300);

      const conversationId = Number(params.conversationId);
      const now = new Date().toISOString();

      return HttpResponse.json<ApiResponse<ConversationDetailResponse>>({
        isSuccess: true,
        code: "CONV2000",
        message: "대화 상세 조회 성공",
        result: {
          conversationId,
          note: { noteId: 1, title: "이산수학 과제 풀이" },
          userMessage: {
            messageId: 201,
            text: "이 문제를 풀어줘",
            latex: null,
            mentionedFiles: [
              {
                assetId: 101,
                fileName: "discrete_math_HW2.pdf",
                thumbnailUrl: null,
              },
            ],
            mentionedTools: [],
            canvasImages: [],
            createdAt: now,
          },
          assistantMessage: {
            messageId: 202,
            text: "이 문제는 다음과 같이 풀 수 있습니다.",
            sections: [
              {
                type: "explanation",
                title: "풀이 과정",
                content: "1단계: 조건을 분석합니다.\n2단계: 공식을 적용합니다.",
              },
            ],
            codeExecution: null,
            generatedProblem: null,
            createdAt: now,
          },
          aiRuns: [
            {
              aiRunId: 1,
              runType: "LLM_QUERY",
              modelName: "gpt-4o",
              status: "COMPLETED",
              promptTokens: 150,
              completionTokens: 300,
              latencyMs: 2500,
            },
          ],
          creditUsed: {
            amount: 10,
            breakdown: [{ reason: "AI 질의", amount: 10 }],
          },
          createdAt: now,
          updatedAt: now,
        },
      });
    },
  ),

  /** POST /api/conversations/canvas-images - 캔버스 이미지 업로드 */
  http.post<never, CanvasImageUploadRequest>(
    `${BASE_URL}/api/conversations/canvas-images`,
    async ({ request }) => {
      await delay(300);

      const body = await request.json();
      const now = new Date().toISOString();
      const assetId = ++canvasAssetIdCounter;

      return HttpResponse.json<ApiResponse<CanvasImageUploadResponse>>({
        isSuccess: true,
        code: "CONV2010",
        message: "캔버스 이미지 업로드 URL 발급 성공",
        result: {
          assetId,
          source: "canvas",
          fileName: body.fileName,
          fileSize: body.fileSize,
          mimeType: body.mimeType,
          storageKey: `canvas/${body.noteId}/${assetId}_${body.fileName}`,
          uploadUrl: `https://s3.amazonaws.com/proovy-mock/canvas/${assetId}?presigned=true`,
          createdAt: now,
        },
      });
    },
  ),
];
