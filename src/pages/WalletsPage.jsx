import { useEffect, useState } from 'react'
import { Archive, ArchiveRestore, Edit3, Plus, Trash2, Wallet } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { useAuth } from '../hooks/useAuth'
import { archiveWallet, createWallet, deleteWallet, getWalletBalances, restoreWallet, updateWallet } from '../services/walletService'

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))
const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200'
const input = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
const button = 'rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50'

export default function WalletsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ name: '', type: 'cash', initial_balance: '', icon: 'Wallet', color: 'blue' })
  const [editing, setEditing] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try { setError(''); setRows(await getWalletBalances(user.id, true)) }
    catch (e) { setError(e.message || 'Gagal memuat dompet.') }
  }
  useEffect(() => { if (user?.id) load() }, [user?.id])

  async function save(e) {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      if (editing) await updateWallet(editing.id, user.id, { ...form, is_active: editing.is_active })
      else await createWallet(user.id, form)
      setForm({ name: '', type: 'cash', initial_balance: '', icon: 'Wallet', color: 'blue' }); setEditing(null); await load()
    } catch (e) { setError(e.message || 'Gagal menyimpan dompet.') }
    finally { setBusy(false) }
  }

  async function archive(id) {
    if (!window.confirm('Arsipkan dompet ini? Dompet tidak akan tampil di Dashboard dan tidak bisa dipilih untuk transaksi baru. Riwayat tetap aman.')) return
    try { setError(''); await archiveWallet(id, user.id); await load() } catch (e) { setError(e.message) }
  }
  async function restore(id) {
    try { setError(''); await restoreWallet(id, user.id); await load() } catch (e) { setError(e.message) }
  }
  async function remove(id) {
    if (!window.confirm('Hapus dompet yang tidak memiliki transaksi/transfer? Tindakan ini permanen.')) return
    try { setError(''); await deleteWallet(id, user.id); await load() } catch (e) { setError(e.message) }
  }
  function edit(wallet) {
    if (wallet.name.trim().toLowerCase() === 'kas utama') return
    setEditing(wallet); setForm({ name: wallet.name, type: wallet.type, initial_balance: wallet.initial_balance, icon: wallet.icon || 'Wallet', color: wallet.color || 'blue' }); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const active = rows.filter(w => w.is_active)
  const archived = rows.filter(w => !w.is_active)
  return <AppShell title="Dompet">
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-extrabold text-slate-900">Dompet</h2><p className="text-sm text-slate-500">Kelola dompet aktif dan arsip tanpa menghilangkan riwayat transaksi.</p></div><button onClick={() => { setEditing(null); setForm({ name: '', type: 'cash', initial_balance: '', icon: 'Wallet', color: 'blue' }) }} className={button}><Plus size={17} className="mr-1 inline"/>Tambah Dompet</button></div>
    {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
    <form onSubmit={save} className={`${card} mb-6 grid gap-4 md:grid-cols-3`}><div className="md:col-span-3"><h3 className="font-extrabold">{editing ? 'Edit Dompet' : 'Tambah Dompet'}</h3><p className="mt-1 text-xs text-slate-400">Kas Utama adalah dompet default. Nama dan status arsipnya dikunci, tetapi dapat dihapus jika benar-benar tidak memiliki transaksi/transfer.</p></div><label>Nama<input required className={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Contoh: BCA"/></label><label>Jenis<select className={input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="cash">Kas</option><option value="bank">Bank</option><option value="ewallet">E-Wallet</option><option value="credit_card">Kartu Kredit</option><option value="other">Lainnya</option></select></label><label>Saldo awal<input disabled={!!editing} min="0" type="number" className={input} value={form.initial_balance} onChange={e => setForm({ ...form, initial_balance: e.target.value })}/></label><div className="md:col-span-3 flex gap-2"><button disabled={busy} className={button}>{busy ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Dompet'}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', type: 'cash', initial_balance: '', icon: 'Wallet', color: 'blue' }) }} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">Batal</button>}</div></form>
    <section><div className="mb-3 flex items-center justify-between"><h3 className="font-extrabold text-slate-900">Dompet Aktif</h3><span className="text-xs font-semibold text-slate-400">{active.length} dompet</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{active.map(w => <WalletCard key={w.id} wallet={w} onEdit={edit} onArchive={archive} onDelete={remove}/>)}</div>{!active.length && <Empty text="Belum ada dompet aktif."/>}</section>
    <section className="mt-8"><button onClick={() => setShowArchived(!showArchived)} className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-700"><Archive size={17}/> Arsip Dompet <span className="text-xs font-semibold text-slate-400">({archived.length})</span></button>{showArchived && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{archived.map(w => <WalletCard key={w.id} wallet={w} onRestore={restore} onDelete={remove}/>)}</div>}</section>
  </AppShell>
}

function WalletCard({ wallet, onEdit, onArchive, onRestore, onDelete }) {
  const isDefault = wallet.name.trim().toLowerCase() === 'kas utama'
  return <div className={`${card} ${wallet.is_active ? '' : 'opacity-80'}`}><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><Wallet size={21}/></span><div className="flex gap-1">{wallet.is_active && onEdit && !isDefault && <button onClick={() => onEdit(wallet)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600" aria-label="Edit"><Edit3 size={17}/></button>}{wallet.is_active && onArchive && !isDefault && <button onClick={() => onArchive(wallet.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-amber-600" aria-label="Arsipkan"><Archive size={17}/></button>}{!wallet.is_active && onRestore && <button onClick={() => onRestore(wallet.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-emerald-600" aria-label="Pulihkan"><ArchiveRestore size={17}/></button>}{onDelete && <button onClick={() => onDelete(wallet.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600" aria-label="Hapus dompet" title={isDefault ? 'Hapus Kas Utama jika benar-benar kosong' : 'Hapus dompet'}><Trash2 size={17}/></button>}</div></div><p className="mt-4 font-bold text-slate-900">{wallet.name}{isDefault && <span className="ml-2 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600">DEFAULT</span>}</p><p className="text-xs text-slate-400">{wallet.is_active ? wallet.type : 'Diarsipkan'}</p><p className="mt-2 text-2xl font-extrabold text-slate-900">{money(wallet.balance)}</p></div>
}

function Empty({ text }) { return <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">{text}</div> }
