import { supabase } from '../lib/supabase'

export async function getDataStats() {
  const { data, error } = await supabase.rpc('get_my_data_stats')
  if (error) throw error
  return data?.[0] ?? { transactions: 0, transfers: 0, categories: 0, wallets: 0, last_activity: null }
}

export async function resetFinancialData() {
  const { error } = await supabase.rpc('reset_my_financial_data')
  if (error) throw error
}

export async function exportTransactionsCsv(userId) {
  const { data, error } = await supabase
    .from('transactions')
    .select('transaction_date,type,amount,description,notes,category:categories(name),wallet:wallets(name)')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
  if (error) throw error

  const escape = value => `"${String(value ?? '').replaceAll('"', '""')}"`
  const rows = [
    ['Tanggal', 'Jenis', 'Nominal', 'Kategori', 'Dompet', 'Keterangan', 'Catatan'],
    ...(data ?? []).map(row => [
      row.transaction_date,
      row.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      row.amount,
      row.category?.name ?? '',
      row.wallet?.name ?? '',
      row.description ?? '',
      row.notes ?? '',
    ]),
  ]
  const csv = '\uFEFF' + rows.map(row => row.map(escape).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `wemoney-transaksi-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
