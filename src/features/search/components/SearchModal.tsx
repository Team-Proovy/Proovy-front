/**
 * SearchModal - 검색 모달 컴포넌트
 *
 * GPT 스타일의 검색 모달
 * 사이드바 "검색" 버튼 클릭 시 현재 페이지 위에 오버레이로 표시
 *
 * 기능:
 * - 모든 노트의 대화 내용 검색
 * - 검색 결과 클릭 → 해당 노트로 이동 + 모달 닫기
 * - ESC 또는 배경 클릭 시 모달 닫기
 */

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // TODO: useSearchChats(query) 훅으로 검색
  const mockResults = [
    {
      id: "r1",
      noteId: "1",
      noteTitle: "이산수학 과제2 3단원",
      preview: "크레이머 공식(Cramer's rule)은 변수와 방정식의 수가 같은...",
      date: "2025년",
    },
    {
      id: "r2",
      noteId: "1",
      noteTitle: "이산수학 과제2 3단원",
      preview: "5.9-5.11 내용 확인해줘",
      date: "2025년",
    },
    {
      id: "r3",
      noteId: "2",
      noteTitle: "선형대수 복습",
      preview: "소거 벡터 계산 방법 알려줘",
      date: "2025년",
    },
  ];

  // 모달 열릴 때 input에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 모달 닫힐 때 검색어 초기화
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredResults = mockResults.filter((r) =>
    query ? r.preview.toLowerCase().includes(query.toLowerCase()) : true,
  );

  return (
    // 오버레이
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[10vh]"
      onClick={onClose}
    >
      {/* 모달 컨테이너 */}
      <div
        className="w-full max-w-[600px] overflow-hidden rounded-xl bg-[#212121] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 검색 입력 */}
        <div className="flex items-center border-b border-gray-700 px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="채팅 검색..."
            className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
          />
          <button
            onClick={onClose}
            className="ml-2 rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* 검색 결과 */}
        <div className="max-h-[60vh] overflow-auto p-2">
          {/* 빠른 액션 */}
          <Link
            to="/app/home"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-700"
          >
            <span>✨</span>
            <span>새 채팅</span>
          </Link>

          {/* 최근/검색 결과 */}
          <div className="mt-2">
            <h3 className="mb-1 px-3 text-xs font-medium text-gray-500">
              {query ? "검색 결과" : "최근 대화"}
            </h3>

            {filteredResults.length > 0 ? (
              filteredResults.map((result) => (
                <Link
                  key={result.id}
                  to={`/app/chat/${result.noteId}`}
                  onClick={onClose}
                  className="flex flex-col rounded-lg px-3 py-2 hover:bg-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">○</span>
                    <span className="text-sm text-white">{result.preview}</span>
                  </div>
                  <div className="mt-0.5 ml-5 text-xs text-gray-500">
                    {result.noteTitle} • {result.date}
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                검색 결과가 없습니다
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
