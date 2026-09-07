import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, CreditCard, Lightbulb, Plus, Send, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import AppShell from '../components/layout/AppShell'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { getTransactionsForPeriod } from '../services/transactionService'
import { getWalletBalances } from '../services/walletService'

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))
const compactMoney = value => new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0))
const localISO = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

function getRange(period, month) {
  const now = new Date()
  if (period === 'week') {
    const start = new Date(now)
    start.setDate(now.getDate() - 6)
    return [localISO(start), localISO(now)]
  }
  if (period === 'year') return [`${now.getFullYear()}-01-01`, `${now.getFullYear()}-12-31`]
  return [localISO(new Date(now.getFullYear(), month, 1)), localISO(new Date(now.getFullYear(), month + 1, 0))]
}

function formatShortDate(date) {
  const [, month, day] = date.split('-')
  return `${day}/${month}`
}

function buildChartData(rows, period, startDate, endDate) {
  const grouped = {}
  if (period === 'year') {
    for (let i = 0; i < 12; i++) grouped[String(i + 1).padStart(2, '0')] = { label: months[i].slice(0, 3), income: 0, expense: 0 }
    rows.forEach(tx => {
      const key = tx.transaction_date.slice(5, 7)
      if (grouped[key]) grouped[key][tx.type] += Number(tx.amount || 0)
    })
    return Object.values(grouped)
  }
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const key = localISO(cursor)
    grouped[key] = { label: formatShortDate(key), income: 0, expense: 0 }
  }
  rows.forEach(tx => {
    if (grouped[tx.transaction_date]) grouped[tx.transaction_date][tx.type] += Number(tx.amount || 0)
  })
  return Object.values(grouped)
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [period, setPeriod] = useState('month')
  const [month, setMonth] = useState(new Date().getMonth())
  const [rows, setRows] = useState([])
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [live, setLive] = useState(false)
  const [startDate, endDate] = useMemo(() => getRange(period, month), [period, month])

  useEffect(() => {
    let active = true
    async function load() {
      if (!user?.id) return
      setLoading(true)
      setError('')
      try {
        const [transactions, balances] = await Promise.all([getTransactionsForPeriod(user.id, startDate, endDate), getWalletBalances(user.id)])
        if (active) {
          setRows(transactions)
          setWallets(balances)
        }
      } catch (err) {
        if (active) setError(err.message || 'Gagal memuat data dashboard.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [user?.id, startDate, endDate])

  useEffect(() => {
    if (!user?.id) return
    let timer
    const refresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => window.dispatchEvent(new Event('wemoney:data-changed')), 120)
    }
    const channel = supabase.channel(`wemoney-dashboard-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transfers', filter: `user_id=eq.${user.id}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, refresh)
      .subscribe(status => setLive(status === 'SUBSCRIBED'))
    return () => { clearTimeout(timer); supabase.removeChannel(channel) }
  }, [user?.id])

  useEffect(() => {
    const refresh = () => {
      if (!user?.id) return
      Promise.all([getTransactionsForPeriod(user.id, startDate, endDate), getWalletBalances(user.id)])
        .then(([transactions, balances]) => { setRows(transactions); setWallets(balances) })
        .catch(err => setError(err.message || 'Gagal menyegarkan dashboard.'))
    }
    window.addEventListener('wemoney:data-changed', refresh)
    return () => window.removeEventListener('wemoney:data-changed', refresh)
  }, [user?.id, startDate, endDate])

  const totals = useMemo(() => rows.reduce((result, tx) => {
    result[tx.type] += Number(tx.amount || 0)
    return result
  }, { income: 0, expense: 0 }), [rows])
  const totalBalance = useMemo(() => wallets.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0), [wallets])
  const net = totals.income - totals.expense
  const chartData = useMemo(() => buildChartData(rows, period, startDate, endDate), [rows, period, startDate, endDate])
  const categories = useMemo(() => {
    const grouped = {}
    rows.filter(tx => tx.type === 'expense').forEach(tx => {
      const key = tx.category?.name || 'Tanpa kategori'
      grouped[key] = (grouped[key] || 0) + Number(tx.amount || 0)
    })
    const total = totals.expense || 0
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, amount]) => ({ name, amount, percent: total ? Math.round(amount / total * 100) : 0 }))
  }, [rows, totals.expense])
  const insight = useMemo(() => {
    if (!rows.length) return { icon: Lightbulb, title: 'Mulai catat transaksi', text: 'Tambahkan pemasukan atau pengeluaran pertama agar WeMoney dapat membaca kondisi keuanganmu.' }
    const top = categories[0]
    if (top && totals.expense > totals.income) return { icon: TrendingDown, title: 'Pengeluaran lebih besar', text: `${top.name} menjadi kategori pengeluaran terbesar sebesar ${money(top.amount)}. Coba cek kembali pengeluaran periode ini.` }
    if (net > 0) return { icon: TrendingUp, title: 'Arus kas positif', text: `Pemasukan lebih besar ${money(net)} daripada pengeluaran pada periode aktif.` }
    if (net === 0) return { icon: BarChart3, title: 'Arus kas seimbang', text: 'Pemasukan dan pengeluaran pada periode aktif berada pada nilai yang sama.' }
    return { icon: Lightbulb, title: 'Pantau pengeluaran', text: 'Belum ada pemasukan pada periode aktif. Pastikan transaksi yang dicatat sudah lengkap.' }
  }, [rows.length, categories, totals.expense, totals.income, net])
  const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

  return <AppShell title="Dashboard">
    <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${live ? 'bg-emerald-500' : 'bg-slate-300'}`} /><p className="text-xs font-semibold text-slate-400">{live ? 'Data realtime aktif' : 'Menghubungkan realtime...'}</p></div>
        <p className="mt-1 text-sm text-slate-500">{today}</p>
        <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">Selamat datang kembali 👋</h2>
        <p className="text-sm text-slate-500">Pantau kondisi keuanganmu hari ini.</p>
      </div>
      <button onClick={() => navigate('/transaksi')} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:w-auto"><Plus size={18} />Tambah Transaksi</button>
    </div>

    <div className="mb-5 flex flex-wrap gap-2 sm:mb-6">
      {[['month','Bulan Ini'],['week','Minggu Ini'],['year','Tahun Ini']].map(([key, label]) => <button key={key} onClick={() => setPeriod(key)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${period === key ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100'}`}>{label}</button>)}
      {period === 'month' && <select aria-label="Pilih bulan" value={month} onChange={e => setMonth(Number(e.target.value))} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:flex-none">{months.map((name, index) => <option key={name} value={index}>{name}</option>)}</select>}
    </div>

    {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 sm:mb-6">{error}</div>}

    <section className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      <BalanceCard title="Total Saldo" value={totalBalance} icon={Wallet} tone="blue" loading={loading} subtitle={`${wallets.length} dompet aktif`} />
      <BalanceCard title="Total Pemasukan" value={totals.income} icon={TrendingUp} tone="emerald" loading={loading} subtitle="Periode aktif" />
      <BalanceCard title="Total Pengeluaran" value={totals.expense} icon={TrendingDown} tone="rose" loading={loading} subtitle="Periode aktif" />
    </section>

    <section className="mt-5 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.7fr)]">
      <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">Arus Kas</h3><p className="mt-1 text-xs text-slate-400">Pemasukan dan pengeluaran pada periode aktif</p></div><BarChart3 size={20} className="text-blue-600" /></div>
        <div className="mt-4 h-64 w-full sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
              <defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopOpacity={0.22} /><stop offset="100%" stopOpacity={0} /></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopOpacity={0.16} /><stop offset="100%" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={18} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={compactMoney} width={46} />
              <Tooltip formatter={(value, name) => [money(value), name === 'income' ? 'Pemasukan' : 'Pengeluaran']} labelFormatter={label => `Tanggal ${label}`} />
              <Area type="monotone" dataKey="income" strokeWidth={2.5} fill="url(#incomeFill)" name="income" />
              <Area type="monotone" dataKey="expense" strokeWidth={2.5} fill="url(#expenseFill)" name="expense" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500"><span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-blue-600" />Pemasukan</span><span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-rose-500" />Pengeluaran</span></div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Lightbulb size={20} /></div><div><h3 className="font-bold text-slate-900">Insight Keuangan</h3><p className="text-xs text-slate-400">Ringkasan otomatis</p></div></div>
        <div className="mt-5 rounded-xl bg-slate-50 p-4"><div className="flex items-start gap-3"><insight.icon size={20} className="mt-0.5 shrink-0 text-blue-600" /><div><p className="text-sm font-bold text-slate-900">{insight.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{insight.text}</p></div></div></div>
        <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-emerald-50 p-3"><p className="text-[11px] font-semibold text-slate-500">Sisa periode</p><p className={`mt-1 truncate text-sm font-extrabold ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{money(net)}</p></div><div className="rounded-xl bg-blue-50 p-3"><p className="text-[11px] font-semibold text-slate-500">Rasio pengeluaran</p><p className="mt-1 text-sm font-extrabold text-blue-600">{totals.income ? Math.round(totals.expense / totals.income * 100) : 0}%</p></div></div>
      </div>
    </section>

    <section className="mt-5 grid gap-4 sm:mt-6 lg:grid-cols-3">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 lg:col-span-2"><div className="flex items-center justify-between gap-3"><div><h3 className="font-bold text-slate-900">Aksi Cepat</h3><p className="mt-1 text-xs text-slate-400">Catat aktivitas tanpa membuka menu panjang</p></div></div><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"><QuickAction icon={TrendingUp} label="Tambah Pemasukan" onClick={() => navigate('/transaksi?type=income')} /><QuickAction icon={TrendingDown} label="Tambah Pengeluaran" onClick={() => navigate('/transaksi?type=expense')} /><QuickAction icon={Send} label="Transfer Dompet" onClick={() => navigate('/dompet')} /></div></div>
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5"><div className="flex items-center justify-between"><div><h3 className="font-bold text-slate-900">Dompet Saya</h3><p className="mt-1 text-xs text-slate-400">Saldo aktif</p></div><button onClick={() => navigate('/dompet')} className="text-xs font-bold text-blue-600">Kelola</button></div><div className="mt-3 space-y-2">{!loading && !wallets.length && <p className="py-4 text-sm text-slate-400">Belum ada dompet.</p>}{wallets.slice(0, 4).map(wallet => <div key={wallet.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"><div className="flex min-w-0 items-center gap-2"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><Wallet size={16} /></div><span className="truncate text-sm font-semibold">{wallet.name}</span></div><span className="shrink-0 text-sm font-bold">{money(wallet.balance)}</span></div>)}</div></div>
    </section>

    <section className="mt-5 grid gap-4 sm:mt-6 lg:grid-cols-2">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5"><h3 className="font-bold text-slate-900">Ringkasan Pengeluaran</h3><p className="mt-1 text-xs text-slate-400">Kategori terbesar pada periode aktif</p><div className="mt-5 space-y-4">{!loading && !categories.length && <p className="text-sm text-slate-400">Belum ada pengeluaran.</p>}{categories.map(item => <div key={item.name}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate">{item.name}</span><span className="shrink-0 font-semibold">{item.percent}% · {money(item.amount)}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${item.percent}%` }} /></div></div>)}</div></div>
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><h3 className="font-bold text-slate-900">Transaksi Terbaru</h3><p className="mt-1 text-xs text-slate-400">Periode aktif · diperbarui otomatis</p></div><button onClick={() => navigate('/transaksi')} className="shrink-0 text-xs font-bold text-blue-600">Lihat semua</button></div><div className="mt-4 divide-y divide-slate-100">{!loading && !rows.length && <p className="py-8 text-sm text-slate-400">Belum ada transaksi.</p>}{rows.slice(0, 5).map(tx => <div key={tx.id} className="flex items-start justify-between gap-3 py-4"><div className="min-w-0"><p className="truncate text-sm font-bold">{tx.description || 'Tanpa keterangan'}</p><p className="truncate text-xs text-slate-400">{tx.category?.name || 'Tanpa kategori'} · {tx.wallet?.name || 'Tanpa dompet'} · {tx.transaction_date}</p></div><span className={`shrink-0 whitespace-nowrap text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{tx.type === 'income' ? '+' : '-'}{money(tx.amount)}</span></div>)}</div></div>
    </section>
  </AppShell>
}

function BalanceCard({ title, value, icon: Icon, tone, loading, subtitle }) {
  const tones = { blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600' }
  return <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm text-slate-500">{title}</p><p className="mt-2 truncate text-xl font-extrabold text-slate-900 sm:text-2xl">{loading ? 'Memuat...' : money(value)}</p><p className="mt-1 truncate text-[11px] text-slate-400">{subtitle}</p></div><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}><Icon size={21} /></div></div></div>
}

function QuickAction({ icon: Icon, label, onClick }) {
  return <button onClick={onClick} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><Icon size={18} />{label}</button>
}
