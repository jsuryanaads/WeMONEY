export const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))

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
  return /\b(gaji|bonus|pendapatan|pemasukan|terima|menerima|dapat|diterima|hasil jual|penjualan|jual|fee|honor|thr|uang masuk)\b/i.test(description) ? 'income' : 'expense'
}

export function parseQuickItems(input, categories = [], wallets = []) {
  return splitQuickInput(input).map((clause, index) => {
    const amounts = extractAmounts(clause)
    const amount = amounts[amounts.length - 1] || 0
    const match = clause.match(/(?:rp\.?\s*)?\d+(?:[.,]\d+)?\s*(?:juta|jt|ribu|rb|k)?/i)
    const description = (match ? clause.slice(0, match.index) : clause).replace(/[,\-:]\s*$/, '').trim()
    const type = inferType(description)
    const pool = categories.filter(item => item.type === type)
    const lower = description.toLowerCase()
    const category = pool.find(item => item.name && lower.includes(item.name.toLowerCase()))
      || pool.find(item => /makan|kuliner|warung|resto/.test(lower) && /makan|food|kuliner/.test(item.name?.toLowerCase() || ''))
      || pool.find(item => /rokok|belanja|beli/.test(lower) && /belanja|kebutuhan/.test(item.name?.toLowerCase() || ''))
      || pool.find(item => /parkir|bensin|ojek|transport/.test(lower) && /transport|parkir|kendaraan/.test(item.name?.toLowerCase() || ''))
      || pool.find(item => /gaji/.test(lower) && /gaji/.test(item.name?.toLowerCase() || ''))
      || pool.find(item => /bonus/.test(lower) && /bonus/.test(item.name?.toLowerCase() || ''))
      || pool[0]
    const wallet = wallets.find(item => item.name && lower.includes(item.name.toLowerCase()))
      || wallets.find(item => item.name?.trim().toLowerCase() === 'kas utama')
      || wallets[0]
    return { id: `${Date.now()}-${index}-${Math.random()}`, description, amount, type, categoryId: category?.id || '', walletId: wallet?.id || '' }
  })
}
