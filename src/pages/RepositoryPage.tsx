import { AppLayout } from "../shared/layout/app_layout";
import { useRepositoryStore } from "../features/repository/model/useRepositoryStore";
import { RepositoryToolbar } from "../features/repository/ui/RepositoryToolbar";
import { NoteGroup } from "../features/repository/ui/NoteGroup";
import { DeleteNotesModal } from "../features/repository/ui/DeleteNotesModal";
import { DeletionSuccessModal } from "../features/repository/ui/DeletionSuccessModal";

/**
 * RepositoryPage
 * FSD 리팩토링 및 Zustand 적용 버전.
 */
export default function RepositoryPage() {
  const {
    isNoteGroupOpen,
    isNoteGroup2Open,
    setNoteGroupOpen,
    setNoteGroup2Open,
    noteCards,
    isDeleteModalOpen,
    isSuccessModalOpen,
  } = useRepositoryStore();

  // 반응형 간격 클래스 정의
  const responsivePaddingL = "pl-6 md:pl-[8%] lg:pl-[12%] 2xl:pl-[302px]";
  const responsivePaddingR = "pr-6 md:pr-[12%] lg:pr-[18%] 2xl:pr-[542px]";

  // NoteGroup에 전달할 데이터를 id 기준으로 나누기 (임시 처리)
  const group1Notes = noteCards.filter((note) => note.id < 10);
  const group2Notes = noteCards.filter((note) => note.id >= 10); // 실제 데이터 성격에 따라 조정 필요

  return (
    <AppLayout>
      <div className="flex h-screen w-full flex-col overflow-y-auto bg-white pt-[97px] pb-20">
        <div className="mx-auto w-full max-w-[1680px]">
          {/* Header Section */}
          <div className={`${responsivePaddingL} mb-[23px]`}>
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

          {/* Toolbar Row */}
          <RepositoryToolbar
            responsivePaddingL={responsivePaddingL}
            responsivePaddingR={responsivePaddingR}
          />

          {/* Note Groups Section */}
          <div
            className={`flex flex-col gap-[20px] ${responsivePaddingL} ${responsivePaddingR}`}
          >
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
    </AppLayout>
  );
}
