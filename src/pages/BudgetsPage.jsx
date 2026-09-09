import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Pencil, Plus, Sparkles, Target, Trash2 } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { useAuth } from '../hooks/useAuth'
import { getCategories } from '../services/categoryService'
import { getTransactions } from '../services/transactionService'
import { calculateBudgetUsage, createBudget, deleteBudget, getBudgets, updateBudget } from '../services/budgetService'
import { DEFAULT_ALLOCATION, GROUPS, calculateGroupUsage, getBudgetPlan, saveBudgetPlan } from '../services/budgetPlanningService'

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))
const monthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` }
const monthEnd = () => { const d = new Date(); d.setMonth(d.getMonth()+1, 0); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const initialLegacy = () => ({ name: '', amount: '', period: 'monthly', start_date: monthStart(), end_date: monthEnd(), category_id: '', is_active: true })
const defaultAllocations = () => DEFAULT_ALLOCATION.map(a => ({ ...a }))

export default function BudgetsPage() {
  const { user } = useAuth()
  const [plan, setPlan] = useState(null); const [income, setIncome] = useState(''); const [obligation, setObligation] = useState(''); const [allocations, setAllocations] = useState(defaultAllocations()); const [mode, setMode] = useState('percent')
  const [budgets, setBudgets] = useState([]); const [categories, setCategories] = useState([]); const [transactions, setTransactions] = useState([])
  const [legacyForm, setLegacyForm] = useState(initialLegacy()); const [editing, setEditing] = useState(null); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('')

  const remaining = Math.max(0, Number(income || 0) - Number(obligation || 0))
  const totalPct = allocations.reduce((s, a) => s + Number(a.percentage || 0), 0)
  const totalAmount = allocations.reduce((s, a) => s + Number(a.amount || 0), 0)
  const groupUsage = useMemo(() => calculateGroupUsage(transactions, categories), [transactions, categories])

  const load = async () => {
    if (!user?.id) return
    setLoading(true); setError('')
    try {
      const [p, b, c, t] = await Promise.all([getBudgetPlan(user.id, monthStart()), getBudgets(user.id, { activeOnly: false }), getCategories(user.id, 'expense'), getTransactions(user.id, 1000)])
      if (p) { setPlan(p); setIncome(String(p.income_amount)); setObligation(String(p.obligation_amount)); setAllocations(p.allocations?.length ? p.allocations : defaultAllocations()) }
      setBudgets(b); setCategories(c); setTransactions(t)
    } catch (e) { setError(e.message || 'Gagal memuat anggaran.') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [user?.id])

  useEffect(() => {
    const base = remaining
    setAllocations(prev => prev.map(a => ({ ...a, amount: Math.round(base * Number(a.percentage || 0) / 100) })))
  }, [income, obligation])

  const updateAllocation = (index, value) => {
    const n = Math.max(0, Number(value || 0)); setAllocations(prev => prev.map((a, i) => i === index ? { ...a, ...(mode === 'percent' ? { percentage: n, amount: Math.round(remaining * n / 100) } : { amount: n, percentage: remaining > 0 ? Number((n / remaining * 100).toFixed(2)) : 0 }) } : a))
  }
  const recommend = () => { setAllocations(GROUPS.map((g, i) => ({ group_key: g.key, name: g.name, percentage: g.defaultPct, amount: Math.round(remaining * g.defaultPct / 100), sort_order: i }))); setMode('percent'); setNotice('Rekomendasi diterapkan. Kamu tetap bebas mengubahnya.') }
  const savePlan = async () => { setSaving(true); setError(''); setNotice(''); try { const saved = await saveBudgetPlan(user.id, { periodStart: monthStart(), incomeAmount: income, obligationAmount: obligation, allocations }); setPlan(saved); setAllocations(saved.allocations); setNotice('Rencana anggaran tersimpan.'); window.dispatchEvent(new Event('wemoney:data-changed')) } catch (e) { setError(e.message || 'Gagal menyimpan rencana.') } finally { setSaving(false) } }

  const resetLegacy = () => { setEditing(null); setLegacyForm(initialLegacy()) }
  const saveLegacy = async e => { e.preventDefault(); setSaving(true); setError(''); try { if (editing) await updateBudget(editing, user.id, legacyForm); else await createBudget(user.id, legacyForm); resetLegacy(); await load(); window.dispatchEvent(new Event('wemoney:data-changed')) } catch (e) { setError(e.message || 'Gagal menyimpan budget lama.') } finally { setSaving(false) } }
  const editLegacy = b => { setEditing(b.id); setLegacyForm({ name: b.name, amount: String(b.amount), period: b.period, start_date: b.start_date, end_date: b.end_date || '', category_id: b.category_id || '', is_active: b.is_active }) }
  const removeLegacy = async id => { if (!window.confirm('Hapus budget ini?')) return; try { await deleteBudget(id, user.id); await load() } catch (e) { setError(e.message || 'Gagal menghapus budget.') } }

  return <AppShell title="Anggaran">
    <div className="mb-5"><h2 className="text-2xl font-extrabold tracking-tight">Anggaran</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Rencanakan pemasukan, kewajiban, lalu bagi sisa uang sesuai prioritasmu.</p></div>
    {error && <div role="alert" className="wm-error mb-4">{error}</div>}{notice && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</div>}
    <section className="wm-panel mb-5">
      <div className="wm-panel-head"><div><h3>Rencana Bulanan</h3><p>We MONEY memberi rekomendasi, bukan aturan yang mengikat.</p></div><span className="wm-metric-icon"><Target size={18}/></span></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold">Pendapatan / Gaji<input className="wm-input mt-1.5 w-full" type="number" min="0" value={income} onChange={e=>setIncome(e.target.value)} placeholder="3.000.000"/></label><label className="text-sm font-semibold">Kewajiban / Cicilan<input className="wm-input mt-1.5 w-full" type="number" min="0" value={obligation} onChange={e=>setObligation(e.target.value)} placeholder="1.500.000"/></label></div>
      <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3"><div><span className="text-xs text-slate-500">Pendapatan</span><strong className="block text-lg">{money(income)}</strong></div><div><span className="text-xs text-slate-500">Kewajiban</span><strong className="block text-lg">{money(obligation)}</strong></div><div><span className="text-xs text-slate-500">Sisa dialokasikan</span><strong className="block text-lg text-blue-600">{money(remaining)}</strong></div></div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div className="inline-flex rounded-xl border p-1"><button type="button" onClick={()=>setMode('percent')} className={`rounded-lg px-3 py-2 text-xs font-extrabold ${mode==='percent'?'bg-slate-900 text-white':''}`}>% Persentase</button><button type="button" onClick={()=>setMode('nominal')} className={`rounded-lg px-3 py-2 text-xs font-extrabold ${mode==='nominal'?'bg-slate-900 text-white':''}`}>Rp Nominal</button></div><button type="button" onClick={recommend} className="inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-extrabold"><Sparkles size={16}/> Rekomendasikan untuk Saya</button></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">{allocations.map((a, i) => { const used = Number(groupUsage[a.group_key] || 0); const pctUsed = a.amount > 0 ? Math.min(100, used / a.amount * 100) : 0; const over = used > a.amount && a.amount >= 0; return <div key={a.group_key} className="rounded-2xl border p-4"><div className="flex items-center justify-between gap-3"><div><b>{GROUPS.find(g=>g.key===a.group_key)?.icon} {a.name}</b><p className="mt-0.5 text-xs text-slate-500">Terpakai {money(used)}</p></div><span className="text-xs font-bold text-slate-500">{Number(a.percentage || 0).toFixed(1)}%</span></div><div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-2"><label className="text-xs font-semibold">{mode==='percent'?'Persentase':'Nominal'}<input className="wm-input mt-1 w-full" type="number" min="0" max={mode==='percent'?'100':undefined} step="0.1" value={mode==='percent'?a.percentage:a.amount} onChange={e=>updateAllocation(i,e.target.value)}/></label><strong className="pb-2 text-sm">{money(a.amount)}</strong></div><div className="wm-progress mt-3 h-2"><i style={{width:`${pctUsed}%`}}/></div><div className={`mt-2 flex items-center justify-between text-xs font-bold ${over?'text-rose-600':'text-slate-500'}`}><span>{over?'Melebihi alokasi':'Sisa '+money(Math.max(0,a.amount-used))}</span><span>{pctUsed.toFixed(0)}% terpakai</span></div></div> })}</div>
      <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-bold ${Math.abs(totalPct-100)<0.01?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}`}><span>Total alokasi: {totalPct.toFixed(1)}% · {money(totalAmount)}</span><span>{remaining===0?'Tidak ada sisa yang perlu dialokasikan':Math.abs(totalPct-100)<0.01?'Semua sisa sudah dialokasikan':'Atur total menjadi 100%'}</span></div>
      <button disabled={saving || (remaining>0 && Math.abs(totalPct-100)>0.01)} onClick={savePlan} className="wm-primary mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold"><CheckCircle2 size={17}/>{saving?'Menyimpan...':'Simpan Rencana'}</button>
    </section>

    <section className="mb-5 grid gap-4 lg:grid-cols-[minmax(330px,0.9fr)_minmax(0,1.5fr)]">
      <form onSubmit={saveLegacy} className="wm-panel h-fit"><div className="wm-panel-head"><div><h3>{editing?'Edit Anggaran Lama':'Anggaran Pengeluaran'}</h3><p>Tetap tersedia untuk budget khusus kategori atau kebutuhan tertentu.</p></div><Plus size={18}/></div><div className="mt-5 grid gap-4"><input required className="wm-input" placeholder="Nama, contoh: Tagihan" value={legacyForm.name} onChange={e=>setLegacyForm({...legacyForm,name:e.target.value})}/><input required className="wm-input" type="number" min="1" value={legacyForm.amount} onChange={e=>setLegacyForm({...legacyForm,amount:e.target.value})} placeholder="Nominal budget"/><select className="wm-input" value={legacyForm.category_id} onChange={e=>setLegacyForm({...legacyForm,category_id:e.target.value})}><option value="">Semua pengeluaran</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><select className="wm-input" value={legacyForm.period} onChange={e=>setLegacyForm({...legacyForm,period:e.target.value})}><option value="weekly">Mingguan</option><option value="monthly">Bulanan</option><option value="yearly">Tahunan</option></select><div className="grid grid-cols-2 gap-3"><input required className="wm-input" type="date" value={legacyForm.start_date} onChange={e=>setLegacyForm({...legacyForm,start_date:e.target.value})}/><input className="wm-input" type="date" value={legacyForm.end_date} onChange={e=>setLegacyForm({...legacyForm,end_date:e.target.value})}/></div><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={legacyForm.is_active} onChange={e=>setLegacyForm({...legacyForm,is_active:e.target.checked})}/>Aktif</label><div className="flex gap-2"><button disabled={saving} className="wm-primary rounded-xl px-4 py-3 text-sm font-extrabold">{editing?'Simpan':'Tambah'}</button>{editing&&<button type="button" onClick={resetLegacy} className="rounded-xl border px-4 py-3 text-sm font-bold">Batal</button>}</div></div></form>
      <div className="space-y-3">{loading?<div className="wm-panel">Memuat anggaran...</div>:budgets.map(b=>{const u=calculateBudgetUsage(b,transactions);const danger=u.exceeded||u.percent>=90;return <article key={b.id} className="wm-panel"><div className="flex items-start justify-between gap-3"><div><h3 className="font-extrabold">{b.name}</h3><p className="text-xs text-slate-500">{b.category?.name||'Semua pengeluaran'} · {b.period}</p></div><div className="flex gap-1"><button onClick={()=>editLegacy(b)} className="grid h-10 w-10 place-items-center rounded-lg"><Pencil size={16}/></button><button onClick={()=>removeLegacy(b.id)} className="grid h-10 w-10 place-items-center rounded-lg text-rose-600"><Trash2 size={16}/></button></div></div><div className="mt-4 flex justify-between text-sm"><span>Terpakai <b>{money(u.actual)}</b></span><b className={danger?'text-rose-600':'text-emerald-600'}>{u.percent.toFixed(1)}%</b></div><div className="wm-progress mt-2 h-2"><i style={{width:`${Math.min(100,u.percent)}%`}}/></div><div className="mt-2 flex items-center justify-between text-xs font-bold"><span className={danger?'text-rose-600':'text-emerald-600'}>{danger?<><AlertTriangle size={13} className="mr-1 inline"/>Perlu diperhatikan</>:`Sisa ${money(u.remaining)}`}</span><span>{money(b.amount)}</span></div></article>})}</div>
    </section>
  </AppShell>
}
