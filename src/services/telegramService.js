import { supabase } from '../lib/supabase'

function requireRpcData(data, error, fallback) {
  if (error) throw new Error(error.message || fallback)
  if (data == null) throw new Error(fallback)
  return data
}

export async function createTelegramLinkCode() {
  const { data, error } = await supabase.rpc('create_telegram_link_code')
  const result = requireRpcData(data, error, 'Gagal membuat kode koneksi Telegram.')
  const code = Array.isArray(result) ? result[0] : result
  if (!code?.code) throw new Error('Kode koneksi Telegram tidak berhasil dibuat.')
  return code
}

export async function getTelegramConnection() {
  const { data, error } = await supabase.from('telegram_connections').select('telegram_chat_id,telegram_username,telegram_first_name,status,linked_at,last_seen_at').maybeSingle()
  if (error) throw error
  return data
}

export async function unlinkTelegram() {
  const { error } = await supabase.rpc('unlink_telegram')
  if (error) throw error
}

export async function hasTelegramBotToken() {
  const { data, error } = await supabase.rpc('has_telegram_bot_token')
  if (error) throw error
  return Boolean(data)
}

export async function setTelegramBotToken(token) {
  const { data, error } = await supabase.rpc('set_telegram_bot_token', { p_token: token })
  if (error) throw error
  return Boolean(data)
}
