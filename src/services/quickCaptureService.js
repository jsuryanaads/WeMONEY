import { classifyTransaction } from './hybridAiService'

export const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))

export function parseAmount(raw) {
  const text = String(raw || '').toLowerCase().replace(/rp\.?/g, '').replace(/\s/g, '').trim()
  const match = text.match(/^(\d+(?:[.,]\d+)?)(juta|jt|ribu|rb|k)?$/i)
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
  return classifyTransaction({ text: description }).type
}

export function parseQuickItems(input, categories = [], wallets = []) {
  return splitQuickInput(input).map((clause, index) => {
    const amounts = extractAmounts(clause)
    const amount = amounts[amounts.length - 1] || 0
    const match = clause.match(/(?:rp\.?\s*)?\d+(?:[.,]\d+)?\s*(?:juta|jt|ribu|rb|k)?/i)
    const description = (match ? clause.slice(0, match.index) : clause).replace(/[,\-:]\s*$/, '').trim()
    const classification = classifyTransaction({ text: description, amount, categories, wallets })
    return {
      id: `${Date.now()}-${index}-${Math.random()}`,
      description: classification.description || description,
      amount: classification.amount,
      type: classification.type,
      categoryId: classification.categoryId || '',
      walletId: classification.walletId || '',
      transaction_date: classification.transaction_date,
      classificationConfidence: classification.classificationConfidence,
      classificationSource: classification.classificationSource,
      classificationExplanation: classification.classificationExplanation,
    }
  })
}
