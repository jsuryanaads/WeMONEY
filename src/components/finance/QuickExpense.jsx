import { useEffect, useState } from 'react'
import { Check, X, Zap } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getCategories } from '../../services/categoryService'
import { createTransaction } from '../../services/transactionService'
import { getWalletBalances } from '../../services/walletService'

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))
const today = () => new Date().toISOString().slice(0, 10)

function parseQuickInput(value) {
  const text = value.trim()
  if (!text) return { description: '', amount: 0 }

  // Amount is intentionally taken from the final numeric token so input such as
  // "Beli rokok dan makan 40000" becomes description + Rp40.000.
  const match = text.match(/(?:rp\.?\s*)?([0-9][0-9.,]*)\s*$/i)
  if (!match) return { description: text, amount: 0 }

  const rawAmount = match[1]
  const normalized = rawAmount.replace(/[.,]/g, '')
  const amount = Number(normalized)
  const description = text.slice(0, match.index).replace(/[,\-:]\s*$/, '').trim()
  return { description, amount: Number.isFinite(amount) ? amount : 0 }
}

export default function QuickExpense({ open, onClose }) {
  const { user } = useAuth()
  const [wallets, setWallets] = useState([])
  const [categories, setCategories] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!open || !user?.id) return
    setInput('')
    setError('')
    setSaved(false)
    setLoadingData(true)
    Promise.all([getWalletBalances(user.id), getCategories(user.id)])
      .then(([walletData, categoryData]) => {
        setWallets(walletData || [])
        setCategories((categoryData || []).filter(category => category.type === 'expense'))
      })
      .catch(err => setError(err.message || 'Gagal memuat data pengeluaran.'))
      .finally(() => setLoadingData(false))
  }, [open, user?.id])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!user?.id) throw new Error('Sesi pengguna tidak ditemukan. Silakan login kembali.')
      if (!wallets.length) throw new Error('Belum ada dompet aktif untuk mencatat pengeluaran.')
      if (!categories.length) throw new Error('Belum ada kategori pengeluaran.')

      const parsed = parseQuickInput(input)
      if (!parsed.description) throw new Error('Tulis keterangan pengeluaran terlebih dahulu.')
      if (!parsed.amount || parsed.amount <= 0) throw new Error('Nominal belum ditemukan. Contoh: Beli rokok dan makan 40000')

      const wallet = wallets.find(item => item.name?.trim().toLowerCase() === 'kas utama') || wallets[0]
      const category = categories.find(item => item.name?.trim().toLowerCase() === 'belanja') || categories[0]

      await createTransaction(user.id, {
        wallet_id: wallet.id,
        category_id: category.id,
        type: 'expense',
        amount: parsed.amount,
        transaction_date: today(),
        description: parsed.description,
        notes: null,
        source: 'quick_input'
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

  const preview = parseQuickInput(input)
  const wallet = wallets.find(item => item.name?.trim().toLowerCase() === 'kas utama') || wallets[0]
  const category = categories.find(item => item.name?.trim().toLowerCase() === 'belanja') || categories[0]

  if (!open) return null
  return <div className="fixed inset-0 z-[70] grid items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="quick-expense-title">
    <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-3xl sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Zap size={21} fill="currentColor" /></div><div><h2 id="quick-expense-title" className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Quick Expense</h2><p className="text-xs text-slate-400">Tulis seperti biasa, WeMoney yang mengatur sisanya.</p></div></div>
        <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Tutup Quick Expense"><X size={19}/></button>
      </div>
      {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}
      {saved ? <div className="grid place-items-center py-10 text-center"><div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"><Check size={28}/></div><p className="mt-4 font-extrabold text-slate-900 dark:text-slate-100">Pengeluaran tersimpan</p><p className="mt-1 text-sm text-slate-400">{money(preview.amount)} dari {wallet?.name || 'Kas Utama'}.</p></div> : <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Catat pengeluaran<input autoFocus required className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-lg font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="Contoh: Beli rokok dan makan 40000" value={input} onChange={event => setInput(event.target.value)}/></label>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-2 font-bold text-slate-700 dark:text-slate-200">Otomatis</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-slate-400">Nominal</span><div className="mt-1 font-extrabold text-slate-900 dark:text-white">{preview.amount ? money(preview.amount) : '—'}</div></div>
            <div><span className="text-slate-400">Dompet</span><div className="mt-1 font-extrabold text-slate-900 dark:text-white">{loadingData ? 'Memuat...' : wallet?.name || '—'}</div></div>
            <div className="col-span-2"><span className="text-slate-400">Kategori</span><div className="mt-1 font-extrabold text-slate-900 dark:text-white">{loadingData ? 'Memuat...' : category?.name || '—'}</div></div>
          </div>
        </div>
        <p className="text-xs leading-5 text-slate-400">Format sederhana: <span className="font-bold text-slate-500 dark:text-slate-300">keterangan + nominal</span>. Contoh: “Beli rokok dan makan 40000”. Nominal otomatis dipotong dari teks dan dicatat sebagai pengeluaran hari ini.</p>
        <button disabled={loading || loadingData || !user?.id} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50"><Zap size={17} fill="currentColor" />{loading ? 'Menyimpan...' : 'Simpan Pengeluaran'}</button>
      </form>}
    </div>
  </div>
}
