import { useEffect, useState } from 'react'
import { AlertTriangle, BookOpen, ChevronRight, Database, Download, LogOut, Trash2, User, UserX } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { signOut } from '../services/authService'
import { deleteMyAccount, exportTransactionsCsv, getDataStats, resetFinancialData } from '../services/dataService'

const input = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
const button = 'rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'

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
  async function resetData() { if (resetText !== 'RESET') return; if (!window.confirm('RESET akan menghapus seluruh transaksi dan transfer serta mengosongkan saldo awal semua dompet. Lanjutkan?')) return; setError(''); setBusy(true); try { await resetFinancialData(); setResetText(''); await loadStats(); window.alert('Data keuangan berhasil di-reset.') } catch (e) { setError(e.message) } finally { setBusy(false) } }
  async function deleteAccount() { if (deleteText !== 'HAPUS AKUN') return; if (!window.confirm('PERMANEN: akun dan seluruh data terkait akan dihapus. Tindakan ini tidak dapat dibatalkan. Lanjutkan?')) return; setError(''); setBusy(true); try { await deleteMyAccount(); await supabase.auth.signOut(); window.location.replace(`${import.meta.env.BASE_URL}login`) } catch (e) { setError(e.message); setBusy(false) } }

  return <AppShell title="Pengaturan">
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
      <div><h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Pengaturan</h2><p className="mt-1 text-sm text-slate-500">Kelola akun dan data WeMoney.</p></div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}
      {stats && <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">{[['Transaksi',stats.transactions],['Transfer',stats.transfers],['Kategori',stats.categories],['Dompet',stats.wallets]].map(([label,value]) => <div key={label} className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-0.5 text-lg font-extrabold text-slate-900">{Number(value||0).toLocaleString('id-ID')}</p></div>)}</div>}

      <SettingItem icon={User} title="Profil" description="Nama dan email akun" defaultOpen>
        <form onSubmit={save} className="space-y-4"><label className="block text-sm font-semibold">Nama lengkap<input className={input} value={name} onChange={e=>setName(e.target.value)} /></label><label className="block text-sm font-semibold">Email<input disabled className={`${input} bg-slate-50`} value={user?.email||''} /></label><button className={`${button} w-full sm:w-auto`}>Simpan Profil</button>{saved && <p className="text-sm font-semibold text-emerald-600">Profil tersimpan.</p>}</form>
      </SettingItem>
      <SettingItem icon={Download} title="Export" description="Backup transaksi ke CSV"><p className="text-sm leading-6 text-slate-500">Unduh data transaksi untuk arsip.</p><button disabled={busy} onClick={exportData} className={`${button} mt-4 w-full sm:w-auto`}><Download size={17} className="mr-1 inline"/>Export CSV</button></SettingItem>
      <SettingItem icon={Database} title="Reset Data" description="Kosongkan transaksi tanpa menghapus akun"><div className="rounded-xl bg-rose-50 p-4"><p className="text-sm leading-6 text-rose-700">Transaksi dan transfer dihapus. Dompet dan kategori tetap.</p><label className="mt-3 block text-xs font-bold text-rose-700">Ketik RESET<input className={`${input} border-rose-200`} value={resetText} onChange={e=>setResetText(e.target.value.toUpperCase())} placeholder="RESET"/></label><button disabled={busy || resetText!=='RESET'} onClick={resetData} className="mt-3 w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50 sm:w-auto"><Trash2 size={17} className="mr-1 inline"/>Reset Data</button></div></SettingItem>
      <SettingItem icon={UserX} title="Hapus Data" description="Hapus akun dan seluruh data permanen" danger><div className="rounded-xl bg-red-50 p-4"><p className="text-sm leading-6 text-red-700">Akun dan seluruh data terkait akan dihapus permanen.</p><label className="mt-3 block text-xs font-bold text-red-700">Ketik HAPUS AKUN<input className={`${input} border-red-200`} value={deleteText} onChange={e=>setDeleteText(e.target.value.toUpperCase())} placeholder="HAPUS AKUN"/></label><button disabled={busy || deleteText!=='HAPUS AKUN'} onClick={deleteAccount} className="mt-3 w-full rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50 sm:w-auto"><UserX size={17} className="mr-1 inline"/>Hapus Akun Permanen</button></div></SettingItem>
      <SettingItem icon={BookOpen} title="Bantuan" description="Panduan singkat penggunaan WeMoney"><a href={`${import.meta.env.BASE_URL}panduan`} className="inline-flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-50 sm:w-auto sm:justify-center"><span className="flex items-center"><BookOpen size={17} className="mr-2"/>Buka Panduan</span><ChevronRight size={17} className="sm:ml-3"/></a></SettingItem>
      <div className="pt-2 text-center"><button onClick={() => signOut()} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50"><LogOut size={17}/>Keluar</button><p className="mt-2 text-xs text-slate-400">WeMoney V1 | © {new Date().getFullYear()} Created Jsuryana</p></div>
    </div>
  </AppShell>
}

function SettingItem({icon:Icon,title,description,children,defaultOpen=false,danger=false}) { return <details className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" open={defaultOpen}><summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 sm:px-5"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${danger ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}><Icon size={19}/></div><div className="min-w-0 flex-1"><h3 className="font-bold text-slate-900">{title}</h3><p className="truncate text-xs text-slate-500">{description}</p></div><ChevronRight size={18} className="shrink-0 text-slate-400 transition-transform group-open:rotate-90"/></summary><div className="border-t border-slate-100 p-4 sm:p-5">{children}</div></details> }
