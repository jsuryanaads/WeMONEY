import { useEffect, useState } from 'react'
import { AlertTriangle, Download, LogOut, Database, BookOpen, Trash2, UserX } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { signOut } from '../services/authService'
import { deleteMyAccount, exportTransactionsCsv, getDataStats, resetFinancialData } from '../services/dataService'

const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200'
const input = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
const button = 'rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50'

export default function SettingsPage() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.user_metadata?.full_name || '')
  const [stats, setStats] = useState(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [resetText, setResetText] = useState('')
  const [deleteText, setDeleteText] = useState('')

  const loadStats = async () => { try { setStats(await getDataStats()) } catch (e) { setError(e.message) } }
  useEffect(() => { if (user?.id) loadStats() }, [user?.id])

  async function save(e) {
    e.preventDefault(); setError(''); setSaved(false)
    const { error: authError } = await supabase.auth.updateUser({ data: { full_name: name.trim() } })
    if (authError) return setError(authError.message)
    const { error: profileError } = await supabase.from('profiles').update({ full_name: name.trim(), updated_at: new Date().toISOString() }).eq('user_id', user.id)
    if (profileError) return setError(profileError.message)
    setSaved(true)
  }

  async function exportData() { setError(''); setBusy(true); try { await exportTransactionsCsv(user.id) } catch (e) { setError(e.message) } finally { setBusy(false) } }
  async function resetData() {
    if (resetText !== 'RESET') return
    if (!window.confirm('RESET akan menghapus seluruh transaksi dan transfer serta mengosongkan saldo awal semua dompet. Dompet dan kategori tetap ada. Lanjutkan?')) return
    setError(''); setBusy(true)
    try { await resetFinancialData(); setResetText(''); await loadStats(); window.alert('Data keuangan berhasil di-reset.') } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function deleteAccount() {
    if (deleteText !== 'HAPUS AKUN') return
    if (!window.confirm('PERMANEN: akun, profil, dompet, kategori, transaksi, dan transfer akan dihapus. Tindakan ini tidak dapat dibatalkan. Lanjutkan?')) return
    setError(''); setBusy(true)
    try { await deleteMyAccount(); await supabase.auth.signOut(); window.location.replace(`${import.meta.env.BASE_URL}login`) } catch (e) { setError(e.message); setBusy(false) }
  }
  async function logout() { await signOut() }

  return <AppShell title="Pengaturan"><div className="space-y-6">
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={save} className={card}><h2 className="font-extrabold">Profil</h2><p className="mt-1 text-sm text-slate-400">Informasi akun WeMoney.</p><label className="mt-5 block text-sm font-semibold">Nama lengkap<input className={input} value={name} onChange={e=>setName(e.target.value)}/></label><label className="mt-4 block text-sm font-semibold">Email<input disabled className={`${input} bg-slate-50`} value={user?.email||''}/></label><button className={`${button} mt-5`}>Simpan Profil</button>{saved&&<p className="mt-3 text-sm font-semibold text-emerald-600">Profil tersimpan.</p>}</form>
      <div className={card}><h2 className="font-extrabold">Sesi</h2><p className="mt-1 text-sm text-slate-400">Keluar dari akun di perangkat ini.</p><button onClick={logout} className="mt-5 rounded-xl border border-rose-200 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50"><LogOut size={17} className="mr-1 inline"/>Keluar</button></div>
    </div>
    <section className={card}><div className="flex items-center gap-3"><Database className="text-blue-600"/><div><h2 className="font-extrabold">Data & Privasi</h2><p className="text-sm text-slate-400">Kelola, backup, reset, atau hapus data.</p></div></div>
      {stats && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Transaksi" value={stats.transactions}/><Metric label="Transfer" value={stats.transfers}/><Metric label="Kategori" value={stats.categories}/><Metric label="Dompet" value={stats.wallets}/></div>}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4"><h3 className="font-bold">Export Data</h3><p className="mt-1 text-sm leading-6 text-slate-500">Unduh seluruh transaksi sebagai CSV sebelum melakukan reset.</p><button disabled={busy} onClick={exportData} className={`${button} mt-4`}><Download size={17} className="mr-1 inline"/>Export CSV</button></div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4"><div className="flex items-center gap-2 text-rose-700"><AlertTriangle size={18}/><h3 className="font-bold">Reset Data Keuangan</h3></div><p className="mt-1 text-sm leading-6 text-rose-700/80">Hapus transaksi & transfer dan kosongkan saldo awal semua dompet. Dompet dan kategori tetap.</p><label className="mt-3 block text-xs font-bold text-rose-700">Ketik RESET<input className={`${input} border-rose-200`} value={resetText} onChange={e=>setResetText(e.target.value.toUpperCase())} placeholder="RESET"/></label><button disabled={busy || resetText!=='RESET'} onClick={resetData} className="mt-3 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"><Trash2 size={17} className="mr-1 inline"/>Reset Data</button></div>
      </div>
      <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4"><div className="flex items-center gap-2 text-red-700"><UserX size={18}/><h3 className="font-bold">Hapus Akun Permanen</h3></div><p className="mt-1 text-sm leading-6 text-red-700/80">Menghapus akun Auth beserta seluruh data terkait. Tidak ada pemulihan setelah berhasil.</p><label className="mt-3 block text-xs font-bold text-red-700">Ketik HAPUS AKUN<input className={`${input} border-red-200`} value={deleteText} onChange={e=>setDeleteText(e.target.value.toUpperCase())} placeholder="HAPUS AKUN"/></label><button disabled={busy || deleteText!=='HAPUS AKUN'} onClick={deleteAccount} className="mt-3 rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"><UserX size={17} className="mr-1 inline"/>Hapus Akun Permanen</button></div>
    </section>
    <section className={card}><div className="flex items-center justify-between gap-4"><div><h2 className="font-extrabold">Bantuan</h2><p className="mt-1 text-sm text-slate-400">Pelajari alur pencatatan, transfer, saldo, dan keamanan data.</p></div><a href={`${import.meta.env.BASE_URL}panduan`} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50"><BookOpen size={17} className="mr-1 inline"/>Buka Panduan</a></div></section>
    <p className="text-center text-xs text-slate-400">WeMoney V1 | © 2026 Created Jsuryana</p>
  </div></AppShell>
}

function Metric({label,value}) { return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-extrabold">{Number(value||0).toLocaleString('id-ID')}</p></div> }
