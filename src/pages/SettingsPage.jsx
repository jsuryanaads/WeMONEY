import { useEffect, useState } from 'react'
import { AlertTriangle, BookOpen, ChevronDown, Database, Download, LogOut, Trash2, User, UserX } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { signOut } from '../services/authService'
import { deleteMyAccount, exportTransactionsCsv, getDataStats, resetFinancialData } from '../services/dataService'

const card = 'overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-200'
const input = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
const button = 'rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0'

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

  return <AppShell title="Pengaturan">
    <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-lg shadow-blue-600/15 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">Account Center</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Pengaturan WeMoney</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Kelola akun dan data keuangan melalui menu yang ringkas. Buka hanya bagian yang sedang kamu perlukan.</p>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}

      {stats && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Transaksi" value={stats.transactions}/><Metric label="Transfer" value={stats.transfers}/><Metric label="Kategori" value={stats.categories}/><Metric label="Dompet" value={stats.wallets}/></div>}

      <div className={card}>
        <SectionHeader icon={User} title="Profil" description="Nama dan informasi akun" />
        <details className="group border-t border-slate-100" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:px-5"><span>Edit profil</span><ChevronDown size={18} className="transition-transform group-open:rotate-180"/></summary>
          <form onSubmit={save} className="border-t border-slate-100 p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Nama lengkap<input className={input} value={name} onChange={e=>setName(e.target.value)} /></label>
              <label className="block text-sm font-semibold">Email<input disabled className={`${input} bg-slate-50`} value={user?.email||''} /></label>
            </div>
            <button className={`${button} mt-4 w-full sm:w-auto`}>Simpan Profil</button>
            {saved && <p className="mt-3 text-sm font-semibold text-emerald-600">Profil tersimpan.</p>}
          </form>
        </details>
      </div>

      <div className={card}>
        <SectionHeader icon={Download} title="Export" description="Backup data transaksi ke file CSV" />
        <details className="group border-t border-slate-100">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:px-5"><span>Export data transaksi</span><ChevronDown size={18} className="transition-transform group-open:rotate-180"/></summary>
          <div className="border-t border-slate-100 p-4 sm:p-5"><p className="text-sm leading-6 text-slate-500">Unduh seluruh transaksi dalam format CSV untuk arsip atau pengolahan lebih lanjut.</p><button disabled={busy} onClick={exportData} className={`${button} mt-4 w-full sm:w-auto`}><Download size={17} className="mr-1 inline"/>Export CSV</button></div>
        </details>
      </div>

      <div className={card}>
        <SectionHeader icon={Database} title="Reset Data" description="Kosongkan transaksi tanpa menghapus akun" />
        <details className="group border-t border-slate-100">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:px-5"><span>Reset data keuangan</span><ChevronDown size={18} className="transition-transform group-open:rotate-180"/></summary>
          <div className="border-t border-slate-100 bg-rose-50/40 p-4 sm:p-5"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-rose-600" size={19}/><div><h3 className="font-bold text-rose-700">Reset transaksi & transfer</h3><p className="mt-1 text-sm leading-6 text-rose-700/80">Transaksi dan transfer akan dihapus, saldo awal dompet dikosongkan, sementara dompet dan kategori tetap dipertahankan.</p></div></div><label className="mt-4 block text-xs font-bold text-rose-700">Ketik RESET<input className={`${input} border-rose-200`} value={resetText} onChange={e=>setResetText(e.target.value.toUpperCase())} placeholder="RESET" /></label><button disabled={busy || resetText!=='RESET'} onClick={resetData} className="mt-3 w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50 sm:w-auto"><Trash2 size={17} className="mr-1 inline"/>Reset Data</button></div>
        </details>
      </div>

      <div className={card}>
        <SectionHeader icon={UserX} title="Hapus Data" description="Penghapusan akun dan seluruh data secara permanen" danger />
        <details className="group border-t border-red-100">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-bold text-red-700 transition hover:bg-red-50"><span>Hapus akun permanen</span><ChevronDown size={18} className="transition-transform group-open:rotate-180"/></summary>
          <div className="border-t border-red-100 bg-red-50 p-4 sm:p-5"><p className="text-sm leading-6 text-red-700/85">Akun Auth, profil, dompet, kategori, transaksi, dan transfer akan dihapus. Tidak ada pemulihan setelah proses berhasil.</p><label className="mt-4 block text-xs font-bold text-red-700">Ketik HAPUS AKUN<input className={`${input} border-red-200`} value={deleteText} onChange={e=>setDeleteText(e.target.value.toUpperCase())} placeholder="HAPUS AKUN" /></label><button disabled={busy || deleteText!=='HAPUS AKUN'} onClick={deleteAccount} className="mt-3 w-full rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-800 disabled:opacity-50 sm:w-auto"><UserX size={17} className="mr-1 inline"/>Hapus Akun Permanen</button></div>
        </details>
      </div>

      <div className={card}>
        <SectionHeader icon={BookOpen} title="Bantuan" description="Panduan penggunaan WeMoney" />
        <details className="group border-t border-slate-100">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:px-5"><span>Buka pusat bantuan</span><ChevronDown size={18} className="transition-transform group-open:rotate-180"/></summary>
          <div className="border-t border-slate-100 p-4 sm:p-5"><p className="text-sm leading-6 text-slate-500">Pelajari pencatatan transaksi, transfer antar dompet, saldo, laporan, dan keamanan data.</p><a href={`${import.meta.env.BASE_URL}panduan`} className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-blue-600 transition hover:-translate-y-0.5 hover:bg-blue-50 sm:w-auto"><BookOpen size={17} className="mr-1"/>Buka Panduan</a></div>
        </details>
      </div>

      <div className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200"><button onClick={() => signOut()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-5 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50"><LogOut size={17}/>Keluar dari akun</button><p className="mt-4 text-xs text-slate-400">WeMoney V1 | © {new Date().getFullYear()} Created Jsuryana</p></div>
    </div>
  </AppShell>
}

function SectionHeader({icon:Icon,title,description,danger=false}) { return <div className="flex items-center gap-3 p-4 sm:p-5"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${danger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}><Icon size={20}/></div><div className="min-w-0"><h2 className="font-extrabold text-slate-900">{title}</h2><p className="mt-0.5 text-xs text-slate-400 sm:text-sm">{description}</p></div></div> }
function Metric({label,value}) { return <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 sm:p-5"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-xl font-extrabold text-slate-900">{Number(value||0).toLocaleString('id-ID')}</p></div> }
