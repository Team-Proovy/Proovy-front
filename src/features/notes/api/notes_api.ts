import apiClient from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/shared_types";
import type {
  NoteListParams,
  NoteListResponse,
  CreateNoteRequest,
  CreateNoteResponse,
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
