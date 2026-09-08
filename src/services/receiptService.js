import { supabase } from '../lib/supabase'

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

/**
 * Receipt files are transient. This helper only validates a File object in the browser.
 * No receipt bytes are uploaded to Supabase Storage.
 */
export function validateReceiptFile(file) {
  if (!file) throw new Error('Pilih file struk terlebih dahulu.')
  if (!ALLOWED.includes(file.type)) throw new Error('Format struk harus JPG, PNG, WEBP, atau PDF.')
  if (file.size > MAX_SIZE) throw new Error('Ukuran struk maksimal 10 MB.')
  return file
}

/**
 * Persist only OCR results after the user has reviewed and confirmed them.
 * The original receipt file is never stored by this service.
 */
export async function createVerifiedReceipt(userId, payload) {
  const { data, error } = await supabase.from('receipts').insert({
    user_id: userId,
    receipt_date: payload.receipt_date || null,
    merchant: payload.merchant?.trim() || null,
    subtotal: payload.subtotal ?? null,
    discount: payload.discount ?? null,
    tax: payload.tax ?? null,
    total: payload.total ?? null,
    ocr_status: 'verified',
    ocr_raw_data: payload.ocr_raw_data ?? null,
  }).select().single()
  if (error) throw error
  return data
}

export async function deleteReceipt(receiptId, userId) {
  const { error } = await supabase.from('receipts').delete().eq('id', receiptId).eq('user_id', userId)
  if (error) throw error
}
