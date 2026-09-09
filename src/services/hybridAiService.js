import { INCOME_RULES, EXPENSE_RULES, INCOME_SIGNALS, EXPENSE_SIGNALS, normalize, canonicalCategoryName } from './hybridAiRules'

function inferType(text) {
  const lower = normalize(text)
  let incomeScore = 0
  let expenseScore = 0
  for (const [term, score] of INCOME_SIGNALS) if (lower.includes(term)) incomeScore += score
  for (const [term, score] of EXPENSE_SIGNALS) if (lower.includes(term)) expenseScore += score
  if (incomeScore > expenseScore && incomeScore > 0) return 'income'
  if (expenseScore > 0) return 'expense'
  return 'expense'
}

function matchCategory(text, type, categories) {
  const pool = (categories || []).filter(item => item.type === type && item.is_active !== false)
  if (!pool.length) return { categoryId: '', confidence: 0, explanation: 'Belum ada kategori aktif untuk jenis transaksi ini.' }
  const lower = normalize(text)
  const exact = pool.find(item => {
    const n = normalize(item.name)
    return n && lower.includes(n)
  })
  if (exact) return { categoryId: exact.id, confidence: 0.98, explanation: `Kategori “${exact.name}” cocok langsung dengan transaksi.` }
  const rules = type === 'income' ? INCOME_RULES : EXPENSE_RULES
  for (const [name, patterns] of rules) {
    if (!patterns.some(pattern => lower.includes(pattern))) continue
    const category = pool.find(item => canonicalCategoryName(item.name) === canonicalCategoryName(name))
    if (category) return { categoryId: category.id, confidence: 0.93, explanation: `Konteks transaksi cocok dengan kategori “${category.name}”.` }
  }
  const fallback = pool.find(item => canonicalCategoryName(item.name) === 'lainnya')
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
    classificationSource: 'hybrid-shared-v3',
    classificationExplanation: `${category.explanation} ${wallet.explanation}`,
  }
}

export function classifyReceipt(result, categories = [], wallets = []) {
  return { ...result, ...classifyTransaction({ text: result?.rawText, amount: result?.total, date: result?.receipt_date, merchant: result?.merchant, categories, wallets }) }
}
