import apiClient from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/shared_types";
import type {
  NoteListParams,
  NoteListResponse,
  CreateNoteRequest,
  CreateNoteResponse,
  NoteDetailParams,
  NoteDetailResponse,
  DeleteNotesBulkResult,
  DeleteNoteResult,
} from "./notes_types";

const NOTES_BASE = "/api/notes";

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
  await Promise.all(noteIds.map((noteId) => deleteNote(noteId)));

  return {
    isSuccess: true,
    code: "COMMON200",
    message: "노트 삭제 성공",
    result: {
      deletedCount: noteIds.length,
      deletedNoteIds: noteIds,
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
