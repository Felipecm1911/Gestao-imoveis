/** Ilustração do painel de login: duas torres residenciais com varandas e janelas acesas. */
export function BuildingArt({ className }: { className?: string }) {
  const floors = Array.from({ length: 13 }, (_, i) => i)
  return (
    <svg viewBox="0 0 360 520" className={className} aria-hidden>
      <defs>
        <linearGradient id="tower" x1="0" x2="1">
          <stop offset="0" stopColor="#f2e8dc" />
          <stop offset="1" stopColor="#d9c7b3" />
        </linearGradient>
        <linearGradient id="tower2" x1="0" x2="1">
          <stop offset="0" stopColor="#3a5f80" />
          <stop offset="1" stopColor="#24445f" />
        </linearGradient>
        <linearGradient id="glass" y1="0" y2="1">
          <stop offset="0" stopColor="#9ed6cf" />
          <stop offset="1" stopColor="#2c8c83" />
        </linearGradient>
      </defs>
      {/* torre de trás */}
      <rect x="20" y="120" width="130" height="400" fill="url(#tower2)" />
      {floors.slice(0, 11).map((f) =>
        [0, 1, 2].map((c) => (
          <rect key={`b${f}-${c}`} x={34 + c * 38} y={140 + f * 34} width="26" height="18" rx="2"
            fill={(f * 3 + c) % 5 === 0 ? '#f6c98a' : '#1a3550'} opacity="0.9" />
        )),
      )}
      {/* torre da frente */}
      <rect x="120" y="40" width="200" height="480" fill="url(#tower)" />
      <rect x="112" y="30" width="216" height="14" rx="2" fill="#c96b4b" />
      {floors.map((f) => (
        <g key={f} transform={`translate(0 ${60 + f * 35})`}>
          <rect x="132" y="0" width="80" height="24" rx="2" fill="url(#glass)" />
          <rect x="228" y="0" width="80" height="24" rx="2" fill="url(#glass)" opacity={f % 3 === 1 ? 0.75 : 1} />
          <rect x="126" y="24" width="92" height="5" fill="#b9a48e" />
          <rect x="222" y="24" width="92" height="5" fill="#b9a48e" />
          {f % 2 === 0 && <rect x="300" y="6" width="5" height="18" fill="#2f855a" opacity="0.8" />}
        </g>
      ))}
      <rect x="0" y="512" width="360" height="8" fill="#0b2236" />
      {/* árvores */}
      <circle cx="40" cy="482" r="34" fill="#1f6b4f" />
      <circle cx="78" cy="494" r="26" fill="#2f855a" />
      <circle cx="330" cy="490" r="30" fill="#2f855a" />
    </svg>
  )
}
