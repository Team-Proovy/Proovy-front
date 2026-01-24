/**
 * SearchPage - 대화 검색 페이지
 *
 * URL: /app/search
 *
 * 기능:
 * - 모든 노트의 대화 내용 검색
 * - 검색 결과 클릭 → 해당 노트로 이동
 * - GPT 검색 UI와 유사
 */

import { useState } from "react";
import { Link } from "react-router-dom";

export const SearchPage = () => {
  const [query, setQuery] = useState("");

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

  return (
    <div className="flex h-full flex-col bg-white">
      {/* 검색 입력 */}
      <div className="border-b p-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="채팅 검색..."
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
          autoFocus
        />
      </div>

      {/* 검색 결과 */}
      <div className="flex-1 overflow-auto p-4">
        {/* 빠른 액션 */}
        <div className="mb-6">
          <Link
            to="/app/home"
            className="flex items-center gap-2 rounded-lg p-3 hover:bg-gray-100"
          >
            <span>✨</span>
            <span className="text-gray-700">새 채팅</span>
          </Link>
        </div>

        {/* 최근/검색 결과 */}
        <div>
          <h3 className="mb-2 text-xs font-medium text-gray-500">
            {query ? "검색 결과" : "최근 대화"}
          </h3>

          {mockResults
            .filter((r) =>
              query
                ? r.preview.toLowerCase().includes(query.toLowerCase())
                : true,
            )
            .map((result) => (
              <Link
                key={result.id}
                to={`/app/note/${result.noteId}`}
                className="flex flex-col rounded-lg p-3 hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">○</span>
                  <span className="font-medium text-gray-900">
                    {result.preview}
                  </span>
                </div>
                <div className="mt-1 ml-6 text-xs text-gray-500">
                  {result.noteTitle} • {result.date}
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
};
