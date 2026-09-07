import { supabase } from '../lib/supabase'

export async function getTransactionsForPeriod(userId, startDate, endDate) {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, type, amount, transaction_date, description, notes, category:categories(id, name, type, icon, color)')
    .eq('user_id', userId)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
