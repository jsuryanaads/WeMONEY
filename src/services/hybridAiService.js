const normalize = value => String(value || '').toLowerCase().normalize('NFKC').replace(/\s+/g, ' ').trim()

const INCOME_RULES = [
  ['Gaji', ['gaji', 'salary', 'upah', 'payroll']],
  ['Bonus', ['bonus', 'thr', 'insentif']],
  ['Penjualan', ['penjualan', 'hasil jual', 'hasil penjualan', 'jual']],
  ['Usaha', ['usaha', 'omzet', 'pendapatan usaha', 'hasil usaha']],
  ['Fee', ['fee', 'honor', 'komisi']],
  ['Cashback', ['cashback', 'cash back']],
]

const EXPENSE_RULES = [
  ['Rokok', ['rokok', 'roko', 'sigaret']],
  ['Makanan & Minuman', ['makan', 'kuliner', 'warung', 'resto', 'restoran', 'jajan', 'minum']],
  ['Kopi', ['kopi', 'ngopi', 'coffee']],
  ['BBM', ['bensin', 'pertalite', 'pertamax', 'solar', 'bbm']],
  ['Parkir', ['parkir']],
  ['Transportasi Online', ['gojek', 'grab', 'maxim', 'ojek', 'ojol']],
  ['Perawatan Kendaraan', ['servis motor', 'service motor', 'bengkel', 'ganti oli', 'servis mobil']],
  ['Suku Cadang', ['suku cadang', 'sparepart', 'spare part', 'ganti ban']],
  ['Listrik', ['listrik', 'token listrik']],
  ['Internet', ['internet', 'wifi', 'wi-fi']],
  ['Obat', ['obat', 'apotek', 'apotik']],
  ['Belanja', ['belanja', 'beli', 'shopping', 'indomaret', 'alfamart']],
]

function matchCategory(text, type, categories) {
  const pool = (categories || []).filter(item => item.type === type && item.is_active !== false)
  if (!pool.length) return { categoryId: '', confidence: 0, explanation: 'Belum ada kategori aktif untuk jenis transaksi ini.' }
  const lower = normalize(text)
  const exact = pool.find(item => lower.includes(normalize(item.name)))
  if (exact) return { categoryId: exact.id, confidence: 0.96, explanation: `Kategori “${exact.name}” cocok dengan teks transaksi.` }
  const rules = type === 'income' ? INCOME_RULES : EXPENSE_RULES
  for (const [name, patterns] of rules) {
    if (!patterns.some(pattern => lower.includes(pattern))) continue
    const category = pool.find(item => normalize(item.name) === normalize(name))
    if (category) return { categoryId: category.id, confidence: 0.91, explanation: `Konteks transaksi cocok dengan kategori “${category.name}”.` }
  }
  return { categoryId: '', confidence: 0.35, explanation: 'Kategori belum cukup yakin. Pilih manual sebelum menyimpan.' }
}

function matchWallet(text, wallets) {
  const pool = (wallets || []).filter(item => item.is_active !== false)
  if (!pool.length) return { walletId: '', confidence: 0, explanation: 'Belum ada dompet aktif.' }
  const lower = normalize(text)
  const exact = pool.find(item => normalize(item.name) && lower.includes(normalize(item.name)))
  if (exact) return { walletId: exact.id, confidence: 0.95, explanation: `Dompet “${exact.name}” disebut pada transaksi.` }
  const main = pool.find(item => normalize(item.name) === 'kas utama') || pool[0]
  return { walletId: main?.id || '', confidence: 0.55, explanation: `Dompet default “${main?.name || 'Kas Utama'}”. Periksa sebelum menyimpan.` }
}

function inferType(text) {
  const lower = normalize(text)
  if (/\b(uang\s+masuk|uang\s+diterima|uang\s+dapat|uang\s+masuknya|dapat\s+uang|terima\s+uang|terima\s+gaji|diterima|pemasukan|income|masuk|gaji|bonus|pendapatan|cashback)\b/.test(lower)) return 'income'
  if (/\b(uang\s+keluar|uang\s+dibayar|pengeluaran|expense|keluar|bayar|membayar)\b/.test(lower)) return 'expense'
  return 'expense'
}

function extractDate(text) {
  const m = String(text || '').match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/)
  if (!m) return ''
  const year = Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3])
  return `${year}-${String(Number(m[2])).padStart(2, '0')}-${String(Number(m[1])).padStart(2, '0')}`
}

export function classifyTransaction({ text = '', amount = 0, date = '', categories = [], wallets = [], merchant = '' } = {}) {
  const source = [text, merchant].filter(Boolean).join(' ')
  const type = inferType(source)
  const category = matchCategory(source, type, categories)
  const wallet = matchWallet(source, wallets)
  const confidence = Math.min(category.confidence || 0, wallet.confidence || 0)
  return {
    type,
    amount: Number(amount) || 0,
    transaction_date: date || extractDate(source) || new Date().toLocaleDateString('en-CA'),
    description: merchant || String(text || '').trim().slice(0, 180),
    categoryId: category.categoryId,
    walletId: wallet.walletId,
    classificationConfidence: confidence,
    classificationSource: 'hybrid-local',
    classificationExplanation: `${category.explanation} ${wallet.explanation}`,
  }
}

export function classifyReceipt(result, categories = [], wallets = []) {
  return { ...result, ...classifyTransaction({ text: result?.rawText, amount: result?.total, date: result?.receipt_date, merchant: result?.merchant, categories, wallets }) }
}
