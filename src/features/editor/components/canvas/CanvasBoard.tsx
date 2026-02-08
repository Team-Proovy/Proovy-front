import { Editor, Tldraw } from "tldraw";
import "tldraw/tldraw.css";

interface CanvasBoardProps {
  className?: string;
  hideUi?: boolean;
  onMount?: (editor: Editor) => void;
}

const TLDRAW_LICENSE_KEY = import.meta.env.VITE_TLDRAW_LICENSE_KEY as
  | string
  | undefined;

export const CanvasBoard = ({
  className = "",
  hideUi = false,
  onMount,
}: CanvasBoardProps) => {
  return (
    <div className={`relative ${className}`}>
      <Tldraw
        {...(TLDRAW_LICENSE_KEY ? { licenseKey: TLDRAW_LICENSE_KEY } : {})}
        hideUi={hideUi}
        onMount={onMount}
      />
    </div>
  );
};
