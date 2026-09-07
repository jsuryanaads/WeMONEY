import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/auth/AuthShell'
import { supabase } from '../lib/supabase'
import { updatePassword } from '../services/authService'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)))
  }, [])

  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setMessage('')
    if (password.length < 6) return setError('Kata sandi minimal 6 karakter.')
    if (password !== confirm) return setError('Konfirmasi kata sandi tidak cocok.')
    setLoading(true)
    const { error: updateError } = await updatePassword(password)
    setLoading(false)
    if (updateError) return setError('Kata sandi gagal diperbarui. Silakan minta tautan reset baru.')
    await supabase.auth.signOut()
    setMessage('Kata sandi berhasil diperbarui. Silakan masuk kembali.')
    setTimeout(() => navigate('/login', { replace: true }), 1200)
  }

  return <AuthShell title="Buat kata sandi baru" subtitle="Gunakan kata sandi yang kuat dan mudah kamu ingat.">
    {!ready ? <div className="space-y-4"><div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">Sesi reset belum tersedia. Gunakan tautan reset dari email terbaru.</div><Link to="/forgot-password" className="block text-center font-bold text-blue-600">Minta tautan baru</Link></div> : <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {message && <div role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
      <label className="block"><span className="text-sm font-semibold">Kata sandi baru</span><input required minLength={6} type="password" autoComplete="new-password" value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" /></label>
      <label className="block"><span className="text-sm font-semibold">Konfirmasi kata sandi</span><input required minLength={6} type="password" autoComplete="new-password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" /></label>
      <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60">{loading?'Menyimpan...':'Simpan kata sandi'}</button>
    </form>}
  </AuthShell>
}
