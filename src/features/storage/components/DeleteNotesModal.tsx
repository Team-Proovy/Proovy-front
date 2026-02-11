import { useStorageStore } from "../store/useStorageStore";
import { useQueryClient } from "@tanstack/react-query";
import { assetKeys } from "../hooks/useAssets";
import { noteKeys } from "@/features/notes/hooks/useNotes";

export const DeleteNotesModal = () => {
  const queryClient = useQueryClient();
  const { setDeleteModalOpen, deleteSelectedNotes, selectedIds } =
    useStorageStore();

  const handleDelete = async () => {
    await deleteSelectedNotes();

    // 쿼리 즉시 갱신 (refetch 사용)
    await Promise.all([
      queryClient.refetchQueries({ queryKey: assetKeys.storage }),
      queryClient.refetchQueries({ queryKey: noteKeys.all }),
    ]);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setDeleteModalOpen(false);
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
            선택하신 파일{" "}
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
            삭제된 파일은 복구가 불가능합니다.
          </p>
        </div>

        {/* Buttons Section */}
        <div
          className="absolute inset-x-0 mx-auto flex items-center justify-center"
          style={{ bottom: "19px", gap: "12px" }}
        >
          <button
            onClick={() => setDeleteModalOpen(false)}
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
              cursor: "pointer",
            }}
          >
            취소하기
          </button>

          <button
            onClick={handleDelete}
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
              cursor: "pointer",
            }}
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
};
