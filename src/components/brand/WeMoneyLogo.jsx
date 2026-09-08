export default function WeMoneyLogo({ size = 64, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="We MONEY Wallet W icon" className={className}>
      <defs>
        <linearGradient id="wm-wallet" x1="8" y1="12" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1597FF" />
          <stop offset="0.52" stopColor="#0878F9" />
          <stop offset="1" stopColor="#0754D9" />
        </linearGradient>
        <linearGradient id="wm-card" x1="17" y1="8" x2="50" y2="27" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#B9FF8A" />
          <stop offset="0.55" stopColor="#16D89A" />
          <stop offset="1" stopColor="#00A8C8" />
        </linearGradient>
        <linearGradient id="wm-w" x1="13" y1="27" x2="50" y2="51" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1C7BFF" />
          <stop offset="0.35" stopColor="#16DFA0" />
          <stop offset="0.68" stopColor="#5DE7FF" />
          <stop offset="1" stopColor="#7CFF35" />
        </linearGradient>
        <filter id="wm-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#001B4D" floodOpacity="0.3" />
        </filter>
      </defs>

      <g filter="url(#wm-shadow)">
        <path d="M15 17 45.7 7.2c2.6-.8 5.1.7 5.7 3.3l1 4.3-37 9.3L15 17Z" fill="url(#wm-card)" />
        <path d="M13.5 23.5 46 15.3c2.8-.7 5.5 1 6.1 3.8l.6 2.6-38.8 9.2-1.4-7.4c-.2-1 0-1.8 1-2Z" fill="#F8FAFC" />
        <path d="M9 25.5h43c3.9 0 7 3.1 7 7V50c0 5.5-4.5 10-10 10H17C11.5 60 7 55.5 7 50V32.5c0-3.9 3.1-7 7-7Z" fill="url(#wm-wallet)" />
        <path d="M11 31.5h45.5" stroke="#5BE7FF" strokeWidth="1.5" opacity="0.8" />
        <path d="M13.5 35h35.5" stroke="#65D9FF" strokeWidth="1.3" strokeDasharray="3 3" opacity="0.8" />

        <path d="M14.5 28.5c5.8-1.4 10.8-1.5 15.2-.4 3.5.9 6.4 2.7 8.7 5.5 2.2 2.7 4.6 3.6 7.3 2.6 1.7-.6 3.4-1.8 5.1-3.6" fill="none" stroke="url(#wm-w)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.5 28.5 20.8 48.5 28.4 35.2 36.2 48.5 48 27.2" fill="none" stroke="url(#wm-w)" strokeWidth="6.8" strokeLinecap="round" strokeLinejoin="round" />

        <path d="M43.5 35h14c2.5 0 4.5 2 4.5 4.5v8c0 2.5-2 4.5-4.5 4.5h-14c-3.3 0-6-2.7-6-6v-5c0-3.3 2.7-6 6-6Z" fill="#0865E9" />
        <circle cx="51.5" cy="44" r="3.2" fill="#F8FAFC" />
      </g>
    </svg>
  )
}
