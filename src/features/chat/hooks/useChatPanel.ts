import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useResizable } from "./useResizable";
import type { PanelTab } from "../components";

const VALID_PANEL_TABS: PanelTab[] = ["viewer", "storage"];

const isValidPanelTab = (value: string | null): value is PanelTab =>
  value !== null && VALID_PANEL_TABS.includes(value as PanelTab);

interface UseChatPanelOptions {
  hasViewerFile: boolean;
  assets?: { length: number } | null;
}

export const useChatPanel = ({
  hasViewerFile,
  assets,
}: UseChatPanelOptions) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const panelParam = searchParams.get("panel");
  const fileId = searchParams.get("file");

  const [fallbackTab, setFallbackTab] = useState<PanelTab>(
    isValidPanelTab(panelParam) ? panelParam : "viewer",
  );
  const [viewerOpenOverride, setViewerOpenOverride] = useState<boolean | null>(
    () => (fileId ? true : null),
  );

  const activeTab = isValidPanelTab(panelParam) ? panelParam : fallbackTab;
  const hasAutoOpenContent =
    (assets && assets.length > 0) || hasViewerFile || !!fileId;
  const isViewerOpen = !!fileId || (viewerOpenOverride ?? hasAutoOpenContent);

  const {
    width: leftPanelWidth,
    isDragging,
    handleMouseDown,
    handleTouchStart,
  } = useResizable({
    initialWidth: 50,
    leftMinPx: 382,
    rightMinPx: 330,
  });

  const handleTabChange = useCallback(
    (tab: PanelTab) => {
      setFallbackTab(tab);
      setViewerOpenOverride(true);
      setSearchParams(
        (sp) => {
          if (tab === "viewer") {
            sp.delete("panel");
          } else {
            sp.set("panel", tab);
          }
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleToggleViewer = useCallback(() => {
    if (isViewerOpen) {
      setSearchParams(
        (sp) => {
          sp.delete("panel");
          sp.delete("file");
          return sp;
        },
        { replace: true },
      );
      setViewerOpenOverride(false);
      return;
    }

    setViewerOpenOverride(true);
  }, [isViewerOpen, setSearchParams]);

  return {
    activeTab,
    fileId,
    isViewerOpen,
    leftPanelWidth,
    isDragging,
    handleMouseDown,
    handleTouchStart,
    handleTabChange,
    handleToggleViewer,
  };
};
