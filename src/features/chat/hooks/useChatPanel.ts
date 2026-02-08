import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useResizable } from "./useResizable";
import type { PanelTab } from "../components";

// 유효한 PanelTab 값 목록
const VALID_PANEL_TABS: PanelTab[] = ["viewer", "storage"];

const isValidPanelTab = (value: string | null): value is PanelTab =>
  value !== null && VALID_PANEL_TABS.includes(value as PanelTab);

interface UseChatPanelOptions {
  /** 뷰어 파일이 있으면 자동 열림 */
  hasViewerFile: boolean;
  /** API 에셋 목록 */
  assets?: { length: number } | null;
}

/**
 * 채팅 페이지 패널 레이아웃 관리 훅
 * - 좌측 패널 탭 (viewer/storage)
 * - 뷰어 열림/닫힘
 * - 패널 크기 조절 (드래그)
 * - URL 파라미터 동기화
 */
export const useChatPanel = ({
  hasViewerFile,
  assets,
}: UseChatPanelOptions) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const panelParam = searchParams.get("panel");
  const fileId = searchParams.get("file");

  const [activeTab, setActiveTab] = useState<PanelTab>(
    isValidPanelTab(panelParam) ? panelParam : "viewer",
  );

  const [isViewerOpen, setIsViewerOpen] = useState(!!fileId);

  const {
    width: leftPanelWidth,
    isDragging,
    handleMouseDown,
  } = useResizable({
    initialWidth: 50,
    leftMinPx: 382,
    rightMinPx: 302,
  });

  // 뷰어 자동 열기
  useEffect(() => {
    if ((assets && assets.length > 0) || hasViewerFile) {
      setIsViewerOpen(true);
    }
  }, [assets, hasViewerFile]);

  // URL 파라미터 동기화
  useEffect(() => {
    if (isViewerOpen) {
      setSearchParams((prev) => {
        prev.set("panel", activeTab);
        return prev;
      });
    }
  }, [activeTab, isViewerOpen, setSearchParams]);

  const handleTabChange = useCallback((tab: PanelTab) => {
    setActiveTab(tab);
  }, []);

  const handleToggleViewer = useCallback(() => {
    setIsViewerOpen((prev) => !prev);
  }, []);

  return {
    activeTab,
    fileId,
    isViewerOpen,
    leftPanelWidth,
    isDragging,
    handleMouseDown,
    handleTabChange,
    handleToggleViewer,
  };
};
