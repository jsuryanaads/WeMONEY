export default function AuthShell({ title, subtitle, children, footer }) {
  const year = new Date().getFullYear()
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-900 sm:grid sm:place-items-center">
      <section className="mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-slate-900 px-6 py-8 text-white sm:px-8">
          <div className="text-2xl font-extrabold tracking-tight">We<span className="text-blue-400">Money</span></div>
          <p className="mt-1 text-xs text-slate-400">Catat Uangmu, Rencanakan Masa Depanmu</p>
        </div>
        <div className="px-6 py-7 sm:px-8">
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </section>
      <p className="mx-auto mt-5 max-w-md text-center text-xs text-slate-500">WeMoney V1 | © {year} Created Jsuryana</p>
    </main>
  )
}
