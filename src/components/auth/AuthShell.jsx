import { version } from '../../../package.json'
import WeMoneyLogo from '../brand/WeMoneyLogo'

export default function AuthShell({ title, subtitle, children, footer }) {
  const year = new Date().getFullYear()
  return (
    <main className="wm-auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 wm-auth-glow" />
      <div className="relative z-10 w-full max-w-md">
        <section className="wm-auth-card overflow-hidden rounded-[1.75rem] border shadow-2xl backdrop-blur-xl">
          <header className="px-6 pb-7 pt-8 text-center sm:px-8 sm:pt-9">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl p-0.5 shadow-lg">
              <WeMoneyLogo size={64} />
            </div>
            <div className="text-2xl font-extrabold tracking-tight">We<span className="wm-brand-accent"> MONEY</span></div>
            <p className="mt-1 text-xs leading-5 opacity-70">Catat Uangmu, Rencanakan Masa Depanmu</p>
          </header>
          <div className="border-t px-6 py-7 sm:px-8 sm:py-8 wm-auth-body">
            <div className="text-left"><h1 className="text-2xl font-extrabold tracking-tight">{title}</h1><p className="mt-1 text-sm leading-6 opacity-70">{subtitle}</p></div>
            <div className="mt-7 text-left">{children}</div>
            {footer && <div className="mt-6 text-center text-sm opacity-70">{footer}</div>}
          </div>
        </section>
        <p className="mt-5 text-center text-xs opacity-60">We MONEY V{version} | © {year} Created Jsuryana</p>
      </div>
    </main>
  )
}
