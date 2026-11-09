// Aegis: the round hoplite shield bearing the Gorgon's eye, drawn like a black-figure vase painting.
// Below ~40px the rivets and serpents turn to noise, so small sizes use a simplified drawing.
const RIVETS = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2 - Math.PI / 2;
  return [64 + 54.5 * Math.cos(a), 64 + 54.5 * Math.sin(a)] as const;
});

const INK = "#1d1612";

export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  const common = { width: size, height: size, viewBox: "0 0 128 128", role: "img", "aria-label": "Aegis", className } as const;

  if (size < 40) {
    return (
      <svg {...common}>
        <circle cx="64" cy="64" r="62" fill={INK} />
        <circle cx="64" cy="64" r="51" fill="#d4653a" />
        <path d="M12 64C30 34 98 34 116 64 98 94 30 94 12 64Z" fill="#f6ead0" stroke={INK} strokeWidth="9" strokeLinejoin="round" />
        <circle cx="64" cy="64" r="21" fill="#e9ab3a" />
        <ellipse cx="64" cy="64" rx="6" ry="20" fill={INK} />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="64" cy="64" r="60" fill={INK} />
      <g fill="#d9a35a">
        {RIVETS.map(([x, y], i) => (
          <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.2" />
        ))}
      </g>
      <circle cx="64" cy="64" r="48" fill="#cf5f33" />
      <circle cx="64" cy="64" r="44" fill="none" stroke={INK} strokeWidth="2" />
      <g transform="translate(0 6)">
        <g fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round">
          <path d="M64 52C57 45 71 39 64 31" />
          <path d="M52 54C44 48 57 42 49 34" />
          <path d="M76 54C84 48 71 42 79 34" />
          <path d="M41 60C33 56 42 50 35 45" />
          <path d="M87 60C95 56 86 50 93 45" />
        </g>
        <g fill={INK}>
          <ellipse cx="64" cy="28.5" rx="3" ry="4.3" />
          <ellipse cx="48" cy="31.5" rx="3" ry="4.3" transform="rotate(-18 48 31.5)" />
          <ellipse cx="80" cy="31.5" rx="3" ry="4.3" transform="rotate(18 80 31.5)" />
          <ellipse cx="33.5" cy="42.5" rx="2.8" ry="4" transform="rotate(-38 33.5 42.5)" />
          <ellipse cx="94.5" cy="42.5" rx="2.8" ry="4" transform="rotate(38 94.5 42.5)" />
        </g>
        <path d="M28 66C43 46 85 46 100 66 85 86 43 86 28 66Z" fill="#f3e5c8" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <circle cx="64" cy="66" r="14" fill="#e3a63c" />
        <ellipse cx="64" cy="66" rx="3.6" ry="13" fill={INK} />
      </g>
    </svg>
  );
}
