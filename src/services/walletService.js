import { supabase } from '../lib/supabase'

export async function getWallets(userId) {
  const { data, error } = await supabase.from('wallets').select('*').eq('user_id', userId).order('name')
  if (error) throw error
  return data ?? []
}

export async function createWallet(userId, payload) {
  const { data, error } = await supabase.from('wallets').insert({ user_id: userId, name: payload.name.trim(), type: payload.type, initial_balance: Number(payload.initial_balance || 0), icon: payload.icon || 'Wallet', color: payload.color || 'blue' }).select().single()
  if (error) throw error
  return data
}

export async function updateWallet(id, userId, payload) {
  const { data, error } = await supabase.from('wallets').update({ name: payload.name.trim(), type: payload.type, icon: payload.icon || 'Wallet', color: payload.color || 'blue', is_active: payload.is_active ?? true }).eq('id', id).eq('user_id', userId).select().single()
  if (error) throw error
  return data
}

export async function deleteWallet(id, userId) {
  const { error } = await supabase.from('wallets').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

export async function getWalletBalances(userId) {
  const [w, t, x] = await Promise.all([
    supabase.from('wallets').select('*').eq('user_id', userId).eq('is_active', true).order('name'),
    supabase.from('transactions').select('wallet_id,type,amount').eq('user_id', userId),
    supabase.from('transfers').select('source_wallet_id,destination_wallet_id,amount').eq('user_id', userId),
  ])
  if (w.error) throw w.error
  if (t.error) throw t.error
  if (x.error) throw x.error
  const balances = Object.fromEntries((w.data ?? []).map(row => [row.id, Number(row.initial_balance)]))
  for (const row of t.data ?? []) {
    if (!row.wallet_id || balances[row.wallet_id] === undefined) continue
    balances[row.wallet_id] += row.type === 'income' ? Number(row.amount) : -Number(row.amount)
  }
  for (const row of x.data ?? []) {
    if (balances[row.source_wallet_id] !== undefined) balances[row.source_wallet_id] -= Number(row.amount)
    if (balances[row.destination_wallet_id] !== undefined) balances[row.destination_wallet_id] += Number(row.amount)
  }
  return (w.data ?? []).map(row => ({ ...row, balance: balances[row.id] ?? 0 }))
}

export async function createTransfer(userId, payload) {
  const { data, error } = await supabase.from('transfers').insert({ user_id: userId, source_wallet_id: payload.source_wallet_id, destination_wallet_id: payload.destination_wallet_id, amount: Number(payload.amount), transfer_date: payload.transfer_date, description: payload.description?.trim() || null, notes: payload.notes?.trim() || null }).select().single()
  if (error) throw error
  return data
}
