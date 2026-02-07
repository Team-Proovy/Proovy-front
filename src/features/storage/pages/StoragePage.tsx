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
import { useEffect } from "react";
import { getNoteList } from "../../notes/api/notes_api";

export const StoragePage = () => {
  const {
    isNoteGroupOpen,
    isNoteGroup2Open,
    setNoteGroupOpen,
    setNoteGroup2Open,
    noteCards,
    isDeleteModalOpen,
    isSuccessModalOpen,
    setNotes,
  } = useStorageStore();

  // 반응형 간격 클래스 정의
  const responsivePaddingL = "pl-6 md:pl-[8%] lg:pl-[12%] 2xl:pl-[302px]";
  const responsivePaddingR = "pr-6 md:pr-[12%] lg:pr-[18%] 2xl:pr-[542px]";

  // NoteGroup에 전달할 데이터를 id 기준으로 나누기 (임시 처리)
  const group1Notes = noteCards.filter((note) => note.id < 10);
  const group2Notes = noteCards.filter((note) => note.id >= 10);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await getNoteList({ page: 0, size: 20 });
        if (response.isSuccess) {
          // NoteDto -> Store Note 변환
          const mappedNotes = response.result.notes.map((note) => ({
            id: note.noteId,
            label: note.title,
            type: "upload" as const,
            fileUrl: note.fileUrl || undefined, // 현재 인터페이스상 "업로드"만 허용됨 (추후 수정 필요)
            mimeType: note.mimeType || undefined,
          }));
          setNotes(mappedNotes);
        }
      } catch (error) {
        console.error("노트 목록 가져오기 실패", error);
      }
    };
    fetchNotes();
  }, [setNotes]);

  return (
    <>
      <div className="flex h-screen w-full flex-col overflow-y-auto bg-white pt-[97px] pb-20">
        <div className="mx-auto w-full max-w-[1680px]">
          {/* Header Section - 노트 상단바(800px)를 기준으로 가운데 정렬 */}
          <div className="mb-[23px] flex justify-center">
            <div className="3xl:max-w-[1360px] w-full max-w-[520px] lg:max-w-[800px] 2xl:max-w-[1080px]">
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
          <div className="mt-[24px] flex flex-col items-center justify-center gap-[20px]">
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
