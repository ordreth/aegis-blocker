export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Aegis"
      className={className}
    >
      <defs>
        <linearGradient id="aegis-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0c27f" />
          <stop offset="1" stopColor="#d97e4a" />
        </linearGradient>
      </defs>
      <path
        d="M32 4 56 13v17c0 15-10 25-24 30C18 55 8 45 8 30V13z"
        fill="url(#aegis-g)"
      />
      <path d="M32 11 50 18v12c0 11-7.500 19-18 23-10.500-4-18-12-18-23V18z" fill="#12151a" />
      <path d="M32 20 40 44h-4.500l-1.400-4.200h-4.200L28.500 44H24zm0 8.600-1.600 5.200h3.200z" fill="url(#aegis-g)" />
    </svg>
  );
}
