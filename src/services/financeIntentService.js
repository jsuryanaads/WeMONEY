import { supabase } from '../lib/supabase'

const normalize = value => String(value || '').toLowerCase().normalize('NFKC').replace(/\s+/g, ' ').trim()

function parseAmount(text) {
  const m = normalize(text).match(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(juta|jt|ribu|rb|k|m)?\b/i)
  if (!m) return 0
  let value = Number(m[1].replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.'))
  if (!Number.isFinite(value)) return 0
  const unit = (m[2] || '').toLowerCase()
  if (['juta', 'jt', 'm'].includes(unit)) value *= 1000000
  if (['ribu', 'rb', 'k'].includes(unit)) value *= 1000
  return Math.round(value)
}

function isoDate(day, base = new Date()) {
  const d = Number(day)
  if (!Number.isInteger(d) || d < 1 || d > 31) return ''
  return new Date(base.getFullYear(), base.getMonth(), d).toISOString().slice(0, 10)
}

function localIntent(text) {
  const source = normalize(text)
  const amount = parseAmount(source)
  const day = source.match(/(?:tanggal|tgl|jatuh tempo|tempo)\s*(?:tanggal\s*)?(\d{1,2})\b/i)?.[1]
  const dueDate = day ? isoDate(day) : ''
  const recurring = /(?:setiap|tiap|bulanan|per bulan|bulanan)/i.test(source)
  const yearly = /(?:tahunan|per tahun|setiap tahun)/i.test(source)
  const debt = /(?:hutang|utang|pinjam|meminjam|berutang)/i.test(source)
  const receivable = /(?:piutang|akan dibayar ke saya|harus menerima)/i.test(source)
  const bill = /(?:tagihan|bayar listrik|bayar internet|bayar wifi|bayar air|bayar pln|cicilan|sewa|langganan)/i.test(source)
  if (!debt && !receivable && !bill) return null
  const kind = bill ? 'bill' : receivable ? 'receivable' : 'debt'
  const title = source
    .replace(/(?:rp\.?\s*)?\d[\d.,]*\s*(?:juta|jt|ribu|rb|k|m)?/gi, '')
    .replace(/(?:tanggal|tgl|jatuh tempo|tempo)\s*\d{1,2}/gi, '')
    .replace(/\s+/g, ' ').trim()
  return {
    intent: 'create_obligation',
    kind,
    amount_total: amount,
    due_date: dueDate,
    title: title.replace(/^(bayar|catat|tambahkan|tambah)\s+/i, '').trim() || 'Kewajiban baru',
    counterparty: '',
    is_recurring: recurring || yearly,
    recurrence: yearly ? 'yearly' : 'monthly',
    confidence: amount > 0 ? 0.82 : 0.58,
    source: 'hybrid-local',
    requires_confirmation: true,
  }
}

export function classifyFinanceIntent(text) {
  return localIntent(text)
}

export async function classifyFinanceIntentWithAi(text, context = {}) {
  const local = localIntent(text)
  if (local && local.confidence >= 0.8) return local
  try {
    const { data, error } = await supabase.functions.invoke('finance-intent', { body: { text, context } })
    if (!error && data?.ok && data?.result) return { ...data.result, source: data.provider || 'openrouter', requires_confirmation: true }
  } catch {}
  return local || { intent: 'unknown', confidence: 0, source: 'hybrid-local', requires_confirmation: true }
}
