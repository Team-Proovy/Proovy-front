import type { PanelTab } from "./types";
import { LeftPanelHeader } from "./LeftPanelHeader";
import { ViewerContent } from "./ViewerContent";
import { StorageContent } from "./StorageContent";

interface LeftPanelProps {
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  noteId: string;
  selectedFileId?: string;
}

export const LeftPanel = ({
  activeTab,
  onTabChange,
  noteId,
  selectedFileId,
}: LeftPanelProps) => {
  return (
    <div className="flex h-full flex-col bg-white">
      {/* 헤더 */}
      <LeftPanelHeader
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      {/* 탭 콘텐츠 */}
      <div className="min-w-0 flex-1 overflow-hidden">
        {activeTab === "viewer" && (
          <ViewerContent
            noteId={noteId}
            fileId={selectedFileId}
          />
        )}
        {activeTab === "storage" && (
          <StorageContent
            noteId={noteId}
            onTabChange={onTabChange}
          />
        )}
      </div>
    </div>
  );
};
