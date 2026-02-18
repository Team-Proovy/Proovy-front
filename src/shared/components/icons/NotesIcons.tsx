import type { SVGProps } from "react";

export const NoteEditIcon = ({
  className,
  ...props
}: SVGProps<SVGSVGElement>) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`text-[#6B7280] transition-colors hover:text-[#2A6AFF] ${className ?? ""}`}
    {...props}
  >
    <path
      d="M6 11L2.08322 12.5667C1.67507 12.73 1.27003 12.3249 1.43329 11.9168L3 8"
      stroke="currentColor"
      strokeLinecap="round"
    />
    <path
      d="M3 8L6 11"
      stroke="currentColor"
    />
    <path
      d="M3 8.69231L9.9852 1.70711C10.3757 1.31658 11.0089 1.31658 11.3994 1.70711L12.2929 2.60059C12.6834 2.99111 12.6834 3.62427 12.2929 4.0148L5.30769 11"
      stroke="currentColor"
    />
    <path
      d="M12 13H9"
      stroke="currentColor"
      strokeLinecap="round"
    />
  </svg>
);

export const NoteCheckboxIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M11.5 3.5L5.25 10.5L2.5 7.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
