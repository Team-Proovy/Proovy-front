# Phase 5: 비즈니스 도메인(Notes/Assets) 성능 구조조정

> **목표**: 불필요한 API 호출과 메모리 누수를 제거하고, 데이터 로딩 방식을 사용자 경험에 맞게 최적화한다.  
> **예상 소요**: 3~5일 (가장 변경 범위가 넓음)  
> **병렬 가능 작업**: 5-A(Polling), 5-B(while 루프), 5-D(인라인 스타일)는 서로 다른 파일이므로 동시 진행 가능.  
> 5-C(N+1 삭제)는 백엔드 API 추가 이후에 진행한다.

---

## 전제 조건

- Phase 1 Design Token 완료 (5-D 인라인 스타일 정리에 필요)
- 5-C(N+1 삭제)는 백엔드 팀에 Bulk Delete API 추가를 먼저 요청해야 한다

---

## 작업 목록 (체크리스트)

- [ ] **5-A** useAssetPolling 메모리 누수 수정 — React Query `refetchInterval`로 교체
- [ ] **5-B** getNoteDetailWithAllConversations `while` 루프 제거 — `useInfiniteQuery` 전환
- [ ] **5-C** Notes 삭제 N+1 문제 해결 — 백엔드 Bulk API 연동 (백엔드 협의 필요)
- [ ] **5-D** Notes/비즈니스 컴포넌트 인라인 스타일 최종 정리

---

## 5-A. useAssetPolling 메모리 누수 수정

### 작업 대상 파일

`src/features/assets/hooks/useAssetPolling.ts`

### 현재 상태

```ts
// 현재 코드 — setTimeout 재귀 방식
const fetchStatus = useCallback(async () => {
  if (!assetId) return;
  try {
    const response = await getAssetDetail(assetId);
    const data = response.result;
    setAsset(data);

    if (data.ocrStatus === "completed" || data.ocrStatus === "failed") {
      setIsLoading(false);
      return;
    }

    // ❌ 컴포넌트가 언마운트되어도 이 setTimeout은 취소되지 않음 → 메모리 누수
    setTimeout(fetchStatus, interval);
  } catch (err) {
    setError("자산 정보를 불러오는 중 오류가 발생했다.");
    setIsLoading(false);
  }
}, [assetId, interval]);
```

### 문제점

- 컴포넌트 언마운트 후에도 `setTimeout` 콜백이 실행되어 `setState`를 호출 → 메모리 누수
- React Query devtools, 캐시, 재시도 등의 기능을 활용 불가
- 에러 발생 시 자동 재시도 없음

### 변경 방향 — React Query `refetchInterval`

```ts
// src/features/assets/hooks/useAssetPolling.ts — 변경 후
import { useQuery } from "@tanstack/react-query";
import { getAssetDetail } from "../api/assetApi";

export const useAssetPolling = (assetId: number | null, interval = 3000) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["asset", assetId],
    queryFn: () => getAssetDetail(assetId!),
    enabled: !!assetId,
    // ocrStatus가 처리 중인 경우에만 폴링, 완료/실패 시 자동 중단
    refetchInterval: (query) => {
      const status = query.state.data?.result.ocrStatus;
      if (status === "completed" || status === "failed") return false;
      return interval;
    },
  });

  const asset = data?.result ?? null;

  return {
    asset,
    isProcessing:
      asset?.ocrStatus === "processing" || asset?.ocrStatus === "pending",
    isLoading,
    error: error ? "자산 정보를 불러오는 중 오류가 발생했습니다." : null,
  };
};
```

### 장점

- 컴포넌트 언마운트 시 React Query가 자동으로 폴링 중단 → 메모리 누수 없음
- `ocrStatus`가 `completed`/`failed`가 되면 `refetchInterval: false`로 폴링 자동 종료
- React Query devtools에서 폴링 상태 확인 가능
- 에러 시 자동 재시도 (`retry` 옵션)

### 완료 기준

- 파일 업로드 후 OCR 처리 중 polling이 정상 동작
- `completed` 상태가 되면 polling 중단
- 컴포넌트 언마운트 후 네트워크 탭에서 폴링 요청이 멈추는 것 확인

---

## 5-B. getNoteDetailWithAllConversations `while` 루프 제거

### 작업 대상 파일

- `src/features/notes/api/notes_api.ts` — `getNoteDetailWithAllConversations` 함수 (line 107~156)
- 이 함수를 사용하는 hook 파악 필요 (아래 확인 명령 실행)

```bash
rg "getNoteDetailWithAllConversations" src/ -l
```

### 현재 상태

```ts
// notes_api.ts line 107~156 — 문제 있는 while 루프
export const getNoteDetailWithAllConversations = async (noteId, params) => {
  const firstResponse = await getNoteDetail(noteId, {
    ...params,
    conversationPage: 0,
  });
  const firstResult = firstResponse.result;

  if (!firstResult.conversationPageInfo?.hasNext) return firstResponse;

  let currentPage = firstResult.conversationPageInfo.page;
  let hasNext = firstResult.conversationPageInfo.hasNext;
  let mergedConversations = [...firstResult.conversations];

  // ❌ 대화 내역이 많을수록 채팅방 진입 시간이 선형으로 증가
  while (hasNext) {
    const nextPage = currentPage + 1;
    const pageResponse = await getNoteDetail(noteId, {
      ...params,
      conversationPage: nextPage,
    });
    mergedConversations = [
      ...mergedConversations,
      ...pageResponse.result.conversations,
    ];
    currentPage = nextPage;
    hasNext = pageResponse.result.conversationPageInfo.hasNext;
  }

  return {
    ...firstResponse,
    result: { ...firstResult, conversations: mergedConversations },
  };
};
```

### 문제점

- 대화가 100개면 2번, 1000개면 20번(50개씩) API를 순차 호출
- 모든 요청이 완료될 때까지 채팅 화면이 빈 상태로 대기
- 네트워크 지연이 곱으로 누적됨

### 변경 방향 — useInfiniteQuery 기반 지연 로딩

채팅방 진입 시 전체 내역을 다 불러오는 것이 아니라, 첫 페이지만 먼저 보여주고  
스크롤이 위로 올라갈 때 이전 대화를 추가 로드하는 방식으로 전환한다.

**Step 1. `getNoteDetailWithAllConversations` 사용을 중단**  
이 함수를 호출하는 hook에서 `getNoteDetail` (단일 페이지)로 교체한다.

**Step 2. useInfiniteQuery 도입**

```ts
// src/features/chat/hooks/useChatMessages.ts (또는 관련 훅) — 변경 후
import { useInfiniteQuery } from "@tanstack/react-query";
import { getNoteDetail } from "@/features/notes/api/notes_api";

export const useChatHistory = (noteId: number) => {
  return useInfiniteQuery({
    queryKey: ["chat-history", noteId],
    queryFn: ({ pageParam = 0 }) =>
      getNoteDetail(noteId, {
        conversationPage: pageParam,
        conversationSize: 50,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const pageInfo = lastPage.result.conversationPageInfo;
      return pageInfo?.hasNext ? pageInfo.page + 1 : undefined;
    },
    // 최신 메시지가 먼저 보이도록 역순 정렬은 컴포넌트에서 처리
  });
};
```

**Step 3. 스크롤 시 이전 메시지 로드**

```tsx
// ChatMessages.tsx — 스크롤 위로 올릴 때 다음 페이지 로드
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useChatHistory(noteId);

const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  const { scrollTop } = e.currentTarget;
  if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }
};

// 메시지는 모든 페이지를 flat하게 펼쳐서 사용
const allMessages =
  data?.pages.flatMap((page) => page.result.conversations) ?? [];
```

### ⚠️ 전제 조건 — 먼저 현재 채팅 데이터 흐름 분석 필수

이 작업은 단순 성능 개선이 아니라 **채팅 UX 변경**이다.  
무한 스크롤 전환 전에 아래 사항을 먼저 분석하고 설계를 확정해야 한다.

```
분석 대상:
  - useChatMessages.ts: 현재 메시지 상태 관리 방식
  - ChatMessages.tsx: 스크롤 위치 유지 로직
  - useViewerSync.ts: 뷰어-채팅 동기화 로직

확인해야 할 질문:
  1. 현재 채팅 메시지가 최신 → 과거 순인가, 과거 → 최신 순인가?
  2. 새 메시지 수신 시 자동 스크롤 다운이 구현되어 있는가?
  3. 스크롤 위치 복원 로직이 있는가?
  4. 메시지 렌더링이 스트리밍(SSE)과 얼마나 얽혀 있는가?
```

분석 없이 `useInfiniteQuery`를 바로 적용하면 스크롤 위치가 튀거나,  
새 메시지 자동 스크롤이 깨지거나, 뷰어 동기화가 끊어질 수 있다.  
**이 작업은 반드시 설계 리뷰 후 별도 PR로 진행한다.**

### ⚠️ 기타 주의

- `getNoteDetailWithAllConversations` 함수는 작업 완료 후 삭제

### 완료 기준

- 채팅방 진입 시 첫 페이지만 로드하여 빠르게 화면 표시
- 스크롤 위로 올릴 때 이전 메시지 추가 로드 동작
- `getNoteDetailWithAllConversations`의 `while` 루프 코드 제거

---

## 5-C. Notes 삭제 N+1 문제 해결

### 작업 대상 파일

`src/features/notes/api/notes_api.ts` — `deleteNotesBulk` 함수 (line 159~201)

### 현재 상태

```ts
// 현재 코드 — 이름은 Bulk이지만 실제로는 N번 API 호출
export const deleteNotesBulk = async (noteIds: number[]) => {
  const chunks = chunkNoteIds(noteIds, MAX_CONCURRENT_NOTE_DELETES); // 5개씩 분할

  for (const chunk of chunks) {
    // ❌ 청크마다 병렬 DELETE 요청 → N개 삭제 시 N번 HTTP 요청
    const results = await Promise.allSettled(
      chunk.map((noteId) => deleteNote(noteId)),
    );
    // ...
  }
};
```

### Storage와 비교

```ts
// assets_api.ts — 이미 올바르게 구현된 Bulk Delete (참고용)
export const deleteAssetsBulk = async (data: BulkDeleteRequest) => {
  // ✅ ID 배열을 body에 담아 단 1번 호출
  const response = await apiClient.delete(`/api/storage/assets`, { data });
  return response.data;
};
```

### 변경 방향

**백엔드 팀에 Notes Bulk Delete API 추가 요청**

```
요청 스펙:
  Method: DELETE
  Path: /api/notes/bulk (또는 /api/notes)
  Body: { noteIds: number[] }
  Response: { deletedCount: number, deletedNoteIds: number[], failedNoteIds: number[] }
```

**백엔드 API 완성 후 프론트엔드 수정**

```ts
// notes_api.ts — 변경 후
export const deleteNotesBulk = async (
  noteIds: number[],
): Promise<ApiResponse<DeleteNotesBulkResult>> => {
  // ✅ 단 1번의 HTTP 요청으로 전량 삭제
  const response = await apiClient.delete<ApiResponse<DeleteNotesBulkResult>>(
    `${NOTES_BASE}/bulk`,
    { data: { noteIds } },
  );
  return response.data;
};
```

### 백엔드 API 전까지 임시 조치

현재 청크 방식(`MAX_CONCURRENT_NOTE_DELETES = 5`)을 유지하되,  
에러 처리 UX를 개선한다 (부분 실패 시 사용자에게 명확하게 안내).

### 완료 기준

- 10개 노트 삭제 시 네트워크 탭에서 DELETE 요청이 1번만 발생
- 삭제 성공/실패 결과가 UI에 정상 반영
- `deleteNote` 단건 함수는 유지 (단건 삭제 기능에서 계속 사용)

---

## 5-D. 인라인 스타일 최종 정리

### 작업 대상

Notes, Storage, Settings 등 비즈니스 컴포넌트에 잔존하는 인라인 스타일 및 하드코딩 색상

### 전제 조건

Phase 1 Design Token 등록 완료 필수. 토큰 없이 교체하면 다시 하드코딩하게 된다.

### 탐색 명령 (작업 전 범위 파악)

```bash
# 인라인 스타일 사용 파일 목록
rg "style=\{\{" src/features/ -l

# 하드코딩 hex 색상 클래스 사용 파일 목록
rg "text-\[#|bg-\[#|border-\[#" src/features/ -l

# 하드코딩 hex 색상 직접 사용 (style 속성 내)
rg "#[0-9A-Fa-f]{6}" src/features/
```

### 교체 패턴

```tsx
// Before — 인라인 스타일
<div style={{ backgroundColor: "#F1F4F8", color: "#414141", padding: "16px" }}>

// After — 디자인 토큰 클래스
<div className="bg-gray-50 text-text-main p-4">
```

```tsx
// Before — 하드코딩 색상 클래스
<span className="text-[#2046FF] font-semibold">

// After — 토큰 클래스
<span className="text-primary-main font-semibold">
```

### 우선순위

1. 사용자에게 자주 노출되는 컴포넌트 우선 (NotesPage, ChatPage, StoragePage)
2. 모달 컴포넌트 (DeleteNotesModal, SettingsModal 등)
3. 카드, 리스트 아이템 등 반복 컴포넌트

### 완료 기준

- `rg "style=\{\{" src/features/` 결과가 없거나 불가피한 경우만 남음
- `rg "text-\[#|bg-\[#" src/features/` 결과가 없거나 불가피한 경우만 남음
- 전체 페이지 육안 검토 완료 (색상 깨짐 없는지 확인)

---

## 완료 기준 (Phase 5 전체)

- [ ] 파일 업로드 → OCR 폴링 → 완료 플로우 정상 동작 (메모리 누수 없음)
- [ ] 채팅방 진입 시 첫 페이지 빠르게 표시, 스크롤 시 이전 메시지 추가 로드
- [ ] `getNoteDetailWithAllConversations`의 `while` 루프 코드 제거
- [ ] Notes 삭제가 단일 Bulk API 1번 호출로 처리 (백엔드 API 완성 후)
- [ ] `src/features/` 내 `style={{` 인라인 스타일 전량 제거
- [ ] `src/features/` 내 하드코딩 hex 색상 클래스 전량 제거

---

## 전체 리팩토링 완료 기준

Phase 1~5가 모두 완료된 시점에 아래를 최종 확인한다.

**기능 테스트**

- [ ] 카카오/네이버/구글 소셜 로그인 → 노트 생성 → 채팅 → 파일 업로드 전체 플로우
- [ ] 로그아웃 후 보호 라우트 접근 차단 확인
- [ ] 새로고침 후 로그인 세션 유지 확인
- [ ] 401 자동 갱신 → 재시도 플로우 확인

**코드 품질**

- [ ] `npm run build` 에러 없음
- [ ] `src/` 내 `style={{` 인라인 스타일 없음 (불가피한 경우 주석으로 이유 명시)
- [ ] `src/` 내 하드코딩 hex 색상 클래스 없음
- [ ] `window.history.replaceState` 직접 조작 없음
- [ ] `auth_api.ts` 함수에서 `tokenUtils.setTokens()` 직접 호출 없음
