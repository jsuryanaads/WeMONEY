import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Pencil, Plus, Sparkles, Target, Trash2 } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { useAuth } from '../hooks/useAuth'
import { getCategories } from '../services/categoryService'
import { getTransactions } from '../services/transactionService'
import { calculateBudgetUsage, createBudget, deleteBudget, getBudgets, updateBudget } from '../services/budgetService'
import { DEFAULT_ALLOCATION, GROUPS, calculateGroupUsage, getBudgetPlan, saveBudgetPlan } from '../services/budgetPlanningService'

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))
const monthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01` }
const monthEnd = () => { const d = new Date(); d.setMonth(d.getMonth() + 1, 0); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const initialLegacy = () => ({ name: '', amount: '', period: 'monthly', start_date: monthStart(), end_date: monthEnd(), category_id: '', is_active: true })
const defaults = () => DEFAULT_ALLOCATION.map(a => ({ ...a }))

export default function BudgetsPage() {
  const { user } = useAuth()
  const [income, setIncome] = useState('')
  const [obligation, setObligation] = useState('')
  const [allocations, setAllocations] = useState(defaults())
  const [mode, setMode] = useState('percent')
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [legacyForm, setLegacyForm] = useState(initialLegacy())
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const incomeValue = Number(income || 0)
  const obligationValue = Number(obligation || 0)
  const remaining = Math.max(0, incomeValue - obligationValue)
  const obligationRatio = incomeValue > 0 ? obligationValue / incomeValue * 100 : 0
  const totalPct = allocations.reduce((s, a) => s + Number(a.percentage || 0), 0)
  const totalAmount = allocations.reduce((s, a) => s + Number(a.amount || 0), 0)
  const allocationComplete = remaining === 0 || Math.abs(totalPct - 100) < 0.01
  const groupUsage = useMemo(() => calculateGroupUsage(transactions, categories, monthStart(), monthEnd()), [transactions, categories])
  const overGroups = allocations.filter(a => Number(groupUsage[a.group_key] || 0) > Number(a.amount || 0)).length
  const financialStatus = !incomeValue ? 'Belum diatur' : overGroups > 0 ? 'Melebihi rencana' : obligationRatio > 60 ? 'Perlu diperhatikan' : !allocationComplete ? 'Perlu diatur' : 'Aman'
  const statusTone = financialStatus === 'Melebihi rencana' ? 'text-rose-700 bg-rose-50 border-rose-200' : financialStatus === 'Aman' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'

  const load = async () => {
    if (!user?.id) return
    setLoading(true); setError('')
    try {
      const [plan, b, c, t] = await Promise.all([getBudgetPlan(user.id, monthStart()), getBudgets(user.id, { activeOnly: false }), getCategories(user.id, 'expense'), getTransactions(user.id, 1000)])
      if (plan) { setIncome(String(plan.income_amount)); setObligation(String(plan.obligation_amount)); setAllocations(plan.allocations?.length ? plan.allocations : defaults()) }
      else { setIncome(''); setObligation(''); setAllocations(defaults()) }
      setBudgets(b); setCategories(c); setTransactions(t)
    } catch (e) { setError(e.message || 'Gagal memuat anggaran.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [user?.id])
  useEffect(() => { setAllocations(prev => prev.map(a => ({ ...a, amount: Math.round(remaining * Number(a.percentage || 0) / 100) }))) }, [income, obligation])

  const updateAllocation = (index, value) => {
    const n = Math.max(0, Number(value || 0))
    setAllocations(prev => prev.map((a, i) => i !== index ? a : mode === 'percent' ? { ...a, percentage: n, amount: Math.round(remaining * n / 100) } : { ...a, amount: n, percentage: remaining > 0 ? Number((n / remaining * 100).toFixed(2)) : 0 }))
  }

  const recommend = () => { setAllocations(GROUPS.map((g, i) => ({ group_key: g.key, name: g.name, percentage: g.defaultPct, amount: Math.round(remaining * g.defaultPct / 100), sort_order: i }))); setMode('percent'); setNotice('Rekomendasi diterapkan. Kamu tetap bebas mengubahnya.') }

  const savePlan = async () => {
    setSaving(true); setError(''); setNotice('')
    try { const saved = await saveBudgetPlan(user.id, { periodStart: monthStart(), incomeAmount: income, obligationAmount: obligation, allocations }); setAllocations(saved.allocations); setNotice('Rencana anggaran tersimpan.'); window.dispatchEvent(new Event('wemoney:data-changed')) }
    catch (e) { setError(e.message || 'Gagal menyimpan rencana.') }
    finally { setSaving(false) }
  }

  const resetLegacy = () => { setEditing(null); setLegacyForm(initialLegacy()) }
  const saveLegacy = async e => { e.preventDefault(); setSaving(true); setError(''); try { if (editing) await updateBudget(editing, user.id, legacyForm); else await createBudget(user.id, legacyForm); resetLegacy(); await load(); window.dispatchEvent(new Event('wemoney:data-changed')) } catch (e) { setError(e.message || 'Gagal menyimpan batas pengeluaran.') } finally { setSaving(false) } }
  const editLegacy = b => { setEditing(b.id); setLegacyForm({ name: b.name, amount: String(b.amount), period: b.period, start_date: b.start_date, end_date: b.end_date || '', category_id: b.category_id || '', is_active: b.is_active }) }
  const removeLegacy = async id => { if (!window.confirm('Hapus batas pengeluaran ini?')) return; try { await deleteBudget(id, user.id); await load() } catch (e) { setError(e.message || 'Gagal menghapus batas pengeluaran.') } }

  return <AppShell title="Anggaran">
    <div className="mb-3"><h2 className="text-xl font-extrabold tracking-tight">Anggaran</h2><p className="mt-0.5 text-xs text-slate-500">Atur uang masuk → kewajiban → bagi sisanya.</p></div>
    {error && <div role="alert" className="wm-error mb-3">{error}</div>}
    {notice && <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{notice}</div>}

    <section className="wm-panel mb-3 !p-3 sm:!p-4">
      <div className="flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><span className="wm-metric-icon"><Target size={16} /></span><div><h3 className="text-sm font-extrabold">Rencana Bulanan</h3><p className="text-[11px] text-slate-500">Pendapatan dan kewajiban bulan ini.</p></div></div><span className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${statusTone}`}>{financialStatus}</span></div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-[11px] font-bold text-slate-600">Pendapatan<input className="wm-input mt-1 w-full !py-2 text-sm" type="number" min="0" value={income} onChange={e => setIncome(e.target.value)} placeholder="4.800.000" /></label>
        <label className="text-[11px] font-bold text-slate-600">Kewajiban<input className="wm-input mt-1 w-full !py-2 text-sm" type="number" min="0" value={obligation} onChange={e => setObligation(e.target.value)} placeholder="2.200.000" /></label>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-xl bg-slate-50 p-2"><div><span className="text-[10px] text-slate-500">Pendapatan</span><b className="block truncate text-xs">{money(income)}</b></div><div><span className="text-[10px] text-slate-500">Kewajiban</span><b className="block truncate text-xs">{money(obligation)}</b></div><div><span className="text-[10px] text-slate-500">Rasio</span><b className="block text-xs">{incomeValue ? `${obligationRatio.toFixed(1)}%` : '—'}</b></div></div>
      <div className="mt-2 rounded-xl bg-blue-600 px-3 py-2.5 text-white"><span className="text-[10px] font-bold uppercase tracking-wide text-blue-100">Sisa siap dibagi</span><strong className="block text-xl font-extrabold">{money(remaining)}</strong></div>
    </section>

    <section className="wm-panel mb-3 !p-3 sm:!p-4">
      <div className="flex items-center justify-between gap-2"><div><h3 className="text-sm font-extrabold">Bagi Sisa Uang</h3><p className="text-[11px] text-slate-500">Ubah % atau nominal.</p></div><button type="button" onClick={recommend} className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-extrabold"><Sparkles size={14} /> Rekomendasi AI</button></div>
      <div className="mt-2 inline-flex w-full rounded-lg border p-0.5"><button type="button" onClick={() => setMode('percent')} className={`flex-1 rounded-md px-2 py-1.5 text-xs font-extrabold ${mode === 'percent' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>% Persentase</button><button type="button" onClick={() => setMode('nominal')} className={`flex-1 rounded-md px-2 py-1.5 text-xs font-extrabold ${mode === 'nominal' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Rp Nominal</button></div>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        {allocations.map((a, i) => { const group = GROUPS.find(g => g.key === a.group_key); const actual = Number(groupUsage[a.group_key] || 0); const planned = Number(a.amount || 0); const used = planned > 0 ? actual / planned * 100 : actual > 0 ? 100 : 0; return <div key={a.group_key} className="rounded-xl border p-2.5"><div className="flex items-center justify-between gap-2"><b className="text-xs sm:text-sm">{group?.icon} {a.name}</b><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold">{Number(a.percentage || 0).toFixed(1)}%</span></div><div className="mt-1.5 grid grid-cols-[1fr_auto] items-end gap-2"><label className="text-[10px] font-bold text-slate-500">{mode === 'percent' ? '%' : 'Rp'}<input className="wm-input mt-0.5 w-full !py-1.5 text-sm" type="number" min="0" max={mode === 'percent' ? '100' : undefined} step="0.1" value={mode === 'percent' ? a.percentage : a.amount} onChange={e => updateAllocation(i, e.target.value)} /></label><div className="pb-1 text-right"><b className="block text-xs">{mode === 'percent' ? money(a.amount) : `${Number(a.percentage || 0).toFixed(1)}%`}</b><span className="text-[9px] text-slate-400">Realisasi {used.toFixed(0)}%</span></div></div></div> })}
      </div>
      <div className={`mt-2 flex items-center justify-between rounded-lg px-2.5 py-2 text-[10px] font-bold ${allocationComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><span>Total {totalPct.toFixed(1)}% · {money(totalAmount)}</span><span>{allocationComplete ? '✓ Lengkap' : 'Harus 100%'}</span></div>
      <button disabled={saving || (remaining > 0 && !allocationComplete)} onClick={savePlan} className="wm-primary mt-2 min-h-10 w-full rounded-lg px-3 py-2 text-xs font-extrabold"><CheckCircle2 size={15} className="mr-1 inline" />{saving ? 'Menyimpan...' : 'Simpan Rencana'}</button>
    </section>

    <section className="wm-panel mb-3 !p-3 sm:!p-4">
      <div className="mb-2 flex items-center justify-between"><div><h3 className="text-sm font-extrabold">Realisasi</h3><p className="text-[11px] text-slate-500">Rencana dibanding transaksi bulan ini.</p></div></div>
      <div className="divide-y rounded-xl border">
        {allocations.map(a => { const group = GROUPS.find(g => g.key === a.group_key); const planned = Number(a.amount || 0); const actual = Number(groupUsage[a.group_key] || 0); const over = actual > planned; const used = planned > 0 ? actual / planned * 100 : actual > 0 ? 100 : 0; return <div key={`real-${a.group_key}`} className="flex items-center gap-2 px-2.5 py-2"><span className="text-sm">{group?.icon}</span><div className="min-w-0 flex-1"><b className="block truncate text-xs">{a.name}</b><div className="wm-progress mt-1 h-1.5"><i style={{ width: `${Math.min(100, Math.max(0, used))}%` }} /></div></div><div className="text-right"><b className={`block text-[11px] ${over ? 'text-rose-600' : 'text-slate-700'}`}>{money(actual)}</b><span className="text-[9px] text-slate-400">/ {money(planned)}</span></div></div> })}
      </div>
    </section>

    <section className="mb-4 grid gap-3 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.5fr)]">
      <form onSubmit={saveLegacy} className="wm-panel !p-3 sm:!p-4"><div className="flex items-center justify-between"><div><h3 className="text-sm font-extrabold">Anggaran Detail</h3><p className="text-[11px] text-slate-500">Opsional untuk batas kategori.</p></div><Plus size={16} /></div><div className="mt-2 grid gap-2"><input required className="wm-input !py-2 text-sm" placeholder="Nama" value={legacyForm.name} onChange={e => setLegacyForm({ ...legacyForm, name: e.target.value })} /><input required className="wm-input !py-2 text-sm" type="number" min="1" value={legacyForm.amount} onChange={e => setLegacyForm({ ...legacyForm, amount: e.target.value })} placeholder="Nominal batas" /><select className="wm-input !py-2 text-sm" value={legacyForm.category_id} onChange={e => setLegacyForm({ ...legacyForm, category_id: e.target.value })}><option value="">Semua pengeluaran</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select className="wm-input !py-2 text-sm" value={legacyForm.period} onChange={e => setLegacyForm({ ...legacyForm, period: e.target.value })}><option value="weekly">Mingguan</option><option value="monthly">Bulanan</option><option value="yearly">Tahunan</option></select><div className="grid grid-cols-2 gap-2"><input required className="wm-input !py-2 text-sm" type="date" value={legacyForm.start_date} onChange={e => setLegacyForm({ ...legacyForm, start_date: e.target.value })} /><input className="wm-input !py-2 text-sm" type="date" value={legacyForm.end_date} onChange={e => setLegacyForm({ ...legacyForm, end_date: e.target.value })} /></div><label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={legacyForm.is_active} onChange={e => setLegacyForm({ ...legacyForm, is_active: e.target.checked })} />Aktif</label><div className="flex gap-2"><button disabled={saving} className="wm-primary rounded-lg px-3 py-2 text-xs font-extrabold">{editing ? 'Simpan' : 'Tambah'}</button>{editing && <button type="button" onClick={resetLegacy} className="rounded-lg border px-3 py-2 text-xs font-bold">Batal</button>}</div></div></form>
      <div className="space-y-2">{loading ? <div className="wm-panel !p-3 text-xs text-slate-500">Memuat...</div> : budgets.length === 0 ? <div className="wm-panel !p-3 text-xs text-slate-500">Belum ada anggaran detail.</div> : budgets.map(b => { const u = calculateBudgetUsage(b, transactions); const danger = u.exceeded || u.percent >= 90; return <article key={b.id} className="wm-panel !p-3"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><h3 className="truncate text-xs font-extrabold">{b.name}</h3><p className="text-[10px] text-slate-500">{b.category?.name || 'Semua pengeluaran'} · {b.period}</p></div><div className="flex gap-1"><button onClick={() => editLegacy(b)} className="grid h-8 w-8 place-items-center rounded-lg"><Pencil size={13} /></button><button onClick={() => removeLegacy(b.id)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-600"><Trash2 size={13} /></button></div></div><div className="mt-2 flex items-center justify-between text-[10px]"><span>Terpakai <b>{money(u.actual)}</b></span><b className={danger ? 'text-rose-600' : 'text-emerald-600'}>{u.percent.toFixed(0)}%</b></div><div className="wm-progress mt-1 h-1.5"><i style={{ width: `${Math.min(100, u.percent)}%` }} /></div><div className={`mt-1 text-[10px] font-bold ${danger ? 'text-rose-600' : 'text-slate-500'}`}>{danger ? <><AlertTriangle size={11} className="mr-1 inline" />Perlu diperhatikan</> : `Sisa ${money(u.remaining)}`}</div></article> })}</div>
    </section>
  </AppShell>
}
