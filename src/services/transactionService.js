import { supabase } from '../lib/supabase'

const SELECT = 'id,user_id,wallet_id,category_id,type,amount,transaction_date,description,notes,created_at,updated_at,category:categories(id,name,type,icon,color),wallet:wallets(id,name,type)'

export async function getTransactionsForPeriod(userId, startDate, endDate) {
  const { data, error } = await supabase.from('transactions').select(SELECT).eq('user_id', userId).gte('transaction_date', startDate).lte('transaction_date', endDate).order('transaction_date', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getTransactions(userId, limit = 100) {
  const { data, error } = await supabase.from('transactions').select(SELECT).eq('user_id', userId).order('transaction_date', { ascending: false }).order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return data ?? []
}

export async function createTransaction(userId, payload) {
  const { data, error } = await supabase.from('transactions').insert({ user_id: userId, wallet_id: payload.wallet_id || null, category_id: payload.category_id || null, type: payload.type, amount: Number(payload.amount), transaction_date: payload.transaction_date, description: payload.description?.trim() || null, notes: payload.notes?.trim() || null }).select(SELECT).single()
  if (error) throw error
  return data
}

export async function updateTransaction(id, userId, payload) {
  const { data, error } = await supabase.from('transactions').update({ wallet_id: payload.wallet_id || null, category_id: payload.category_id || null, type: payload.type, amount: Number(payload.amount), transaction_date: payload.transaction_date, description: payload.description?.trim() || null, notes: payload.notes?.trim() || null, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId).select(SELECT).single()
  if (error) throw error
  return data
}

export async function deleteTransaction(id, userId) {
  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}
