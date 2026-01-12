export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-white">{children}</div>
  );
}
