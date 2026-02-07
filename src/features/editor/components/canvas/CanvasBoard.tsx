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
        licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY}
        hideUi={hideUi}
        onMount={onMount}
      />
    </div>
  );
};
