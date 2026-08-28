import type { ReactNode } from "react";

/* Labelled icons only — recognition over recall. Every tab pairs its glyph
   with a visible word, which is a requirement for this population rather
   than a stylistic preference. */

const paths: Record<string, ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  message: <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />,
  heart: <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1z" />,
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  back: <path d="m15 18-6-6 6-6" />,
  video: (
    <>
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="m22 8-6 4 6 4z" />
    </>
  ),
  arrow: <path d="M7 17 17 7M9 7h8v8" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  check: <path d="m4 12.5 5 5L20 6.5" />,
  mic: (
    <>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8" />
    </>
  ),
  micOff: (
    <>
      <path d="M15 5a3 3 0 0 0-6 0v5m0 2a3 3 0 0 0 5.1 2.1" />
      <path d="M5 11a7 7 0 0 0 10.5 6M19 11a7 7 0 0 1-.8 3.2M12 18v4M8 22h8M3 3l18 18" />
    </>
  ),
  videoOff: (
    <>
      <path d="M16 16H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2m4 0h4a2 2 0 0 1 2 2v3" />
      <path d="m22 8-6 4M3 3l18 18" />
    </>
  ),
  hangup: <path d="M2.5 9.5a14 14 0 0 1 19 0v2.7a1.6 1.6 0 0 1-1.9 1.6l-3-.6a1.6 1.6 0 0 1-1.3-1.6v-1a11 11 0 0 0-6.6 0v1a1.6 1.6 0 0 1-1.3 1.6l-3 .6a1.6 1.6 0 0 1-1.9-1.6z" />,
  life: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="m5.6 5.6 3.8 3.8m5.2 5.2 3.8 3.8m0-12.8-3.8 3.8m-5.2 5.2-3.8 3.8" />
    </>
  ),
  capsule: (
    <>
      <rect x="2.5" y="8" width="19" height="8" rx="4" transform="rotate(-45 12 12)" />
      <path d="M9.2 9.2 14.8 14.8" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16.5 5.5a3.2 3.2 0 0 1 0 5M18 20a6 6 0 0 0-2.2-4.6" />
    </>
  ),
  send: <path d="M4 12 20.5 4 13 20l-2.2-6.4z" />,
};

export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false"
    >
      {paths[name] ?? null}
    </svg>
  );
}
