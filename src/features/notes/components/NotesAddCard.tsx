/**
 * NotesAddCard - 노트 추가하기 카드
 */

import { Link } from "react-router-dom";
import { PdfIcon } from "../../../shared/components/icons/HomepageInputIcons";

export const NotesAddCard = () => (
  <Link
    to="/app/home"
    className="group flex h-[229px] w-[271px] flex-col items-center justify-center rounded-[12px] border-[0.5px] border-[#D1D6DE] bg-[#F1F4F8] px-[97px] py-[70px] transition-colors hover:bg-[#E8ECF1]"
  >
    <div className="mb-[8px] flex h-[60px] w-[60px] items-center justify-center rounded-[30px] bg-white p-[6px]">
      <PdfIcon
        color="#2A6AFF"
        size={48}
      />
    </div>
    <span className="text-[14px] leading-[20px] font-medium whitespace-nowrap text-black">
      노트 추가하기
    </span>
  </Link>
);
