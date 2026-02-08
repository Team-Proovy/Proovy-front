import { useStorageStore } from "../store/useStorageStore";
import { StorageToolbar } from "../components/StorageToolbar";
import { NoteGroup } from "../components/NoteGroup";
import { DeleteNotesModal } from "../components/DeleteNotesModal";
import { DeletionSuccessModal } from "../components/DeletionSuccessModal";
import { useState } from "react";
import { useStorageInfo } from "../hooks/useAssets";

export const StoragePage = () => {
  const [keyword, setKeyword] = useState("");
  
  // 1. 현재 열려 있는 노트 그룹들의 ID를 저장하는 상태 추가
  const [openNoteIds, setOpenNoteIds] = useState<number[]>([]);

  const { isDeleteModalOpen, isSuccessModalOpen } = useStorageStore();
  // const { data, isLoading } = useStorageInfo(keyword);

  // MOCK DATA FOR UI VERIFICATION
  const isLoading = false;
  const data = {
    totalUsed: 251658240, // 240MB
    totalLimit: 524288000, // 500MB
    totalUsedDisplay: "240MB",
    totalLimitDisplay: "500MB",
    usagePercent: 48,
    plan: {
      planType: "free" as const,
      isActive: true,
    },
    notes: [
      {
        noteId: 1,
        title: "컴퓨터 구조 (CSED311)",
        storageUsed: 125829120, // 120MB
        storageLimit: 262144000, // 250MB
        storageUsedDisplay: "120MB",
        storageLimitDisplay: "250MB",
        assets: [
          {
            assetId: 101,
            source: "upload" as const,
            fileName: "Lecture_01_Intro.pdf",
            fileSize: 10485760, // 10MB
            mimeType: "application/pdf",
            ocrStatus: "completed" as const,
            createdAt: "2024-02-09T09:00:00Z",
            thumbnailUrl: null,
            fileCategory: "document" as const,
          },
          {
            assetId: 102,
            source: "ai_generated" as const,
            fileName: "Lecture_01_Summary.md",
            fileSize: 5120, // 5KB
            mimeType: "text/markdown",
            ocrStatus: "completed" as const,
            createdAt: "2024-02-09T10:00:00Z",
            thumbnailUrl: null,
            fileCategory: "document" as const,
          },
        ],
      },
      {
        noteId: 2,
        title: "운영체제 (CSED312)",
        storageUsed: 52428800, // 50MB
        storageLimit: 262144000, // 250MB
        storageUsedDisplay: "50MB",
        storageLimitDisplay: "250MB",
        assets: [
          {
            assetId: 201,
            source: "upload" as const,
            fileName: "Process_Synchronization.pdf",
            fileSize: 15728640, // 15MB
            mimeType: "application/pdf",
            ocrStatus: "processing" as const, // For verify processing UI
            createdAt: "2024-02-09T11:00:00Z",
            thumbnailUrl: null,
            fileCategory: "document" as const,
          },
          {
             assetId: 202,
             source: "upload" as const,
             fileName: "Memory_Management_Graph.png",
             fileSize: 204800, // 200KB
             mimeType: "image/png",
             ocrStatus: "completed" as const,
             createdAt: "2024-02-09T12:00:00Z",
             thumbnailUrl: "https://placehold.co/400x300/png", // Placeholder image
             fileCategory: "image" as const,
          }
        ],
      },
    ],
  };

  // 2. 토글 핸들러 함수 정의
  const handleToggle = (noteId: number) => {
    setOpenNoteIds((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId) // 이미 열려 있으면 닫기
        : [...prev, noteId] // 닫혀 있으면 열기
    );
  };

  const handleSearch = (value: string) => {
    setKeyword(value);
  };

  const responsivePaddingL = "pl-6 md:pl-[8%] lg:pl-[12%] 2xl:pl-[302px]";
  const responsivePaddingR = "pr-6 md:pr-[12%] lg:pr-[18%] 2xl:pr-[542px]";

  return (
    <>
      <div className="flex h-screen w-full flex-col overflow-y-auto bg-white pt-[97px] pb-20">
        <div className="mx-auto w-full max-w-[1680px]">
          {/* Header Section */}
          <div className="mb-[23px] flex justify-center">
            <div className="3xl:max-w-[1360px] w-full max-w-[520px] lg:max-w-[800px] 2xl:max-w-[1080px]">
              <h1 className="font-['Pretendard'] text-[40px] font-semibold text-black leading-[52px]">
                저장소
              </h1>
            </div>
          </div>

          {/* Toolbar Row */}
          <div className="flex justify-center">
            <StorageToolbar
              responsivePaddingL={responsivePaddingL}
              responsivePaddingR={responsivePaddingR}
              usagePercent={data?.usagePercent ?? 0}
              totalUsedDisplay={data?.totalUsedDisplay ?? "0GB"}
              totalLimitDisplay={data?.totalLimitDisplay ?? "0GB"}
              onSearch={handleSearch}
            />
          </div>

          {/* Note Groups Section */}
          <div className="mt-[24px] flex flex-col items-center justify-center gap-[20px]">
            {isLoading ? (
              <p>데이터를 불러오는 중입니다...</p>
            ) : (
              data?.notes.map((note) => (
                <NoteGroup
                  key={note.noteId}
                  title={note.title}
                  storageUsedDisplay={note.storageUsedDisplay}
                  storageLimitDisplay={note.storageLimitDisplay}
                  usagePercent={(note.storageUsed / note.storageLimit) * 100}
                  notes={note.assets}
                  // 3. 현재 이 노트 ID가 openNoteIds에 들어있는지 확인해서 넘겨줌 [cite: 2025-09-17]
                  isOpen={openNoteIds.includes(note.noteId)} 
                  onToggle={() => handleToggle(note.noteId)}
                />
              ))
            )}
          </div>
        </div>
      </div>
      {isDeleteModalOpen && <DeleteNotesModal />}
      {isSuccessModalOpen && <DeletionSuccessModal />}
    </>
  );
};