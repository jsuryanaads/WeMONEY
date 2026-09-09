const normalize = value => String(value || '').toLowerCase().normalize('NFKC').replace(/\s+/g, ' ').trim()

const INCOME_RULES = [
  ['Gaji', ['gaji', 'salary', 'upah', 'payroll', 'terima gaji']],
  ['Bonus', ['bonus', 'thr', 'insentif', 'tunjangan']],
  ['Penjualan', ['penjualan', 'hasil jual', 'hasil penjualan', 'jual', 'jualan']],
  ['Usaha', ['usaha', 'omzet', 'pendapatan usaha', 'hasil usaha', 'uang masuk dari usaha', 'pemasukan usaha', 'usaha masuk']],
  ['Fee', ['fee', 'honor', 'komisi', 'jasa']],
  ['Cashback', ['cashback', 'cash back', 'pengembalian dana']],
]

const EXPENSE_RULES = [
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

const INCOME_SIGNALS = [
  ['pemasukan', 5], ['uang masuk', 6], ['uang diterima', 6], ['terima uang', 6],
  ['dapat uang', 5], ['diterima', 4], ['pendapatan', 5], ['hasil usaha', 6],
  ['uang dari usaha', 6], ['income', 5], ['masuk', 3], ['gaji', 6], ['bonus', 5], ['cashback', 4]
]
const EXPENSE_SIGNALS = [
  ['pengeluaran', 5], ['uang keluar', 6], ['uang dibayar', 6], ['bayar', 5],
  ['membayar', 5], ['belanja', 4], ['beli', 4], ['expense', 5], ['keluar', 3]
]

function inferType(text) {
  const lower = normalize(text)
  let incomeScore = 0
  let expenseScore = 0
  for (const [term, score] of INCOME_SIGNALS) if (lower.includes(term)) incomeScore += score
  for (const [term, score] of EXPENSE_SIGNALS) if (lower.includes(term)) expenseScore += score
  // Explicit intent wins when present; otherwise financial vocabulary decides.
  if (incomeScore > expenseScore && incomeScore > 0) return 'income'
  if (expenseScore > 0) return 'expense'
  return 'expense'
}

function canonicalName(name) {
  const n = normalize(name)
  if (['makanan', 'makanan minuman', 'makanan dan minuman', 'makanan & minuman'].includes(n)) return 'makanan & minuman'
  return n
}

function matchCategory(text, type, categories) {
  const pool = (categories || []).filter(item => item.type === type && item.is_active !== false)
  if (!pool.length) return { categoryId: '', confidence: 0, explanation: 'Belum ada kategori aktif untuk jenis transaksi ini.' }
  const lower = normalize(text)

  // Exact user-master category names have highest priority.
  const exact = pool.find(item => {
    const n = normalize(item.name)
    return n && lower.includes(n)
  })
  if (exact) return { categoryId: exact.id, confidence: 0.98, explanation: `Kategori “${exact.name}” cocok langsung dengan transaksi.` }

  const rules = type === 'income' ? INCOME_RULES : EXPENSE_RULES
  for (const [name, patterns] of rules) {
    if (!patterns.some(pattern => lower.includes(pattern))) continue
    const target = canonicalName(name)
    const category = pool.find(item => canonicalName(item.name) === target)
    if (category) return { categoryId: category.id, confidence: 0.93, explanation: `Konteks transaksi cocok dengan kategori “${category.name}”.` }
  }

  const fallback = pool.find(item => canonicalName(item.name) === 'lainnya')
  if (fallback) return { categoryId: fallback.id, confidence: 0.45, explanation: `Kategori belum pasti. “${fallback.name}” dipakai sebagai kandidat dan perlu diperiksa.` }
  return { categoryId: '', confidence: 0.3, explanation: 'Kategori belum cukup yakin. Pilih manual sebelum menyimpan.' }
}

function matchWallet(text, wallets) {
  const pool = (wallets || []).filter(item => item.is_active !== false)
  if (!pool.length) return { walletId: '', confidence: 0, explanation: 'Belum ada dompet aktif.' }
  const lower = normalize(text)
  const exact = pool.find(item => normalize(item.name) && lower.includes(normalize(item.name)))
  if (exact) return { walletId: exact.id, confidence: 0.97, explanation: `Dompet “${exact.name}” disebut pada transaksi.` }
  const main = pool.find(item => normalize(item.name) === 'kas utama') || pool[0]
  return { walletId: main?.id || '', confidence: 0.55, explanation: `Dompet default “${main?.name || 'Kas Utama'}”. Periksa sebelum menyimpan.` }
}

function extractDate(text) {
  const value = String(text || '')
  const m = value.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/)
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
    description: String(text || merchant || '').trim().slice(0, 180),
    merchant: String(merchant || '').trim().slice(0, 120),
    categoryId: category.categoryId,
    walletId: wallet.walletId,
    classificationConfidence: confidence,
    classificationSource: 'hybrid-local-v2',
    classificationExplanation: `${category.explanation} ${wallet.explanation}`,
  }
}

export function classifyReceipt(result, categories = [], wallets = []) {
  return { ...result, ...classifyTransaction({ text: result?.rawText, amount: result?.total, date: result?.receipt_date, merchant: result?.merchant, categories, wallets }) }
}
