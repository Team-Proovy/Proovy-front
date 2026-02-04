/**
 * StoragePage - 저장소 페이지
 *
 * URL: /app/storage
 *
 * 기능:
 * - 노트별 파일 그룹 표시
 * - 파일 선택/삭제
 * - 용량 정보 표시
 */

import { useStorageStore } from "../store/useStorageStore";
import { StorageToolbar } from "../components/StorageToolbar";
import { NoteGroup } from "../components/NoteGroup";
import { DeleteNotesModal } from "../components/DeleteNotesModal";
import { DeletionSuccessModal } from "../components/DeletionSuccessModal";

export const StoragePage = () => {
  const {
    isNoteGroupOpen,
    isNoteGroup2Open,
    setNoteGroupOpen,
    setNoteGroup2Open,
    noteCards,
    isDeleteModalOpen,
    isSuccessModalOpen,
  } = useStorageStore();

  // 반응형 간격 클래스 정의
  const responsivePaddingL = "pl-6 md:pl-[8%] lg:pl-[12%] 2xl:pl-[302px]";
  const responsivePaddingR = "pr-6 md:pr-[12%] lg:pr-[18%] 2xl:pr-[542px]";

  // NoteGroup에 전달할 데이터를 id 기준으로 나누기 (임시 처리)
  const group1Notes = noteCards.filter((note) => note.id < 10);
  const group2Notes = noteCards.filter((note) => note.id >= 10);

  return (
    <>
      <div className="flex h-screen w-full flex-col overflow-y-auto bg-white pt-[97px] pb-20">
        <div className="mx-auto w-full max-w-[1680px]">
          {/* Header Section - 노트 상단바(800px)를 기준으로 가운데 정렬 */}
          <div className="mb-[23px] flex justify-center">
            <div className="w-[800px] max-w-full">
              <h1
                className="font-['Pretendard']"
                style={{
                  color: "#000",
                  fontSize: "40px",
                  fontStyle: "normal",
                  fontWeight: 600,
                  lineHeight: "52px",
                  letterSpacing: "-0.008px",
                }}
              >
                저장소
              </h1>
            </div>
          </div>

          {/* Toolbar Row - 제목/노트 상단바와 같은 기준선(800px) 유지 */}
          <div className="flex justify-center">
            <StorageToolbar
              responsivePaddingL={responsivePaddingL}
              responsivePaddingR={responsivePaddingR}
            />
          </div>

          {/* Note Groups Section - 사이드바를 제외한 영역에서 가운데 정렬 */}
          <div className="mt-[24px] flex flex-col items-center gap-[20px] px-6 md:px-10">
            <NoteGroup
              title="여기는 노트 제목이 오는 위치"
              notes={group1Notes}
              isOpen={isNoteGroupOpen}
              onToggle={() => setNoteGroupOpen(!isNoteGroupOpen)}
            />
            <NoteGroup
              title="여기는 노트 제목이 오는 위치"
              notes={group2Notes}
              isOpen={isNoteGroup2Open}
              onToggle={() => setNoteGroup2Open(!isNoteGroup2Open)}
            />
          </div>
        </div>
      </div>
      {isDeleteModalOpen && <DeleteNotesModal />}
      {isSuccessModalOpen && <DeletionSuccessModal />}
    </>
  );
};
