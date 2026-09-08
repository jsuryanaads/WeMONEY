import { useEffect, useState } from 'react'
import { Camera, Check, X } from 'lucide-react'
import ReceiptOcr from './ReceiptOcr'
import { useAuth } from '../../hooks/useAuth'
import { getCategories } from '../../services/categoryService'
import { createVerifiedReceipt, deleteReceipt } from '../../services/receiptService'
import { createTransaction } from '../../services/transactionService'
import { getWalletBalances } from '../../services/walletService'

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))

export default function QuickPhotoExpense({ open, onClose }) {
  const { user } = useAuth()
  const [wallets, setWallets] = useState([])
  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !user?.id) return
    setSaved(false)
    setError('')
    Promise.all([getWalletBalances(user.id), getCategories(user.id)])
      .then(([walletData, categoryData]) => {
        setWallets(walletData || [])
        setCategories((categoryData || []).filter(category => category.type === 'expense'))
      })
      .catch(err => setError(err.message || 'Gagal memuat dompet dan kategori.'))
  }, [open, user?.id])

  async function handleVerified(result) {
    setError('')
    setSaving(true)
    let receiptId = null
    try {
      if (!user?.id) throw new Error('Sesi pengguna tidak ditemukan. Silakan login kembali.')
      const wallet = wallets.find(item => item.name?.trim().toLowerCase() === 'kas utama') || wallets[0]
      const category = categories.find(item => item.name?.trim().toLowerCase() === 'belanja') || categories[0]
      if (!wallet) throw new Error('Belum ada dompet aktif. Buat dompet terlebih dahulu.')
      if (!category) throw new Error('Belum ada kategori pengeluaran.')
      if (!Number(result.total) || Number(result.total) <= 0) throw new Error('Total struk harus lebih besar dari 0.')

      const receipt = await createVerifiedReceipt(user.id, {
        receipt_date: result.receipt_date,
        merchant: result.merchant,
        subtotal: result.subtotal,
        discount: result.discount,
        tax: result.tax,
        total: result.total,
        ocr_raw_data: { confidence: result.confidence, raw_text: result.rawText },
      })
      receiptId = receipt.id

      try {
        await createTransaction(user.id, {
          wallet_id: wallet.id,
          category_id: category.id,
          type: 'expense',
          amount: Number(result.total),
          transaction_date: result.receipt_date || new Date().toISOString().slice(0, 10),
          description: result.merchant || 'Pengeluaran dari struk',
          notes: null,
          receipt_id: receiptId,
          source: 'receipt',
        })
      } catch (transactionError) {
        await deleteReceipt(receiptId, user.id)
        throw transactionError
      }

      setSaved(true)
      window.dispatchEvent(new Event('wemoney:data-changed'))
      setTimeout(() => onClose(), 800)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pengeluaran dari foto struk.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null
  const wallet = wallets.find(item => item.name?.trim().toLowerCase() === 'kas utama') || wallets[0]
  const category = categories.find(item => item.name?.trim().toLowerCase() === 'belanja') || categories[0]

  return <div className="fixed inset-0 z-[75] grid items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="quick-photo-title">
    <div className="wm-quick-card max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[28px] p-4 shadow-2xl sm:rounded-[28px] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500 text-white shadow-md"><Camera size={21}/></div><div><div className="text-[10px] font-extrabold uppercase tracking-wider opacity-50">Fitur Unggulan</div><h2 id="quick-photo-title" className="text-lg font-extrabold">Photo Catat</h2><p className="text-xs opacity-60">Foto struk → verifikasi → otomatis jadi pengeluaran.</p></div></div>
        <button type="button" onClick={onClose} disabled={saving} className="rounded-xl p-2 opacity-60 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/5" aria-label="Tutup Photo Catat"><X size={19}/></button>
      </div>
      {error && <div role="alert" className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}
      {saved ? <div className="grid place-items-center py-12 text-center"><div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"><Check size={28}/></div><p className="mt-4 font-extrabold">Pengeluaran tersimpan</p><p className="mt-1 text-sm opacity-60">{money(wallet?.balance ? Number(wallet.balance) : 0)} · {wallet?.name || 'Kas Utama'} · {category?.name || 'Belanja'}</p></div> : <>
        <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">Otomatis: <b>Pengeluaran</b> · <b>{wallet?.name || 'Kas Utama'}</b> · <b>{category?.name || 'Belanja'}</b></div>
        <ReceiptOcr disabled={saving} autoOpen onVerified={handleVerified} onCancel={onClose} />
        {saving && <div className="mt-2 text-center text-xs font-bold text-blue-600">Menyimpan pengeluaran ke {wallet?.name || 'Kas Utama'}...</div>}
      </>}
    </div>
  </div>
}
