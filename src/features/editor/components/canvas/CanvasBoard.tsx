import { Editor, Tldraw } from "tldraw";
import "tldraw/tldraw.css";

interface CanvasBoardProps {
  className?: string;
  hideUi?: boolean;
  onMount?: (editor: Editor) => void;
}

export const CanvasBoard = ({
  className = "",
  hideUi = false,
  onMount,
}: CanvasBoardProps) => {
  return (
    <div className={`relative ${className}`}>
      <Tldraw
        hideUi={hideUi}
        onMount={onMount}
      />
    </div>
  );
};
