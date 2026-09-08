import { useEffect, useMemo, useState } from 'react'
import { Check, X, Zap } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getCategories } from '../../services/categoryService'
import { createTransaction } from '../../services/transactionService'
import { getWalletBalances } from '../../services/walletService'

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))
const today = () => new Date().toISOString().slice(0, 10)
const initial = { amount: '', wallet_id: '', category_id: '', description: '' }

export default function QuickExpense({ open, onClose }) {
  const { user } = useAuth()
  const [wallets, setWallets] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!open || !user?.id) return
    setForm(initial)
    setError('')
    setSaved(false)
    setLoadingData(true)
    Promise.all([getWalletBalances(user.id), getCategories(user.id)])
      .then(([walletData, categoryData]) => {
        setWallets(walletData || [])
        setCategories((categoryData || []).filter(category => category.type === 'expense'))
        if (walletData?.length === 1) setForm(current => ({ ...current, wallet_id: walletData[0].id }))
      })
      .catch(err => setError(err.message || 'Gagal memuat dompet dan kategori.'))
      .finally(() => setLoadingData(false))
  }, [open, user?.id])

  const defaultCategory = useMemo(() => categories.find(category => category.name.toLowerCase().includes('lain'))?.id || categories[0]?.id || '', [categories])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const amount = Number(form.amount)
      if (!amount || amount <= 0) throw new Error('Nominal harus lebih besar dari 0.')
      if (!form.wallet_id) throw new Error('Pilih dompet terlebih dahulu.')
      await createTransaction(user.id, {
        wallet_id: form.wallet_id,
        category_id: form.category_id || defaultCategory || null,
        type: 'expense',
        amount,
        transaction_date: today(),
        description: form.description || 'Quick Expense',
        notes: null,
        source: 'quick'
      })
      setSaved(true)
      window.dispatchEvent(new Event('wemoney:data-changed'))
      setTimeout(() => onClose(), 650)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pengeluaran.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  return <div className="fixed inset-0 z-[70] grid items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="quick-expense-title">
    <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-3xl sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Zap size={21} fill="currentColor" /></div><div><h2 id="quick-expense-title" className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Quick Expense</h2><p className="text-xs text-slate-400">Catat pengeluaran tanpa form panjang.</p></div></div>
        <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Tutup Quick Expense"><X size={19}/></button>
      </div>
      {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}
      {saved ? <div className="grid place-items-center py-10 text-center"><div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"><Check size={28}/></div><p className="mt-4 font-extrabold text-slate-900 dark:text-slate-100">Pengeluaran tersimpan</p><p className="mt-1 text-sm text-slate-400">Dashboard akan diperbarui otomatis.</p></div> : <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Nominal<input autoFocus required min="1" step="1" inputMode="numeric" type="number" className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-2xl font-extrabold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="0" value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })}/></label>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Dompet<select required disabled={loadingData} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" value={form.wallet_id} onChange={event => setForm({ ...form, wallet_id: event.target.value })}><option value="">{loadingData ? 'Memuat dompet...' : 'Pilih dompet'}</option>{wallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.name} — {money(wallet.balance)}</option>)}</select></label>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Kategori<select disabled={loadingData} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" value={form.category_id} onChange={event => setForm({ ...form, category_id: event.target.value })}><option value="">{loadingData ? 'Memuat kategori...' : 'Pilih kategori'}</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Catatan <span className="font-normal text-slate-400">(opsional)</span><input maxLength="120" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" placeholder="Contoh: Kopi, parkir, makan..." value={form.description} onChange={event => setForm({ ...form, description: event.target.value })}/></label>
        <button disabled={loading || loadingData || !user?.id} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50"><Zap size={17} fill="currentColor" />{loading ? 'Menyimpan...' : 'Simpan Pengeluaran'}</button>
      </form>}
    </div>
  </div>
}
