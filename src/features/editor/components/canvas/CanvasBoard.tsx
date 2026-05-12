import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Arrow,
  Circle,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Transformer,
} from "react-konva";
import { getStroke } from "perfect-freehand";

type CanvasTool =
  | "select"
  | "hand"
  | "pen"
  | "eraser"
  | "rect"
  | "circle"
  | "line"
  | "arrow";

type KonvaStage = import("konva/lib/Stage").Stage;
type KonvaImageNode = import("konva/lib/shapes/Image").Image;
type KonvaTransformer = import("konva/lib/shapes/Transformer").Transformer;
type KonvaEvent<T> = import("konva/lib/Node").KonvaEventObject<T>;

interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
}

interface StrokeItem {
  id: string;
  kind: "stroke";
  color: string;
  size: number;
  eraser: boolean;
  points: StrokePoint[];
}

interface RectItem {
  id: string;
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface CircleItem {
  id: string;
  kind: "circle";
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface LineItem {
  id: string;
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

interface ArrowItem {
  id: string;
  kind: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

interface ImageItem {
  id: string;
  kind: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement;
}

type CanvasItem =
  | StrokeItem
  | RectItem
  | CircleItem
  | LineItem
  | ArrowItem
  | ImageItem;

interface DraftShape {
  kind: "rect" | "circle" | "line" | "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

interface PinchState {
  startDistance: number;
  scenePoint: { x: number; y: number };
}

export interface CanvasBoardApi {
  hasContent: () => boolean;
  exportBlob: () => Promise<Blob | null>;
}

interface CanvasBoardProps {
  className?: string;
  onMount?: (api: CanvasBoardApi) => void;
}

const TOOL_BUTTON_BASE =
  "rounded-md border px-2 py-1 text-xs font-medium transition-colors";
const MIN_SCALE = 0.35;
const MAX_SCALE = 4;
const ZOOM_FACTOR = 1.08;

const createId = () =>
  `canvas_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

const getPointerPressure = (evt: unknown) => {
  if (evt && typeof evt === "object" && "pressure" in evt) {
    const pressure = Number((evt as { pressure: number }).pressure);
    if (Number.isFinite(pressure) && pressure >= 0 && pressure <= 1) {
      return pressure;
    }
  }
  return 0.5;
};

const getStrokePolygon = (points: StrokePoint[], size: number) => {
  if (points.length < 2) {
    return [];
  }

  return getStroke(
    points.map((point) => [point.x, point.y, point.pressure] as const),
    {
      size,
      thinning: 0.72,
      smoothing: 0.78,
      streamline: 0.62,
      simulatePressure: false,
      last: true,
    },
  );
};

const getScenePointFromStage = (
  stage: KonvaStage,
  pointer: { x: number; y: number },
) => {
  const scale = stage.scaleX() || 1;
  return {
    x: (pointer.x - stage.x()) / scale,
    y: (pointer.y - stage.y()) / scale,
  };
};

const getTouchPoint = (stage: KonvaStage, touch: Touch) => {
  const rect = stage.container().getBoundingClientRect();
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
};

const StrokeShape = ({ item }: { item: StrokeItem }) => {
  const polygon = useMemo(
    () => getStrokePolygon(item.points, item.size),
    [item.points, item.size],
  );
  const linePoints = polygon.flatMap((point) => [point[0], point[1]]);

  if (linePoints.length < 6) {
    return null;
  }

  return (
    <Line
      points={linePoints}
      closed
      fill={item.eraser ? "#000" : item.color}
      globalCompositeOperation={item.eraser ? "destination-out" : "source-over"}
      listening={false}
    />
  );
};

export const CanvasBoard = ({ className = "", onMount }: CanvasBoardProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<KonvaStage | null>(null);
  const transformerRef = useRef<KonvaTransformer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stageSize, setStageSize] = useState({ width: 1, height: 1 });
  const [viewport, setViewport] = useState<ViewportState>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const viewportRef = useRef<ViewportState>(viewport);

  const [tool, setTool] = useState<CanvasTool>("pen");
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [, setUndoStack] = useState<CanvasItem[][]>([]);
  const [, setRedoStack] = useState<CanvasItem[][]>([]);
  const [activeStroke, setActiveStroke] = useState<StrokeItem | null>(null);
  const activeStrokeRef = useRef<StrokeItem | null>(null);
  const strokeRafRef = useRef<number | null>(null);
  const [draftShape, setDraftShape] = useState<DraftShape | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const isDrawingRef = useRef(false);
  const pinchStateRef = useRef<PinchState | null>(null);
  const [allowFingerDrawing, setAllowFingerDrawing] = useState(false);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  useEffect(() => {
    return () => {
      if (strokeRafRef.current !== null) {
        cancelAnimationFrame(strokeRafRef.current);
      }
    };
  }, []);

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

  const applyZoomAt = useCallback(
    (screenPoint: { x: number; y: number }, nextScale: number) => {
      setViewport((prev) => {
        const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
        const sceneX = (screenPoint.x - prev.x) / prev.scale;
        const sceneY = (screenPoint.y - prev.y) / prev.scale;

        return {
          x: screenPoint.x - sceneX * clampedScale,
          y: screenPoint.y - sceneY * clampedScale,
          scale: clampedScale,
        };
      });
    },
    [],
  );

  const scheduleStrokeRender = useCallback(() => {
    if (strokeRafRef.current !== null) {
      return;
    }

    strokeRafRef.current = requestAnimationFrame(() => {
      strokeRafRef.current = null;
      const snapshot = activeStrokeRef.current;
      setActiveStroke(
        snapshot
          ? {
              ...snapshot,
              points: [...snapshot.points],
            }
          : null,
      );
    });
  }, []);

  const pushStrokePoint = useCallback(
    (point: StrokePoint) => {
      const stroke = activeStrokeRef.current;
      if (!stroke) return;

      const prevPoint = stroke.points[stroke.points.length - 1];
      if (prevPoint) {
        const distance = Math.hypot(
          point.x - prevPoint.x,
          point.y - prevPoint.y,
        );

        if (distance < 0.28) {
          prevPoint.pressure = (prevPoint.pressure + point.pressure) / 2;
          return;
        }
      }

      stroke.points.push(point);
      scheduleStrokeRender();
    },
    [scheduleStrokeRender],
  );

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

  const resetView = useCallback(() => {
    setViewport({ x: 0, y: 0, scale: 1 });
  }, []);

  const hasContent = useCallback(() => items.length > 0, [items.length]);

  const exportBlob = useCallback<() => Promise<Blob | null>>(async () => {
    const stage = stageRef.current;
    if (!stage) return null;

    const transformer = transformerRef.current;
    if (transformer) {
      transformer.visible(false);
      transformer.getLayer()?.batchDraw();
    }

    const blob = (await stage.toBlob({ pixelRatio: 2 })) as Blob;

    if (transformer) {
      transformer.visible(true);
      transformer.getLayer()?.batchDraw();
    }

    return blob;
  }, []);

  useEffect(() => {
    onMount?.({ hasContent, exportBlob });
  }, [exportBlob, hasContent, onMount]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setStageSize({
        width: Math.max(1, container.clientWidth),
        height: Math.max(1, container.clientHeight),
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (tool !== "select") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedImageId(null);
    }
  }, [tool]);

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;

    if (!transformer || !stage) {
      return;
    }

    if (tool !== "select" || !selectedImageId) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const node = stage.findOne(`#image_${selectedImageId}`) as
      | KonvaImageNode
      | undefined;

    if (!node) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    transformer.nodes([node]);
    transformer.getLayer()?.batchDraw();
  }, [items, selectedImageId, tool]);

  const handlePointerDown = useCallback(
    (event: KonvaEvent<PointerEvent>) => {
      const stage = event.target.getStage();
      if (!stage) return;

      const stagePointer = stage.getPointerPosition();
      if (!stagePointer) return;

      const scenePoint = getScenePointFromStage(stage, stagePointer);

      if (tool === "select") {
        if (event.target === stage) {
          setSelectedImageId(null);
        }
        return;
      }

      if (tool === "hand") {
        return;
      }

      if (event.evt.pointerType === "touch" && !allowFingerDrawing) {
        return;
      }

      isDrawingRef.current = true;
      setSelectedImageId(null);

      if (tool === "pen" || tool === "eraser") {
        const pressure = getPointerPressure(event.evt);
        const stroke: StrokeItem = {
          id: createId(),
          kind: "stroke",
          color: "#111827",
          size: tool === "eraser" ? 22 : 7.6,
          eraser: tool === "eraser",
          points: [
            {
              x: scenePoint.x,
              y: scenePoint.y,
              pressure,
            },
          ],
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
    [allowFingerDrawing, tool],
  );

  const handlePointerMove = useCallback(
    (event: KonvaEvent<PointerEvent>) => {
      if (!isDrawingRef.current) return;

      const stage = event.target.getStage();
      if (!stage) return;

      if (tool === "pen" || tool === "eraser") {
        const nativeEvents =
          typeof event.evt.getCoalescedEvents === "function"
            ? event.evt.getCoalescedEvents()
            : [event.evt];

        for (const nativeEvent of nativeEvents) {
          stage.setPointersPositions(nativeEvent);
          const pointer = stage.getPointerPosition();
          if (!pointer) continue;

          const scenePoint = getScenePointFromStage(stage, pointer);
          const pressure = clamp(getPointerPressure(nativeEvent), 0.05, 1);
          pushStrokePoint({
            x: scenePoint.x,
            y: scenePoint.y,
            pressure,
          });
        }

        stage.setPointersPositions(event.evt);
        return;
      }

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scenePoint = getScenePointFromStage(stage, pointer);
      setDraftShape((prevShape) => {
        if (!prevShape) return prevShape;
        return {
          ...prevShape,
          x2: scenePoint.x,
          y2: scenePoint.y,
        };
      });
    },
    [pushStrokePoint, tool],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const stroke = activeStrokeRef.current;
    if (stroke) {
      if (stroke.points.length > 1) {
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
  }, [commitItems, draftShape]);

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

        const imageItem: ImageItem = {
          id: createId(),
          kind: "image",
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
    [commitItems, stageSize.height, stageSize.width],
  );

  const handleWheel = useCallback(
    (event: KonvaEvent<WheelEvent>) => {
      event.evt.preventDefault();

      const stage = event.target.getStage();
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const isZoomIn = event.evt.deltaY < 0;
      const nextScale =
        viewportRef.current.scale * (isZoomIn ? ZOOM_FACTOR : 1 / ZOOM_FACTOR);

      applyZoomAt(pointer, nextScale);
    },
    [applyZoomAt],
  );

  const handleTouchStart = useCallback((event: KonvaEvent<TouchEvent>) => {
    const stage = event.target.getStage();
    if (!stage) return;

    const touches = event.evt.touches;
    if (touches.length !== 2) return;

    if (event.evt.cancelable) {
      event.evt.preventDefault();
    }

    const pointA = getTouchPoint(stage, touches[0]);
    const pointB = getTouchPoint(stage, touches[1]);
    const center = {
      x: (pointA.x + pointB.x) / 2,
      y: (pointA.y + pointB.y) / 2,
    };

    const distance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
    const currentViewport = viewportRef.current;

    pinchStateRef.current = {
      startDistance: distance,
      scenePoint: {
        x: (center.x - currentViewport.x) / currentViewport.scale,
        y: (center.y - currentViewport.y) / currentViewport.scale,
      },
    };

    isDrawingRef.current = false;
    activeStrokeRef.current = null;
    setActiveStroke(null);
    setDraftShape(null);
  }, []);

  const handleTouchMove = useCallback((event: KonvaEvent<TouchEvent>) => {
    const stage = event.target.getStage();
    if (!stage) return;

    const touches = event.evt.touches;
    const pinchState = pinchStateRef.current;
    if (touches.length !== 2 || !pinchState) return;

    if (event.evt.cancelable) {
      event.evt.preventDefault();
    }

    const pointA = getTouchPoint(stage, touches[0]);
    const pointB = getTouchPoint(stage, touches[1]);

    const center = {
      x: (pointA.x + pointB.x) / 2,
      y: (pointA.y + pointB.y) / 2,
    };

    const distance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);

    const ratio = distance / pinchState.startDistance;
    const nextScale = clamp(
      viewportRef.current.scale * ratio,
      MIN_SCALE,
      MAX_SCALE,
    );

    setViewport(() => ({
      x: center.x - pinchState.scenePoint.x * nextScale,
      y: center.y - pinchState.scenePoint.y * nextScale,
      scale: nextScale,
    }));

    pinchStateRef.current = {
      startDistance: distance,
      scenePoint: pinchState.scenePoint,
    };
  }, []);

  const handleTouchEnd = useCallback(() => {
    pinchStateRef.current = null;
  }, []);

  const draftShapeNode = useMemo(() => {
    if (!draftShape) return null;
    const color = "#2563EB";

    if (draftShape.kind === "rect") {
      return (
        <Rect
          x={Math.min(draftShape.x1, draftShape.x2)}
          y={Math.min(draftShape.y1, draftShape.y2)}
          width={Math.abs(draftShape.x2 - draftShape.x1)}
          height={Math.abs(draftShape.y2 - draftShape.y1)}
          stroke={color}
          strokeWidth={2}
          dash={[6, 4]}
        />
      );
    }

    if (draftShape.kind === "circle") {
      return (
        <Circle
          x={draftShape.x1}
          y={draftShape.y1}
          radius={Math.hypot(
            draftShape.x2 - draftShape.x1,
            draftShape.y2 - draftShape.y1,
          )}
          stroke={color}
          strokeWidth={2}
          dash={[6, 4]}
        />
      );
    }

    if (draftShape.kind === "line") {
      return (
        <Line
          points={[draftShape.x1, draftShape.y1, draftShape.x2, draftShape.y2]}
          stroke={color}
          strokeWidth={2}
          dash={[6, 4]}
        />
      );
    }

    return (
      <Arrow
        points={[draftShape.x1, draftShape.y1, draftShape.x2, draftShape.y2]}
        stroke={color}
        fill={color}
        strokeWidth={2}
        pointerLength={10}
        pointerWidth={10}
        dash={[6, 4]}
      />
    );
  }, [draftShape]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-white/95 p-2 shadow-sm">
        {(
          [
            ["select", "선택"],
            ["hand", "손"],
            ["pen", "펜"],
            ["eraser", "지우개"],
            ["rect", "사각형"],
            ["circle", "원"],
            ["line", "직선"],
            ["arrow", "화살표"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTool(value)}
            className={`${TOOL_BUTTON_BASE} ${
              tool === value
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`${TOOL_BUTTON_BASE} border-gray-300 bg-white text-gray-700 hover:bg-gray-100`}
        >
          이미지
        </button>

        <button
          type="button"
          onClick={handleUndo}
          className={`${TOOL_BUTTON_BASE} border-gray-300 bg-white text-gray-700 hover:bg-gray-100`}
        >
          Undo
        </button>
        <button
          type="button"
          onClick={handleRedo}
          className={`${TOOL_BUTTON_BASE} border-gray-300 bg-white text-gray-700 hover:bg-gray-100`}
        >
          Redo
        </button>
        <button
          type="button"
          onClick={clearCanvas}
          className={`${TOOL_BUTTON_BASE} border-red-200 bg-red-50 text-red-600 hover:bg-red-100`}
        >
          Clear
        </button>

        <label className="ml-1 flex cursor-pointer items-center gap-1 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={allowFingerDrawing}
            onChange={(event) => setAllowFingerDrawing(event.target.checked)}
          />
          손가락 그리기 허용
        </label>
      </div>

      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-lg border border-gray-200 bg-white/95 p-2 text-xs shadow-sm">
        <button
          type="button"
          onClick={() =>
            applyZoomAt(
              { x: stageSize.width / 2, y: stageSize.height / 2 },
              viewport.scale / ZOOM_FACTOR,
            )
          }
          className={`${TOOL_BUTTON_BASE} border-gray-300 bg-white text-gray-700 hover:bg-gray-100`}
        >
          -
        </button>
        <button
          type="button"
          onClick={resetView}
          className={`${TOOL_BUTTON_BASE} border-gray-300 bg-white text-gray-700 hover:bg-gray-100`}
        >
          {Math.round(viewport.scale * 100)}%
        </button>
        <button
          type="button"
          onClick={() =>
            applyZoomAt(
              { x: stageSize.width / 2, y: stageSize.height / 2 },
              viewport.scale * ZOOM_FACTOR,
            )
          }
          className={`${TOOL_BUTTON_BASE} border-gray-300 bg-white text-gray-700 hover:bg-gray-100`}
        >
          +
        </button>
      </div>

      <Stage
        ref={stageRef}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        width={stageSize.width}
        height={stageSize.height}
        className="bg-white"
        style={{ touchAction: "none" }}
        draggable={tool === "hand"}
        onDragMove={(event) => {
          const stage = event.target.getStage();
          if (!stage) return;

          setViewport((prev) => ({
            ...prev,
            x: stage.x(),
            y: stage.y(),
          }));
        }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <Layer>
          {items.map((item) => {
            if (item.kind === "stroke") {
              return (
                <StrokeShape
                  key={item.id}
                  item={item}
                />
              );
            }

            if (item.kind === "rect") {
              return (
                <Rect
                  key={item.id}
                  x={item.x}
                  y={item.y}
                  width={item.width}
                  height={item.height}
                  stroke={item.color}
                  strokeWidth={2}
                />
              );
            }

            if (item.kind === "circle") {
              return (
                <Circle
                  key={item.id}
                  x={item.x}
                  y={item.y}
                  radius={item.radius}
                  stroke={item.color}
                  strokeWidth={2}
                />
              );
            }

            if (item.kind === "line") {
              return (
                <Line
                  key={item.id}
                  points={[item.x1, item.y1, item.x2, item.y2]}
                  stroke={item.color}
                  strokeWidth={2}
                />
              );
            }

            if (item.kind === "arrow") {
              return (
                <Arrow
                  key={item.id}
                  points={[item.x1, item.y1, item.x2, item.y2]}
                  stroke={item.color}
                  fill={item.color}
                  strokeWidth={2}
                  pointerLength={10}
                  pointerWidth={10}
                />
              );
            }

            return (
              <KonvaImage
                key={item.id}
                id={`image_${item.id}`}
                image={item.image}
                x={item.x}
                y={item.y}
                width={item.width}
                height={item.height}
                draggable={tool === "select"}
                onClick={() => {
                  if (tool === "select") {
                    setSelectedImageId(item.id);
                  }
                }}
                onTap={() => {
                  if (tool === "select") {
                    setSelectedImageId(item.id);
                  }
                }}
                onDragEnd={(event) => {
                  const target = event.target;
                  const x = target.x();
                  const y = target.y();

                  commitItems((prevItems) =>
                    prevItems.map((canvasItem) => {
                      if (
                        canvasItem.kind !== "image" ||
                        canvasItem.id !== item.id
                      ) {
                        return canvasItem;
                      }
                      return {
                        ...canvasItem,
                        x,
                        y,
                      };
                    }),
                  );
                }}
                onTransformEnd={(event) => {
                  const node = event.target as KonvaImageNode;
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();

                  const nextWidth = Math.max(24, node.width() * scaleX);
                  const nextHeight = Math.max(24, node.height() * scaleY);

                  node.scaleX(1);
                  node.scaleY(1);

                  commitItems((prevItems) =>
                    prevItems.map((canvasItem) => {
                      if (
                        canvasItem.kind !== "image" ||
                        canvasItem.id !== item.id
                      ) {
                        return canvasItem;
                      }

                      return {
                        ...canvasItem,
                        x: node.x(),
                        y: node.y(),
                        width: nextWidth,
                        height: nextHeight,
                      };
                    }),
                  );
                }}
              />
            );
          })}

          {activeStroke && <StrokeShape item={activeStroke} />}
          {draftShapeNode}
          <Transformer
            ref={transformerRef}
            rotateEnabled={false}
            enabledAnchors={[
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
            ]}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 24 || newBox.height < 24) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
};
