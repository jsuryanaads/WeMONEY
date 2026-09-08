import { supabase } from '../lib/supabase'

const SELECT = 'id,user_id,category_id,name,amount,period,start_date,end_date,is_active,created_at,updated_at,category:categories(id,name,type,icon,color)'

export async function getBudgets(userId, { activeOnly = false } = {}) {
  let query = supabase.from('budgets').select(SELECT).eq('user_id', userId).order('start_date', { ascending: false }).order('created_at', { ascending: false })
  if (activeOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

function validate(payload) {
  const amount = Number(payload.amount)
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Nominal budget harus lebih besar dari 0.')
  if (!payload.name?.trim()) throw new Error('Nama budget wajib diisi.')
  if (!['weekly', 'monthly', 'yearly'].includes(payload.period)) throw new Error('Periode budget tidak valid.')
  if (!payload.start_date) throw new Error('Tanggal mulai budget wajib diisi.')
  if (payload.end_date && payload.end_date < payload.start_date) throw new Error('Tanggal selesai tidak boleh sebelum tanggal mulai.')
  return amount
}

export async function createBudget(userId, payload) {
  const amount = validate(payload)
  const row = {
    user_id: userId,
    category_id: payload.category_id || null,
    name: payload.name.trim(),
    amount,
    period: payload.period,
    start_date: payload.start_date,
    end_date: payload.end_date || null,
    is_active: payload.is_active ?? true,
  }
  const { data, error } = await supabase.from('budgets').insert(row).select(SELECT).single()
  if (error) throw error
  return data
}

export async function updateBudget(id, userId, payload) {
  const amount = validate(payload)
  const { data, error } = await supabase.from('budgets').update({
    category_id: payload.category_id || null,
    name: payload.name.trim(),
    amount,
    period: payload.period,
    start_date: payload.start_date,
    end_date: payload.end_date || null,
    is_active: payload.is_active ?? true,
  }).eq('id', id).eq('user_id', userId).select(SELECT).single()
  if (error) throw error
  return data
}

export async function deleteBudget(id, userId) {
  const { error } = await supabase.from('budgets').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

export function getBudgetPeriodEnd(budget) {
  if (budget.end_date) return budget.end_date
  const start = new Date(`${budget.start_date}T00:00:00`)
  if (budget.period === 'weekly') start.setDate(start.getDate() + 6)
  else if (budget.period === 'yearly') start.setFullYear(start.getFullYear() + 1); else start.setMonth(start.getMonth() + 1)
  start.setDate(start.getDate() - 1)
  return start.toISOString().slice(0, 10)
}

export function calculateBudgetUsage(budget, transactions) {
  const end = getBudgetPeriodEnd(budget)
  const categoryId = budget.category_id
  const actual = transactions.reduce((sum, tx) => {
    if (tx.type !== 'expense') return sum
    if (tx.transaction_date < budget.start_date || tx.transaction_date > end) return sum
    if (categoryId && tx.category_id !== categoryId) return sum
    return sum + Number(tx.amount || 0)
  }, 0)
  const limit = Number(budget.amount || 0)
  const percent = limit > 0 ? (actual / limit) * 100 : 0
  return { actual, remaining: Math.max(0, limit - actual), percent, exceeded: actual > limit, end }
}
