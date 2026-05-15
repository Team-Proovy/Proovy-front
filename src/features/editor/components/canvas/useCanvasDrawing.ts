import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type {
  ArrowItem,
  CanvasItem,
  CanvasTool,
  CircleItem,
  DraftShape,
  KonvaEvent,
  KonvaStage,
  LineItem,
  RectItem,
  StrokeItem,
  ViewportState,
} from "./canvas_types";
import {
  createId,
  getPointerPressure,
  getScenePointFromStage,
} from "./canvas_utils";
import {
  DEFAULT_ERASER_SIZE,
  DEFAULT_PEN_SIZE,
  MIN_POINT_DISTANCE,
} from "./canvas_constants";

interface UseCanvasDrawingOptions {
  stageRef: RefObject<KonvaStage | null>;
  stageSize: { width: number; height: number };
  viewportRef: RefObject<ViewportState>;
}

export interface UseCanvasDrawingReturn {
  tool: CanvasTool;
  setTool: (tool: CanvasTool) => void;
  items: CanvasItem[];
  activeStroke: StrokeItem | null;
  draftShape: DraftShape | null;
  selectedImageId: string | null;
  setSelectedImageId: (id: string | null) => void;
  penSize: number;
  setPenSize: (size: number) => void;
  eraserSize: number;
  setEraserSize: (size: number) => void;
  allowFingerDrawing: boolean;
  setAllowFingerDrawing: (allow: boolean) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  hasContent: () => boolean;
  commitItems: (
    nextItems: CanvasItem[] | ((prev: CanvasItem[]) => CanvasItem[]),
  ) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  clearCanvas: () => void;
  handlePointerDown: (event: KonvaEvent<PointerEvent>) => void;
  handlePointerMove: (event: KonvaEvent<PointerEvent>) => void;
  handlePointerUp: (event?: PointerEvent) => void;
  handleImageFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  abortActiveStroke: () => void;
}

export const useCanvasDrawing = ({
  stageRef,
  stageSize,
  viewportRef,
}: UseCanvasDrawingOptions): UseCanvasDrawingReturn => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [tool, setTool] = useState<CanvasTool>("pen");
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [, setUndoStack] = useState<CanvasItem[][]>([]);
  const [, setRedoStack] = useState<CanvasItem[][]>([]);
  const [activeStroke, setActiveStroke] = useState<StrokeItem | null>(null);
  const [draftShape, setDraftShape] = useState<DraftShape | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [penSize, setPenSize] = useState(DEFAULT_PEN_SIZE);
  const [eraserSize, setEraserSize] = useState(DEFAULT_ERASER_SIZE);
  const [allowFingerDrawing, setAllowFingerDrawing] = useState(false);

  const activeStrokeRef = useRef<StrokeItem | null>(null);
  const strokeRafRef = useRef<number | null>(null);
  const isDrawingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const documentPointerMoveRef = useRef<((event: PointerEvent) => void) | null>(
    null,
  );
  const documentPointerEndRef = useRef<((event: PointerEvent) => void) | null>(
    null,
  );
  const documentListenersAttachedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (strokeRafRef.current !== null) {
        cancelAnimationFrame(strokeRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (tool !== "select") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedImageId(null);
    }
  }, [tool]);

  const commitItems = useCallback(
    (nextItems: CanvasItem[] | ((prev: CanvasItem[]) => CanvasItem[])) => {
      setItems((prev) => {
        const resolved =
          typeof nextItems === "function" ? nextItems(prev) : nextItems;
        setUndoStack((stack) => [...stack, prev]);
        setRedoStack([]);
        return resolved;
      });
    },
    [],
  );

  const scheduleStrokeRender = useCallback(() => {
    if (strokeRafRef.current !== null) return;

    strokeRafRef.current = requestAnimationFrame(() => {
      strokeRafRef.current = null;
      const snapshot = activeStrokeRef.current;
      setActiveStroke(
        snapshot ? { ...snapshot, points: [...snapshot.points] } : null,
      );
    });
  }, []);

  const pushStrokePoint = useCallback(
    (point: { x: number; y: number; pressure: number }) => {
      const stroke = activeStrokeRef.current;
      if (!stroke) return;

      const prevPoint = stroke.points[stroke.points.length - 1];
      if (prevPoint) {
        const distance = Math.hypot(
          point.x - prevPoint.x,
          point.y - prevPoint.y,
        );
        if (distance < MIN_POINT_DISTANCE) {
          prevPoint.pressure = (prevPoint.pressure + point.pressure) / 2;
          return;
        }
      }

      stroke.points.push(point);
      scheduleStrokeRender();
    },
    [scheduleStrokeRender],
  );

  const pushStrokePointerEvent = useCallback(
    (nativeEvent: PointerEvent) => {
      const stage = stageRef.current;
      if (!stage) return;

      stage.setPointersPositions(nativeEvent);
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scenePoint = getScenePointFromStage(stage, pointer);
      const pressure = getPointerPressure(nativeEvent);
      pushStrokePoint({ x: scenePoint.x, y: scenePoint.y, pressure });
    },
    [pushStrokePoint, stageRef],
  );

  const pushStrokePointerEvents = useCallback(
    (nativeEvent: PointerEvent) => {
      const nativeEvents =
        typeof nativeEvent.getCoalescedEvents === "function"
          ? nativeEvent.getCoalescedEvents()
          : [nativeEvent];
      for (const event of nativeEvents) {
        pushStrokePointerEvent(event);
      }
    },
    [pushStrokePointerEvent],
  );

  const removeStrokeDocumentListeners = useCallback(() => {
    if (!documentListenersAttachedRef.current) return;

    const moveHandler = documentPointerMoveRef.current;
    const endHandler = documentPointerEndRef.current;
    if (moveHandler) document.removeEventListener("pointermove", moveHandler);
    if (endHandler) {
      document.removeEventListener("pointerup", endHandler);
      document.removeEventListener("pointercancel", endHandler);
    }
    documentListenersAttachedRef.current = false;
  }, []);

  const addStrokeDocumentListeners = useCallback(() => {
    if (documentListenersAttachedRef.current) return;

    const moveHandler = documentPointerMoveRef.current;
    const endHandler = documentPointerEndRef.current;
    if (!moveHandler || !endHandler) return;

    document.addEventListener("pointermove", moveHandler, { passive: false });
    document.addEventListener("pointerup", endHandler, { passive: false });
    document.addEventListener("pointercancel", endHandler, { passive: false });
    documentListenersAttachedRef.current = true;
  }, []);

  const handleUndo = useCallback(() => {
    setUndoStack((prevUndo) => {
      if (prevUndo.length === 0) return prevUndo;
      const previousItems = prevUndo[prevUndo.length - 1];
      setItems((currentItems) => {
        setRedoStack((prevRedo) => [...prevRedo, currentItems]);
        return previousItems;
      });
      return prevUndo.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;
      const nextItems = prevRedo[prevRedo.length - 1];
      setItems((currentItems) => {
        setUndoStack((prevUndo) => [...prevUndo, currentItems]);
        return nextItems;
      });
      return prevRedo.slice(0, -1);
    });
  }, []);

  const clearCanvas = useCallback(() => {
    if (items.length === 0) return;
    setSelectedImageId(null);
    commitItems([]);
  }, [commitItems, items.length]);

  const hasContent = useCallback(() => items.length > 0, [items.length]);

  const abortActiveStroke = useCallback(() => {
    isDrawingRef.current = false;
    if (strokeRafRef.current !== null) {
      cancelAnimationFrame(strokeRafRef.current);
      strokeRafRef.current = null;
    }
    activeStrokeRef.current = null;
    setActiveStroke(null);
    setDraftShape(null);
    removeStrokeDocumentListeners();

    const stageContainer = stageRef.current?.container();
    const activePointerId = activePointerIdRef.current;
    if (
      stageContainer &&
      activePointerId !== null &&
      typeof stageContainer.releasePointerCapture === "function"
    ) {
      try {
        stageContainer.releasePointerCapture(activePointerId);
      } catch {
        // Pointer capture may already be released by the browser.
      }
    }
    activePointerIdRef.current = null;
  }, [removeStrokeDocumentListeners, stageRef]);

  const handlePointerUp = useCallback(
    (event?: PointerEvent) => {
      if (
        event &&
        activePointerIdRef.current !== null &&
        event.pointerId !== activePointerIdRef.current
      ) {
        return;
      }

      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      removeStrokeDocumentListeners();

      const stageContainer = stageRef.current?.container();
      const activePointerId = activePointerIdRef.current;
      if (
        stageContainer &&
        activePointerId !== null &&
        typeof stageContainer.releasePointerCapture === "function"
      ) {
        try {
          stageContainer.releasePointerCapture(activePointerId);
        } catch {
          // Pointer capture may already be released by the browser.
        }
      }
      activePointerIdRef.current = null;

      const stroke = activeStrokeRef.current;
      if (stroke) {
        if (stroke.points.length > 0) {
          commitItems((prevItems) => [...prevItems, stroke]);
        }
        activeStrokeRef.current = null;
        setActiveStroke(null);
      }

      if (draftShape) {
        const { x1, y1, x2, y2, kind } = draftShape;
        const color = "#1F2937";

        if (kind === "rect") {
          const rectItem: RectItem = {
            id: createId(),
            kind: "rect",
            x: Math.min(x1, x2),
            y: Math.min(y1, y2),
            width: Math.abs(x2 - x1),
            height: Math.abs(y2 - y1),
            color,
          };
          if (rectItem.width > 2 && rectItem.height > 2) {
            commitItems((prevItems) => [...prevItems, rectItem]);
          }
        }

        if (kind === "circle") {
          const radius = Math.hypot(x2 - x1, y2 - y1);
          if (radius > 2) {
            const circleItem: CircleItem = {
              id: createId(),
              kind: "circle",
              x: x1,
              y: y1,
              radius,
              color,
            };
            commitItems((prevItems) => [...prevItems, circleItem]);
          }
        }

        if (kind === "line") {
          if (Math.hypot(x2 - x1, y2 - y1) > 2) {
            const lineItem: LineItem = {
              id: createId(),
              kind: "line",
              x1,
              y1,
              x2,
              y2,
              color,
            };
            commitItems((prevItems) => [...prevItems, lineItem]);
          }
        }

        if (kind === "arrow") {
          if (Math.hypot(x2 - x1, y2 - y1) > 2) {
            const arrowItem: ArrowItem = {
              id: createId(),
              kind: "arrow",
              x1,
              y1,
              x2,
              y2,
              color,
            };
            commitItems((prevItems) => [...prevItems, arrowItem]);
          }
        }

        setDraftShape(null);
      }
    },
    [commitItems, draftShape, removeStrokeDocumentListeners, stageRef],
  );

  const handleDocumentPointerMove = useCallback(
    (event: PointerEvent) => {
      if (
        activePointerIdRef.current !== event.pointerId ||
        !isDrawingRef.current ||
        (tool !== "pen" && tool !== "eraser")
      ) {
        return;
      }
      if (event.cancelable) event.preventDefault();
      pushStrokePointerEvents(event);
    },
    [pushStrokePointerEvents, tool],
  );

  const handleDocumentPointerEnd = useCallback(
    (event: PointerEvent) => {
      if (activePointerIdRef.current !== event.pointerId) return;
      if (event.cancelable) event.preventDefault();
      pushStrokePointerEvents(event);
      handlePointerUp();
    },
    [handlePointerUp, pushStrokePointerEvents],
  );

  useEffect(() => {
    documentPointerMoveRef.current = handleDocumentPointerMove;
    documentPointerEndRef.current = handleDocumentPointerEnd;

    return () => {
      removeStrokeDocumentListeners();
    };
  }, [
    handleDocumentPointerEnd,
    handleDocumentPointerMove,
    removeStrokeDocumentListeners,
  ]);

  const handlePointerDown = useCallback(
    (event: KonvaEvent<PointerEvent>) => {
      const stage = event.target.getStage();
      if (!stage) return;

      const stagePointer = stage.getPointerPosition();
      if (!stagePointer) return;

      const scenePoint = getScenePointFromStage(stage, stagePointer);

      if (tool === "select") {
        if (event.target === stage) setSelectedImageId(null);
        return;
      }

      if (tool === "hand") return;

      if (event.evt.pointerType === "touch" && !allowFingerDrawing) return;

      isDrawingRef.current = true;
      setSelectedImageId(null);

      if (tool === "pen" || tool === "eraser") {
        activePointerIdRef.current = event.evt.pointerId;
        const stageContainer = stage.container();
        if (typeof stageContainer.setPointerCapture === "function") {
          try {
            stageContainer.setPointerCapture(event.evt.pointerId);
          } catch {
            // Some browsers can reject capture for stylus/touch transitions.
          }
        }
        addStrokeDocumentListeners();

        const pressure = getPointerPressure(event.evt);
        const stroke: StrokeItem = {
          id: createId(),
          kind: "stroke",
          color: "#111827",
          size: tool === "eraser" ? eraserSize : penSize,
          eraser: tool === "eraser",
          points: [{ x: scenePoint.x, y: scenePoint.y, pressure }],
        };

        activeStrokeRef.current = stroke;
        setActiveStroke(stroke);
        return;
      }

      setDraftShape({
        kind: tool,
        x1: scenePoint.x,
        y1: scenePoint.y,
        x2: scenePoint.x,
        y2: scenePoint.y,
      });
    },
    [addStrokeDocumentListeners, allowFingerDrawing, eraserSize, penSize, tool],
  );

  const handlePointerMove = useCallback(
    (event: KonvaEvent<PointerEvent>) => {
      if (!isDrawingRef.current) return;
      if (tool === "pen" || tool === "eraser") return;

      const stage = event.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scenePoint = getScenePointFromStage(stage, pointer);
      setDraftShape((prevShape) => {
        if (!prevShape) return prevShape;
        return { ...prevShape, x2: scenePoint.x, y2: scenePoint.y };
      });
    },
    [tool],
  );

  const handleImageFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      event.target.value = "";
      if (!selectedFile) return;

      const objectUrl = URL.createObjectURL(selectedFile);
      const imageElement = new Image();

      imageElement.onload = () => {
        const maxWidth = stageSize.width * 0.6;
        const maxHeight = stageSize.height * 0.6;
        const scale = Math.min(
          1,
          maxWidth / imageElement.width,
          maxHeight / imageElement.height,
        );

        const width = imageElement.width * scale;
        const height = imageElement.height * scale;

        const sceneCenter = {
          x:
            (stageSize.width / 2 - viewportRef.current.x) /
            viewportRef.current.scale,
          y:
            (stageSize.height / 2 - viewportRef.current.y) /
            viewportRef.current.scale,
        };

        const imageItem = {
          id: createId(),
          kind: "image" as const,
          x: sceneCenter.x - width / 2,
          y: sceneCenter.y - height / 2,
          width,
          height,
          image: imageElement,
        };

        commitItems((prevItems) => [...prevItems, imageItem]);
        setTool("select");
        setSelectedImageId(imageItem.id);
        URL.revokeObjectURL(objectUrl);
      };

      imageElement.onerror = () => {
        URL.revokeObjectURL(objectUrl);
      };

      imageElement.src = objectUrl;
    },
    [commitItems, stageSize.height, stageSize.width, viewportRef],
  );

  return {
    tool,
    setTool,
    items,
    activeStroke,
    draftShape,
    selectedImageId,
    setSelectedImageId,
    penSize,
    setPenSize,
    eraserSize,
    setEraserSize,
    allowFingerDrawing,
    setAllowFingerDrawing,
    fileInputRef,
    hasContent,
    commitItems,
    handleUndo,
    handleRedo,
    clearCanvas,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleImageFileChange,
    abortActiveStroke,
  };
};
