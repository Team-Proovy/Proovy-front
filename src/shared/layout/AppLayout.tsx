import { Sidebar } from "./Sidebar";
import React, { useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
  backgroundColor?: string;
}

export function AppLayout({
  children,
  backgroundColor = "bg-[#F8F9FA]",
}: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`flex min-h-screen w-full ${backgroundColor}`}>
      {/* 왼쪽 사이드바 고정 */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={setIsCollapsed}
      />

      {/* 오른쪽 본문 영역 */}
      {/* Sidebar가 접히면(80px), 줄어든 160px(240px - 80px)만큼 padding-left를 추가하여 콘텐츠 위치 고정 */}
      <main
        className={`relative flex flex-1 flex-col transition-all duration-300 ${isCollapsed ? "pl-[160px]" : ""}`}
      >
        {children}
      </main>
    </div>
  );
}
