import { useEffect, useMemo, useState } from 'react'
import { BarChart3, CreditCard, LayoutDashboard, Plus, Settings, Tags, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { useAuth } from '../hooks/useAuth'
import { getTransactionsForPeriod } from '../services/transactionService'
import { getWalletBalances } from '../services/walletService'

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))
const localISO = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
function getRange(period, month) {
  const now = new Date()
  if (period === 'week') { const start = new Date(now); start.setDate(now.getDate() - 6); return [localISO(start), localISO(now)] }
  if (period === 'year') return [`${now.getFullYear()}-01-01`, `${now.getFullYear()}-12-31`]
  return [localISO(new Date(now.getFullYear(), month, 1)), localISO(new Date(now.getFullYear(), month + 1, 0))]
}

export default function Dashboard() {
  const { user } = useAuth()
  const [period, setPeriod] = useState('month')
  const [month, setMonth] = useState(new Date().getMonth())
  const [rows, setRows] = useState([])
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [startDate, endDate] = useMemo(() => getRange(period, month), [period, month])

  useEffect(() => {
    let active = true
    async function load() {
      if (!user?.id) return
      setLoading(true); setError('')
      try {
        const [transactions, balances] = await Promise.all([getTransactionsForPeriod(user.id, startDate, endDate), getWalletBalances(user.id)])
        if (active) { setRows(transactions); setWallets(balances) }
      } catch (err) { if (active) setError(err.message || 'Gagal memuat data dashboard.') }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [user?.id, startDate, endDate])

  const totals = useMemo(() => rows.reduce((result, tx) => { result[tx.type] += Number(tx.amount || 0); return result }, { income: 0, expense: 0 }), [rows])
  const totalBalance = useMemo(() => wallets.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0), [wallets])
  const categories = useMemo(() => {
    const grouped = {}
    rows.filter(tx => tx.type === 'expense').forEach(tx => { const key = tx.category?.name || 'Tanpa kategori'; grouped[key] = (grouped[key] || 0) + Number(tx.amount || 0) })
    const total = totals.expense || 0
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, amount]) => ({ name, amount, percent: total ? Math.round(amount / total * 100) : 0 }))
  }, [rows, totals.expense])

  const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

  return <AppShell title="Dashboard">
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm text-slate-500">{today}</p><h2 className="mt-1 text-2xl font-extrabold text-slate-900">Selamat datang kembali 👋</h2><p className="text-sm text-slate-500">Pantau kondisi keuanganmu hari ini.</p></div>
      <button onClick={() => window.location.assign('#')} className="hidden" aria-hidden="true" tabIndex={-1}>x</button>
      <button onClick={() => { window.history.pushState({}, '', `${import.meta.env.BASE_URL}transaksi`); window.dispatchEvent(new PopStateEvent('popstate')) }} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-600/20"><Plus size={18}/>Tambah Transaksi</button>
    </div>
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
      {[['month','Bulan Ini'],['week','Minggu Ini'],['year','Tahun Ini']].map(([key,label]) => <button key={key} onClick={() => setPeriod(key)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${period === key ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}>{label}</button>)}
      {period === 'month' && <select aria-label="Pilih bulan" value={month} onChange={e => setMonth(Number(e.target.value))} className="rounded-lg border border-slate-200 bg-white px-3 text-sm">{months.map((name,index) => <option key={name} value={index}>{name}</option>)}</select>}
    </div>
    {error && <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Card title="Total Pemasukan" value={totals.income} icon={TrendingUp} tone="emerald" loading={loading}/><Card title="Total Pengeluaran" value={totals.expense} icon={TrendingDown} tone="rose" loading={loading}/><Card title="Saldo Semua Dompet" value={totalBalance} icon={Wallet} tone="blue" loading={loading}/></section>
    <section className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><h3 className="font-bold">Ringkasan Pengeluaran</h3><p className="mt-1 text-xs text-slate-400">Berdasarkan periode aktif</p><div className="mt-5 space-y-4">{!loading&&!categories.length&&<p className="text-sm text-slate-400">Belum ada pengeluaran.</p>}{categories.map(item=><div key={item.name}><div className="mb-2 flex justify-between gap-3 text-sm"><span className="truncate">{item.name}</span><span className="font-semibold">{item.percent}% · {money(item.amount)}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{width:`${item.percent}%`}}/></div></div>)}</div></div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-center justify-between"><div><h3 className="font-bold">Transaksi Terbaru</h3><p className="mt-1 text-xs text-slate-400">Periode aktif</p></div><a href={`${import.meta.env.BASE_URL}transaksi`} className="text-xs font-bold text-blue-600">Lihat semua</a></div><div className="mt-4 divide-y divide-slate-100">{!loading&&!rows.length&&<p className="py-8 text-sm text-slate-400">Belum ada transaksi.</p>}{rows.slice(0,5).map(tx=><div key={tx.id} className="flex items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="truncate text-sm font-bold">{tx.description||'Tanpa keterangan'}</p><p className="text-xs text-slate-400">{tx.category?.name||'Tanpa kategori'} · {tx.wallet?.name||'Tanpa dompet'} · {tx.transaction_date}</p></div><span className={`whitespace-nowrap text-sm font-bold ${tx.type==='income'?'text-emerald-600':'text-rose-600'}`}>{tx.type==='income'?'+':'-'}{money(tx.amount)}</span></div>)}</div></div>
    </section>
  </AppShell>
}
function Card({title,value,icon:Icon,tone,loading}) { const tones={blue:'bg-blue-50 text-blue-600',emerald:'bg-emerald-50 text-emerald-600',rose:'bg-rose-50 text-rose-600'}; return <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-2xl font-extrabold">{loading?'Memuat...':money(value)}</p></div><div className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}><Icon size={21}/></div></div></div> }
