import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getTools,
  createConversationJson,
  getConversationDetail,
  searchConversations,
  uploadCanvasImage,
} from "../api/editor_api";
import { getNoteDetail } from "@/features/notes/api/notes_api";
import type {
  ToolDto,
  ChatAssetDto,
  CreateConversationRequest,
  ConversationSearchParams,
  ConversationDetailResponse,
  ConversationSearchResponse,
  CanvasImageUploadRequest,
  CanvasImageUploadResponse,
} from "../types/editor_types";

/**
 * 도구 목록 조회 훅
 * @param query 검색어 (선택)
 */
export const useTools = (query?: string) =>
  useQuery<ToolDto[]>({
    queryKey: ["tools", query],
    queryFn: async () => {
      const response = await getTools({ query });
      return response.result.tools;
    },
    staleTime: 5 * 60 * 1000, // 5분간 캐시
  });

/**
 * 노트 에셋(파일) 목록 조회 훅 - # 멘션용
 *
 * Swagger에 GET /api/notes/:noteId/assets 엔드포인트가 없으므로
 * GET /api/notes/{noteId} 응답의 assets 필드에서 추출합니다.
 *
 * @param noteId 노트 ID
 * @param query 검색어 (선택)
 */
export const useNoteAssets = (noteId: number | null, query?: string) =>
  useQuery<ChatAssetDto[], Error, ChatAssetDto[]>({
    queryKey: ["noteAssets", noteId],
    queryFn: async () => {
      if (!noteId) return [];
      const response = await getNoteDetail(noteId);
      const noteDetail = response.result;
      return (noteDetail.assets ?? []).map((a) => ({
        assetId: a.assetId,
        fileName: a.fileName,
        fileSize: a.fileSize,
        mimeType: "",
        fileType: a.fileType as ChatAssetDto["fileType"],
        source: "upload" as const,
        ocrStatus: a.ocrStatus as ChatAssetDto["ocrStatus"],
        thumbnailUrl: a.thumbnailUrl,
        createdAt: a.createdAt,
      }));
    },
    select: (assets) => {
      if (!query) return assets;
      return assets.filter((a) =>
        a.fileName.toLowerCase().includes(query.toLowerCase()),
      );
    },
    enabled: !!noteId,
    staleTime: 60 * 1000, // 1분간 캐시
  });

/**
 * 대화 생성 (비-스트리밍) 훅
 */
export const useCreateConversation = () =>
  useMutation({
    mutationFn: (data: CreateConversationRequest) =>
      createConversationJson(data),
  });

/**
 * 대화 상세 조회 훅
 * GET /api/conversations/{conversationId}
 */
export const useConversationDetail = (conversationId: number | null) =>
  useQuery<ConversationDetailResponse>({
    queryKey: ["conversationDetail", conversationId],
    queryFn: async () => {
      const response = await getConversationDetail(conversationId!);
      return response.result;
    },
    enabled: !!conversationId,
  });

/**
 * 대화 검색 훅
 * GET /api/conversations/search
 */
export const useSearchConversations = (
  params: ConversationSearchParams | null,
) =>
  useQuery<ConversationSearchResponse>({
    queryKey: ["conversationSearch", params],
    queryFn: async () => {
      const response = await searchConversations(params!);
      return response.result;
    },
    enabled: !!params && params.query.length >= 2,
  });

/**
 * 캔버스 이미지 업로드 훅
 * POST /api/conversations/canvas-images
 */
export const useUploadCanvasImage = () =>
  useMutation<CanvasImageUploadResponse, Error, CanvasImageUploadRequest>({
    mutationFn: async (data) => {
      const response = await uploadCanvasImage(data);
      return response.result;
    },
  });
