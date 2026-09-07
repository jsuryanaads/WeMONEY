import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import AuthShell from '../components/auth/AuthShell'
import { signUp } from '../services/authService'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function change(key, value) { setForm((current) => ({ ...current, [key]: value })) }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (form.password.length < 6) return setError('Kata sandi minimal 6 karakter.')
    if (form.password !== form.confirm) return setError('Konfirmasi kata sandi tidak cocok.')
    setLoading(true)
    const { data, error: authError } = await signUp(form.email.trim(), form.password, form.fullName.trim())
    setLoading(false)
    if (authError) return setError(authError.message || 'Pendaftaran gagal. Silakan coba lagi.')
    if (data.session) navigate('/dashboard', { replace: true })
    else setMessage('Akun berhasil dibuat. Periksa email untuk konfirmasi, lalu masuk ke WeMoney.')
  }

  return <AuthShell title="Buat akun" subtitle="Mulai mencatat keuanganmu hari ini.">
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {message && <div role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
      <label className="block"><span className="text-sm font-semibold">Nama lengkap</span><input required value={form.fullName} onChange={(e)=>change('fullName',e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Nama kamu" /></label>
      <label className="block"><span className="text-sm font-semibold">Email</span><input required type="email" autoComplete="email" value={form.email} onChange={(e)=>change('email',e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="nama@email.com" /></label>
      <label className="block"><span className="text-sm font-semibold">Kata sandi</span><input required minLength={6} type="password" autoComplete="new-password" value={form.password} onChange={(e)=>change('password',e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Minimal 6 karakter" /></label>
      <label className="block"><span className="text-sm font-semibold">Konfirmasi kata sandi</span><input required minLength={6} type="password" autoComplete="new-password" value={form.confirm} onChange={(e)=>change('confirm',e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Ulangi kata sandi" /></label>
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60">{loading&&<LoaderCircle size={18} className="animate-spin"/>}Daftar</button>
    </form>
    <p className="mt-6 text-center text-sm text-slate-500">Sudah punya akun? <Link to="/login" className="font-bold text-blue-600">Masuk</Link></p>
  </AuthShell>
}
