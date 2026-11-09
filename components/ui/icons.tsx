import type { SVGProps } from "react";

/**
 * Brand marks Lucide no longer ships, plus the ME chip logo.
 * All decorative (aria-hidden); the surrounding link/button carries the accessible name.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export function GitHubIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" aria-hidden {...props}>
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}

export function LinkedInIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden {...props}>
      <rect x="2" y="9" width="4.5" height="13" rx="0.5" />
      <circle cx="4.25" cy="4.5" r="2.5" />
      <path d="M9.5 9h4.3v1.8c.6-1.1 2-2.1 4.1-2.1 4.3 0 5.1 2.8 5.1 6.5V22h-4.5v-6.1c0-1.5 0-3.4-2.1-3.4s-2.4 1.6-2.4 3.3V22H9.5V9Z" />
    </svg>
  );
}

/** "ME" monogram drawn as a chip with pins (SPEC §5 navbar logo). */
export function ChipLogo({ size = 32, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden {...props}>
      <defs>
        <linearGradient id="chip-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--cyan)" />
          <stop offset="1" stopColor="var(--violet)" />
        </linearGradient>
      </defs>
      <g stroke="url(#chip-g)" strokeWidth="1.5" strokeLinecap="round" fill="none">
        <path d="M11 3v3M16 3v3M21 3v3M11 26v3M16 26v3M21 26v3M3 11h3M3 16h3M3 21h3M26 11h3M26 16h3M26 21h3" />
        <rect x="6.5" y="6.5" width="19" height="19" rx="3" />
      </g>
      <text
        x="16"
        y="19.6"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="9.5"
        fontWeight="700"
        fill="url(#chip-g)"
      >
        ME
      </text>
    </svg>
  );
}
