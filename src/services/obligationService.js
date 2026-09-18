import { supabase } from '../lib/supabase'
import { getDeviceId, getDeviceName } from './deviceService'

const SELECT = 'id,user_id,kind,title,counterparty,amount_total,amount_paid,due_date,status,is_recurring,recurrence,notes,created_at,updated_at'

function validatePayload(payload) {
  const amountTotal = Number(payload.amount_total)
  const amountPaid = Number(payload.amount_paid || 0)
  if (!['debt', 'receivable', 'bill'].includes(payload.kind)) throw new Error('Jenis catatan tidak valid.')
  if (!payload.title?.trim()) throw new Error('Nama wajib diisi.')
  if (!Number.isFinite(amountTotal) || amountTotal <= 0) throw new Error('Nominal harus lebih besar dari 0.')
  if (!Number.isFinite(amountPaid) || amountPaid < 0 || amountPaid > amountTotal) throw new Error('Nominal dibayar tidak valid.')
  if (payload.is_recurring && !['monthly', 'yearly'].includes(payload.recurrence)) throw new Error('Pola berulang wajib dipilih.')
  return { amountTotal, amountPaid }
}

function normalizePayload(payload) {
  const { amountTotal, amountPaid } = validatePayload(payload)
  return {
    kind: payload.kind,
    title: payload.title.trim(),
    counterparty: payload.counterparty?.trim() || null,
    amount_total: amountTotal,
    amount_paid: amountPaid,
    due_date: payload.due_date || null,
    status: amountPaid >= amountTotal ? 'paid' : payload.status === 'cancelled' ? 'cancelled' : 'open',
    is_recurring: Boolean(payload.is_recurring),
    recurrence: payload.is_recurring ? payload.recurrence : null,
    notes: payload.notes?.trim() || null,
  }
}

export async function getObligations(userId, { kind = 'all', status = 'all', search = '' } = {}) {
  let query = supabase.from('obligations').select(SELECT).eq('user_id', userId)
  if (kind !== 'all') query = query.eq('kind', kind)
  if (status !== 'all') query = query.eq('status', status)
  const term = search.trim().replace(/[^\p{L}\p{N}\s._-]/gu, ' ').replace(/\s+/g, ' ')
  if (term) query = query.or(`title.ilike.%${term}%,counterparty.ilike.%${term}%`)
  const { data, error } = await query.order('status', { ascending: true }).order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createObligation(userId, payload) {
  const { data, error } = await supabase.from('obligations').insert({ user_id: userId, ...normalizePayload(payload) }).select(SELECT).single()
  if (error) throw error
  return data
}

export async function updateObligation(id, userId, payload) {
  const { data, error } = await supabase.from('obligations').update({ ...normalizePayload(payload), updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId).select(SELECT).single()
  if (error) throw error
  return data
}

export async function payObligation(userId, obligationId, payload) {
  const amount = Number(payload.amount)
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Nominal pembayaran harus lebih besar dari 0.')
  if (!payload.wallet_id) throw new Error('Dompet pembayaran wajib dipilih.')
  const deviceId = getDeviceId()
  const deviceName = getDeviceName()
  const { data, error } = await supabase.rpc('pay_obligation', {
    p_obligation_id: obligationId,
    p_wallet_id: payload.wallet_id,
    p_amount: amount,
    p_payment_date: payload.payment_date,
    p_category_id: payload.category_id || null,
    p_notes: payload.notes?.trim() || null,
    p_device_id: deviceId,
    p_device_name: deviceName,
  })
  if (error) throw error
  return data
}

export async function deleteObligation(id, userId) {
  const { error } = await supabase.from('obligations').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}
