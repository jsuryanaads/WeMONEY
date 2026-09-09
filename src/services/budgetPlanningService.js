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
  const remaining = income - obligation
  const totalPct = allocations.reduce((s, a) => s + Number(a.percentage || 0), 0)
  if (Math.abs(totalPct - 100) > 0.01 && remaining > 0) throw new Error(`Total alokasi harus 100%. Saat ini ${totalPct.toFixed(1)}%.`)
  const rows = allocations.map(a => ({ ...a, percentage: Number(a.percentage || 0), amount: Math.round(remaining * Number(a.percentage || 0) / 100) }))
  const { data: plan, error } = await supabase.from('budget_plans').upsert({ user_id: userId, period_start: periodStart, income_amount: income, obligation_amount: obligation }, { onConflict: 'user_id,period_start' }).select().single()
  if (error) throw error
  const { error: deleteError } = await supabase.from('budget_allocations').delete().eq('plan_id', plan.id).eq('user_id', userId)
  if (deleteError) throw deleteError
  if (rows.length) {
    const { error: insertError } = await supabase.from('budget_allocations').insert(rows.map(r => ({ plan_id: plan.id, user_id: userId, group_key: r.group_key, name: r.name, percentage: r.percentage, amount: r.amount, sort_order: r.sort_order })))
    if (insertError) throw insertError
  }
  return { ...plan, allocations: rows }
}

export function groupForCategory(categoryName, description = '') {
  const text = `${categoryName || ''} ${description || ''}`.toLowerCase()
  if (/tabung|saving/.test(text)) return 'savings'
  if (/darurat|emergency/.test(text)) return 'emergency'
  if (/hiburan|rokok|game|gaming|nongkrong|wisata|travel|langganan/.test(text)) return 'lifestyle'
  if (/makanan|transport|tagihan|pendidikan|listrik|internet|bbm|bensin|kesehatan|obat/.test(text)) return 'needs'
  return 'flexible'
}

export function calculateGroupUsage(transactions, categories) {
  const categoryMap = new Map((categories || []).map(c => [c.id, c.name]))
  return transactions.filter(t => t.type === 'expense').reduce((acc, tx) => {
    const group = groupForCategory(categoryMap.get(tx.category_id), tx.description)
    acc[group] = (acc[group] || 0) + Number(tx.amount || 0)
    return acc
  }, {})
}
