import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthShell from '../components/auth/AuthShell'
import { requestPasswordReset } from '../services/authService'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setLoading(true)
    const { error: resetError } = await requestPasswordReset(email.trim())
    setLoading(false)
    if (resetError) return setError('Permintaan reset gagal. Periksa email dan coba lagi.')
    setSent(true)
  }

  return <AuthShell title="Lupa kata sandi?" subtitle="Kami akan mengirimkan tautan untuk membuat kata sandi baru.">
    {sent ? <div className="space-y-4"><div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Jika akun dengan email tersebut tersedia, tautan reset sudah dikirim. Periksa inbox dan folder spam.</div><Link to="/login" className="block text-center font-bold text-blue-600">Kembali ke halaman masuk</Link></div> : <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <label className="block"><span className="text-sm font-semibold">Email</span><input required type="email" autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="nama@email.com" /></label>
      <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60">{loading?'Mengirim...':'Kirim tautan reset'}</button>
      <Link to="/login" className="block text-center text-sm font-semibold text-slate-500">Kembali ke masuk</Link>
    </form>}
  </AuthShell>
}
