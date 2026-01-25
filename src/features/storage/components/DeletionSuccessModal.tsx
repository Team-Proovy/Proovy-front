import { useStorageStore } from "../store/useStorageStore";

export const DeletionSuccessModal = () => {
  const { setSuccessModalOpen } = useStorageStore();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSuccessModalOpen(false);
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
        {/* Title Section - 2 lines, 96px height */}
        <div
          className="absolute inset-x-0 mx-auto flex items-center justify-center"
          style={{ top: "91px", width: "319px", height: "96px" }}
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
            삭제가
            <br />
            완료되었습니다.
          </h2>
        </div>

        {/* Button Section - 19px from bottom */}
        <div
          className="absolute inset-x-0 mx-auto flex items-center justify-center"
          style={{ bottom: "19px" }}
        >
          <button
            onClick={() => setSuccessModalOpen(false)}
            style={{
              display: "flex",
              width: "524px",
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
            돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};
