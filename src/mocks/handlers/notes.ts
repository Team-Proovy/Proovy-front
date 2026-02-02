import { http, HttpResponse, delay } from "msw";
import type { ApiResponse } from "../../shared/api/shared_types";
import type {
  CreateNoteResponse,
  CreateNoteRequest,
  NoteDto,
} from "../../features/notes/api/notes_types";

const BASE_URL = "https://api.proovy.ai.kr";

// ============================================================
// 목 데이터
// ============================================================

/** 노트 목록 목 데이터 */
const mockNotes: NoteDto[] = [
  {
    noteId: 1,
    title: "이산수학 과제 풀이",
    thumbnailUrl: null,
    conversationCount: 5,
    conversationLimit: 20,
    conversationUsagePercent: 25,
    assetCount: 2,
    createdAt: "2025-01-05T10:00:00",
    lastUsedAt: "2025-01-05T15:30:00",
  },
  {
    noteId: 2,
    title: "미적분학 중간고사 대비",
    thumbnailUrl: null,
    conversationCount: 12,
    conversationLimit: 20,
    conversationUsagePercent: 60,
    assetCount: 5,
    createdAt: "2025-01-03T09:00:00",
    lastUsedAt: "2025-01-04T20:00:00",
  },
  {
    noteId: 3,
    title: "선형대수학 연습문제",
    thumbnailUrl: null,
    conversationCount: 3,
    conversationLimit: 20,
    conversationUsagePercent: 15,
    assetCount: 1,
    createdAt: "2025-01-01T14:00:00",
    lastUsedAt: "2025-01-02T10:00:00",
  },
];

// ============================================================
// Notes API 핸들러
// ============================================================

export const notesHandlers = [
  // 노트 목록 조회 (페이지네이션)
  http.get(`${BASE_URL}/api/notes`, async ({ request }) => {
    await delay(500);

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return HttpResponse.json<ApiResponse<null>>(
        {
          isSuccess: false,
          code: "AUTH4010",
          message: "인증 토큰이 필요합니다.",
          result: null,
        },
        { status: 401 },
      );
    }

    // URL에서 쿼리 파라미터 추출
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "0");
    const size = parseInt(url.searchParams.get("size") || "20");
    const sort = url.searchParams.get("sort") || "lastUsedAt,desc";

    console.log("[MSW] 노트 목록 조회:", { page, size, sort });

    // 정렬 처리 (간단히 lastUsedAt 기준)
    const sortedNotes = [...mockNotes].sort((a, b) => {
      if (sort.includes("desc")) {
        return (
          new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
        );
      }
      return (
        new Date(a.lastUsedAt).getTime() - new Date(b.lastUsedAt).getTime()
      );
    });

    // 페이지네이션 적용
    const start = page * size;
    const paginatedNotes = sortedNotes.slice(start, start + size);

    const pageInfo = {
      page,
      size,
      totalElements: mockNotes.length,
      totalPages: Math.ceil(mockNotes.length / size),
      hasNext: start + size < mockNotes.length,
      hasPrevious: page > 0,
    };

    // Swagger 스펙: ApiResponse<NoteListResponse>
    return HttpResponse.json({
      isSuccess: true,
      code: "NOTE2000",
      message: "노트 목록 조회 성공",
      result: {
        notes: paginatedNotes,
        pageInfo,
      },
    });
  }),

  // 새 노트 생성
  http.post<never, CreateNoteRequest>(
    `${BASE_URL}/api/notes`,
    async ({ request }) => {
      await delay(1000); // AI 응답 시뮬레이션

      const authHeader = request.headers.get("Authorization");
      if (!authHeader) {
        return HttpResponse.json<ApiResponse<null>>(
          {
            isSuccess: false,
            code: "AUTH4010",
            message: "인증 토큰이 필요합니다.",
            result: null,
          },
          { status: 401 },
        );
      }

      const body = await request.json();
      console.log("[MSW] 새 노트 생성:", body);

      // 노트 생성 한도 초과 시뮬레이션
      if (mockNotes.length >= 2) {
        // Free 플랜 한도
        // 테스트를 위해 일단 통과시킴
      }

      const newNoteId = mockNotes.length + 1;
      const now = new Date().toISOString();

      const response: CreateNoteResponse = {
        noteId: newNoteId,
        title: body.firstMessage.slice(0, 30) + "...", // 임시 제목
        titleGeneratedBy: "USER_MESSAGE",
        conversationLimit: 20,
        firstConversation: {
          conversationId: 1,
          userMessage: {
            messageId: 1,
            content: body.firstMessage,
            mentionedAssets:
              body.mentionedAssetIds?.map((id: number) => ({
                assetId: id,
                fileName: `file_${id}.pdf`,
              })) || [],
            mentionedTools: body.mentionedToolCodes || [],
            createdAt: now,
          },
          assistantMessage: {
            messageId: 2,
            content: `안녕하세요! "${body.firstMessage.slice(0, 20)}..."에 대해 도움을 드릴게요.\n\n이 문제를 해결하기 위해 단계별로 접근해보겠습니다.`,
            usedTools: body.mentionedToolCodes || [],
            status: "COMPLETED",
            createdAt: now,
          },
        },
        createdAt: now,
      };

      return HttpResponse.json<ApiResponse<CreateNoteResponse>>({
        isSuccess: true,
        code: "NOTE2010",
        message: "노트 생성 성공",
        result: response,
      });
    },
  ),
];
