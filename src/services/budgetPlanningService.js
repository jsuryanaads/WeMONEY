import { supabase } from '../lib/supabase'

export const GROUPS = [
  { key: 'needs', name: 'Kebutuhan Pokok', icon: '🏠', defaultPct: 60 },
  { key: 'savings', name: 'Tabungan', icon: '💰', defaultPct: 15 },
  { key: 'emergency', name: 'Dana Darurat', icon: '🛡️', defaultPct: 15 },
  { key: 'lifestyle', name: 'Hiburan', icon: '🎮', defaultPct: 10 },
]

export const DEFAULT_ALLOCATION = GROUPS.map((g, i) => ({ group_key: g.key, name: g.name, percentage: g.defaultPct, amount: 0, sort_order: i }))

export async function getBudgetPlan(userId, periodStart) {
  const { data: plan, error } = await supabase.from('budget_plans').select('*').eq('user_id', userId).eq('period_start', periodStart).maybeSingle()
  if (error) throw error
  if (!plan) return null
  const { data: allocations, error: allocationError } = await supabase.from('budget_allocations').select('*').eq('plan_id', plan.id).order('sort_order')
  if (allocationError) throw allocationError
  return { ...plan, allocations: allocations ?? [] }
}

export async function saveBudgetPlan(userId, { periodStart, incomeAmount, obligationAmount, allocations }) {
  const income = Number(incomeAmount || 0)
  const obligation = Number(obligationAmount || 0)
  if (!Number.isFinite(income) || income < 0) throw new Error('Pendapatan tidak valid.')
  if (!Number.isFinite(obligation) || obligation < 0 || obligation > income) throw new Error('Kewajiban tidak boleh melebihi pendapatan.')
  const rows = (allocations || []).map(a => ({ ...a, percentage: Number(a.percentage || 0), amount: Number(a.amount || 0) }))
  const remaining = income - obligation
  const totalPct = rows.reduce((s, a) => s + a.percentage, 0)
  if (rows.some(a => !Number.isFinite(a.percentage) || a.percentage < 0 || a.percentage > 100 || !Number.isFinite(a.amount) || a.amount < 0)) throw new Error('Nilai alokasi tidak valid.')
  if (new Set(rows.map(a => a.group_key)).size !== rows.length) throw new Error('Kelompok alokasi duplikat.')
  if (remaining > 0 && Math.abs(totalPct - 100) > 0.01) throw new Error(`Total alokasi harus 100%. Saat ini ${totalPct.toFixed(1)}%.`)
  const normalized = rows.map(a => ({ ...a, amount: Math.round(remaining * a.percentage / 100) }))
  if (normalized.length && remaining > 0) {
    const delta = Math.round(remaining - normalized.reduce((s, a) => s + a.amount, 0))
    normalized[normalized.length - 1].amount += delta
  }
  const payload = normalized.map(a => ({ group_key: a.group_key, name: a.name, percentage: a.percentage, amount: a.amount, sort_order: a.sort_order }))
  const { data, error } = await supabase.rpc('save_budget_plan', { p_period_start: periodStart, p_income: income, p_obligation: obligation, p_allocations: payload })
  if (error) throw error
  return { ...(data?.plan || {}), allocations: data?.allocations || [] }
}

export function groupForCategory(categoryName, description = '') {
  const text = `${categoryName || ''} ${description || ''}`.toLowerCase()
  if (/tabung|saving/.test(text)) return 'savings'
  if (/darurat|emergency/.test(text)) return 'emergency'
  if (/hiburan|rokok|game|gaming|nongkrong|wisata|travel|langganan/.test(text)) return 'lifestyle'
  if (/makanan|transport|tagihan|pendidikan|listrik|internet|bbm|bensin|kesehatan|obat/.test(text)) return 'needs'
  return 'flexible'
}

export function calculateGroupUsage(transactions, categories, periodStart, periodEnd) {
  const categoryMap = new Map((categories || []).map(c => [c.id, c.name]))
  const start = periodStart ? new Date(`${periodStart}T00:00:00`) : null
  const end = periodEnd ? new Date(`${periodEnd}T23:59:59.999`) : null
  return (transactions || []).filter(t => {
    if (t.type !== 'expense') return false
    if (!start || !end) return true
    const raw = t.transaction_date || t.date || t.created_at
    if (!raw) return false
    const d = new Date(raw)
    return !Number.isNaN(d.getTime()) && d >= start && d <= end
  }).reduce((acc, tx) => {
    const group = groupForCategory(categoryMap.get(tx.category_id), tx.description)
    acc[group] = (acc[group] || 0) + Number(tx.amount || 0)
    return acc
  }, {})
}
