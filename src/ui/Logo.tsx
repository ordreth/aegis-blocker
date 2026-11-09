export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" role="img" aria-label="Aegis" className={className}>
      <defs>
        <linearGradient id="aegis-gold" x1="18" y1="8" x2="110" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f6d08f" />
          <stop offset="0.55" stopColor="#d99543" />
          <stop offset="1" stopColor="#c8693a" />
        </linearGradient>
        <linearGradient id="aegis-face" x1="64" y1="18" x2="64" y2="116" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#232a3a" />
          <stop offset="1" stopColor="#0f121a" />
        </linearGradient>
        <linearGradient id="aegis-glyph" x1="64" y1="36" x2="64" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffe2a8" />
          <stop offset="1" stopColor="#e0a04b" />
        </linearGradient>
      </defs>
      <path d="M64 8 108 24v38c0 28-18 46-44 58C38 108 20 90 20 62V24z" fill="url(#aegis-gold)" />
      <path d="M64 16 101 29.500V62c0 23.500-15 38.500-37 48.500C42 100.500 27 85.500 27 62V29.500z" fill="url(#aegis-face)" />
      <path d="M64 38 84 90H73.200l-3.600-10.400H58.400L54.800 90H44zm0 17.600-4.700 14.400h9.400z" fill="url(#aegis-glyph)" fillRule="evenodd" />
    </svg>
  );
}
