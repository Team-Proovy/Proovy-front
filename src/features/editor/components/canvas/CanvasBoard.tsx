import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
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
import type {
  CanvasBoardProps,
  KonvaEvent,
  KonvaImageNode,
  KonvaStage,
  KonvaTransformer,
} from "./canvas_types";
import {
  MAX_ERASER_SIZE,
  MAX_PEN_SIZE,
  MIN_ERASER_SIZE,
  MIN_PEN_SIZE,
  TOOL_BUTTON_BASE,
  ZOOM_FACTOR,
} from "./canvas_constants";
import { StrokeShape } from "./StrokeShape";
import { useCanvasViewport } from "./useCanvasViewport";
import { useCanvasDrawing } from "./useCanvasDrawing";

export type { CanvasBoardApi } from "./canvas_types";

export const CanvasBoard = ({ className = "", onMount }: CanvasBoardProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<KonvaStage | null>(null);
  const transformerRef = useRef<KonvaTransformer | null>(null);

  const {
    stageSize,
    viewport,
    viewportRef,
    applyZoomAt,
    updateViewportPosition,
    resetView,
    handleWheel,
    startPinch,
    movePinch,
    endPinch,
  } = useCanvasViewport({ containerRef });

  const {
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
  } = useCanvasDrawing({ stageRef, stageSize, viewportRef });

  const isStrokeTool = tool === "pen" || tool === "eraser";
  const activeToolSize = tool === "eraser" ? eraserSize : penSize;
  const activeToolMinSize = tool === "eraser" ? MIN_ERASER_SIZE : MIN_PEN_SIZE;
  const activeToolMaxSize = tool === "eraser" ? MAX_ERASER_SIZE : MAX_PEN_SIZE;

  // Sync transformer with selectedImageId
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

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

  const exportBlob = useCallback<() => Promise<Blob | null>>(async () => {
    const stage = stageRef.current;
    if (!stage) return null;

    const transformer = transformerRef.current;
    if (transformer) {
      transformer.visible(false);
      transformer.getLayer()?.batchDraw();
    }

    const blob = (await stage.toBlob({ pixelRatio: 2 })) as Blob | null;

    if (transformer) {
      transformer.visible(true);
      transformer.getLayer()?.batchDraw();
    }

    return blob;
  }, []);

  useEffect(() => {
    onMount?.({ hasContent, exportBlob });
  }, [exportBlob, hasContent, onMount]);

  // Combined touch handler: cancel active stroke on 2-finger, then start pinch
  const handleTouchStart = useCallback(
    (event: KonvaEvent<TouchEvent>) => {
      if (event.evt.touches.length === 2) {
        abortActiveStroke();
        startPinch(event);
      }
    },
    [abortActiveStroke, startPinch],
  );

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

      {/* Toolbar */}
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

        {isStrokeTool && (
          <label className="ml-1 flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600">
            <span className="min-w-[28px]">Size</span>
            <input
              type="range"
              min={activeToolMinSize}
              max={activeToolMaxSize}
              step={0.2}
              value={activeToolSize}
              onChange={(event) => {
                const nextSize = Number(event.target.value);
                if (tool === "eraser") {
                  setEraserSize(nextSize);
                } else {
                  setPenSize(nextSize);
                }
              }}
              className="w-[96px] accent-blue-600"
            />
            <span className="w-[28px] text-right tabular-nums">
              {activeToolSize.toFixed(1)}
            </span>
          </label>
        )}

        <label className="ml-1 flex cursor-pointer items-center gap-1 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={allowFingerDrawing}
            onChange={(event) => setAllowFingerDrawing(event.target.checked)}
          />
          손가락 그리기 허용
        </label>
      </div>

      {/* Zoom controls */}
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
        ref={stageRef as RefObject<KonvaStage>}
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
          updateViewportPosition(stage.x(), stage.y());
        }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={movePinch}
        onTouchEnd={endPinch}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => handlePointerUp(event.evt)}
        onPointerCancel={(event) => handlePointerUp(event.evt)}
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
                  if (tool === "select") setSelectedImageId(item.id);
                }}
                onTap={() => {
                  if (tool === "select") setSelectedImageId(item.id);
                }}
                onDragEnd={(event) => {
                  const target = event.target;
                  commitItems((prevItems) =>
                    prevItems.map((canvasItem) =>
                      canvasItem.kind !== "image" || canvasItem.id !== item.id
                        ? canvasItem
                        : { ...canvasItem, x: target.x(), y: target.y() },
                    ),
                  );
                }}
                onTransformEnd={(event) => {
                  const node = event.target as KonvaImageNode;
                  const nextWidth = Math.max(24, node.width() * node.scaleX());
                  const nextHeight = Math.max(
                    24,
                    node.height() * node.scaleY(),
                  );
                  node.scaleX(1);
                  node.scaleY(1);
                  commitItems((prevItems) =>
                    prevItems.map((canvasItem) =>
                      canvasItem.kind !== "image" || canvasItem.id !== item.id
                        ? canvasItem
                        : {
                            ...canvasItem,
                            x: node.x(),
                            y: node.y(),
                            width: nextWidth,
                            height: nextHeight,
                          },
                    ),
                  );
                }}
              />
            );
          })}

          {activeStroke && <StrokeShape item={activeStroke} />}
          {draftShapeNode}

          <Transformer
            ref={transformerRef as RefObject<KonvaTransformer>}
            rotateEnabled={false}
            enabledAnchors={[
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
            ]}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 24 || newBox.height < 24) return oldBox;
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
};
