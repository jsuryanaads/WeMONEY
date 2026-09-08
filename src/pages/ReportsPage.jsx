import { useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3, Lightbulb, TrendingDown, TrendingUp } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { useAuth } from '../hooks/useAuth'
import { getTransactions } from '../services/transactionService'

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))
const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

export default function ReportsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    setLoading(true); setError('')
    getTransactions(user.id, 1000).then(setRows).catch(e => setError(e.message || 'Gagal memuat laporan.')).finally(() => setLoading(false))
  }, [user?.id])

  const months = useMemo(() => {
    const now = new Date(); const map = {}
    for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; map[key] = { key, label: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`, income: 0, expense: 0 } }
    rows.forEach(tx => { const key = String(tx.transaction_date || '').slice(0,7); if (map[key] && (tx.type === 'income' || tx.type === 'expense')) map[key][tx.type] += Number(tx.amount || 0) })
    return Object.values(map)
  }, [rows])

  const current = months[months.length - 1] || { income: 0, expense: 0 }
  const previous = months[months.length - 2] || { income: 0, expense: 0 }
  const net = current.income - current.expense
  const expenseChange = previous.expense ? Math.round(((current.expense - previous.expense) / previous.expense) * 100) : null

  const categories = useMemo(() => {
    const map = {}; rows.filter(tx => tx.type === 'expense').forEach(tx => { const key = tx.category?.name || 'Tanpa kategori'; map[key] = (map[key] || 0) + Number(tx.amount || 0) })
    const total = rows.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,6).map(([name, amount]) => ({ name, amount, percent: total ? Math.round(amount / total * 100) : 0 }))
  }, [rows])

  const max = Math.max(1, ...months.flatMap(item => [item.income, item.expense]))
  const insight = expenseChange === null ? 'Tambahkan transaksi agar perbandingan bulan mulai terbentuk.' : expenseChange > 0 ? `Pengeluaran bulan ini naik ${expenseChange}% dibanding bulan sebelumnya.` : expenseChange < 0 ? `Pengeluaran bulan ini turun ${Math.abs(expenseChange)}% dibanding bulan sebelumnya.` : 'Pengeluaran bulan ini sama dengan bulan sebelumnya.'

  return <AppShell title="Laporan">
    <div className="mb-5"><h2 className="text-2xl font-extrabold tracking-tight">Laporan & Insight</h2><p className="mt-1 text-sm text-slate-500">Bukan sekadar grafik — pahami apa yang berubah dan apa yang perlu diperhatikan.</p></div>
    {error && <div role="alert" className="wm-error mb-4">{error}</div>}
    <section className="grid gap-3 sm:grid-cols-3">
      <Stat title="Pemasukan bulan ini" value={current.income} tone="green" icon={TrendingUp} loading={loading}/>
      <Stat title="Pengeluaran bulan ini" value={current.expense} tone="rose" icon={TrendingDown} loading={loading}/>
      <Stat title="Sisa bulan ini" value={net} tone={net >= 0 ? 'blue' : 'rose'} icon={BarChart3} loading={loading}/>
    </section>

    <section className="wm-panel mt-4"><div className="wm-panel-head"><div><h3>Perbandingan Bulanan</h3><p>12 bulan terakhir, tanpa membebani layar dengan detail yang tidak penting.</p></div></div><div className="wm-report-chart" aria-label="Grafik perbandingan pemasukan dan pengeluaran">{months.map(item => <div key={item.key} className="wm-report-month"><div className="wm-report-bars"><i style={{height:`${Math.max(3, item.income / max * 100)}%`}} title={`Pemasukan ${money(item.income)}`}/><b style={{height:`${Math.max(3, item.expense / max * 100)}%`}} title={`Pengeluaran ${money(item.expense)}`}/></div><small>{item.label}</small></div>)}</div><div className="wm-report-legend"><span><i className="income"/>Pemasukan</span><span><i className="expense"/>Pengeluaran</span></div></section>

    <section className="grid gap-4 lg:grid-cols-2">
      <div className="wm-panel mt-4"><div className="wm-panel-head"><div><h3>Pola Pengeluaran</h3><p>Kategori terbesar berdasarkan seluruh transaksi yang tersedia.</p></div></div>{categories.length ? <div className="wm-category-list">{categories.map(item => <div key={item.name}><div className="flex items-center justify-between gap-3 text-sm"><b className="truncate">{item.name}</b><span>{money(item.amount)}</span></div><div className="wm-progress"><i style={{width:`${Math.min(100,item.percent)}%`}}/></div><small>{item.percent}% dari total pengeluaran</small></div>)}</div> : <Empty text="Belum ada pola pengeluaran."/>}</div>
      <div className="wm-panel mt-4"><div className="wm-panel-head"><div><h3>Insight Bulan Ini</h3><p>Ringkasan yang bisa langsung ditindaklanjuti.</p></div></div><div className="wm-insight mt-4"><span className="wm-insight-icon"><Lightbulb size={19}/></span><div><b>{insight}</b><p>Gunakan Catat Cepat secara konsisten supaya pola pengeluaran semakin akurat.</p></div></div><div className="wm-flow-grid"><div><span>Bulan lalu</span><b>{money(previous.expense)}</b></div><div><span>Bulan ini</span><b>{money(current.expense)}</b></div><div><span>Perubahan</span><b className={expenseChange !== null && expenseChange > 0 ? 'text-rose-600' : 'text-emerald-600'}>{expenseChange === null ? '—' : `${expenseChange > 0 ? '+' : ''}${expenseChange}%`}</b></div></div></div>
    </section>

    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500"><b className="text-slate-800">Budget awareness:</b> struktur laporan sudah disiapkan untuk membandingkan realisasi dengan anggaran. Saat modul anggaran aktif, indikator akan ditampilkan di sini tanpa mengubah alur transaksi.</div>
  </AppShell>
}

function Stat({ title, value, tone, icon: Icon, loading }) { return <div className={`wm-metric wm-metric-${tone}`}><span className="wm-metric-icon"><Icon size={20}/></span><div className="min-w-0"><span>{title}</span>{loading ? <div className="wm-skeleton mt-2 h-7 w-32"/> : <strong>{money(value)}</strong>}<small>Periode terbaru</small></div></div> }
function Empty({ text }) { return <div className="wm-empty"><span><Lightbulb size={18}/></span><p>{text}</p></div> }
