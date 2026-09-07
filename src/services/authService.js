import { supabase } from '../lib/supabase'

const appUrl = (path = '') => `${window.location.origin}${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(email, password, fullName) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: appUrl('dashboard'),
    },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function requestPasswordReset(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: appUrl('reset-password'),
  })
}

export async function updatePassword(password) {
  return supabase.auth.updateUser({ password })
}
