import { version } from '../../../package.json'
import WeMoneyLogo from '../brand/WeMoneyLogo'

export default function AuthShell({ title, subtitle, children, footer }) {
  const year = new Date().getFullYear()
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-8 text-slate-100 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.14),transparent_42%)]" />
      <div className="relative z-10 w-full max-w-md">
        <section className="overflow-hidden rounded-[1.75rem] border border-slate-800/80 bg-slate-900/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <header className="px-6 pb-7 pt-8 text-center sm:px-8 sm:pt-9">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
              <WeMoneyLogo size={64} />
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-white">We<span className="text-blue-400">MONEY</span></div>
            <p className="mt-1 text-xs leading-5 text-slate-400">Catat Uangmu, Rencanakan Masa Depanmu</p>
          </header>
          <div className="border-t border-slate-800/80 px-6 py-7 sm:px-8 sm:py-8">
            <div className="text-left">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">{title}</h1>
              <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p>
            </div>
            <div className="mt-7 text-left">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-slate-400">{footer}</div>}
          </div>
        </section>
        <p className="mt-5 text-center text-xs text-slate-500">WeMONEY V{version} | © {year} Created Jsuryana</p>
      </div>
    </main>
  )
}
