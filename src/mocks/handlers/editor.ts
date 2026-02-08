import { http, HttpResponse, delay } from "msw";
import type { ApiResponse } from "../../shared/api/shared_types";
import type {
  ToolDto,
  ToolListResult,
  ChatAssetDto,
  CreateConversationRequest,
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
      thumbnailUrl: null,
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
      thumbnailUrl: null,
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
      thumbnailUrl: null,
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
      thumbnailUrl: null,
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
      thumbnailUrl: null,
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
      ocrStatus: "processing",
      thumbnailUrl: null,
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

  /** POST /api/conversations - 대화 생성 (Mock: JSON 응답) */
  http.post<never, CreateConversationRequest>(
    `${BASE_URL}/api/conversations`,
    async ({ request }) => {
      await delay(800);

      const body = await request.json();
      const now = new Date().toISOString();
      const convId = ++conversationIdCounter;
      const userMsgId = ++messageIdCounter;
      const assistantMsgId = ++messageIdCounter;

      const userText = body.text || "";

      // Mock AI 응답 생성
      const aiContent = `"${userText.slice(0, 30)}..."에 대해 답변드립니다.\n\n이 문제는 다음과 같은 접근으로 풀 수 있습니다:\n\n1단계: 문제의 조건을 정리합니다.\n2단계: 핵심 개념을 적용합니다.\n3단계: 결과를 도출합니다.\n\n추가 질문이 있으시면 말씀해주세요!`;

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
    },
  ),
];
