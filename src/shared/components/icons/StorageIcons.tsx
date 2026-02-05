import type { SVGProps } from "react";

export const StorageChevronIcon = ({
  isOpen = false,
  ...props
}: SVGProps<SVGSVGElement> & { isOpen?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    style={{
      transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
      transition: "transform 0.2s ease-in-out",
      width: "16px",
      height: "16px",
      aspectRatio: "1/1",
    }}
    {...props}
  >
    <path
      d="M1.63599 5.29295C1.82351 5.10548 2.07782 5.00017 2.34299 5.00017C2.60815 5.00017 2.86246 5.10548 3.04999 5.29295L7.99999 10.243L12.95 5.29295C13.1386 5.11079 13.3912 5.01 13.6534 5.01228C13.9156 5.01456 14.1664 5.11973 14.3518 5.30513C14.5372 5.49054 14.6424 5.74135 14.6447 6.00355C14.6469 6.26575 14.5461 6.51835 14.364 6.70695L8.70699 12.364C8.51946 12.5514 8.26515 12.6567 7.99999 12.6567C7.73482 12.6567 7.48052 12.5514 7.29299 12.364L1.63599 6.70695C1.44852 6.51942 1.3432 6.26512 1.3432 5.99995C1.3432 5.73479 1.44852 5.48048 1.63599 5.29295Z"
      fill="#2542F0"
    />
  </svg>
);

export const StorageSearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    style={{
      width: "20px",
      height: "20px",
      aspectRatio: "1/1",
    }}
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.5738 14.6373C11.281 15.5283 9.71394 16.0501 8.02503 16.0501C3.59293 16.0501 0 12.4571 0 8.02503C0 3.59293 3.59293 0 8.02503 0C12.4571 0 16.0501 3.59293 16.0501 8.02503C16.0501 9.71394 15.5283 11.281 14.6373 12.5738L20 17.9365L17.9365 20L12.5738 14.6373ZM8.02466 13.1321C10.8451 13.1321 13.1315 10.8457 13.1315 8.02529C13.1315 5.20486 10.8451 2.91845 8.02466 2.91845C5.20423 2.91845 2.91782 5.20486 2.91782 8.02529C2.91782 10.8457 5.20423 13.1321 8.02466 13.1321Z"
      fill="#2A6AFF"
    />
  </svg>
);

export const StorageCheckboxUncheckedIcon = (
  props: SVGProps<SVGSVGElement>,
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    {...props}
  >
    <rect
      x="0.5"
      y="0.5"
      width="19"
      height="19"
      rx="3.5"
      stroke="#C6C6C6"
    />
    <path
      d="M5 9.5L9 14.5L15.5 6"
      stroke="#C6C6C6"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const StorageCheckboxCheckedIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    {...props}
  >
    <rect
      x="0.5"
      y="0.5"
      width="19"
      height="19"
      rx="3.5"
      stroke="#2542F0"
      strokeWidth="2"
    />
    <path
      d="M5 9.5L9 14.5L15.5 6"
      stroke="#2542F0"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
