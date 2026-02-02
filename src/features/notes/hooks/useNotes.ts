import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { getNoteList, createNote } from "../api/notes_api";
import type { NoteListParams, CreateNoteRequest } from "../api/notes_types";

// Query Keys
export const noteKeys = {
  all: ["notes"] as const,
  lists: () => [...noteKeys.all, "list"] as const,
  list: (params?: NoteListParams) => [...noteKeys.lists(), params] as const,
  detail: (id: string) => [...noteKeys.all, "detail", id] as const,
};

// 노트 목록 조회 Hook (일반 페이지네이션)
export const useNoteList = (
  params?: NoteListParams & { enabled?: boolean },
) => {
  const { enabled = true, ...queryParams } = params ?? {};

  return useQuery({
    queryKey: noteKeys.list(queryParams),
    queryFn: async () => {
      const response = await getNoteList(queryParams);
      return response.result; // { notes, pageInfo }
    },
    enabled,
    staleTime: 1000 * 60 * 2, // 2분
  });
};

// 노트 목록 조회 Hook (무한 스크롤)
export const useInfiniteNoteList = (
  params?: Omit<NoteListParams, "page" | "cursor">,
) => {
  return useInfiniteQuery({
    queryKey: noteKeys.list(params),
    queryFn: async ({ pageParam }) => {
      const response = await getNoteList({
        ...params,
        cursor: pageParam,
      });
      return response.result; // { notes, pageInfo }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNext ? lastPage.pageInfo.nextCursor : undefined,
    staleTime: 1000 * 60 * 2,
  });
};

// 노트 생성 Hook
export const useCreateNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNoteRequest) => createNote(data),
    onSuccess: () => {
      // 노트 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
};
