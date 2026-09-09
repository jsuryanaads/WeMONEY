import { useEffect, useMemo, useState } from 'react'
import { Check, Trash2, X, Zap } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getCategories } from '../../services/categoryService'
import { createTransaction } from '../../services/transactionService'
import { getWalletBalances } from '../../services/walletService'
import { money, parseQuickItems } from '../../services/quickCaptureService'

const today = () => new Date().toISOString().slice(0, 10)

export default function QuickExpense({ open, onClose }) {
  const { user } = useAuth()
  const [wallets, setWallets] = useState([])
  const [categories, setCategories] = useState([])
  const [input, setInput] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!open || !user?.id) return
    setInput('')
    setItems([])
    setError('')
    setSaved(false)
    setLoadingData(true)
    Promise.all([getWalletBalances(user.id), getCategories(user.id)])
      .then(([walletData, categoryData]) => {
        setWallets(walletData || [])
        setCategories(categoryData || [])
      })
      .catch(err => setError(err.message || 'Gagal memuat data transaksi.'))
      .finally(() => setLoadingData(false))
  }, [open, user?.id])

  const parsedItems = useMemo(() => parseQuickItems(input, categories, wallets), [input, categories, wallets])

  function analyze() {
    setError('')
    if (!input.trim()) return setError('Tulis transaksi terlebih dahulu.')
    if (!parsedItems.length) return setError('Transaksi belum dapat dibaca.')
    const incomplete = parsedItems.find(item => !item.amount)
    if (incomplete) return setError(`Nominal belum ditemukan untuk “${incomplete.description}”. Contoh: bayar parkir 2000`)
    setItems(parsedItems)
  }

  function updateItem(id, field, value) {
    setItems(current => current.map(item => item.id === id ? { ...item, [field]: field === 'amount' ? Number(value) : value } : item))
  }

  function changeType(id, type) {
    const fallback = categories.find(category => category.type === type)
    setItems(current => current.map(item => item.id === id ? { ...item, type, categoryId: fallback?.id || '' } : item))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!user?.id) throw new Error('Sesi pengguna tidak ditemukan. Silakan login kembali.')
      if (!wallets.length) throw new Error('Belum ada dompet aktif.')
      if (!items.length) throw new Error('Belum ada transaksi untuk disimpan.')
      if (items.some(item => !item.description || !item.amount || item.amount <= 0 || !item.walletId || !item.categoryId)) throw new Error('Lengkapi keterangan, nominal, dompet, dan kategori setiap transaksi.')
      for (const item of items) {
        await createTransaction(user.id, { wallet_id: item.walletId, category_id: item.categoryId, type: item.type, amount: item.amount, transaction_date: today(), description: item.description, notes: null, source: 'quick_input' })
      }
      setSaved(true)
      window.dispatchEvent(new Event('wemoney:data-changed'))
      setTimeout(onClose, 800)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan transaksi.')
    } finally {
      setLoading(false)
    }
  }

  const totalIncome = items.filter(item => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalExpense = items.filter(item => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0)
  if (!open) return null

  return <div className="wm-quick-overlay fixed inset-0 z-[70] grid items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="quick-expense-title">
    <div className="wm-quick-card max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] p-5 shadow-2xl sm:rounded-[28px] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="wm-feature-icon grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white"><Zap size={22} fill="currentColor" /></div><div><div className="mb-1 inline-flex rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider wm-feature-badge">Fitur Unggulan</div><h2 id="quick-expense-title" className="text-xl font-extrabold">Catat Cepat</h2><p className="mt-0.5 text-xs leading-5 opacity-65">Pemasukan, pengeluaran, atau beberapa transaksi sekaligus.</p></div></div><button type="button" onClick={onClose} className="rounded-xl p-2 opacity-55 hover:bg-black/5 dark:hover:bg-white/5" aria-label="Tutup Catat Cepat"><X size={19}/></button></div>
      {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}
      {saved ? <div className="grid place-items-center py-10 text-center"><div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"><Check size={28}/></div><p className="mt-4 font-extrabold">{items.length} transaksi tersimpan</p><p className="mt-1 text-sm opacity-60">Pemasukan {money(totalIncome)} · Pengeluaran {money(totalExpense)}</p></div> : <form onSubmit={submit} className="space-y-4">
        {items.length === 0 ? <>
          <label className="block text-sm font-bold">Tulis transaksi seperti biasa<input autoFocus required className="wm-quick-input mt-2 w-full rounded-2xl px-4 py-4 text-base font-bold outline-none" placeholder="Beli rokok 27000, bayar parkir 2000" value={input} onChange={event => setInput(event.target.value)}/></label>
          <div className="wm-quick-preview rounded-2xl p-4 text-xs leading-5"><p className="font-extrabold">Cara penggunaan</p><p className="mt-2 opacity-70">• Satu transaksi: Beli makan 25000</p><p className="opacity-70">• Banyak transaksi: Beli rokok 27000, bayar parkir 2000</p><p className="opacity-70">• Pemasukan: Gaji 5 juta, bonus 500 ribu</p><p className="mt-2 opacity-55">Pisahkan transaksi dengan koma, baris baru, titik koma, atau “lalu/terus”. Gunakan “ribu/ rb”, “juta/jt”, atau angka biasa.</p></div>
          <button type="button" onClick={analyze} disabled={loadingData || !user?.id} className="wm-primary flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-extrabold shadow-lg"><Zap size={17} fill="currentColor" />{loadingData ? 'Memuat...' : 'Periksa Transaksi'}</button>
        </> : <>
          <div className="wm-quick-preview rounded-2xl p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-extrabold uppercase tracking-wider opacity-55">Periksa sebelum simpan</span><button type="button" onClick={() => setItems([])} className="text-xs font-bold text-blue-600">Ubah input</button></div><div className="space-y-3">{items.map((item, index) => <div key={item.id} className="rounded-2xl border border-slate-200/70 p-3 dark:border-white/10"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-extrabold opacity-50">Transaksi {index + 1}</span><button type="button" onClick={() => setItems(items.filter(row => row.id !== item.id))} className="rounded-lg p-1.5 text-rose-500" aria-label={`Hapus transaksi ${index + 1}`}><Trash2 size={15}/></button></div><div className="grid gap-2"><input className="wm-quick-input rounded-xl px-3 py-2.5 text-sm font-bold outline-none" value={item.description} onChange={event => updateItem(item.id, 'description', event.target.value)} aria-label="Keterangan"/><div className="grid grid-cols-2 gap-2"><select className="wm-quick-input rounded-xl px-3 py-2.5 text-xs font-bold outline-none" value={item.type} onChange={event => changeType(item.id, event.target.value)}><option value="expense">💸 Pengeluaran</option><option value="income">💰 Pemasukan</option></select><input type="number" min="1" inputMode="numeric" className="wm-quick-input rounded-xl px-3 py-2.5 text-sm font-extrabold outline-none" value={item.amount || ''} onChange={event => updateItem(item.id, 'amount', event.target.value)} aria-label="Nominal"/></div><div className="grid grid-cols-2 gap-2"><select className="wm-quick-input rounded-xl px-3 py-2.5 text-xs font-bold outline-none" value={item.categoryId} onChange={event => updateItem(item.id, 'categoryId', event.target.value)}>{categories.filter(category => category.type === item.type).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select><select className="wm-quick-input rounded-xl px-3 py-2.5 text-xs font-bold outline-none" value={item.walletId} onChange={event => updateItem(item.id, 'walletId', event.target.value)}>{wallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select></div></div></div>)}</div></div>
          <div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-300">Pemasukan<div className="mt-1 font-extrabold">{money(totalIncome)}</div></div><div className="rounded-xl bg-rose-50 p-3 text-rose-700 dark:bg-rose-950/25 dark:text-rose-300">Pengeluaran<div className="mt-1 font-extrabold">{money(totalExpense)}</div></div></div>
          <button disabled={loading} className="wm-primary flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-extrabold shadow-lg"><Check size={17}/>{loading ? 'Menyimpan...' : 'Simpan Semua Transaksi'}</button><p className="text-center text-[11px] leading-5 opacity-50">Periksa jenis, nominal, kategori, dan dompet sebelum menyimpan.</p>
        </>}
      </form>}
    </div>
  </div>
}
