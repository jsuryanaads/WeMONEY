import { supabase } from '../lib/supabase'

export async function getCategories(userId, type = null) {
  let query = supabase.from('categories').select('*').eq('user_id', userId).eq('is_active', true).order('type').order('name')
  if (type) query = query.eq('type', type)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createCategory(userId, payload) {
  const { data, error } = await supabase.from('categories').insert({ user_id: userId, name: payload.name.trim(), type: payload.type, icon: payload.icon || 'Tag', color: payload.color || 'blue' }).select().single()
  if (error) throw error
  return data
}

export async function updateCategory(id, userId, payload) {
  const { data, error } = await supabase.from('categories').update({ name: payload.name.trim(), type: payload.type, icon: payload.icon || 'Tag', color: payload.color || 'blue', is_active: payload.is_active ?? true }).eq('id', id).eq('user_id', userId).select().single()
  if (error) throw error
  return data
}

export async function deleteCategory(id, userId) {
  const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}
