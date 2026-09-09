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
  ['uang dari usaha', 6], ['income', 5], ['masuk', 3], ['gaji', 6], ['bonus', 5], ['cashback', 4]
]

export const EXPENSE_SIGNALS = [
  ['pengeluaran', 5], ['uang keluar', 6], ['uang dibayar', 6], ['bayar', 5],
  ['membayar', 5], ['belanja', 4], ['beli', 4], ['expense', 5], ['keluar', 3]
]

export const normalize = value => String(value || '').toLowerCase().normalize('NFKC').replace(/\s+/g, ' ').trim()

export const canonicalCategoryName = name => {
  const n = normalize(name)
  return ['makanan', 'makanan minuman', 'makanan dan minuman', 'makanan & minuman'].includes(n) ? 'makanan & minuman' : n
}
