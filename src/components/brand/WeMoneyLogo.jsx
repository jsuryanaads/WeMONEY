export default function WeMoneyLogo({ size = 64, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="WeMONEY logo" className={className}>
      <defs>
        <linearGradient id="wemoney-blue" x1="8" y1="8" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <rect x="4" y="11" width="56" height="45" rx="12" fill="url(#wemoney-blue)" />
      <path d="M14 15.5 50 8.5c3.1-.6 5.8 1.8 5.8 4.9v3.1H14v-1Z" fill="#93C5FD" />
      <path d="M17 23h30v25H17z" fill="#fff" opacity=".98" />
      <path d="M17 23h30v25H17z" fill="#2563EB" opacity=".12" />
      <path d="M17 23h30v25H17z" fill="none" stroke="#fff" strokeWidth="2.4" />
      <path d="M21 29 24.5 42 29 31l4 11 4.5-13 4 13 3-13" fill="none" stroke="#fff" strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M39 37h8" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
      <circle cx="48" cy="37" r="3.2" fill="#fff" />
    </svg>
  )
}
