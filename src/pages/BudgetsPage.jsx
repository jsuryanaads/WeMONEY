import { useEffect, useMemo, useState } from 'react'
import AppShell from '../components/layout/AppShell'
import { useAuth } from '../hooks/useAuth'
import { getCategories } from '../services/categoryService'
import { getTransactions } from '../services/transactionService'
import { DEFAULT_ALLOCATION, GROUPS, calculateGroupUsage, getBudgetPlan, saveBudgetPlan } from '../services/budgetPlanningService'

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))
const monthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01` }
const monthEnd = () => { const d = new Date(); d.setMonth(d.getMonth() + 1, 0); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const defaults = () => DEFAULT_ALLOCATION.map(a => ({ ...a }))

export default function BudgetsPage() {
  const { user } = useAuth()
  const [income, setIncome] = useState('')
  const [obligation, setObligation] = useState('')
  const [allocations, setAllocations] = useState(defaults())
  const [mode, setMode] = useState('percent')
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const incomeValue = Number(income || 0)
  const obligationValue = Number(obligation || 0)
  const remaining = Math.max(0, incomeValue - obligationValue)
  const totalPct = allocations.reduce((s, a) => s + Number(a.percentage || 0), 0)
  const totalAmount = allocations.reduce((s, a) => s + Number(a.amount || 0), 0)
  const complete = remaining === 0 || Math.abs(totalPct - 100) < 0.01
  const usage = useMemo(() => calculateGroupUsage(transactions, categories, monthStart(), monthEnd()), [transactions, categories])

  const load = async () => {
    if (!user?.id) return
    setLoading(true); setError('')
    try {
      const [plan, c, t] = await Promise.all([getBudgetPlan(user.id, monthStart()), getCategories(user.id, 'expense'), getTransactions(user.id, 1000)])
      if (plan) { setIncome(String(plan.income_amount)); setObligation(String(plan.obligation_amount)); setAllocations(plan.allocations?.length ? plan.allocations : defaults()) }
      else { setIncome(''); setObligation(''); setAllocations(defaults()) }
      setCategories(c); setTransactions(t)
    } catch (e) { setError(e.message || 'Gagal memuat anggaran.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [user?.id])
  useEffect(() => { setAllocations(prev => prev.map(a => ({ ...a, amount: Math.round(remaining * Number(a.percentage || 0) / 100) }))) }, [income, obligation])

  const updateAllocation = (index, value) => {
    const n = Math.max(0, Number(value || 0))
    setAllocations(prev => prev.map((a, i) => i !== index ? a : mode === 'percent'
      ? { ...a, percentage: n, amount: Math.round(remaining * n / 100) }
      : { ...a, amount: n, percentage: remaining > 0 ? Number((n / remaining * 100).toFixed(2)) : 0 }))
  }

  const savePlan = async () => {
    setSaving(true); setError(''); setNotice('')
    try {
      const saved = await saveBudgetPlan(user.id, { periodStart: monthStart(), incomeAmount: income, obligationAmount: obligation, allocations })
      setAllocations(saved.allocations)
      setNotice('Rencana tersimpan.')
      window.dispatchEvent(new Event('wemoney:data-changed'))
    } catch (e) { setError(e.message || 'Gagal menyimpan rencana.') }
    finally { setSaving(false) }
  }

  return <AppShell title="Anggaran">
    <div className="mb-4">
      <h2 className="text-xl font-extrabold tracking-tight">Anggaran</h2>
      <p className="mt-0.5 text-xs text-slate-500">Rencanakan sisa uang dan lihat realisasinya.</p>
    </div>

    {error && <div role="alert" className="wm-error mb-3">{error}</div>}
    {notice && <div className="mb-3 border-b border-emerald-200 pb-2 text-xs font-semibold text-emerald-700">{notice}</div>}

    <section className="mb-5">
      <h3 className="mb-2 text-sm font-extrabold">Rencana Bulanan</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <label className="text-[11px] font-bold text-slate-600">Pendapatan
          <input className="wm-input mt-1 w-full !py-2 text-sm" type="number" min="0" value={income} onChange={e => setIncome(e.target.value)} placeholder="4.800.000" />
        </label>
        <label className="text-[11px] font-bold text-slate-600">Kewajiban
          <input className="wm-input mt-1 w-full !py-2 text-sm" type="number" min="0" value={obligation} onChange={e => setObligation(e.target.value)} placeholder="2.200.000" />
        </label>
        <div className="col-span-2 border-l-2 border-slate-900 pl-3 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-600">Sisa</span>
          <strong className="mt-1 block text-xl font-extrabold">{money(remaining)}</strong>
        </div>
      </div>
    </section>

    <section className="mb-5 border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between gap-2">
        <div><h3 className="text-sm font-extrabold">Rencana vs Realisasi</h3><p className="mt-0.5 text-[11px] text-slate-500">Atur rencana, lalu bandingkan dengan transaksi.</p></div>
        <div className="inline-flex rounded-lg border p-0.5">
          <button type="button" onClick={() => setMode('percent')} className={`rounded-md px-2.5 py-1.5 text-[11px] font-extrabold ${mode === 'percent' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>%</button>
          <button type="button" onClick={() => setMode('nominal')} className={`rounded-md px-2.5 py-1.5 text-[11px] font-extrabold ${mode === 'nominal' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Rp</button>
        </div>
      </div>

      <div className="mt-3 divide-y border-y border-slate-200">
        {allocations.map((a, i) => {
          const planned = Number(a.amount || 0)
          const actual = Number(usage[a.group_key] || 0)
          const percentUsed = planned > 0 ? actual / planned * 100 : actual > 0 ? 100 : 0
          return <div key={a.group_key} className="py-3">
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[1fr_130px_150px]">
              <div><b className="block text-sm">{a.name}</b><span className="text-[10px] text-slate-400">Realisasi {money(actual)}</span></div>
              <label className="text-right text-[10px] font-bold text-slate-500">{mode === 'percent' ? '%' : 'Rp'}
                <input className="wm-input mt-1 w-24 !py-1.5 text-right text-sm" type="number" min="0" max={mode === 'percent' ? '100' : undefined} step="0.1" value={mode === 'percent' ? a.percentage : a.amount} onChange={e => updateAllocation(i, e.target.value)} />
              </label>
              <div className="col-span-2 text-right sm:col-span-1"><b className="text-xs">Rencana {money(planned)}</b><span className="ml-2 text-[10px] text-slate-400">{percentUsed.toFixed(0)}% terpakai</span></div>
            </div>
            <div className="wm-progress mt-2 h-1.5"><i style={{ width: `${Math.min(100, Math.max(0, percentUsed))}%` }} /></div>
          </div>
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-600">
        <span>Total {totalPct.toFixed(1)}% · {money(totalAmount)}</span>
        <span className={complete ? 'text-emerald-700' : 'text-amber-700'}>{complete ? 'Lengkap' : 'Total harus 100%'}</span>
      </div>
      <button disabled={saving || (remaining > 0 && !complete)} onClick={savePlan} className="wm-primary mt-3 min-h-10 w-full rounded-lg px-3 py-2 text-xs font-extrabold">{saving ? 'Menyimpan...' : 'Simpan Rencana'}</button>
    </section>

    {loading && <div className="text-xs text-slate-500">Memuat data...</div>}
  </AppShell>
}
