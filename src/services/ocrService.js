import { createWorker } from 'tesseract.js'

const moneyPattern = /(?:rp\.?\s*)?([0-9][0-9.\s]*(?:,[0-9]{1,2})?)/i
const DATE_PATTERNS = [
  /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/,
  /\b(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/,
]

function parseMoney(value) {
  if (!value) return null
  const cleaned = String(value).replace(/[^0-9,.-]/g, '')
  if (!cleaned) return null
  const normalized = cleaned.includes(',') && cleaned.includes('.')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.includes('.')
      ? cleaned.replace(/\./g, '')
      : cleaned.replace(',', '.')
  const number = Number(normalized)
  return Number.isFinite(number) ? Math.round(number) : null
}

function findMoney(lines, keywords) {
  for (const line of lines) {
    const lower = line.toLowerCase()
    if (!keywords.some(keyword => lower.includes(keyword))) continue
    const match = line.match(moneyPattern)
    const value = parseMoney(match?.[1])
    if (value !== null) return value
  }
  return null
}

function parseDate(text) {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern)
    if (!match) continue
    let day; let month; let year
    if (match[1].length === 4) {
      year = Number(match[1]); month = Number(match[2]); day = Number(match[3])
    } else {
      day = Number(match[1]); month = Number(match[2]); year = Number(match[3])
      if (year < 100) year += 2000
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year.toString().padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }
  return new Date().toISOString().slice(0, 10)
}

function findMerchant(lines) {
  const blocked = /^(struk|receipt|invoice|nota|tanggal|date|total|subtotal|diskon|discount|pajak|tax|cash|tunai|kembali|change|terima kasih|thank)/i
  return lines.find(line => line.length >= 3 && !blocked.test(line) && !/^\d+[\d\s./:-]*$/.test(line))?.slice(0, 120) || ''
}

export function parseReceiptText(rawText, confidence = 0) {
  const lines = rawText.split(/\r?\n/).map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean)
  return {
    merchant: findMerchant(lines),
    receipt_date: parseDate(rawText),
    subtotal: findMoney(lines, ['subtotal', 'sub total', 'jumlah']),
    discount: findMoney(lines, ['diskon', 'discount', 'disc']),
    tax: findMoney(lines, ['pajak', 'tax', 'ppn', 'pph']),
    total: findMoney(lines, ['total', 'grand total', 'jumlah bayar', 'amount']),
    confidence,
    rawText: rawText.slice(0, 12000),
  }
}

export async function recognizeReceipt(file, onProgress = () => {}) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('OCR saat ini mendukung foto JPG, PNG, atau WEBP. PDF belum diproses.')
  }

  const worker = await createWorker('ind', 1, {
    logger: message => {
      if (typeof message.progress === 'number') {
        onProgress(Math.max(0, Math.min(100, message.progress * 100)))
      }
    },
  })

  try {
    const { data } = await worker.recognize(file)
    onProgress(100)
    return parseReceiptText(data.text || '', Number(data.confidence || 0))
  } finally {
    await worker.terminate()
  }
}
