import { supabase } from '../lib/supabase'

export async function createTelegramLinkCode() {
  const { data, error } = await supabase.rpc('create_telegram_link_code')
  if (error) throw error
  return data?.[0] || data
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
