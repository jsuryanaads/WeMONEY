export const INCOME_RULES = [
  ['Gaji', ['gaji', 'salary', 'upah', 'payroll', 'terima gaji']],
  ['Bonus', ['bonus', 'thr', 'insentif', 'tunjangan']],
  ['Penjualan', ['penjualan', 'hasil jual', 'hasil penjualan', 'jual', 'jualan']],
  ['Usaha', ['usaha', 'omzet', 'pendapatan usaha', 'hasil usaha', 'uang masuk dari usaha', 'pemasukan usaha', 'usaha masuk']],
  ['Fee', ['fee', 'honor', 'komisi', 'jasa']],
  ['Cashback', ['cashback', 'cash back', 'pengembalian dana']],
]

export const EXPENSE_RULES = [
  ['Rokok', ['rokok', 'roko', 'sigaret', 'cigarette']],
  ['Makanan & Minuman', ['makan', 'makanan', 'kuliner', 'warung', 'resto', 'restoran', 'jajan', 'minum', 'minuman']],
  ['Kopi', ['kopi', 'ngopi', 'coffee']],
  ['BBM', ['bensin', 'pertalite', 'pertamax', 'solar', 'bbm', 'isi bensin']],
  ['Parkir', ['parkir']],
  ['Transportasi Online', ['gojek', 'grab', 'maxim', 'ojek', 'ojol']],
  ['Perawatan Kendaraan', ['servis motor', 'service motor', 'bengkel', 'ganti oli', 'servis mobil']],
  ['Suku Cadang', ['suku cadang', 'sparepart', 'spare part', 'ganti ban']],
  ['Listrik', ['listrik', 'token listrik', 'pln']],
  ['Internet', ['internet', 'wifi', 'wi-fi', 'pulsa']],
  ['Obat', ['obat', 'apotek', 'apotik']],
  ['Belanja', ['belanja', 'beli', 'shopping', 'indomaret', 'alfamart']],
]

export const INCOME_SIGNALS = [
  ['pemasukan', 5], ['uang masuk', 6], ['uang diterima', 6], ['terima uang', 6],
  ['dapat uang', 5], ['diterima', 4], ['pendapatan', 5], ['hasil usaha', 6],
  ['uang dari usaha', 6], ['income', 5], ['masuk', 3], ['gaji', 6], ['bonus', 5],
  ['cashback', 4], ['usaha', 2], ['bisnis', 2], ['membayar saya', 7], ['bayar saya', 7],
  ['dibayar ke saya', 7], ['dibayar kepada saya', 7], ['transfer ke saya', 7]
]

export const EXPENSE_SIGNALS = [
  ['pengeluaran', 5], ['uang keluar', 6], ['uang dibayar', 6], ['bayar', 5],
  ['membayar', 5], ['belanja', 4], ['beli', 4], ['expense', 5], ['keluar', 3]
]

export const normalize = value => String(value || '').toLowerCase().normalize('NFKC').replace(/\s+/g, ' ').trim()

export function inferTransactionType(value) {
  const text = normalize(value)
  let incomeScore = 0
  let expenseScore = 0
  for (const [term, score] of INCOME_SIGNALS) if (text.includes(term)) incomeScore += score
  for (const [term, score] of EXPENSE_SIGNALS) if (text.includes(term)) expenseScore += score
  if (incomeScore === 0 && expenseScore === 0) return { type: 'expense', confidence: 0.3, incomeScore, expenseScore }
  if (incomeScore > expenseScore) return { type: 'income', confidence: Math.min(0.98, 0.55 + (incomeScore - expenseScore) * 0.07), incomeScore, expenseScore }
  if (expenseScore > incomeScore) return { type: 'expense', confidence: Math.min(0.98, 0.55 + (expenseScore - incomeScore) * 0.07), incomeScore, expenseScore }
  return { type: 'expense', confidence: 0.5, incomeScore, expenseScore }
}

export const canonicalCategoryName = name => {
  const n = normalize(name)
  return ['makanan', 'makanan minuman', 'makanan dan minuman', 'makanan & minuman'].includes(n) ? 'makanan & minuman' : n
}
