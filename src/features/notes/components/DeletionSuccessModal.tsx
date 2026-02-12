import { useEffect } from "react";

interface DeletionSuccessModalProps {
  onClose: () => void;
}

export const DeletionSuccessModal = ({
  onClose,
}: DeletionSuccessModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000033]"
      onClick={handleBackdropClick}
    >
      <div
        className="relative bg-white"
        style={{
          width: "560px",
          height: "360px",
          borderRadius: "20px",
          boxShadow: "0px 10px 40px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Check Icon */}
        <div
          className="absolute inset-x-0 mx-auto"
          style={{
            top: "40px",
            width: "80px",
            height: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: "#E8EFFF",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 20L16 26L30 12"
              stroke="#2A6AFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Title Section */}
        <div
          className="absolute inset-x-0 mx-auto flex flex-col items-center"
          style={{ top: "153px", width: "319px" }}
        >
          <h2
            style={{
              color: "#000",
              textAlign: "center",
              fontFamily: "Pretendard",
              fontSize: "32px",
              fontStyle: "normal",
              fontWeight: 600,
              lineHeight: "48px",
              letterSpacing: "-0.006px",
            }}
          >
            노트가 삭제되었습니다.
          </h2>

          <p
            style={{
              color: "#00000066",
              textAlign: "center",
              fontFamily: "Pretendard",
              fontSize: "18px",
              fontStyle: "normal",
              fontWeight: 400,
              lineHeight: "28px",
              letterSpacing: "-0.002px",
              width: "400px",
              marginTop: "16px",
            }}
          >
            선택하신 노트들이 영구적으로 삭제되었습니다.
          </p>
        </div>

        {/* Button Section */}
        <button
          onClick={onClose}
          className="absolute inset-x-0 bottom-[19px] mx-auto"
          style={{
            display: "flex",
            width: "492px",
            height: "56px",
            padding: "10px",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
            borderRadius: "20px",
            background: "#2A6AFF",
            border: "none",
            color: "#FFF",
            fontFamily: "Pretendard",
            fontSize: "18px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
};
