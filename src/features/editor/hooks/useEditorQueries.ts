import { useQuery } from "@tanstack/react-query";
import { getTools, getNoteAssets } from "../api/editor_api";
import type { ToolDto, ChatAssetDto } from "../types/editor_types";

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
 * @param noteId 노트 ID
 * @param query 검색어 (선택)
 */
export const useNoteAssets = (noteId: number | null, query?: string) =>
  useQuery<ChatAssetDto[]>({
    queryKey: ["noteAssets", noteId, query],
    queryFn: async () => {
      if (!noteId) return [];
      const response = await getNoteAssets({ noteId, query });
      return response.result.assets;
    },
    enabled: !!noteId,
    staleTime: 30 * 1000, // 30초간 캐시
  });
