import { Sidebar } from "./sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* 왼쪽 사이드바 고정 */}
      <Sidebar />

      {/* 오른쪽 본문 영역 */}
      <main className="flex flex-1 flex-col items-center overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
