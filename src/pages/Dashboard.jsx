import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, Bell, ChevronDown, CreditCard, LayoutDashboard, Menu, Plus, Settings, Tags, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { getTransactionsForPeriod } from '../services/transactionService'

const nav = [
  ['Dashboard', '/', LayoutDashboard],
  ['Transaksi', '/transaksi', CreditCard],
  ['Kategori', '/kategori', Tags],
  ['Laporan', '/laporan', BarChart3],
  ['Pengaturan', '/pengaturan', Settings],
]

const months = Array.from({ length: 12 }, (_, i) => new Date(new Date().getFullYear(), i, 1))

function formatIDR(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

function isoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function periodRange(period, monthDate) {
  const today = new Date()
  if (period === 'week') {
    const start = new Date(today)
    start.setDate(today.getDate() - 6)
    return [isoDate(start), isoDate(today)]
  }
  if (period === 'year') return [`${today.getFullYear()}-01-01`, `${today.getFullYear()}-12-31`]
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  return [isoDate(start), isoDate(end)]
}

function chartRows(transactions, period, monthDate) {
  const [startDate, endDate] = periodRange(period, monthDate)
  if (period === 'year') {
    const year = new Date().getFullYear()
    return Array.from({ length: 12 }, (_, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`
      const row = { name: new Date(year, i, 1).toLocaleDateString('id-ID', { month: 'short' }), income: 0, expense: 0 }
      transactions.forEach(tx => { if (tx.transaction_date.startsWith(key)) row[tx.type] += Number(tx.amount) })
      return row
    })
  }
  const rows = []
  for (let cursor = new Date(`${startDate}T00:00:00`), end = new Date(`${endDate}T00:00:00`); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const key = isoDate(cursor)
    const row = { name: period === 'week' ? cursor.toLocaleDateString('id-ID', { weekday: 'short' }) : String(cursor.getDate()).padStart(2, '0'), income: 0, expense: 0 }
    transactions.forEach(tx => { if (tx.transaction_date === key) row[tx.type] += Number(tx.amount) })
    rows.push(row)
  }
  return rows
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [period, setPeriod] = useState('month')
  const [monthDate, setMonthDate] = useState(new Date())
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [startDate, endDate] = useMemo(() => periodRange(period, monthDate), [period, monthDate])

  useEffect(() => {
    let active = true
    async function load() {
      if (!user?.id) return
      setLoading(true)
      setError('')
      try {
        const rows = await getTransactionsForPeriod(user.id, startDate, endDate)
        if (active) setTransactions(rows)
      } catch (err) {
        if (active) setError(err.message || 'Gagal memuat transaksi.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [user?.id, startDate, endDate])

  const totals = useMemo(() => transactions.reduce((result, tx) => {
    result[tx.type] += Number(tx.amount)
    return result
  }, { income: 0, expense: 0 }), [transactions])

  const chartData = useMemo(() => chartRows(transactions, period, monthDate), [transactions, period, monthDate])

  const categorySummary = useMemo(() => {
    const grouped = {}
    transactions.filter(tx => tx.type === 'expense').forEach(tx => {
      const name = tx.category?.name || 'Tanpa Kategori'
      grouped[name] = (grouped[name] || 0) + Number(tx.amount)
    })
    const total = totals.expense || 0
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, amount]) => ({ label, percent: total ? Math.round(amount / total * 100) : 0 }))
  }, [transactions, totals.expense])

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pengguna'
  const activeLabel = nav.find(item => item[1] === location.pathname)?.[0] || 'Dashboard'
  const dateLabel = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
  const go = path => { setMenuOpen(false); navigate(path) }

  return <div className="min-h-screen bg-slate-50 text-slate-800">
    <aside className={`${menuOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white p-5 transition-transform lg:translate-x-0`}>
      <div className="mb-8 flex items-center justify-between"><div><div className="text-2xl font-extrabold tracking-tight text-slate-900">We<span className="text-blue-600">Money</span></div><div className="text-xs text-slate-400">Catat Uangmu, Rencanakan Masa Depanmu</div></div><button onClick={() => setMenuOpen(false)} className="lg:hidden" aria-label="Tutup menu"><X size={20}/></button></div>
      <nav className="space-y-1">{nav.map(([label, path, Icon]) => <button key={label} onClick={() => go(path)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${activeLabel === label ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}><Icon size={19}/>{label}</button>)}</nav>
      <div className="absolute bottom-5 left-5 right-5 border-t border-slate-100 pt-4 text-xs text-slate-400">WeMoney V1<br/>© 2026 Created Jsuryana</div>
    </aside>

    <div className="lg:pl-64">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8"><button onClick={() => setMenuOpen(true)} className="lg:hidden" aria-label="Buka menu"><Menu/></button><div className="hidden lg:block"><h1 className="font-bold text-slate-900">{activeLabel}</h1></div><div className="ml-auto flex items-center gap-4"><button className="rounded-xl p-2 hover:bg-slate-100" aria-label="Notifikasi"><Bell size={20}/></button><button onClick={() => go('/pengaturan')} className="flex items-center gap-2" aria-label="Buka pengaturan profil"><div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 font-bold text-blue-700">{displayName.slice(0, 2).toUpperCase()}</div><div className="hidden text-left sm:block"><div className="text-sm font-bold">{displayName}</div><div className="text-xs text-slate-400">Pengguna</div></div><ChevronDown size={16}/></button></div></header>

      <main className="mx-auto max-w-7xl p-4 pb-24 lg:p-8 lg:pb-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-slate-500">{dateLabel}</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Selamat datang kembali 👋</h2><p className="mt-1 text-sm text-slate-500">Pantau kondisi keuanganmu hari ini.</p></div><button onClick={() => go('/transaksi')} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><Plus size={18}/> Tambah Transaksi</button></div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1"><button onClick={() => setPeriod('month')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}>Bulan Ini</button><button onClick={() => setPeriod('week')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${period === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}>Minggu Ini</button><button onClick={() => setPeriod('year')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${period === 'year' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}>Tahun Ini</button></div>

        {error && <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Summary title="Total Pemasukan" value={formatIDR(totals.income)} icon={TrendingUp} tone="emerald" loading={loading}/><Summary title="Total Pengeluaran" value={formatIDR(totals.expense)} icon={TrendingDown} tone="rose" loading={loading}/><Summary title="Saldo" value={formatIDR(totals.income - totals.expense)} icon={Wallet} tone="blue" loading={loading}/></section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]"><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="mb-5 flex items-center justify-between gap-3"><div><h3 className="font-bold text-slate-900">Arus Keuangan</h3><p className="text-xs text-slate-400">Pemasukan vs pengeluaran</p></div>{period === 'month' && <select value={monthDate.getMonth()} onChange={e => setMonthDate(new Date(new Date().getFullYear(), Number(e.target.value), 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-xs" aria-label="Pilih bulan">{months.map(date => <option key={date.getMonth()} value={date.getMonth()}>{date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</option>)}</select>}</div><div className="h-64">{loading ? <div className="grid h-full place-items-center text-sm text-slate-400">Memuat grafik...</div> : <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip formatter={value => formatIDR(value)}/><Bar dataKey="income" name="Pemasukan" fill="#2563eb" radius={[5,5,0,0]}/><Bar dataKey="expense" name="Pengeluaran" fill="#e11d48" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer>}</div></div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><h3 className="font-bold">Ringkasan Pengeluaran</h3><p className="mt-1 text-xs text-slate-400">Berdasarkan kategori pada periode aktif</p><div className="mt-5 space-y-5">{loading ? <p className="text-sm text-slate-400">Memuat ringkasan...</p> : categorySummary.length ? categorySummary.map(item => <Progress key={item.label} label={item.label} value={`${item.percent}%`} width={`${item.percent}%`}/>) : <p className="text-sm text-slate-400">Belum ada pengeluaran pada periode ini.</p>}</div></div></section>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-bold">Transaksi Terbaru</h3><p className="text-xs text-slate-400">Aktivitas keuangan terbaru pada periode aktif</p></div><button onClick={() => go('/transaksi')} className="text-sm font-bold text-blue-600">Lihat Semua</button></div>{loading ? <div className="py-8 text-center text-sm text-slate-400">Memuat transaksi...</div> : transactions.length ? <div className="divide-y divide-slate-100">{transactions.slice(0, 5).map(tx => <TransactionRow key={tx.id} transaction={tx}/>)}</div> : <div className="rounded-xl bg-slate-50 py-10 text-center"><p className="font-semibold text-slate-700">Belum ada transaksi</p><p className="mt-1 text-sm text-slate-400">Tambahkan transaksi pertama untuk mulai mencatat keuanganmu.</p><button onClick={() => go('/transaksi')} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Tambah Transaksi</button></div>}</section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid h-16 grid-cols-5 border-t border-slate-200 bg-white lg:hidden"><MobileNav label="Dashboard" path="/" Icon={LayoutDashboard} activeLabel={activeLabel} onClick={go}/><MobileNav label="Transaksi" path="/transaksi" Icon={CreditCard} activeLabel={activeLabel} onClick={go}/><button onClick={() => go('/transaksi')} className="-mt-5 mx-auto grid h-14 w-14 place-items-center rounded-full bg-blue-600 text-white shadow-xl" aria-label="Tambah transaksi"><Plus/></button><MobileNav label="Laporan" path="/laporan" Icon={BarChart3} activeLabel={activeLabel} onClick={go}/><MobileNav label="Pengaturan" path="/pengaturan" Icon={Settings} activeLabel={activeLabel} onClick={go}/></nav>
    </div>
  </div>
}

function Summary({ title, value, icon: Icon, tone, loading }) {
  const styles = { blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600' }
  return <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{title}</p><p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{loading ? 'Memuat...' : value}</p></div><div className={`grid h-11 w-11 place-items-center rounded-xl ${styles[tone]}`}><Icon size={21}/></div></div></div>
}

function Progress({ label, value, width }) {
  return <div><div className="mb-2 flex justify-between text-xs font-semibold"><span>{label}</span><span className="text-slate-400">{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width }}/></div></div></div>
}

function TransactionRow({ transaction }) {
  const income = transaction.type === 'income'
  const date = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${transaction.transaction_date}T00:00:00`))
  return <div className="flex items-center justify-between gap-3 py-4"><div className="flex min-w-0 items-center gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${income ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{income ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}</div><div className="min-w-0"><div className="truncate text-sm font-bold">{transaction.description || 'Tanpa keterangan'}</div><div className="text-xs text-slate-400">{transaction.category?.name || 'Tanpa kategori'} · {date}</div></div></div><div className={`whitespace-nowrap text-sm font-extrabold ${income ? 'text-emerald-600' : 'text-rose-600'}`}>{income ? '+' : '-'}{formatIDR(Number(transaction.amount))}</div></div>
}

function MobileNav({ label, path, Icon, activeLabel, onClick }) {
  return <button onClick={() => onClick(path)} className={`grid place-items-center text-[10px] font-semibold ${activeLabel === label ? 'text-blue-600' : 'text-slate-400'}`}><Icon size={20}/>{label}</button>
}
