import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import axios from "axios";
import { showErrorToast } from "@/shared/lib/toast";
import { getErrorRedirectRoute } from "@/shared/api/client";

/**
 * react-query mutation meta 타입 보강.
 * - suppressGlobalErrorToast: 호출부에서 직접 에러를 표시하는 경우 전역 토스트를 끔
 * - errorMessage: 전역 토스트에 표시할 커스텀 메시지
 */
declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      suppressGlobalErrorToast?: boolean;
      errorMessage?: string;
    };
  }
}

const DEFAULT_ERROR_MESSAGE =
  "요청 처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.";

/** 에러에서 사용자에게 보여줄 메시지를 안전하게 추출 (원시 기술 메시지 노출 방지) */
const resolveErrorMessage = (error: unknown, override?: string): string => {
  if (override) return override;
  if (axios.isAxiosError(error)) {
    const serverMessage = (
      error.response?.data as { message?: string } | undefined
    )?.message;
    if (serverMessage) return serverMessage;
  }
  return DEFAULT_ERROR_MESSAGE;
};

export function AppQueryProvider({ children }: PropsWithChildren) {
  // QueryClient는 한 번만 생성되도록 state로 관리 (SSR 고려 시 필수 패턴)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // 개별 처리되지 않은 mutation 실패에 대한 전역 에러 토스트 안전망
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            // 호출부에서 자체 에러 UI를 표시하는 경우 옵트아웃
            if (mutation.meta?.suppressGlobalErrorToast) return;
            // 에러 페이지로 리다이렉트되는 에러는 토스트가 중복되므로 생략
            if (getErrorRedirectRoute(error)) return;

            showErrorToast(
              resolveErrorMessage(error, mutation.meta?.errorMessage),
            );
          },
        }),
        defaultOptions: {
          queries: {
            // 창 포커스 시 자동 재요청 방지 (개발 편의성)
            refetchOnWindowFocus: false,
            // 데이터가 '오래된(stale)' 상태로 간주되는 시간 (1분)
            staleTime: 1000 * 60,
            // 4xx(클라이언트 에러)는 재시도 무의미 → 비재시도, 그 외만 2회 재시도
            retry: (failureCount, error) => {
              if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                if (status && status >= 400 && status < 500) return false;
              }
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 개발 모드에서만 보이는 디버깅 툴 */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
