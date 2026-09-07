import { supabase } from '../lib/supabase'

const DEFAULT_EXPENSE_CATEGORIES = [
  ['Makanan', 'Utensils', 'rose'], ['Transportasi', 'Car', 'blue'], ['Belanja', 'ShoppingBag', 'violet'], ['Tagihan', 'ReceiptText', 'amber'],
  ['Hiburan', 'Gamepad2', 'pink'], ['Kesehatan', 'HeartPulse', 'emerald'], ['Pendidikan', 'GraduationCap', 'indigo'], ['Lainnya', 'MoreHorizontal', 'slate'],
]
const DEFAULT_INCOME_CATEGORIES = [
  ['Gaji', 'Wallet', 'emerald'], ['Bonus', 'Gift', 'blue'], ['Penjualan', 'Store', 'violet'], ['Investasi', 'TrendingUp', 'indigo'], ['Hadiah', 'Gift', 'pink'], ['Lainnya', 'MoreHorizontal', 'slate'],
]

export async function ensureUserProfile(user) {
  if (!user?.id) return { error: new Error('User tidak valid.') }
  const { error: profileError } = await supabase.from('profiles').upsert({ user_id: user.id, full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna', email: user.email || null }, { onConflict: 'user_id' })
  if (profileError) return { error: profileError }

  const { data: existingCategories, error: categoryReadError } = await supabase.from('categories').select('name,type').eq('user_id', user.id)
  if (categoryReadError) return { error: categoryReadError }
  const existingKeys = new Set((existingCategories || []).map(item => `${item.type}:${item.name}`))
  const defaults = [
    ...DEFAULT_EXPENSE_CATEGORIES.map(([name, icon, color]) => ({ user_id: user.id, name, type: 'expense', icon, color })),
    ...DEFAULT_INCOME_CATEGORIES.map(([name, icon, color]) => ({ user_id: user.id, name, type: 'income', icon, color })),
  ]
  const missing = defaults.filter(item => !existingKeys.has(`${item.type}:${item.name}`))
  if (missing.length) {
    const { error } = await supabase.from('categories').insert(missing)
    if (error) return { error }
  }

  const { data: wallets, error: walletReadError } = await supabase.from('wallets').select('id').eq('user_id', user.id).limit(1)
  if (walletReadError) return { error: walletReadError }
  if (!wallets?.length) {
    const { error } = await supabase.from('wallets').insert({ user_id: user.id, name: 'Kas Utama', type: 'cash', initial_balance: 0, icon: 'Wallet', color: 'blue' })
    if (error) return { error }
  }
  return { error: null }
}
