import type { SVGProps } from "react";

// Minimal stroke icon set (24px grid, inherits currentColor). Avoids an icon-library dependency.
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

type P = SVGProps<SVGSVGElement>;

export const ArrowRight = (p: P) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>;
export const Check = (p: P) => <Icon {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>;
export const Upload = (p: P) => <Icon {...p}><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 15v3a2 2 0 002 2h10a2 2 0 002-2v-3" /></Icon>;
export const Download = (p: P) => <Icon {...p}><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 15v3a2 2 0 002 2h10a2 2 0 002-2v-3" /></Icon>;
export const Shield = (p: P) => <Icon {...p}><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></Icon>;
export const Sheet = (p: P) => <Icon {...p}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M4 9h16M4 15h16M10 3v18" /></Icon>;
export const Sparkle = (p: P) => <Icon {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 16l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" /></Icon>;
export const Cap = (p: P) => <Icon {...p}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6" /></Icon>;
export const Book = (p: P) => <Icon {...p}><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z" /><path d="M4 19V5M8 7h7" /></Icon>;
export const Lock = (p: P) => <Icon {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></Icon>;
export const Clock = (p: P) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>;
export const File = (p: P) => <Icon {...p}><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /></Icon>;
export const Zip = (p: P) => <Icon {...p}><path d="M7 3h7l4 4v14H7z" /><path d="M11 3v2M11 7v2M11 11v2M10 15h2v3h-2z" /></Icon>;
export const Pencil = (p: P) => <Icon {...p}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></Icon>;
export const Users = (p: P) => <Icon {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.8c2 .7 3.2 2.5 3.5 5.2" /></Icon>;
export const Eye = (p: P) => <Icon {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Icon>;
export const Plus = (p: P) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
