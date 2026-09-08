import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { useAuth } from '../hooks/useAuth'
import { getCategories } from '../services/categoryService'
import { getTransactions } from '../services/transactionService'
import { calculateBudgetUsage, createBudget, deleteBudget, getBudgets, updateBudget } from '../services/budgetService'

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))
const dateLabel = value => value ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`)) : '-'
const monthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` }
const monthEnd = () => { const d = new Date(); d.setMonth(d.getMonth()+1, 0); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const initial = () => ({ name: '', amount: '', period: 'monthly', start_date: monthStart(), end_date: monthEnd(), category_id: '', is_active: true })

export default function BudgetsPage() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState([]); const [categories, setCategories] = useState([]); const [transactions, setTransactions] = useState([])
  const [form, setForm] = useState(initial()); const [editing, setEditing] = useState(null); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('')

  const load = async () => {
    if (!user?.id) return
    setLoading(true); setError('')
    try { const [b, c, t] = await Promise.all([getBudgets(user.id, { activeOnly: false }), getCategories(user.id, 'expense'), getTransactions(user.id, 1000)]); setBudgets(b); setCategories(c); setTransactions(t) }
    catch (e) { setError(e.message || 'Gagal memuat anggaran.') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [user?.id])

  const cards = useMemo(() => budgets.map(budget => ({ budget, usage: calculateBudgetUsage(budget, transactions) })), [budgets, transactions])

  const reset = () => { setEditing(null); setForm(initial()) }
  const save = async e => { e.preventDefault(); setSaving(true); setError(''); try { if (editing) await updateBudget(editing, user.id, form); else await createBudget(user.id, form); reset(); await load(); window.dispatchEvent(new Event('wemoney:data-changed')) } catch (e) { setError(e.message || 'Gagal menyimpan budget.') } finally { setSaving(false) } }
  const edit = budget => { setEditing(budget.id); setForm({ name: budget.name, amount: String(budget.amount), period: budget.period, start_date: budget.start_date, end_date: budget.end_date || '', category_id: budget.category_id || '', is_active: budget.is_active }) }
  const remove = async id => { if (!window.confirm('Hapus budget ini?')) return; try { await deleteBudget(id, user.id); await load() } catch (e) { setError(e.message || 'Gagal menghapus budget.') } }
  const periodChange = period => setForm(f => ({ ...f, period, end_date: period === 'monthly' ? monthEnd() : f.end_date }))

  return <AppShell title="Anggaran">
    <div className="mb-5"><h2 className="text-2xl font-extrabold tracking-tight">Anggaran</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Tetapkan batas pengeluaran dan lihat seberapa dekat kamu dengan batas tersebut.</p></div>
    {error && <div role="alert" className="wm-error mb-4">{error}</div>}
    <div className="grid gap-4 lg:grid-cols-[minmax(330px,0.9fr)_minmax(0,1.5fr)]">
      <form onSubmit={save} className="wm-panel h-fit">
        <div className="wm-panel-head"><div><h3>{editing ? 'Edit Anggaran' : 'Tambah Anggaran'}</h3><p>Budget total atau khusus kategori pengeluaran.</p></div><span className="wm-metric-icon"><Target size={18}/></span></div>
        <div className="mt-5 grid gap-4">
          <label className="block text-sm font-semibold">Nama<input required className="wm-input mt-1.5 block w-full" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Contoh: Kebutuhan Bulanan"/></label>
          <label className="block text-sm font-semibold">Nominal<input required min="1" step="1" inputMode="numeric" type="number" className="wm-input mt-1.5 block w-full" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="5.000.000"/></label>
          <label className="block text-sm font-semibold">Kategori<select className="wm-input mt-1.5 block w-full" value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Semua pengeluaran</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Periode<select className="wm-input mt-1.5 block w-full" value={form.period} onChange={e=>periodChange(e.target.value)}><option value="weekly">Mingguan</option><option value="monthly">Bulanan</option><option value="yearly">Tahunan</option></select></label><label className="block text-sm font-semibold">Mulai<input required type="date" className="wm-input mt-1.5 block w-full" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})}/></label></div>
          <label className="block text-sm font-semibold">Selesai<input type="date" className="wm-input mt-1.5 block w-full" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})}/></label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/>Aktif</label>
          <div className="flex flex-wrap gap-2 pt-1"><button disabled={saving} className="wm-primary inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold"><Plus size={17}/>{saving?'Menyimpan...':editing?'Simpan Perubahan':'Tambah Anggaran'}</button>{editing&&<button type="button" onClick={reset} className="inline-flex min-h-11 items-center rounded-xl border px-4 py-3 text-sm font-bold">Batal</button>}</div>
        </div>
      </form>
      <section className="space-y-3">
        {loading ? <div className="wm-panel"><div className="wm-skeleton h-6 w-40"/><div className="wm-skeleton mt-4 h-24 w-full"/></div> : cards.length ? cards.map(({budget,usage}) => <BudgetCard key={budget.id} budget={budget} usage={usage} onEdit={()=>edit(budget)} onDelete={()=>remove(budget.id)}/>) : <div className="wm-panel text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Target size={22}/></span><h3 className="mt-3 font-extrabold">Belum ada anggaran</h3><p className="mt-1 text-sm text-slate-500">Buat budget pertama untuk mulai mendapatkan Budget Awareness.</p></div>}
      </section>
    </div>
  </AppShell>
}

function BudgetCard({ budget, usage, onEdit, onDelete }) {
  const pct = Math.min(100, usage.percent); const danger = usage.exceeded || usage.percent >= 90; const warning = !danger && usage.percent >= 70
  return <article className="wm-panel"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-extrabold">{budget.name}</h3>{budget.is_active ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Aktif</span> : <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">Nonaktif</span>}</div><p className="mt-1 text-xs text-slate-500">{budget.category?.name || 'Semua pengeluaran'} · {dateLabel(budget.start_date)} — {dateLabel(usage.end)}</p></div><div className="flex shrink-0 gap-1"><button onClick={onEdit} className="grid h-10 w-10 place-items-center rounded-lg opacity-70 hover:bg-black/5" aria-label="Edit anggaran"><Pencil size={16}/></button><button onClick={onDelete} className="grid h-10 w-10 place-items-center rounded-lg text-rose-600 opacity-70 hover:bg-rose-50" aria-label="Hapus anggaran"><Trash2 size={16}/></button></div></div><div className="mt-5 flex items-end justify-between gap-3"><div><span className="text-xs text-slate-500">Terpakai</span><strong className="mt-1 block text-xl font-extrabold">{money(usage.actual)}</strong></div><div className="text-right"><span className="text-xs text-slate-500">Dari {money(budget.amount)}</span><b className={`mt-1 block ${danger?'text-rose-600':warning?'text-amber-600':'text-emerald-600'}`}>{usage.percent.toFixed(1)}%</b></div></div><div className="wm-progress mt-3 h-2"><i style={{width:`${pct}%`}}/></div><div className="mt-3 flex items-center justify-between gap-3 text-xs"><span className={`flex items-center gap-1 font-bold ${danger?'text-rose-600':warning?'text-amber-600':'text-emerald-600'}`}>{danger?<AlertTriangle size={14}/>:<CheckCircle2 size={14}/>} {usage.exceeded?'Melebihi budget':warning?'Perlu diperhatikan':'Masih aman'}</span><span className="font-semibold text-slate-500">Sisa {money(usage.remaining)}</span></div></article>
}
