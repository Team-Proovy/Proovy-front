import { useQuery } from "@tanstack/react-query";
import { searchConversations } from "@/features/editor/api/editor_api";
import type { ConversationSearchParams } from "@/features/editor/types/editor_types";

export const conversationSearchKeys = {
  all: ["conversationSearch"] as const,
  search: (params: ConversationSearchParams) =>
    [...conversationSearchKeys.all, params] as const,
};

/**
 * 대화 검색 훅
 * GET /api/conversations/search
 *
 * - query가 2자 이상일 때만 자동 실행
 * - 300ms debounce는 컴포넌트에서 처리
 */
export const useConversationSearch = (
  params: ConversationSearchParams,
  options?: { enabled?: boolean },
) => {
  const isQueryValid = params.query.trim().length >= 2;

  return useQuery({
    queryKey: conversationSearchKeys.search(params),
    queryFn: async () => {
      const response = await searchConversations(params);
      return response.result;
    },
    enabled: (options?.enabled ?? true) && isQueryValid,
    staleTime: 1000 * 60 * 1, // 1분
    placeholderData: (prev) => prev,
  });
};
