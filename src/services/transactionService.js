import { supabase } from '../lib/supabase'

const SELECT = 'id,user_id,wallet_id,category_id,type,amount,transaction_date,description,notes,source,receipt_id,created_at,updated_at,category:categories(id,name,type,icon,color),wallet:wallets(id,name,type)'

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

export async function getTransactionsPage(userId, { page = 1, pageSize = 10, search = '', type = 'all', walletId = 'all', categoryId = 'all', startDate = '', endDate = '' } = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const safePageSize = [10, 20, 50].includes(Number(pageSize)) ? Number(pageSize) : 10
  const from = (safePage - 1) * safePageSize
  const to = from + safePageSize - 1
  let query = supabase.from('transactions').select(SELECT, { count: 'exact' }).eq('user_id', userId)
  const term = search.trim().replace(/[^\p{L}\p{N}\s._-]/gu, ' ').replace(/\s+/g, ' ')
  if (term) query = query.or(`description.ilike.%${term}%,notes.ilike.%${term}%`)
  if (type === 'income' || type === 'expense') query = query.eq('type', type)
  if (walletId !== 'all') query = query.eq('wallet_id', walletId)
  if (categoryId !== 'all') query = query.eq('category_id', categoryId)
  if (startDate) query = query.gte('transaction_date', startDate)
  if (endDate) query = query.lte('transaction_date', endDate)
  const { data, error, count } = await query.order('transaction_date', { ascending: false }).order('created_at', { ascending: false }).range(from, to)
  if (error) throw error
  return { data: data ?? [], count: count ?? 0, page: safePage, pageSize: safePageSize, totalPages: Math.max(1, Math.ceil((count ?? 0) / safePageSize)) }
}

function validateTransactionPayload(payload) {
  const amount = Number(payload.amount)
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Nominal harus lebih besar dari 0.')
  if (!['income', 'expense'].includes(payload.type)) throw new Error('Jenis transaksi tidak valid.')
  if (!payload.transaction_date) throw new Error('Tanggal transaksi wajib diisi.')
  return amount
}

export async function createTransaction(userId, payload) {
  const amount = validateTransactionPayload(payload)
  const { data, error } = await supabase.from('transactions').insert({ user_id: userId, wallet_id: payload.wallet_id || null, category_id: payload.category_id || null, type: payload.type, amount, transaction_date: payload.transaction_date, description: payload.description?.trim() || null, notes: payload.notes?.trim() || null, source: payload.source || 'manual', receipt_id: payload.receipt_id || null }).select(SELECT).single()
  if (error) throw error
  return data
}

export async function updateTransaction(id, userId, payload) {
  const amount = validateTransactionPayload(payload)
  const { data, error } = await supabase.from('transactions').update({ wallet_id: payload.wallet_id || null, category_id: payload.category_id || null, type: payload.type, amount, transaction_date: payload.transaction_date, description: payload.description?.trim() || null, notes: payload.notes?.trim() || null, receipt_id: payload.receipt_id || null, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId).select(SELECT).single()
  if (error) throw error
  return data
}

export async function deleteTransaction(id, userId) {
  const { data: tx, error: findError } = await supabase.from('transactions').select('receipt_id').eq('id', id).eq('user_id', userId).single()
  if (findError) throw findError
  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
  if (tx.receipt_id) {
    const { error: receiptError } = await supabase.from('receipts').delete().eq('id', tx.receipt_id).eq('user_id', userId)
    if (receiptError) throw receiptError
  }
}
