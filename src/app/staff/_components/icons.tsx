import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 18): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
});

export const ScanIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M7 12h10" />
  </svg>
);
export const CheckIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} strokeWidth={2.6} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const CheckCircleIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l2.7 2.7L16 10" />
  </svg>
);
export const WarnIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
  </svg>
);
export const XIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const XCircleIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </svg>
);
export const InfoIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.5h.01" />
  </svg>
);
export const AlertCircleIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5M12 16h.01" />
  </svg>
);
export const PinIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);
export const CalendarIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);
export const CalendarXIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4M10 13.5l4 4M14 13.5l-4 4" />
  </svg>
);
export const SearchIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);
export const UserPlusIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="10" cy="8" r="4" />
    <path d="M3 21a7 7 0 0 1 14 0M19 8v6M16 11h6" />
  </svg>
);
export const ArrowLeftIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
export const ArrowRightIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const QrMiniIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="4" y="4" width="5" height="5" rx="1" />
    <rect x="15" y="4" width="5" height="5" rx="1" />
    <rect x="4" y="15" width="5" height="5" rx="1" />
    <path d="M15 15h1.5M19 15v1.5M15 19.5h.01M19 19.5v.01" />
  </svg>
);
