export type CanvasTool =
  | "select"
  | "hand"
  | "pen"
  | "eraser"
  | "rect"
  | "circle"
  | "line"
  | "arrow";

export type KonvaStage = import("konva/lib/Stage").Stage;
export type KonvaImageNode = import("konva/lib/shapes/Image").Image;
export type KonvaTransformer =
  import("konva/lib/shapes/Transformer").Transformer;
export type KonvaEvent<T> = import("konva/lib/Node").KonvaEventObject<T>;

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
}

export interface StrokeItem {
  id: string;
  kind: "stroke";
  color: string;
  size: number;
  eraser: boolean;
  points: StrokePoint[];
}

export interface RectItem {
  id: string;
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface CircleItem {
  id: string;
  kind: "circle";
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface LineItem {
  id: string;
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export interface ArrowItem {
  id: string;
  kind: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export interface ImageItem {
  id: string;
  kind: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement;
}

export type CanvasItem =
  | StrokeItem
  | RectItem
  | CircleItem
  | LineItem
  | ArrowItem
  | ImageItem;

export interface DraftShape {
  kind: "rect" | "circle" | "line" | "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

export interface PinchState {
  startDistance: number;
  scenePoint: { x: number; y: number };
}

export interface CanvasBoardApi {
  hasContent: () => boolean;
  exportBlob: () => Promise<Blob | null>;
}

export interface CanvasBoardProps {
  className?: string;
  onMount?: (api: CanvasBoardApi) => void;
}
