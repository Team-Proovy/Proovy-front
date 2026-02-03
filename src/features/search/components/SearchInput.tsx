// 검색 바
import { X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  onClose: () => void;
}

const SearchInput = ({ value, onChange, onClose }: SearchInputProps) => (
  <div className="flex w-full items-center bg-transparent pt-6 pr-[36px] pb-4 pl-9">
    <input
      autoFocus
      type="text"
      placeholder="채팅 검색..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="font-regular flex-1 bg-transparent text-[20px] placeholder-[#000000] outline-none placeholder:text-[20px]"
    />
    <button
      onClick={onClose}
      className="ml-4 rounded-full p-1 transition-colors"
    >
      <X className="size-[24px] text-[#000000] hover:text-[#2A6AFF]" />
    </button>
  </div>
);

export default SearchInput;
