import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Edit3, FileText, Plus, Search, Trash2, X } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { useAuth } from '../hooks/useAuth'
import { getWalletBalances, createTransfer } from '../services/walletService'
import { getCategories } from '../services/categoryService'
import { getTransactionsPage, createTransaction, updateTransaction, deleteTransaction } from '../services/transactionService'

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))
const today = () => new Date().toISOString().slice(0, 10)
const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700'
const input = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'
const button = 'rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50'
const blankTransaction = () => ({ type: 'expense', amount: '', wallet_id: '', category_id: '', transaction_date: today(), description: '', notes: '' })
const blankTransfer = () => ({ source_wallet_id: '', destination_wallet_id: '', amount: '', transfer_date: today(), description: '' })

export default function TransactionsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([]); const [wallets, setWallets] = useState([]); const [categories, setCategories] = useState([])
  const [tab, setTab] = useState('transaction'); const [form, setForm] = useState(blankTransaction()); const [transfer, setTransfer] = useState(blankTransfer())
  const [editing, setEditing] = useState(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const [filters, setFilters] = useState({ search: '', type: 'all', walletId: 'all', categoryId: 'all', startDate: '', endDate: '' })
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10); const [total, setTotal] = useState(0); const totalPages = Math.max(1, Math.ceil(total / pageSize))

  async function load() {
    if (!user?.id) return
    try {
      setError('')
      const [result, walletData, categoryData] = await Promise.all([
        getTransactionsPage(user.id, { page, pageSize, ...filters }), getWalletBalances(user.id), getCategories(user.id),
      ])
      setRows(result.data); setTotal(result.count); setWallets(walletData); setCategories(categoryData)
      if (page > result.totalPages) setPage(result.totalPages)
    } catch (e) { setError(e.message || 'Gagal memuat data transaksi.') }
  }
  useEffect(() => { load() }, [user?.id, page, pageSize, filters.search, filters.type, filters.walletId, filters.categoryId, filters.startDate, filters.endDate])
  const filteredCategories = useMemo(() => categories.filter(c => c.type === form.type), [categories, form.type])

  function changeFilter(key, value) { setPage(1); setFilters(current => ({ ...current, [key]: value })) }
  function resetFilters() { setPage(1); setFilters({ search: '', type: 'all', walletId: 'all', categoryId: 'all', startDate: '', endDate: '' }) }

  async function save(e) {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      if (Number(form.amount) <= 0) throw new Error('Nominal harus lebih besar dari 0.')
      if (editing) await updateTransaction(editing.id, user.id, { ...form, receipt_id: editing.receipt_id || null })
      else await createTransaction(user.id, { ...form, receipt_id: null, source: 'manual' })
      setForm(blankTransaction()); setEditing(null); await load()
    } catch (e) { setError(e.message || 'Gagal menyimpan transaksi.') }
    finally { setBusy(false) }
  }
  async function saveTransfer(e) {
    e.preventDefault(); setError(''); setBusy(true)
    try { if (Number(transfer.amount) <= 0) throw new Error('Nominal transfer harus lebih besar dari 0.'); await createTransfer(user.id, transfer); setTransfer(blankTransfer()); await load() }
    catch (e) { setError(e.message || 'Gagal menyimpan transfer.') } finally { setBusy(false) }
  }
  async function remove(id) {
    if (!window.confirm('Hapus transaksi ini? Tindakan ini permanen dan akan memengaruhi saldo dompet.')) return
    try { setError(''); await deleteTransaction(id, user.id); await load() } catch (e) { setError(e.message || 'Gagal menghapus transaksi.') }
  }
  function startEdit(tx) {
    setEditing(tx); setForm({ type: tx.type, amount: String(tx.amount ?? ''), wallet_id: tx.wallet_id ?? '', category_id: tx.category_id ?? '', transaction_date: tx.transaction_date, description: tx.description ?? '', notes: tx.notes ?? '' }); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function cancelEdit() { setEditing(null); setForm(blankTransaction()) }

  return <AppShell title="Transaksi">
    <div className="mb-6 flex gap-2"><button onClick={() => setTab('transaction')} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'transaction' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'}`}>Transaksi</button><button onClick={() => setTab('transfer')} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'transfer' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'}`}>Transfer</button></div>
    {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}
    {tab === 'transaction' ? <>
      <form onSubmit={save} className={`${card} grid gap-4 md:grid-cols-2`}>
        <div className="md:col-span-2 flex items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{editing ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2><p className="text-sm text-slate-400">{editing ? 'Perbaiki data transaksi tanpa membuat catatan baru.' : 'Catat pemasukan atau pengeluaran ke dompet tertentu.'}</p></div>{editing && <button type="button" onClick={cancelEdit} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Batal edit"><X size={19}/></button>}</div>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Jenis<select className={input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value, category_id: '' })}><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select></label>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nominal<input required min="1" step="1" type="number" className={input} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}/></label>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dompet<select required className={input} value={form.wallet_id} onChange={e => setForm({ ...form, wallet_id: e.target.value })}><option value="">Pilih dompet</option>{wallets.map(w => <option key={w.id} value={w.id}>{w.name} — {money(w.balance)}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Kategori<select className={input} value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}><option value="">Tanpa kategori</option>{filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tanggal<input required type="date" className={input} value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })}/></label>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Keterangan<input className={input} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Contoh: Belanja mingguan"/></label>
        <label className="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Catatan<textarea className={input} rows="3" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}/></label>
        <div className="md:col-span-2 flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-950"><FileText size={19} className="mt-0.5 text-blue-500"/><div><b className="block text-slate-700 dark:text-slate-200">Smart Receipt / OCR</b><span className="text-xs leading-5 text-slate-400">Arsitektur baru: file struk hanya diproses sementara, tidak disimpan di Supabase Storage. Hasil OCR yang sudah diverifikasi nantinya disimpan sebagai data transaksi. Engine OCR belum diaktifkan pada versi ini.</span></div></div>
        <div className="md:col-span-2 flex flex-wrap gap-2"><button disabled={busy} className={button}>{busy ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : <><Plus size={17} className="mr-1 inline"/>Simpan Transaksi</>}</button>{editing && <button type="button" onClick={cancelEdit} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">Batal</button>}</div>
      </form>

      <div className={`${card} mt-6`}>
        <div className="flex flex-col gap-3"><div className="flex items-center justify-between"><h2 className="font-extrabold text-slate-900 dark:text-slate-100">Riwayat Transaksi</h2><span className="text-xs font-semibold text-slate-400">{total} hasil</span></div>
          <div className="grid gap-2 md:grid-cols-6"><label className="relative md:col-span-2"><Search size={16} className="absolute left-3 top-4 text-slate-400"/><input className={`${input} pl-9`} value={filters.search} onChange={e => changeFilter('search', e.target.value)} placeholder="Cari keterangan/catatan..."/></label><select className={input} value={filters.type} onChange={e => changeFilter('type', e.target.value)}><option value="all">Semua jenis</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select><select className={input} value={filters.walletId} onChange={e => changeFilter('walletId', e.target.value)}><option value="all">Semua dompet</option>{wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select><select className={input} value={filters.categoryId} onChange={e => changeFilter('categoryId', e.target.value)}><option value="all">Semua kategori</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button type="button" onClick={resetFilters} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
          <div className="grid gap-2 sm:grid-cols-3"><label className="text-xs font-semibold text-slate-500">Dari<input type="date" className={input} value={filters.startDate} onChange={e => changeFilter('startDate', e.target.value)}/></label><label className="text-xs font-semibold text-slate-500">Sampai<input type="date" className={input} value={filters.endDate} onChange={e => changeFilter('endDate', e.target.value)}/></label><label className="text-xs font-semibold text-slate-500">Per halaman<select className={input} value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)) }}><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label></div>
        </div>
        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">{rows.length ? rows.map(tx => <div key={tx.id} className="flex items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{tx.description || 'Tanpa keterangan'}</p><p className="truncate text-xs text-slate-400">{tx.transaction_date} · {tx.wallet?.name || 'Tanpa dompet'} · {tx.category?.name || 'Tanpa kategori'}</p></div><div className="flex shrink-0 items-center gap-1 sm:gap-3"><b className={tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}>{tx.type === 'income' ? '+' : '-'}{money(tx.amount)}</b><button onClick={() => startEdit(tx)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800" aria-label="Edit transaksi" title="Edit transaksi"><Edit3 size={17}/></button><button onClick={() => remove(tx.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800" aria-label="Hapus transaksi" title="Hapus transaksi"><Trash2 size={17}/></button></div></div>) : <div className="py-10 text-center text-sm text-slate-400">Tidak ada transaksi yang cocok.</div>}</div>
        {totalPages > 1 && <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800"><button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40 dark:border-slate-700">Sebelumnya</button><span className="text-xs font-semibold text-slate-400">Halaman {page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40 dark:border-slate-700">Berikutnya</button></div>}
      </div>
    </> : <form onSubmit={saveTransfer} className={`${card} grid gap-4 md:grid-cols-2`}><div className="md:col-span-2"><h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Transfer Antar Dompet</h2><p className="text-sm text-slate-400">Transfer tidak dihitung sebagai pemasukan/pengeluaran.</p></div><label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dompet Asal<select required className={input} value={transfer.source_wallet_id} onChange={e => setTransfer({ ...transfer, source_wallet_id: e.target.value, destination_wallet_id: transfer.destination_wallet_id === e.target.value ? '' : transfer.destination_wallet_id })}><option value="">Pilih</option>{wallets.map(w => <option key={w.id} value={w.id}>{w.name} — {money(w.balance)}</option>)}</select></label><label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dompet Tujuan<select required className={input} value={transfer.destination_wallet_id} onChange={e => setTransfer({ ...transfer, destination_wallet_id: e.target.value })}><option value="">Pilih</option>{wallets.filter(w => w.id !== transfer.source_wallet_id).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label><label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nominal<input required min="1" step="1" type="number" className={input} value={transfer.amount} onChange={e => setTransfer({ ...transfer, amount: e.target.value })}/></label><label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tanggal<input required type="date" className={input} value={transfer.transfer_date} onChange={e => setTransfer({ ...transfer, transfer_date: e.target.value })}/></label><label className="md:col-span-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Keterangan<input className={input} value={transfer.description} onChange={e => setTransfer({ ...transfer, description: e.target.value })}/></label><div className="md:col-span-2"><button disabled={busy} className={button}>{busy ? 'Menyimpan...' : <><ArrowRight size={17} className="mr-1 inline"/>Simpan Transfer</>}</button></div></form>}
  </AppShell>
}