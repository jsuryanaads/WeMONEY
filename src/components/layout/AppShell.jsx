import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, CreditCard, LayoutDashboard, Menu, Settings, Tags, Wallet, X } from 'lucide-react'
import { signOut } from '../../services/authService'
import { useAuth } from '../../hooks/useAuth'

const items = [
  ['Dashboard', '/dashboard', LayoutDashboard],
  ['Transaksi', '/transaksi', CreditCard],
  ['Kategori', '/kategori', Tags],
  ['Dompet', '/dompet', Wallet],
  ['Laporan', '/laporan', BarChart3],
  ['Pengaturan', '/pengaturan', Settings],
]

export default function AppShell({ title, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pengguna'
  const year = new Date().getFullYear()
  const go = path => { setOpen(false); navigate(path) }

  return <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-800 lg:pl-64">
    <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-[min(18rem,85vw)] border-r border-slate-200 bg-white p-4 transition-transform sm:p-5 lg:translate-x-0`}>
      <div className="mb-6 flex items-start justify-between"><div className="min-w-0"><div className="truncate text-2xl font-extrabold tracking-tight text-slate-900">We<span className="text-blue-600">Money</span></div><p className="max-w-[14rem] text-[11px] leading-4 text-slate-400">Catat Uangmu, Rencanakan Masa Depanmu</p></div><button className="ml-2 shrink-0 lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu"><X size={20}/></button></div>
      <nav className="space-y-1">{items.map(([label,path,Icon]) => <button key={path} onClick={() => go(path)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold sm:px-4 ${location.pathname === path ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}><Icon size={19}/>{label}</button>)}</nav>
      <div className="absolute bottom-5 left-5 text-xs leading-5 text-slate-400">WeMoney V1<br/>© {year} Created Jsuryana</div>
    </aside>
    {open && <button aria-label="Tutup menu" className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden" onClick={() => setOpen(false)}/>} 
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-3 backdrop-blur sm:px-4 lg:px-8"><button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu/></button><h1 className="ml-3 truncate font-bold text-slate-900 lg:ml-0">{title}</h1><div className="ml-auto flex items-center gap-2"><button onClick={() => navigate('/pengaturan')} className="flex min-w-0 items-center gap-2"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{name.slice(0,2).toUpperCase()}</span><span className="hidden max-w-48 truncate text-sm font-semibold sm:block">{name}</span></button></div></header>
    <main className="mx-auto w-full max-w-7xl p-3 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:p-4 sm:pb-24 lg:p-8 lg:pb-8">{children}</main>
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid h-[calc(4rem+env(safe-area-inset-bottom))] grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"><Mobile label="Dashboard" path="/dashboard" Icon={LayoutDashboard} go={go}/><Mobile label="Transaksi" path="/transaksi" Icon={CreditCard} go={go}/><button aria-label="Tambah transaksi" onClick={() => go('/transaksi')} className="-mt-5 mx-auto grid h-14 w-14 place-items-center self-start rounded-full bg-blue-600 text-white shadow-xl"><span className="text-2xl">+</span></button><Mobile label="Laporan" path="/laporan" Icon={BarChart3} go={go}/><Mobile label="Pengaturan" path="/pengaturan" Icon={Settings} go={go}/></nav>
  </div>
}

function Mobile({ label, path, Icon, go }) { return <button onClick={() => go(path)} className="grid min-w-0 place-items-center gap-0.5 px-1 text-[10px] font-semibold text-slate-500"><Icon size={19}/><span className="max-w-full truncate">{label}</span></button> }
