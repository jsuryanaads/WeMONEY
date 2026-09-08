import { supabase } from '../lib/supabase'

export async function getWallets(userId, includeArchived = false) {
  let query = supabase.from('wallets').select('*').eq('user_id', userId).order('name')
  if (!includeArchived) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createWallet(userId, payload) {
  const name = payload.name.trim()
  if (!name) throw new Error('Nama dompet wajib diisi.')
  const { data, error } = await supabase.from('wallets').insert({ user_id: userId, name, type: payload.type, initial_balance: Number(payload.initial_balance || 0), icon: payload.icon || 'Wallet', color: payload.color || 'blue', is_active: true }).select().single()
  if (error) throw error
  return data
}

export async function updateWallet(id, userId, payload) {
  const { data: current, error: currentError } = await supabase.from('wallets').select('name').eq('id', id).eq('user_id', userId).single()
  if (currentError) throw currentError
  if (current.name?.trim().toLowerCase() === 'kas utama' && payload.name?.trim().toLowerCase() !== 'kas utama') {
    throw new Error('Kas Utama adalah dompet default dan namanya tidak dapat diganti.')
  }
  const { data, error } = await supabase.from('wallets').update({ name: payload.name.trim(), type: payload.type, icon: payload.icon || 'Wallet', color: payload.color || 'blue', is_active: payload.is_active ?? true }).eq('id', id).eq('user_id', userId).select().single()
  if (error) throw error
  return data
}

export async function archiveWallet(id, userId) {
  const { data: wallet, error: findError } = await supabase.from('wallets').select('name,is_active').eq('id', id).eq('user_id', userId).single()
  if (findError) throw findError
  if (wallet.name?.trim().toLowerCase() === 'kas utama') throw new Error('Kas Utama adalah dompet default dan tidak dapat diarsipkan.')
  if (!wallet.is_active) return wallet
  const { data, error } = await supabase.from('wallets').update({ is_active: false }).eq('id', id).eq('user_id', userId).select().single()
  if (error) throw error
  return data
}

export async function restoreWallet(id, userId) {
  const { data, error } = await supabase.from('wallets').update({ is_active: true }).eq('id', id).eq('user_id', userId).select().single()
  if (error) throw error
  return data
}

export async function deleteWallet(id, userId) {
  const { error: walletError } = await supabase.from('wallets').select('id').eq('id', id).eq('user_id', userId).single()
  if (walletError) throw walletError
  const [transactions, transfersFrom, transfersTo] = await Promise.all([
    supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('wallet_id', id),
    supabase.from('transfers').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('source_wallet_id', id),
    supabase.from('transfers').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('destination_wallet_id', id),
  ])
  if (transactions.error) throw transactions.error
  if (transfersFrom.error) throw transfersFrom.error
  if (transfersTo.error) throw transfersTo.error
  const used = (transactions.count ?? 0) + (transfersFrom.count ?? 0) + (transfersTo.count ?? 0)
  if (used > 0) throw new Error(`Dompet masih memiliki ${used} transaksi/transfer. Arsipkan dompet agar riwayat tetap aman.`)
  const { error } = await supabase.from('wallets').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

export async function getWalletBalances(userId, includeArchived = false) {
  const [w, t, x] = await Promise.all([
    getWallets(userId, includeArchived),
    supabase.from('transactions').select('wallet_id,type,amount').eq('user_id', userId),
    supabase.from('transfers').select('source_wallet_id,destination_wallet_id,amount').eq('user_id', userId),
  ])
  const [tResult, xResult] = [t, x]
  if (tResult.error) throw tResult.error
  if (xResult.error) throw xResult.error
  const balances = Object.fromEntries((w ?? []).map(row => [row.id, Number(row.initial_balance)]))
  for (const row of tResult.data ?? []) {
    if (!row.wallet_id || balances[row.wallet_id] === undefined) continue
    balances[row.wallet_id] += row.type === 'income' ? Number(row.amount) : -Number(row.amount)
  }
  for (const row of xResult.data ?? []) {
    if (balances[row.source_wallet_id] !== undefined) balances[row.source_wallet_id] -= Number(row.amount)
    if (balances[row.destination_wallet_id] !== undefined) balances[row.destination_wallet_id] += Number(row.amount)
  }
  return (w ?? []).map(row => ({ ...row, balance: balances[row.id] ?? 0 }))
}

export async function createTransfer(userId, payload) {
  if (payload.source_wallet_id === payload.destination_wallet_id) throw new Error('Dompet asal dan tujuan harus berbeda.')
  const { data, error } = await supabase.from('transfers').insert({ user_id: userId, source_wallet_id: payload.source_wallet_id, destination_wallet_id: payload.destination_wallet_id, amount: Number(payload.amount), transfer_date: payload.transfer_date, description: payload.description?.trim() || null, notes: payload.notes?.trim() || null }).select().single()
  if (error) throw error
  return data
}
