import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  getNoteList,
  createNote,
  getNoteDetail,
  getNoteDetailWithAllConversations,
  updateNoteTitle,
  deleteNotesBulk,
  deleteNote,
} from "../api/notes_api";
import type {
  NoteListParams,
  CreateNoteRequest,
  NoteDetailParams,
} from "../api/notes_types";

// Query Keys
export const noteKeys = {
  all: ["notes"] as const,
  lists: () => [...noteKeys.all, "list"] as const,
  list: (params?: NoteListParams) =>
    [...noteKeys.lists(), "paginated", params] as const,
  infiniteList: (params?: Omit<NoteListParams, "page" | "cursor">) =>
    [...noteKeys.lists(), "infinite", params] as const,
  detail: (id: string, params?: NoteDetailParams) =>
    [...noteKeys.all, "detail", id, params] as const,
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
    queryKey: noteKeys.infiniteList(params),
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
    // useHomeSend에서 자체 onError 토스트로 처리 → 전역 토스트 제외
    meta: { suppressGlobalErrorToast: true },
    mutationFn: (
      variables: CreateNoteRequest & { suppressRedirect?: boolean },
    ) => {
      const { suppressRedirect, ...data } = variables;
      return createNote(data, { suppressRedirect });
    },
    onSuccess: () => {
      // 노트 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
};

// 노트 제목 변경 Hook
export const useUpdateNoteTitle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, title }: { noteId: number; title: string }) =>
      updateNoteTitle(noteId, { title }),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: noteKeys.detail(String(variables.noteId)),
      });
    },
  });
};

/**
 * 노트 상세 정보 + 대화 히스토리 조회 Hook
 * 채팅방 진입(재진입) 시 사용
 *
 * @param noteId  URL 파라미터에서 가져온 noteId (string | undefined)
 * @param params  대화 페이지네이션 파라미터 (선택)
 * @param options.enabled  쿼리 활성화 여부 (location.state가 있으면 false)
 */
export const useNoteDetail = (
  noteId: string | undefined,
  params?: NoteDetailParams,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false;
    fetchAllConversations?: boolean;
    refetchOnMount?: boolean | "always";
  },
) => {
  return useQuery({
    queryKey: noteKeys.detail(noteId ?? "", params),
    queryFn: async () => {
      const response = options?.fetchAllConversations
        ? await getNoteDetailWithAllConversations(Number(noteId), params)
        : await getNoteDetail(Number(noteId), params);
      return response.result;
    },
    enabled: (options?.enabled ?? true) && !!noteId,
    staleTime: 1000 * 60 * 1, // 1분
    refetchInterval: options?.refetchInterval,
    refetchOnMount: options?.refetchOnMount,
  });
};

// 노트 벌크 삭제 Hook
export const useDeleteNotesBulk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // DeleteNotesModal에서 인라인 에러 메시지로 처리 → 전역 토스트 제외
    meta: { suppressGlobalErrorToast: true },
    mutationFn: (noteIds: number[]) => deleteNotesBulk(noteIds),
    onSuccess: () => {
      // 노트 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
};

// 단일 노트 삭제 Hook
export const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: number) => deleteNote(noteId),
    onSuccess: (_data, noteId) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.removeQueries({
        queryKey: noteKeys.detail(String(noteId)),
      });
    },
  });
};
