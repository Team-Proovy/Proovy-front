import { useState, useCallback, useRef, useEffect } from "react";
import type { ToolDto, ChatAssetDto } from "../types/editor_types";
import { useTools, useNoteAssets } from "./useEditorQueries";

interface UseAtMenuOptions {
  inputRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  noteId?: number | null;
}

interface UseAtMenuReturn {
  // @ 도구 메뉴
  isAtMenuOpen: boolean;
  setIsAtMenuOpen: (open: boolean) => void;
  menuPos: { bottom: number; left: number };
  focusedToolIndex: number;
  setFocusedToolIndex: (index: number) => void;
  selectedTool: string | null;
  selectedToolCode: string | null;
  filteredTools: ToolDto[];
  toolQuery: string;
  updateMenuPosition: () => void;
  handleToolSelect: (toolName: string, isFromMenu?: boolean) => void;
  handleAtMenuKeyDown: (e: React.KeyboardEvent) => boolean;

  // # 파일 멘션 메뉴
  isFileMenuOpen: boolean;
  setIsFileMenuOpen: (open: boolean) => void;
  fileMenuPos: { bottom: number; left: number };
  focusedFileIndex: number;
  setFocusedFileIndex: (index: number) => void;
  filteredAssets: ChatAssetDto[];
  fileQuery: string;
  mentionedAssets: ChatAssetDto[];
  handleFileSelect: (asset: ChatAssetDto) => void;
  clearMentionedAssets: () => void;
  isAssetsLoading: boolean;
}

/**
 * @ 도구 + # 파일 멘션 메뉴 통합 훅
 * - @ 입력: 도구 메뉴 열기 + 타이핑 필터링
 * - # 입력: 파일 메뉴 열기 + 타이핑 필터링
 * - 키보드 네비게이션 (Arrow Up/Down, Enter, Escape)
 * - 선택 시 입력창에 태그 삽입
 */
export const useAtMenu = ({
  inputRef,
  containerRef,
  noteId,
}: UseAtMenuOptions): UseAtMenuReturn => {
  // @ 도구 메뉴 상태
  const [isAtMenuOpen, setIsAtMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ bottom: 0, left: 0 });
  const [focusedToolIndex, setFocusedToolIndex] = useState<number>(0);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolQuery, setToolQuery] = useState("");
  const atStartOffsetRef = useRef<number | null>(null);

  // # 파일 메뉴 상태
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [fileMenuPos, setFileMenuPos] = useState({ bottom: 0, left: 0 });
  const [focusedFileIndex, setFocusedFileIndex] = useState<number>(0);
  const [fileQuery, setFileQuery] = useState("");
  const hashStartOffsetRef = useRef<number | null>(null);
  const [mentionedAssets, setMentionedAssets] = useState<ChatAssetDto[]>([]);

  // API 쿼리
  const { data: tools = [] } = useTools();
  const { data: assets = [], isLoading: isAssetsLoading } = useNoteAssets(
    noteId ?? null,
  );

  // 선택된 도구의 toolCode
  const selectedToolCode = selectedTool
    ? (tools.find((t) => t.name === selectedTool)?.toolCode ?? null)
    : null;

  // mentionedAssets 초기화
  const clearMentionedAssets = useCallback(() => {
    setMentionedAssets([]);
  }, []);

  // 필터링된 목록
  const filteredTools = toolQuery
    ? tools.filter((t) =>
        t.name.toLowerCase().includes(toolQuery.toLowerCase()),
      )
    : tools;

  const filteredAssets = fileQuery
    ? assets.filter((a) =>
        a.fileName.toLowerCase().includes(fileQuery.toLowerCase()),
      )
    : assets;

  // 캐럿 위치에서 @ 또는 # 이후 입력된 텍스트를 추출
  const getQueryAfterTrigger = useCallback(
    (startOffset: number | null): string => {
      if (startOffset === null) return "";
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return "";
      const range = sel.getRangeAt(0);
      if (range.startContainer.nodeType !== Node.TEXT_NODE) return "";
      const text = range.startContainer.textContent || "";
      const currentOffset = range.startOffset;
      if (currentOffset <= startOffset) return "";
      return text.slice(startOffset, currentOffset);
    },
    [],
  );

  // 메뉴 폭 상수 (@ 도구: 180px, # 파일: 560px)
  const TOOL_MENU_WIDTH = 180;
  const FILE_MENU_WIDTH = 660;

  // 메뉴 위치 계산 - 커서 위에 표시, 하단 고정 (IDE 자동완성 스타일)
  // containerRef 기준으로 계산 (position: absolute의 기준 = position: relative인 containerRef)
  const calcMenuPos = useCallback(
    (menuWidth: number) => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const container = containerRef.current;

        if (container) {
          const containerRect = container.getBoundingClientRect();
          // 캐럿의 실제 위치 (rect가 0이면 컨테이너 기준 fallback)
          const caretTop = rect.top === 0 ? containerRect.top + 20 : rect.top;
          const caretLeft =
            rect.left === 0 ? containerRect.left + 20 : rect.left;

          // left: 메뉴가 컨테이너 오른쪽을 넘지 않도록 클램핑
          const rawLeft = caretLeft - containerRect.left;
          const maxLeft = containerRect.width - menuWidth;
          const clampedLeft = Math.max(0, Math.min(rawLeft, maxLeft));

          return {
            // bottom: 컨테이너 하단에서 캐럿까지의 거리 + 간격
            bottom: containerRect.bottom - caretTop + 4,
            left: clampedLeft,
          };
        }
      }
      return { bottom: 0, left: 0 };
    },
    [containerRef],
  );

  const updateMenuPosition = useCallback(() => {
    setMenuPos(calcMenuPos(TOOL_MENU_WIDTH));
  }, [calcMenuPos]);

  // 트리거(@, #) + 이후 입력된 텍스트 삭제 후 태그 삽입
  const deleteTriggerAndQuery = useCallback(
    (startOffset: number | null, triggerChar: string) => {
      if (startOffset === null) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (range.startContainer.nodeType !== Node.TEXT_NODE) return;
      const textNode = range.startContainer;
      const text = textNode.textContent || "";
      const currentOffset = range.startOffset;

      // triggerChar를 포함해서 삭제 (@query 또는 #query 전체)
      const triggerIdx = text.lastIndexOf(triggerChar, startOffset);
      if (triggerIdx === -1) return;
      range.setStart(textNode, triggerIdx);
      range.setEnd(textNode, currentOffset);
      range.deleteContents();
    },
    [],
  );

  // 도구 선택 핸들러
  const handleToolSelect = useCallback(
    (toolName: string, isFromMenu: boolean = false) => {
      if (!toolName) {
        setSelectedTool(null);
        setToolQuery("");
        return;
      }
      setSelectedTool(toolName);
      if (isFromMenu) {
        deleteTriggerAndQuery(atStartOffsetRef.current, "@");
      }
      setToolQuery("");
      atStartOffsetRef.current = null;
    },
    [deleteTriggerAndQuery],
  );

  // 파일 선택 핸들러 - 입력창에 #파일명 태그 삽입
  const handleFileSelect = useCallback(
    (asset: ChatAssetDto) => {
      deleteTriggerAndQuery(hashStartOffsetRef.current, "#");

      // 입력창에 태그 스팬 삽입
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);

        const tag = document.createElement("span");
        tag.contentEditable = "false";
        tag.className =
          "inline-flex items-center rounded bg-[#E8EDFB] px-2 py-0.5 mx-0.5 text-[14px] font-medium text-[#3B5998] select-none";
        tag.dataset.assetId = String(asset.assetId);
        tag.textContent = `#${asset.fileName}`;

        range.insertNode(tag);

        // 태그 뒤에 커서 이동
        const space = document.createTextNode("\u00A0");
        tag.after(space);
        range.setStartAfter(space);
        range.setEndAfter(space);
        sel.removeAllRanges();
        sel.addRange(range);
      }

      setMentionedAssets((prev) => {
        if (prev.some((a) => a.assetId === asset.assetId)) return prev;
        return [...prev, asset];
      });

      setFileQuery("");
      hashStartOffsetRef.current = null;
      setIsFileMenuOpen(false);
    },
    [deleteTriggerAndQuery],
  );

  // input 이벤트 감지: 타이핑 시 필터 업데이트
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleInput = () => {
      if (isAtMenuOpen && atStartOffsetRef.current !== null) {
        const q = getQueryAfterTrigger(atStartOffsetRef.current);
        setToolQuery(q);
        setFocusedToolIndex(0);
      }
      if (isFileMenuOpen && hashStartOffsetRef.current !== null) {
        const q = getQueryAfterTrigger(hashStartOffsetRef.current);
        setFileQuery(q);
        setFocusedFileIndex(0);
      }
    };

    input.addEventListener("input", handleInput);
    return () => input.removeEventListener("input", handleInput);
  }, [inputRef, isAtMenuOpen, isFileMenuOpen, getQueryAfterTrigger]);

  // DOM 변경 감지: 멘션 span이 삭제되면 mentionedAssets 동기화
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const syncMentionedAssets = () => {
      const currentIds = new Set<number>();
      input
        .querySelectorAll<HTMLElement>("span[data-asset-id]")
        .forEach((el) => {
          const id = Number(el.dataset.assetId);
          if (!isNaN(id)) currentIds.add(id);
        });

      setMentionedAssets((prev) => {
        const filtered = prev.filter((a) => currentIds.has(a.assetId));
        return filtered.length === prev.length ? prev : filtered;
      });
    };

    const observer = new MutationObserver(syncMentionedAssets);
    observer.observe(input, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [inputRef]);

  // 키보드 이벤트 통합 핸들러
  const handleAtMenuKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      // ─── # 파일 메뉴 ───
      if (isFileMenuOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedFileIndex((prev) =>
            filteredAssets.length > 0 ? (prev + 1) % filteredAssets.length : 0,
          );
          return true;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusedFileIndex((prev) =>
            filteredAssets.length > 0
              ? (prev - 1 + filteredAssets.length) % filteredAssets.length
              : 0,
          );
          return true;
        }
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (filteredAssets[focusedFileIndex]) {
            handleFileSelect(filteredAssets[focusedFileIndex]);
          }
          return true;
        }
        if (e.key === "Escape") {
          setIsFileMenuOpen(false);
          setFileQuery("");
          hashStartOffsetRef.current = null;
          return true;
        }
        if (e.key === "Backspace") {
          // 쿼리가 비어있으면 메뉴 닫기
          const q = getQueryAfterTrigger(hashStartOffsetRef.current);
          if (q.length === 0) {
            setIsFileMenuOpen(false);
            setFileQuery("");
            hashStartOffsetRef.current = null;
          }
          return false;
        }
        // 다른 키는 타이핑으로 간주 → input 이벤트에서 필터링
        return false;
      }

      // ─── @ 도구 메뉴 ───
      if (isAtMenuOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedToolIndex((prev) =>
            filteredTools.length > 0 ? (prev + 1) % filteredTools.length : 0,
          );
          return true;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusedToolIndex((prev) =>
            filteredTools.length > 0
              ? (prev - 1 + filteredTools.length) % filteredTools.length
              : 0,
          );
          return true;
        }
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (filteredTools[focusedToolIndex]) {
            handleToolSelect(filteredTools[focusedToolIndex].name, true);
            setIsAtMenuOpen(false);
          }
          return true;
        }
        if (e.key === "Escape") {
          setIsAtMenuOpen(false);
          setToolQuery("");
          atStartOffsetRef.current = null;
          return true;
        }
        if (e.key === "Backspace") {
          const q = getQueryAfterTrigger(atStartOffsetRef.current);
          if (q.length === 0) {
            setIsAtMenuOpen(false);
            setToolQuery("");
            atStartOffsetRef.current = null;
          }
          return false;
        }
        return false;
      }

      // ─── 트리거 감지 ───
      if (e.key === "@") {
        setTimeout(() => {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            atStartOffsetRef.current = sel.getRangeAt(0).startOffset;
          }
          setMenuPos(calcMenuPos(TOOL_MENU_WIDTH));
          setIsAtMenuOpen(true);
          setFocusedToolIndex(0);
          setToolQuery("");
        }, 0);
        return false;
      }

      if (e.key === "#") {
        setTimeout(() => {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            hashStartOffsetRef.current = sel.getRangeAt(0).startOffset;
          }
          setFileMenuPos(calcMenuPos(FILE_MENU_WIDTH));
          setIsFileMenuOpen(true);
          setFocusedFileIndex(0);
          setFileQuery("");
        }, 0);
        return false;
      }

      return false;
    },
    [
      isAtMenuOpen,
      isFileMenuOpen,
      focusedToolIndex,
      focusedFileIndex,
      filteredTools,
      filteredAssets,
      handleToolSelect,
      handleFileSelect,
      calcMenuPos,
      getQueryAfterTrigger,
    ],
  );

  return {
    // @ 도구 메뉴
    isAtMenuOpen,
    setIsAtMenuOpen,
    menuPos,
    focusedToolIndex,
    setFocusedToolIndex,
    selectedTool,
    selectedToolCode,
    filteredTools,
    toolQuery,
    updateMenuPosition,
    handleToolSelect,
    handleAtMenuKeyDown,

    // # 파일 메뉴
    isFileMenuOpen,
    setIsFileMenuOpen,
    fileMenuPos,
    focusedFileIndex,
    setFocusedFileIndex,
    filteredAssets,
    fileQuery,
    mentionedAssets,
    handleFileSelect,
    clearMentionedAssets,
    isAssetsLoading,
  };
};
