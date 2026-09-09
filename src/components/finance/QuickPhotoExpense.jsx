import { useEffect, useState } from 'react'
import { Camera, Check, X } from 'lucide-react'
import ReceiptOcr from './ReceiptOcr'
import { useAuth } from '../../hooks/useAuth'
import { getCategories } from '../../services/categoryService'
import { createVerifiedReceipt, deleteReceipt } from '../../services/receiptService'
import { createTransaction } from '../../services/transactionService'
import { getWalletBalances } from '../../services/walletService'
import { classifyReceipt } from '../../services/hybridAiService'

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))

export default function QuickPhotoExpense({ open, onClose }) {
  const { user } = useAuth()
  const [wallets, setWallets] = useState([])
  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState(null)

  useEffect(() => {
    if (!open || !user?.id) return
    setSaved(false)
    setError('')
    setDraft(null)
    Promise.all([getWalletBalances(user.id), getCategories(user.id)])
      .then(([walletData, categoryData]) => {
        setWallets(walletData || [])
        setCategories(categoryData || [])
      })
      .catch(err => setError(err.message || 'Gagal memuat dompet dan kategori.'))
  }, [open, user?.id])

  function prepareDraft(result) {
    const classified = classifyReceipt(result, categories, wallets)
    setDraft(classified)
  }

  async function handleVerified() {
    const result = draft
    setError('')
    setSaving(true)
    let receiptId = null
    try {
      if (!user?.id) throw new Error('Sesi pengguna tidak ditemukan. Silakan login kembali.')
      if (!result) throw new Error('Hasil transaksi belum tersedia.')
      const wallet = wallets.find(item => item.id === result.walletId)
      const category = categories.find(item => item.id === result.categoryId)
      if (!wallet) throw new Error('Dompet belum dipilih. Pilih dompet pada hasil verifikasi.')
      if (!category) throw new Error('Kategori belum dipilih. Pilih kategori pada hasil verifikasi.')
      if (result.type !== 'expense') throw new Error('Photo Catat saat ini hanya menyimpan struk sebagai pengeluaran.')
      if (!Number(result.total) || Number(result.total) <= 0) throw new Error('Total struk harus lebih besar dari 0.')

      const receipt = await createVerifiedReceipt(user.id, {
        receipt_date: result.receipt_date,
        merchant: result.merchant,
        subtotal: result.subtotal,
        discount: result.discount,
        tax: result.tax,
        total: result.total,
        ocr_raw_data: { confidence: result.confidence, raw_text: result.rawText, ai_source: result.classificationSource },
      })
      receiptId = receipt.id

      try {
        await createTransaction(user.id, {
          wallet_id: wallet.id,
          category_id: category.id,
          type: 'expense',
          amount: Number(result.total),
          transaction_date: result.receipt_date || new Date().toLocaleDateString('en-CA'),
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
  const wallet = wallets.find(item => item.id === draft?.walletId) || wallets[0]
  const category = categories.find(item => item.id === draft?.categoryId)

  return <div className="fixed inset-0 z-[75] grid items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="quick-photo-title">
    <div className="wm-quick-card max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[28px] p-4 shadow-2xl sm:rounded-[28px] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500 text-white shadow-md"><Camera size={21} /></div><div><div className="text-[10px] font-extrabold uppercase tracking-wider opacity-50">Fitur Unggulan</div><h2 id="quick-photo-title" className="text-lg font-extrabold">Photo Catat</h2><p className="text-xs opacity-60">Foto struk → AI membaca → verifikasi → simpan manual.</p></div></div>
        <button type="button" onClick={onClose} disabled={saving} className="rounded-xl p-2 opacity-60 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/5" aria-label="Tutup Photo Catat"><X size={19} /></button>
      </div>
      {error && <div role="alert" className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}
      {saved ? <div className="grid place-items-center py-12 text-center"><div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"><Check size={28} /></div><p className="mt-4 font-extrabold">Pengeluaran tersimpan</p><p className="mt-1 text-sm opacity-60">{money(wallet?.balance || 0)} · {wallet?.name || 'Kas Utama'} · {category?.name || 'Belanja'}</p></div> : <>
        <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">AI lokal hanya memberi saran. Semua field wajib diperiksa sebelum simpan.</div>
        <ReceiptOcr embedded disabled={saving} autoOpen onVerified={prepareDraft} onCancel={onClose} />
        {draft && <div className="mt-3 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
          <p className="text-xs font-extrabold uppercase tracking-wider opacity-55">Klasifikasi AI</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold opacity-70">Jenis<select className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-950" value={draft.type} onChange={e => setDraft(v => ({ ...v, type: e.target.value, categoryId: '' }))}><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select></label>
            <label className="text-xs font-bold opacity-70">Nominal<input type="number" min="1" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-950" value={draft.total || ''} onChange={e => setDraft(v => ({ ...v, total: Number(e.target.value) }))} /></label>
            <label className="text-xs font-bold opacity-70">Kategori<select className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-950" value={draft.categoryId} onChange={e => setDraft(v => ({ ...v, categoryId: e.target.value }))}><option value="">Pilih kategori</option>{categories.filter(item => item.type === draft.type && item.is_active !== false).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="text-xs font-bold opacity-70">Dompet<select className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-950" value={draft.walletId} onChange={e => setDraft(v => ({ ...v, walletId: e.target.value }))}><option value="">Pilih dompet</option>{wallets.filter(item => item.is_active !== false).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          </div>
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-[11px] leading-5 dark:bg-slate-900"><b>AI:</b> {draft.classificationExplanation}<br/><b>Confidence:</b> {Math.round((draft.classificationConfidence || 0) * 100)}%</div>
          <button type="button" disabled={saving || !draft.categoryId || !draft.walletId || !draft.total} onClick={handleVerified} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50"><Check size={17}/>{saving ? 'Menyimpan...' : 'Konfirmasi & Simpan'}</button>
        </div>}
      </>}
    </div>
  </div>
}
