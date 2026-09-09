export const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))

const INCOME_RULES = [
  ['Gaji', ['gaji', 'upah', 'salary']],
  ['Bonus', ['bonus', 'thr', 'insentif']],
  ['Penjualan', ['hasil jual', 'hasil penjualan', 'penjualan', 'jual']],
  ['Usaha', ['usaha', 'omzet', 'pendapatan usaha']],
  ['Fee', ['fee', 'honor', 'komisi']],
  ['Cashback', ['cashback', 'cash back']],
  ['Pemasukan', ['pemasukan', 'uang masuk', 'terima', 'menerima', 'diterima', 'dapat']]
]

const EXPENSE_RULES = [
  ['Perawatan Kendaraan', ['servis motor', 'service motor', 'benerin motor', 'perbaiki motor', 'perbaikan motor', 'servis mobil', 'service mobil', 'bengkel', 'ganti oli']],
  ['Suku Cadang', ['suku cadang', 'sparepart', 'spare part', 'ganti ban', 'ban motor', 'ban mobil']],
  ['BBM', ['bensin', 'pertalite', 'pertamax', 'solar', 'bbm', 'isi bensin', 'isi bbm']],
  ['Parkir', ['parkir', 'parkir motor', 'parkir mobil']],
  ['Transportasi Online', ['ojek', 'gojek', 'grab', 'maxim', 'ojol']],
  ['Kopi', ['kopi', 'ngopi', 'coffee']],
  ['Makanan & Minuman', ['makan', 'kuliner', 'warung', 'resto', 'restoran', 'jajan', 'minum']],
  ['Rokok', ['rokok', 'roko', 'sigaret']],
  ['Belanja', ['belanja', 'beli', 'shopping']],
  ['Listrik', ['listrik', 'token listrik', 'token']],
  ['Internet', ['internet', 'wifi', 'wi-fi']],
  ['Obat', ['obat', 'apotek', 'apotik']],
]

const normalizeText = value => String(value || '')
  .toLowerCase()
  .normalize('NFKC')
  .replace(/\s+/g, ' ')
  .trim()

export function parseAmount(raw) {
  const text = String(raw || '').toLowerCase().replace(/rp\.?/g, '').trim()
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(juta|jt|ribu|rb|k)?/i)
  if (!match) return 0
  const value = Number(match[1].replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.'))
  if (!Number.isFinite(value)) return 0
  const unit = match[2]?.toLowerCase()
  if (unit === 'juta' || unit === 'jt') return Math.round(value * 1000000)
  if (unit === 'ribu' || unit === 'rb' || unit === 'k') return Math.round(value * 1000)
  return Math.round(value)
}

export function extractAmounts(text) {
  const matches = String(text || '').match(/(?:rp\.?\s*)?\d+(?:[.,]\d+)?\s*(?:juta|jt|ribu|rb|k)?/gi) || []
  return matches.map(parseAmount).filter(Boolean)
}

export function splitQuickInput(value) {
  const text = String(value || '').trim()
  if (!text) return []
  const clauses = text.split(/(?:\s*,\s*|\s*;\s*|\n+|\s+(?:lalu|terus)\s+)/i).map(v => v.trim()).filter(Boolean)
  return clauses.flatMap(clause => extractAmounts(clause).length > 1
    ? clause.split(/\s+dan\s+(?=[a-zA-Z])/i).map(v => v.trim()).filter(Boolean)
    : [clause])
}

export function inferType(description) {
  const lower = normalizeText(description)
  return INCOME_RULES.some(([, patterns]) => patterns.some(pattern => lower.includes(pattern))) ? 'income' : 'expense'
}

function findCategory(pool, categoryNames) {
  return categoryNames
    .map(name => pool.find(item => normalizeText(item.name) === normalizeText(name)))
    .find(Boolean)
}

function classifyCategory(description, type, categories = []) {
  const lower = normalizeText(description)
  const pool = categories.filter(item => item.type === type && item.is_active !== false)
  if (!pool.length) return { category: null, confidence: 0, source: 'none', explanation: 'Belum ada kategori aktif untuk jenis transaksi ini.' }

  const exact = pool.find(item => {
    const name = normalizeText(item.name)
    return name && (lower === name || lower.includes(name))
  })
  if (exact) return { category: exact, confidence: 0.96, source: 'category-name', explanation: `Nama kategori “${exact.name}” cocok dengan input.` }

  const rules = type === 'income' ? INCOME_RULES : EXPENSE_RULES
  for (const [categoryName, patterns] of rules) {
    if (!patterns.some(pattern => lower.includes(pattern))) continue
    const category = findCategory(pool, [categoryName])
    if (category) return { category, confidence: categoryName === 'Perawatan Kendaraan' ? 0.95 : 0.91, source: 'rule', explanation: `Terdeteksi pola “${categoryName}” dari konteks input.` }
  }

  return { category: null, confidence: 0.35, source: 'manual', explanation: 'Kategori belum cukup yakin. Pilih kategori secara manual pada tahap review.' }
}

export function parseQuickItems(input, categories = [], wallets = []) {
  return splitQuickInput(input).map((clause, index) => {
    const amounts = extractAmounts(clause)
    const amount = amounts[amounts.length - 1] || 0
    const match = clause.match(/(?:rp\.?\s*)?\d+(?:[.,]\d+)?\s*(?:juta|jt|ribu|rb|k)?/i)
    const description = (match ? clause.slice(0, match.index) : clause).replace(/[,\-:]\s*$/, '').trim()
    const type = inferType(description)
    const classification = classifyCategory(description, type, categories)
    const lower = normalizeText(description)
    const wallet = wallets.find(item => item.name && lower.includes(normalizeText(item.name)))
      || wallets.find(item => normalizeText(item.name) === 'kas utama')
      || wallets[0]
    return {
      id: `${Date.now()}-${index}-${Math.random()}`,
      description,
      amount,
      type,
      categoryId: classification.category?.id || '',
      walletId: wallet?.id || '',
      classificationConfidence: classification.confidence,
      classificationSource: classification.source,
      classificationExplanation: classification.explanation,
    }
  })
}
