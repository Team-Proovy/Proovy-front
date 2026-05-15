import { useMemo } from "react";
import { Circle, Line } from "react-konva";
import type { StrokeItem } from "./canvas_types";
import { getStrokePolygon } from "./canvas_utils";

export const DotShape = ({ item }: { item: StrokeItem }) => {
  const point = item.points[0];
  if (!point) return null;

  return (
    <Circle
      x={point.x}
      y={point.y}
      radius={Math.max(1.2, (item.size * point.pressure) / 2)}
      fill={item.eraser ? "#000" : item.color}
      globalCompositeOperation={item.eraser ? "destination-out" : "source-over"}
      listening={false}
    />
  );
};

export const StrokeShape = ({ item }: { item: StrokeItem }) => {
  const polygon = useMemo(
    () => getStrokePolygon(item.points, item.size, item.eraser),
    [item.eraser, item.points, item.size],
  );
  const linePoints = polygon.flatMap((point) => [point[0], point[1]]);

  if (linePoints.length < 6) {
    return <DotShape item={item} />;
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
