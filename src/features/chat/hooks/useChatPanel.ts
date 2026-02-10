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

  // URL searchParams 변경 감지 → activeTab 동기화
  // (StorageContent 등 외부에서 setSearchParams로 panel을 변경했을 때 반영)
  useEffect(() => {
    if (isValidPanelTab(panelParam) && panelParam !== activeTab) {
      setActiveTab(panelParam);
    }
  }, [panelParam]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = useCallback((tab: PanelTab) => {
    setActiveTab(tab);
    setIsViewerOpen(true);
  }, []);

  const handleToggleViewer = useCallback(() => {
    setIsViewerOpen((prev) => {
      if (prev) {
        // 패널을 닫을 때 URL에서 panel/file 파라미터 제거
        setSearchParams(
          (sp) => {
            sp.delete("panel");
            sp.delete("file");
            return sp;
          },
          { replace: true },
        );
      }
      return !prev;
    });
  }, [setSearchParams]);

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
