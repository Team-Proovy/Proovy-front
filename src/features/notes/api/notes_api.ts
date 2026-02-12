import apiClient from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/shared_types";
import type {
  NoteListParams,
  NoteListResponse,
  CreateNoteRequest,
  CreateNoteResponse,
  UpdateNoteTitleRequest,
  UpdateNoteTitleResponse,
  NoteDetailParams,
  NoteDetailResponse,
  DeleteNotesBulkResult,
  DeleteNoteResult,
} from "./notes_types";

const NOTES_BASE = "/api/notes";
const MAX_CONCURRENT_NOTE_DELETES = 5;

const chunkNoteIds = (noteIds: number[], size: number) => {
  const chunks: number[][] = [];

  for (let i = 0; i < noteIds.length; i += size) {
    chunks.push(noteIds.slice(i, i + size));
  }

  return chunks;
};

const getDeleteErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return "노트 삭제에 실패했습니다.";
};

// 노트 목록 조회
export const getNoteList = async (
  params?: NoteListParams,
): Promise<ApiResponse<NoteListResponse>> => {
  const response = await apiClient.get<ApiResponse<NoteListResponse>>(
    NOTES_BASE,
    { params },
  );
  return response.data;
};

// 노트 생성
export const createNote = async (
  data: CreateNoteRequest,
): Promise<ApiResponse<CreateNoteResponse>> => {
  const response = await apiClient.post<ApiResponse<CreateNoteResponse>>(
    NOTES_BASE,
    data,
  );
  return response.data;
};

// 노트 제목 변경
export const updateNoteTitle = async (
  noteId: number,
  data: UpdateNoteTitleRequest,
): Promise<ApiResponse<UpdateNoteTitleResponse>> => {
  const response = await apiClient.patch<ApiResponse<UpdateNoteTitleResponse>>(
    `${NOTES_BASE}/${noteId}`,
    data,
  );
  return response.data;
};

/**
 * 노트 상세 정보 + 대화 내역 + 첨부 파일 목록 조회
 * GET /api/notes/{noteId}
 *
 * 채팅방 진입 시 호출하여 기존 대화 히스토리를 불러온다.
 */
export const getNoteDetail = async (
  noteId: number,
  params?: NoteDetailParams,
): Promise<ApiResponse<NoteDetailResponse>> => {
  const response = await apiClient.get<ApiResponse<NoteDetailResponse>>(
    `${NOTES_BASE}/${noteId}`,
    { params },
  );
  return response.data;
};

// 노트 벌크 삭제
export const deleteNotesBulk = async (
  noteIds: number[],
): Promise<ApiResponse<DeleteNotesBulkResult>> => {
  const deletedNoteIds: number[] = [];
  const failedNoteIds: number[] = [];
  const failedReasons: { noteId: number; message: string }[] = [];

  const chunks = chunkNoteIds(noteIds, MAX_CONCURRENT_NOTE_DELETES);

  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map((noteId) => deleteNote(noteId)),
    );

    results.forEach((result, index) => {
      const noteId = chunk[index];

      if (result.status === "fulfilled") {
        deletedNoteIds.push(noteId);
      } else {
        failedNoteIds.push(noteId);
        failedReasons.push({
          noteId,
          message: getDeleteErrorMessage(result.reason),
        });
      }
    });
  }

  const isSuccess = failedNoteIds.length === 0;

  return {
    isSuccess,
    code: isSuccess ? "COMMON200" : "COMMON207",
    message: isSuccess ? "노트 삭제 성공" : "노트 삭제 부분 성공",
    result: {
      deletedCount: deletedNoteIds.length,
      deletedNoteIds,
      failedNoteIds,
      failedReasons,
    },
  };
};

// 단일 노트 삭제
export const deleteNote = async (
  noteId: number,
): Promise<ApiResponse<DeleteNoteResult>> => {
  const response = await apiClient.delete<ApiResponse<DeleteNoteResult>>(
    `${NOTES_BASE}/${noteId}`,
  );
  return response.data;
};
