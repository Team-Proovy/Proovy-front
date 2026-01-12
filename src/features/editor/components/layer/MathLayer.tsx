import { useRef, useEffect } from "react";
import type { MathfieldElement } from "mathlive";
import "mathlive";

interface MathLayerProps {
  isOpen: boolean;
  value: string;
  onClose: () => void;
  onInput: (value: string) => void;
  onComplete: () => void;
}

export const MathLayer = ({
  isOpen,
  value,
  onClose,
  onInput,
  onComplete,
}: MathLayerProps) => {
  const mfRef = useRef<MathfieldElement>(null);

  // 수식 입력기 열기 시 포커스 (기본)
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => mfRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // 가상 키보드 토글 시 포커스 유지
  useEffect(() => {
    const mkb = (window as any).mathVirtualKeyboard;
    if (!mkb) return;

    const handleGeometryChange = () => {
      if (isOpen && mfRef.current) {
        mfRef.current.focus();
      }
    };

    mkb.addEventListener("geometrychange", handleGeometryChange);
    return () => {
      mkb.removeEventListener("geometrychange", handleGeometryChange);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-0 z-50 mb-2 w-full">
      <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-2 rounded-xl border-2 border-blue-500 bg-white p-2 shadow-lg duration-200">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-semibold text-blue-500">
            수식 입력 모드
          </span>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <math-field
          ref={mfRef}
          onInput={(evt: React.SyntheticEvent<MathfieldElement>) =>
            onInput((evt.target as MathfieldElement).value)
          }
          style={
            {
              width: "100%",
              fontSize: "1.2rem",
              padding: "8px",
              cursor: "text",
            } as React.CSSProperties
          }
        >
          {value}
        </math-field>

        <div className="flex justify-end">
          <button
            onClick={onComplete}
            className="cursor-pointer rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            입력 완료
          </button>
        </div>
      </div>
    </div>
  );
};
