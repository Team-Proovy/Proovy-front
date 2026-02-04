interface PanelIconProps {
  size?: number;
  className?: string;
}

// 패널 열기 아이콘 (뷰어가 닫혀있을 때)
export const PanelOpenIcon = ({ size = 32, className }: PanelIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 26 26"
    fill="none"
    className={className}
  >
    <path
      d="M15.1103 6.84961H19.3503V18.6596H15.1103V6.84961Z"
      fill="url(#paint0_linear_open)"
    />
    <path
      d="M5.5502 19.4096H19.9602V6.09961H5.5402V19.4096H5.5502ZM18.7402 17.9096H6.7702V7.59961H18.7402V17.9096Z"
      className="fill-current"
    />
    <path
      d="M12.6902 12.7598L9.56018 15.7598V9.75977"
      className="fill-current"
    />
    <defs>
      <linearGradient
        id="paint0_linear_open"
        x1="17.2303"
        y1="6.84961"
        x2="17.2303"
        y2="18.6596"
        gradientUnits="userSpaceOnUse"
      >
        <stop className="[stop-color:currentColor]" />
        <stop
          offset="1"
          stopColor="white"
        />
      </linearGradient>
    </defs>
  </svg>
);

// 패널 닫기 아이콘 (뷰어가 열려있을 때)
export const PanelCloseIcon = ({ size = 32, className }: PanelIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 26 26"
    fill="none"
    className={className}
  >
    <path
      d="M10.3997 6.84961H6.15967V18.6596H10.3997V6.84961Z"
      fill="url(#paint0_linear_close)"
    />
    <path
      d="M19.9598 19.4096H5.5498V6.09961H19.9698V19.4096H19.9598ZM6.7698 17.9096H18.7398V7.59961H6.7698V17.9096Z"
      className="fill-current"
    />
    <path
      d="M12.8198 12.7598L15.9498 15.7598V9.75977"
      className="fill-current"
    />
    <defs>
      <linearGradient
        id="paint0_linear_close"
        x1="8.27967"
        y1="6.84961"
        x2="8.27967"
        y2="18.6596"
        gradientUnits="userSpaceOnUse"
      >
        <stop className="[stop-color:currentColor]" />
        <stop
          offset="1"
          stopColor="white"
        />
      </linearGradient>
    </defs>
  </svg>
);
