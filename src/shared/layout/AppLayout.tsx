import { Sidebar } from "./Sidebar";
import { useState } from "react";
import { Outlet } from "react-router-dom";

interface AppLayoutProps {
  backgroundColor?: string;
}

export function AppLayout({
  backgroundColor = "bg-[#F8F9FA]",
}: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`flex min-h-screen w-full ${backgroundColor}`}>
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={setIsCollapsed}
      />
      <main
        className={`relative flex flex-1 flex-col transition-all duration-300`}
      >
        <Outlet />
      </main>
    </div>
  );
}
