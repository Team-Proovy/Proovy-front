import { useState } from "react";
import { useDeleteNotesBulk } from "../hooks/useNotes";

interface DeleteNotesModalProps {
  selectedIds: number[];
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteNotesModal = ({
  selectedIds,
  onClose,
  onSuccess,
}: DeleteNotesModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deleteNotesBulkMutation = useDeleteNotesBulk();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  const handleDeleteClick = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      // 벌크 삭제 API 1회 호출
      await deleteNotesBulkMutation.mutateAsync(selectedIds);
      onSuccess();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "노트 삭제에 실패했습니다";
      console.error("노트 삭제 실패:", err);
      setError(errorMessage);
      setIsDeleting(false);
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
        {/* Title Section */}
        <div
          className="absolute inset-x-0 mx-auto flex flex-col items-center"
          style={{ top: "68px", width: "319px" }}
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
            선택하신 노트{" "}
            <span style={{ color: "#2542F0", fontWeight: 700 }}>
              {selectedIds.length}개
            </span>
            를
            <br />
            삭제하시겠습니까?
          </h2>

          <p
            style={{
              color: "#000",
              textAlign: "center",
              fontFamily: "Pretendard",
              fontSize: "18px",
              fontStyle: "normal",
              fontWeight: 400,
              lineHeight: "28px",
              letterSpacing: "-0.002px",
              width: "319px",
              marginTop: "16px",
            }}
          >
            삭제된 노트는 복구가 불가능합니다.
          </p>

          {error && (
            <p
              style={{
                color: "#E74C3C",
                textAlign: "center",
                fontFamily: "Pretendard",
                fontSize: "14px",
                fontStyle: "normal",
                fontWeight: 400,
                lineHeight: "20px",
                width: "319px",
                marginTop: "12px",
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Buttons Section */}
        <div
          className="absolute inset-x-0 mx-auto flex items-center justify-center"
          style={{ bottom: "19px", gap: "12px" }}
        >
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{
              display: "flex",
              width: "240px",
              height: "56px",
              padding: "10px",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
              borderRadius: "20px",
              border: "1px solid #D1D6DE",
              background: "#F1F4F8",
              color: "#6B7280",
              fontFamily: "Pretendard",
              fontSize: "18px",
              fontWeight: 600,
              cursor: isDeleting ? "not-allowed" : "pointer",
              opacity: isDeleting ? 0.5 : 1,
            }}
          >
            취소하기
          </button>

          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            style={{
              display: "flex",
              width: "240px",
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
              cursor: isDeleting ? "not-allowed" : "pointer",
              opacity: isDeleting ? 0.7 : 1,
            }}
          >
            {isDeleting ? "삭제 중..." : "삭제하기"}
          </button>
        </div>
      </div>
    </div>
  );
};
