import { supabase } from '../lib/supabase'

const BUCKET = 'receipts'
const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export async function uploadReceipt(userId, file) {
  if (!file) throw new Error('Pilih file struk terlebih dahulu.')
  if (!ALLOWED.includes(file.type)) throw new Error('Format struk harus JPG, PNG, WEBP, atau PDF.')
  if (file.size > MAX_SIZE) throw new Error('Ukuran struk maksimal 10 MB.')

  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-')
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) throw uploadError

  const { data, error } = await supabase.from('receipts').insert({
    user_id: userId,
    storage_path: path,
    receipt_date: new Date().toISOString().slice(0, 10),
    ocr_status: 'pending',
  }).select().single()
  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    throw error
  }
  return data
}

export async function getReceiptSignedUrl(path, expiresIn = 600) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn)
  if (error) throw error
  return data.signedUrl
}

export async function deleteReceipt(receiptId, userId, storagePath) {
  const { error } = await supabase.from('receipts').delete().eq('id', receiptId).eq('user_id', userId)
  if (error) throw error
  if (storagePath) await supabase.storage.from(BUCKET).remove([storagePath])
}
