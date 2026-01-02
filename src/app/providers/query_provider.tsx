import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { PropsWithChildren } from "react";
import { useState } from "react";

export function AppQueryProvider({ children }: PropsWithChildren) {
  // QueryClient는 한 번만 생성되도록 state로 관리 (SSR 고려 시 필수 패턴)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 창 포커스 시 자동 재요청 방지 (개발 편의성)
            refetchOnWindowFocus: false,
            // 데이터가 '오래된(stale)' 상태로 간주되는 시간 (1분)
            staleTime: 1000 * 60,
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
