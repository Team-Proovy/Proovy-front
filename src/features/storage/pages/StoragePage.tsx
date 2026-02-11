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
import { useAuthStore } from "@/features/auth/store/auth_store"; // Import auth store
import {
  PLAN_DETAILS,
  type PlanType,
} from "@/features/subscription/types/plan_types"; // Import plan details

export const StoragePage = () => {
  const [keyword, setKeyword] = useState("");

  // 동적으로 열려 있는 노트 그룹 ID 관리
  const [openNoteIds, setOpenNoteIds] = useState<number[]>([]);

  const { isDeleteModalOpen, isSuccessModalOpen } = useStorageStore();
  const { user } = useAuthStore(); // Get current user

  // 노트당 최대 용량 계산 (512MB)
  // Logic: All plans have 512MB per note limit (Total Storage / Max Notes)
  // Free: 1GB / 2 = 512MB
  // Standard: 5GB / 10 = 512MB
  // Pro: 10GB / 20 = 512MB
  const NOTE_STORAGE_LIMIT_BYTES = 512 * 1024 * 1024;
  const NOTE_STORAGE_LIMIT_DISPLAY = "512MB";

  // MOCK DATA FOR UI VERIFICATION
  const isLoading = false;

  // 사용자 플랜에 따른 전체 용량 정보 (mock)
  const userPlanType = (user?.plan as PlanType) || "Free";
  const planDetails = PLAN_DETAILS[userPlanType];

  const data = {
    totalUsed: 251658240,
    totalLimit:
      parseInt(planDetails.storage.replace("GB", "")) * 1024 * 1024 * 1024, // Parse based on plan
    totalUsedDisplay: "240MB",
    totalLimitDisplay: planDetails.storage,
    usagePercent: 48,
    plan: {
      planType: userPlanType,
      isActive: true,
    },
    notes: [
      {
        noteId: 1,
        title: "컴퓨터 구조 (CSED311)",
        storageUsed: 126353920, // ~120.5MB
        // storageLimit: NOTE_STORAGE_LIMIT_BYTES, // Derived in render
        assets: [
          {
            assetId: 101,
            source: "upload" as const,
            fileName: "Lecture_01_Intro.pdf",
            fileSize: 126353920,
            mimeType: "application/pdf",
            ocrStatus: "completed" as const,
            createdAt: "2024-02-09T09:00:00Z",
            thumbnailUrl: null,
            fileCategory: "document" as const,
          },
        ],
      },
      {
        noteId: 2,
        title: "운영체제 (CSED312)",
        storageUsed: 52428800, // 50MB
        assets: [
          {
            assetId: 201,
            source: "upload" as const,
            fileName: "Process_Synchronization.pdf",
            fileSize: 52428800,
            mimeType: "application/pdf",
            ocrStatus: "processing" as const,
            createdAt: "2024-02-09T11:00:00Z",
            thumbnailUrl: null,
            fileCategory: "document" as const,
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

  const formatBytesToMB = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return Number.isInteger(mb) ? mb.toFixed(0) : mb.toFixed(1);
  };

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
              data?.notes.map((note) => {
                const usedMBDisplay = `${formatBytesToMB(note.storageUsed)}MB`;
                const usagePercent =
                  (note.storageUsed / NOTE_STORAGE_LIMIT_BYTES) * 100;

                return (
                  <NoteGroup
                    key={note.noteId}
                    title={note.title}
                    storageUsedDisplay={usedMBDisplay}
                    storageLimitDisplay={NOTE_STORAGE_LIMIT_DISPLAY}
                    usagePercent={Math.min(usagePercent, 100)} // Cap at 100%
                    notes={note.assets}
                    isOpen={openNoteIds.includes(note.noteId)}
                    onToggle={() => handleToggle(note.noteId)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
      {isDeleteModalOpen && <DeleteNotesModal />}
      {isSuccessModalOpen && <DeletionSuccessModal />}
    </>
  );
};
