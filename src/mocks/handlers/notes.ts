import { http, HttpResponse, delay } from "msw";
import type { ApiResponse } from "../../shared/api/shared_types";
import type {
  CreateNoteResponse,
  CreateNoteRequest,
  NoteDto,
  NoteDetailResponse,
} from "../../features/notes/api/notes_types";
import { mockNoteAssets } from "./editor";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

    // 개발 환경에서는 인증 체크 스킵
    // const authHeader = request.headers.get("Authorization");
    // if (!authHeader) {
    //   return HttpResponse.json<ApiResponse<null>>(
    //     {
    //       isSuccess: false,
    //       code: "AUTH4010",
    //       message: "인증 토큰이 필요합니다.",
    //       result: null,
    //     },
    //     { status: 401 },
    //   );
    // }

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

      const body = await request.json();
      console.log("[MSW] 새 노트 생성:", body);

      // 노트 생성 한도 초과 시뮬레이션
      if (mockNotes.length >= 2) {
        // Free 플랜 한도
        // 테스트를 위해 일단 통과시킴
      }

      const newNoteId = mockNotes.length + 1;
      const now = new Date().toISOString();
      const generatedTitle =
        body.firstMessage.length > 30
          ? body.firstMessage.slice(0, 30) + "..."
          : body.firstMessage;

      // mockNotes 배열에 새 노트 추가 → GET /api/notes에서 반영됨
      const newNote: NoteDto = {
        noteId: newNoteId,
        title: generatedTitle,
        thumbnailUrl: null,
        conversationCount: 1,
        conversationLimit: 20,
        conversationUsagePercent: 5,
        assetCount: body.mentionedAssetIds?.length ?? 0,
        createdAt: now,
        lastUsedAt: now,
      };
      mockNotes.unshift(newNote);

      const response: CreateNoteResponse = {
        noteId: newNoteId,
        title: generatedTitle,
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

  // 노트 상세 정보 + 대화 히스토리 조회 (채팅방 진입 시)
  http.get(`${BASE_URL}/api/notes/:noteId`, async ({ params, request }) => {
    await delay(400);

    const noteId = Number(params.noteId);
    const url = new URL(request.url);
    const conversationPage = parseInt(
      url.searchParams.get("conversationPage") || "0",
    );
    const conversationSize = parseInt(
      url.searchParams.get("conversationSize") || "20",
    );

    console.log("[MSW] 노트 상세 조회:", {
      noteId,
      conversationPage,
      conversationSize,
    });

    // 해당 noteId의 노트 확인
    const note = mockNotes.find((n) => n.noteId === noteId);

    if (!note) {
      return HttpResponse.json(
        {
          isSuccess: false,
          code: "NOTE4041",
          message: "노트를 찾을 수 없습니다.",
          result: null,
        },
        { status: 404 },
      );
    }

    const now = new Date().toISOString();

    // Mock 대화 내역 (해당 노트에 대한 2개 대화 시뮬레이션)
    const mockConversations = [
      {
        conversationId: 101,
        userMessage: {
          messageId: 201,
          content: "이 문제를 풀어줘",
          mentionedAssets: [],
          mentionedTools: [],
          usedTools: [],
          generatedFiles: [],
          createdAt: now,
        },
        assistantMessage: {
          messageId: 202,
          content:
            "네, 이 문제를 단계별로 풀어보겠습니다.\n\n1단계: 문제의 조건을 분석합니다.\n2단계: 풀이 방법을 적용합니다.\n3단계: 결과를 도출합니다.",
          mentionedAssets: [],
          mentionedTools: [],
          usedTools: [],
          generatedFiles: [],
          createdAt: now,
        },
        createdAt: now,
      },
      {
        conversationId: 102,
        userMessage: {
          messageId: 203,
          content: "2번 문제도 풀어줘",
          mentionedAssets: [],
          mentionedTools: [],
          usedTools: [],
          generatedFiles: [],
          createdAt: now,
        },
        assistantMessage: {
          messageId: 204,
          content:
            "2번 문제도 풀어보겠습니다.\n\n이 문제는 이전 문제와 비슷한 접근 방식을 사용하지만, 추가 조건이 있습니다.",
          mentionedAssets: [],
          mentionedTools: [],
          usedTools: [],
          generatedFiles: [],
          createdAt: now,
        },
        createdAt: now,
      },
    ];

    const response: NoteDetailResponse = {
      noteId: note.noteId,
      title: note.title,
      usage: {
        conversationCount: note.conversationCount,
        conversationLimit: note.conversationLimit,
        conversationUsagePercent: note.conversationUsagePercent,
      },
      assets: (mockNoteAssets[note.noteId] ?? []).map((a) => ({
        assetId: a.assetId,
        fileName: a.fileName,
        fileType: a.fileType,
        fileSize: a.fileSize,
        ocrStatus: a.ocrStatus,
        thumbnailUrl: a.thumbnailUrl,
        createdAt: a.createdAt,
      })),
      conversations: mockConversations,
      conversationPageInfo: {
        page: conversationPage,
        size: conversationSize,
        totalElements: mockConversations.length,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
      createdAt: note.createdAt,
      lastUsedAt: note.lastUsedAt,
    };

    return HttpResponse.json<ApiResponse<NoteDetailResponse>>({
      isSuccess: true,
      code: "NOTE2000",
      message: "노트 상세 조회 성공",
      result: response,
    });
  }),

  // 노트 벌크 삭제
  http.delete(`${BASE_URL}/api/notes`, async ({ request }) => {
    await delay(500);

    const body = await request.json();
    const noteIds = body.noteIds as number[];

    console.log("[MSW] 노트 벌크 삭제:", noteIds);

    if (!Array.isArray(noteIds) || noteIds.length === 0) {
      return HttpResponse.json(
        {
          isSuccess: false,
          code: "NOTE4000",
          message: "삭제할 노트 ID가 없습니다.",
          result: null,
        },
        { status: 400 },
      );
    }

    // mockNotes에서 해당 ID의 노트 제거
    const deletedNoteIds = noteIds.filter((id) => {
      const index = mockNotes.findIndex((n) => n.noteId === id);
      if (index > -1) {
        mockNotes.splice(index, 1);
        return true;
      }
      return false;
    });

    return HttpResponse.json<
      ApiResponse<{ deletedCount: number; deletedNoteIds: number[] }>
    >({
      isSuccess: true,
      code: "NOTE2020",
      message: "노트 삭제 성공",
      result: {
        deletedCount: deletedNoteIds.length,
        deletedNoteIds,
      },
    });
  }),

  // 단일 노트 삭제
  http.delete(`${BASE_URL}/api/notes/:noteId`, async ({ params }) => {
    await delay(500);

    const noteId = Number(params.noteId);

    console.log("[MSW] 노트 단일 삭제:", noteId);

    // 해당 noteId의 노트 찾기
    const noteIndex = mockNotes.findIndex((n) => n.noteId === noteId);

    if (noteIndex === -1) {
      return HttpResponse.json(
        {
          isSuccess: false,
          code: "NOTE4041",
          message: "노트를 찾을 수 없습니다.",
          result: null,
        },
        { status: 404 },
      );
    }

    const note = mockNotes[noteIndex];
    const assetCount = mockNoteAssets[noteId]?.length ?? 0;
    const conversationCount = note.conversationCount;

    // Mock 저장소 해제 (자산 크기 기반)
    const freedStorageBytes = assetCount * 1048576; // 각 자산당 1MB 가정

    // mockNotes에서 해당 노트 삭제
    mockNotes.splice(noteIndex, 1);

    return HttpResponse.json<
      ApiResponse<{
        deletedNoteId: number;
        deletedConversationCount: number;
        deletedAssetCount: number;
        freedStorageBytes: number;
      }>
    >({
      isSuccess: true,
      code: "NOTE2020",
      message: "노트 및 관련 대화, 자산 데이터가 모두 삭제되었습니다.",
      result: {
        deletedNoteId: noteId,
        deletedConversationCount: conversationCount,
        deletedAssetCount: assetCount,
        freedStorageBytes,
      },
    });
  }),
];
