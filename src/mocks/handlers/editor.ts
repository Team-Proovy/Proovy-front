import { http, HttpResponse, delay } from "msw";
import type { ApiResponse } from "../../shared/api/shared_types";
import type {
  ToolDto,
  ToolListResult,
  ChatAssetDto,
  ConversationSearchResponse,
  ConversationSearchItem,
  CanvasImageUploadRequest,
  CanvasImageUploadResponse,
} from "../../features/editor/types/editor_types";

// 빈 값이거나 정의되지 않으면 API client(client.ts)와 같이 같은 origin의 /api를 받는다.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

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
// ID 카운터
// ============================================================
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
