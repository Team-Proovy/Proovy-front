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

import { useState } from "react";
import { useStorageStore } from "../store/useStorageStore";
import { StorageToolbar } from "../components/StorageToolbar";
import { NoteGroup } from "../components/NoteGroup";
import { DeleteNotesModal } from "../components/DeleteNotesModal";
import { DeletionSuccessModal } from "../components/DeletionSuccessModal";

export const StoragePage = () => {
  const [keyword, setKeyword] = useState("");

  // 동적으로 열려 있는 노트 그룹 ID 관리
  const [openNoteIds, setOpenNoteIds] = useState<number[]>([]);

  const { isDeleteModalOpen, isSuccessModalOpen } = useStorageStore();
  // TODO: 서버 데이터 연결 시 주석 해제
  // const { data, isLoading } = useStorageInfo(keyword);

  // MOCK DATA FOR UI VERIFICATION
  const isLoading = false;
  const data = {
    totalUsed: 251658240,
    totalLimit: 524288000,
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
        storageUsed: 125829120,
        storageLimit: 262144000,
        storageUsedDisplay: "120MB",
        storageLimitDisplay: "250MB",
        assets: [
          {
            assetId: 101,
            source: "upload" as const,
            fileName: "Lecture_01_Intro.pdf",
            fileSize: 10485760,
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
            fileSize: 5120,
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
        storageUsed: 52428800,
        storageLimit: 262144000,
        storageUsedDisplay: "50MB",
        storageLimitDisplay: "250MB",
        assets: [
          {
            assetId: 201,
            source: "upload" as const,
            fileName: "Process_Synchronization.pdf",
            fileSize: 15728640,
            mimeType: "application/pdf",
            ocrStatus: "processing" as const,
            createdAt: "2024-02-09T11:00:00Z",
            thumbnailUrl: null,
            fileCategory: "document" as const,
          },
          {
            assetId: 202,
            source: "upload" as const,
            fileName: "Memory_Management_Graph.png",
            fileSize: 204800,
            mimeType: "image/png",
            ocrStatus: "completed" as const,
            createdAt: "2024-02-09T12:00:00Z",
            thumbnailUrl: "https://placehold.co/400x300/png",
            fileCategory: "image" as const,
          },
        ],
      },
    ],
  };

  // 노트 그룹 토글 핸들러
  const handleToggle = (noteId: number) => {
    setOpenNoteIds((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId],
    );
  };

  const handleSearch = (value: string) => {
    setKeyword(value);
  };

  // keyword 사용 (lint 경고 방지)
  void keyword;

  const responsivePaddingL = "pl-6 md:pl-[8%] lg:pl-[12%] 2xl:pl-[302px]";
  const responsivePaddingR = "pr-6 md:pr-[12%] lg:pr-[18%] 2xl:pr-[542px]";

  return (
    <>
      <div className="flex h-screen w-full flex-col overflow-y-auto bg-white pt-[97px] pb-20">
        <div className="mx-auto w-full max-w-[1680px]">
          {/* Header Section */}
          <div className="mb-[23px] flex justify-center">
            <div className="3xl:max-w-[1360px] w-full max-w-[520px] lg:max-w-[800px] 2xl:max-w-[1080px]">
              <h1 className="font-['Pretendard'] text-[40px] leading-[52px] font-semibold text-black">
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
                  usagePercent={
                    note.storageLimit > 0
                      ? (note.storageUsed / note.storageLimit) * 100
                      : 0
                  }
                  notes={note.assets}
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
