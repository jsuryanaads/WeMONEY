import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import AuthShell from '../components/auth/AuthShell'
import { signIn } from '../services/authService'

const field = 'mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/15'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await signIn(email.trim(), password)
    setLoading(false)
    if (authError) return setError('Email atau kata sandi tidak benar. Silakan periksa kembali.')
    navigate('/dashboard', { replace: true })
  }

  return <AuthShell title="Selamat datang kembali" subtitle="Kelola keuanganmu dengan lebih mudah.">
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div role="alert" className="rounded-xl border border-rose-800/70 bg-rose-950/50 px-4 py-3 text-sm font-semibold leading-5 text-rose-300">{error}</div>}
      <label className="block text-left"><span className="text-sm font-semibold text-slate-200">Email</span><input required type="email" autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} className={field} placeholder="nama@email.com" /></label>
      <label className="block text-left"><span className="text-sm font-semibold text-slate-200">Kata sandi</span><div className="relative mt-1.5"><input required minLength={8} type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} className={`${field} pr-11`} placeholder="Masukkan kata sandi" /><button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-700 hover:text-slate-200" aria-label={showPassword?'Sembunyikan kata sandi':'Tampilkan kata sandi'}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
      <div className="text-right"><Link to="/forgot-password" className="text-sm font-semibold text-blue-400 transition hover:text-blue-300">Lupa kata sandi?</Link></div>
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{loading && <LoaderCircle size={18} className="animate-spin"/>}{loading ? 'Memproses...' : 'Masuk'}</button>
    </form>
    <p className="mt-6 text-center text-sm text-slate-400">Belum punya akun? <Link to="/register" className="font-bold text-blue-400 transition hover:text-blue-300">Daftar sekarang</Link></p>
  </AuthShell>
}
