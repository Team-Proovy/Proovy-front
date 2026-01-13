import { AppLayout } from "../shared/layout/app_layout";
import { useRepositoryStore } from "../features/repository/model/useRepositoryStore";
import { RepositoryToolbar } from "../features/repository/ui/RepositoryToolbar";
import { NoteGroup } from "../features/repository/ui/NoteGroup";

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
  } = useRepositoryStore();

  // 반응형 간격 클래스 정의
  const responsivePaddingL = "pl-6 md:pl-[8%] lg:pl-[12%] 2xl:pl-[302px]";
  const responsivePaddingR = "pr-6 md:pr-[12%] lg:pr-[18%] 2xl:pr-[542px]";

  // 공통 노트 카드 리스트
  const noteCards = [
    { label: "file_name.py", type: "업로드" as const },
    { label: "파일 가능.pdf", type: "업로드" as const },
    { label: "file_name.py", type: "업로드" as const },
    { label: "LLM 생성 파일", type: "AI 생성" as const },
    { label: "file_name.py", type: "업로드" as const },
    { label: "file_name.py", type: "업로드" as const },
    { label: "파일 가능.pdf", type: "업로드" as const },
    { label: "file_name.py", type: "업로드" as const },
    { label: "LLM 생성 파일", type: "AI 생성" as const },
    { label: "file_name.py", type: "업로드" as const },
  ];

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
              notes={noteCards}
              isOpen={isNoteGroupOpen}
              onToggle={() => setNoteGroupOpen(!isNoteGroupOpen)}
              startIndex={0}
            />
            <NoteGroup
              title="여기는 노트 제목이 오는 위치"
              notes={noteCards}
              isOpen={isNoteGroup2Open}
              onToggle={() => setNoteGroup2Open(!isNoteGroup2Open)}
              startIndex={10}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
