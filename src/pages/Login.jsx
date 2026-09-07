import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import AuthShell from '../components/auth/AuthShell'
import { signIn } from '../services/authService'

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

  return <AuthShell title="Masuk ke WeMoney" subtitle="Kelola keuanganmu dengan aman.">
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <label className="block"><span className="text-sm font-semibold">Email</span><input required type="email" autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" placeholder="nama@email.com" /></label>
      <label className="block"><span className="text-sm font-semibold">Kata sandi</span><div className="relative mt-1.5"><input required minLength={6} type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" placeholder="••••••••" /><button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Tampilkan kata sandi">{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
      <div className="text-right"><Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Lupa kata sandi?</Link></div>
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{loading && <LoaderCircle size={18} className="animate-spin"/>}Masuk</button>
    </form>
    <p className="mt-6 text-center text-sm text-slate-500">Belum punya akun? <Link to="/register" className="font-bold text-blue-600">Daftar sekarang</Link></p>
  </AuthShell>
}
