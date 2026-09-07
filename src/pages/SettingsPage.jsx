import { useEffect, useState } from 'react'
import { AlertTriangle, BookOpen, ChevronRight, Database, Download, LogOut, Trash2, User, UserX, X } from 'lucide-react'
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
  const [modal, setModal] = useState(null)
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
    setSaved(true); setModal(null)
  }

  async function exportData() {
    setError(''); setBusy(true)
    try { await exportTransactionsCsv(user.id) } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function resetData() {
    if (resetText !== 'RESET') return
    setError(''); setBusy(true)
    try { await resetFinancialData(); setResetText(''); setModal(null); await loadStats(); window.alert('Data keuangan berhasil di-reset.') }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function deleteAccount() {
    if (deleteText !== 'HAPUS AKUN') return
    setError(''); setBusy(true)
    try { await deleteMyAccount(); await supabase.auth.signOut(); window.location.replace(`${import.meta.env.BASE_URL}login`) }
    catch (e) { setError(e.message); setBusy(false) }
  }

  function closeModal() {
    if (busy) return
    setModal(null); setResetText(''); setDeleteText('')
  }

  return <AppShell title="Pengaturan">
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
      <div><h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Pengaturan</h2><p className="mt-1 text-sm text-slate-500">Kelola akun dan data WeMoney.</p></div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}
      {stats && <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">{[['Transaksi',stats.transactions],['Transfer',stats.transfers],['Kategori',stats.categories],['Dompet',stats.wallets]].map(([label,value]) => <div key={label} className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-0.5 text-lg font-extrabold text-slate-900">{Number(value||0).toLocaleString('id-ID')}</p></div>)}</div>}

      <SettingItem icon={User} title="Profil" description="Nama dan email akun" onClick={() => setModal('profile')} />
      <SettingItem icon={Download} title="Export" description="Backup transaksi ke CSV" onClick={exportData} disabled={busy} />
      <SettingItem icon={Database} title="Reset Data" description="Kosongkan transaksi tanpa menghapus akun" onClick={() => setModal('reset')} />
      <SettingItem icon={UserX} title="Hapus Data" description="Hapus akun dan seluruh data permanen" danger onClick={() => setModal('delete')} />
      <SettingItem icon={BookOpen} title="Bantuan" description="Panduan singkat penggunaan WeMoney" onClick={() => { window.location.href = `${import.meta.env.BASE_URL}panduan` }} />

      <div className="pt-2 text-center"><button onClick={() => signOut()} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50"><LogOut size={17}/>Keluar</button><p className="mt-2 text-xs text-slate-400">WeMoney V1 | © {new Date().getFullYear()} Created Jsuryana</p></div>
    </div>

    {modal === 'profile' && <Modal title="Profil" icon={User} onClose={closeModal}>
      <form onSubmit={save} className="space-y-4"><label className="block text-sm font-semibold">Nama lengkap<input className={input} value={name} onChange={e=>setName(e.target.value)} /></label><label className="block text-sm font-semibold">Email<input disabled className={`${input} bg-slate-50`} value={user?.email||''} /></label><button disabled={busy} className={`${button} w-full`}>Simpan Profil</button>{saved && <p className="text-sm font-semibold text-emerald-600">Profil tersimpan.</p>}</form>
    </Modal>}

    {modal === 'reset' && <Modal title="Reset Data" icon={Database} danger onClose={closeModal}>
      <div className="rounded-xl bg-rose-50 p-4"><p className="text-sm leading-6 text-rose-700">Transaksi dan transfer akan dihapus. Dompet dan kategori tetap.</p><label className="mt-3 block text-xs font-bold text-rose-700">Ketik RESET<input autoFocus className={`${input} border-rose-200`} value={resetText} onChange={e=>setResetText(e.target.value.toUpperCase())} placeholder="RESET" /></label><button disabled={busy || resetText!=='RESET'} onClick={resetData} className="mt-3 w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Trash2 size={17} className="mr-1 inline"/>Reset Data</button></div>
    </Modal>}

    {modal === 'delete' && <Modal title="Hapus Data" icon={UserX} danger onClose={closeModal}>
      <div className="rounded-xl bg-red-50 p-4"><p className="text-sm leading-6 text-red-700">Akun dan seluruh data terkait akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</p><label className="mt-3 block text-xs font-bold text-red-700">Ketik HAPUS AKUN<input autoFocus className={`${input} border-red-200`} value={deleteText} onChange={e=>setDeleteText(e.target.value.toUpperCase())} placeholder="HAPUS AKUN" /></label><button disabled={busy || deleteText!=='HAPUS AKUN'} onClick={deleteAccount} className="mt-3 w-full rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><UserX size={17} className="mr-1 inline"/>Hapus Akun Permanen</button></div>
    </Modal>}
  </AppShell>
}

function SettingItem({ icon: Icon, title, description, onClick, danger = false, disabled = false }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="group flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-px hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${danger ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}><Icon size={19}/></div><div className="min-w-0 flex-1"><h3 className="font-bold text-slate-900">{title}</h3><p className="truncate text-xs text-slate-500">{description}</p></div><ChevronRight size={18} className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"/></button>
}

function Modal({ title, icon: Icon, children, onClose, danger = false }) {
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
    <button type="button" aria-label="Tutup" className="absolute inset-0 cursor-default" onClick={onClose}/>
    <div className="relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6">
      <div className="mb-5 flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-xl ${danger ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}><Icon size={19}/></div><h3 className="flex-1 text-lg font-extrabold text-slate-900">{title}</h3><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Tutup"><X size={19}/></button></div>
      {children}
    </div>
  </div>
}
