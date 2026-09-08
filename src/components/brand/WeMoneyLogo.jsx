import appIcon from '../../assets/branding/wemoney-app-icon.png'

export default function WeMoneyLogo({ size = 64, className = '', showName = false, showTagline = false }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={appIcon}
        width={size}
        height={size}
        alt="We MONEY"
        className="shrink-0 object-contain"
        draggable="false"
      />
      {showName && (
        <div className="min-w-0">
          <div className="font-extrabold tracking-tight text-slate-900 dark:text-white">We MONEY</div>
          {showTagline && (
            <div className="text-xs leading-tight text-slate-500 dark:text-slate-400">
              Catat Uangmu, Rencanakan Masa Depanmu
            </div>
          )}
        </div>
      )}
    </div>
  )
}
