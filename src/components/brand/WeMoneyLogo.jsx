export default function WeMoneyLogo({ size = 64, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="We MONEY logo" className={className}>
      <defs>
        <linearGradient id="we-money-blue" x1="7" y1="7" x2="57" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1597FF" />
          <stop offset="0.55" stopColor="#0878F9" />
          <stop offset="1" stopColor="#0754D9" />
        </linearGradient>
        <linearGradient id="we-money-flap" x1="13" y1="4" x2="52" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D9E8FF" />
        </linearGradient>
        <filter id="we-money-shadow" x="-20%" y="-30%" width="140%" height="170%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#001B4D" floodOpacity="0.28" />
        </filter>
      </defs>

      <g filter="url(#we-money-shadow)">
        <path d="M14 16.7 47.9 6.1c2.5-.8 4.9.9 5.4 3.5l.7 4.1-38.5 8.2-1.5-5.2Z" fill="url(#we-money-flap)" />
        <path d="M15.5 22.1 48.2 14c2.8-.7 5.5 1.1 6.1 3.9l.7 3.1-39.5 8.3-1.4-7.2c-.2-.1-.1-.1.4 0Z" fill="#39A8FF" />
        <path d="M9.5 25.5h48c2.8 0 5 2.2 5 5v20c0 5.5-4.5 10-10 10h-38c-5.5 0-10-4.5-10-10v-20c0-2.8 2.2-5 5-5Z" fill="url(#we-money-blue)" />

        <path d="M14 32.5h26.8c1.1 0 2 .9 2 2v15.7c0 1.1-.9 2-2 2H14c-1.1 0-2-.9-2-2V34.5c0-1.1.9-2 2-2Z" fill="#FFFFFF" opacity="0.98" />
        <path d="M14 32.5h26.8c1.1 0 2 .9 2 2v15.7c0 1.1-.9 2-2 2H14c-1.1 0-2-.9-2-2V34.5c0-1.1.9-2 2-2Z" fill="url(#we-money-blue)" opacity="0.08" />

        <path d="M16 34.2h23.7v16H16z" fill="none" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.9" />
        <path d="M17.8 36.4 21.8 48l4.1-11.6L30 48l4.3-11.6L38.2 48" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />

        <path d="M39 33h18.5c2.2 0 4 1.8 4 4v11.5c0 2.2-1.8 4-4 4H39c-1.4 0-2.5-1.1-2.5-2.5v-14.5C36.5 34.1 37.6 33 39 33Z" fill="#0865E9" />
        <path d="M43.5 36.2h13.3c1.1 0 2 .9 2 2v8.9c0 1.1-.9 2-2 2H43.5c-2.1 0-3.8-1.7-3.8-3.8V40c0-2.1 1.7-3.8 3.8-3.8Z" fill="#0061E5" />
        <circle cx="50.2" cy="42.6" r="5.3" fill="#0A58CF" />
        <circle cx="50.2" cy="42.6" r="3.1" fill="#001B45" />
      </g>
    </svg>
  )
}
