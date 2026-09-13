import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle2, FileScan, Loader2, RotateCcw, Upload, X } from 'lucide-react'
import { Camera as NativeCamera } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { validateReceiptFile } from '../../services/receiptService'
import { recognizeReceipt } from '../../services/ocrService'

const input = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

export default function ReceiptOcr({ disabled = false, onVerified, onCancel, autoOpen = false, embedded = false }) {
  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const autoOpenedRef = useRef(false)
  const nativeCamera = Capacitor.isNativePlatform()

  useEffect(() => {
    if (!autoOpen || disabled || autoOpenedRef.current || status !== 'idle') return
    autoOpenedRef.current = true
    const timer = window.setTimeout(() => {
      if (nativeCamera) openNativeCamera()
      else inputRef.current?.click()
    }, 120)
    return () => window.clearTimeout(timer)
  }, [autoOpen, disabled, status, nativeCamera])

  async function openNativeCamera() {
    if (disabled || status !== 'idle') return
    setError('')
    setResult(null)
    setStatus('processing')
    setProgress(0)
    setFileName('Foto kamera')
    try {
      const photo = await NativeCamera.takePhoto({ quality: 90, includeMetadata: true })
      const url = photo.webPath || photo.uri
      if (!url) throw new Error('Foto kamera tidak dapat dibaca.')
      const response = await fetch(url)
      if (!response.ok) throw new Error('Gagal membaca hasil foto kamera.')
      const blob = await response.blob()
      const file = new File([blob], `wemoney-camera-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' })
      await handleFile(file)
    } catch (e) {
      if (e?.message?.toLowerCase?.().includes('cancel')) {
        setStatus('idle')
        setFileName('')
        autoOpenedRef.current = false
        return
      }
      setStatus('idle')
      setFileName('')
      setError(e?.message || 'Kamera gagal dibuka atau foto gagal diproses.')
      autoOpenedRef.current = false
    }
  }

  async function handleFile(file) {
    if (!file) return
    setError('')
    setResult(null)
    setStatus('processing')
    setProgress(0)
    setFileName(file.name)
    try {
      validateReceiptFile(file)
      const parsed = await recognizeReceipt(file, setProgress)
      setResult(parsed)
      setStatus('review')
    } catch (e) {
      setStatus('idle')
      setFileName('')
      setError(e.message || 'OCR gagal memproses struk.')
      autoOpenedRef.current = false
    }
  }

  function confirm() {
    if (!result) return
    onVerified?.(result)
    setStatus('idle')
    setResult(null)
    setFileName('')
    setProgress(0)
    autoOpenedRef.current = false
  }

  function reset() {
    setStatus('idle')
    setResult(null)
    setFileName('')
    setProgress(0)
    setError('')
    autoOpenedRef.current = false
    onCancel?.()
  }

  function update(key, value) {
    setResult(current => ({ ...current, [key]: value }))
  }

  const content = <>
    {!embedded && <div className="flex items-start gap-3">
      <div className="wm-photo-icon grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white"><Camera size={21} /></div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 inline-flex rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider wm-feature-badge">Fitur Unggulan</div>
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Photo Catat</h3>
        <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">Foto struk, biarkan We MONEY membaca nominal dan tanggal secara otomatis.</p>
      </div>
    </div>}

    {!embedded && <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-400"><FileScan size={14} /> Smart Receipt / OCR · diproses sementara di browser</div>}

    {status === 'idle' && (nativeCamera ? <button type="button" disabled={disabled} onClick={openNativeCamera} className={`wm-photo-upload ${embedded ? 'mt-1' : 'mt-4'} flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-extrabold disabled:pointer-events-none disabled:opacity-50`}>
      <Camera size={18} /> Buka Kamera
    </button> : <label className={`wm-photo-upload ${embedded ? 'mt-1' : 'mt-4'} flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-extrabold ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      <Upload size={18} /> Ambil / Pilih Foto Struk
      <input ref={inputRef} disabled={disabled} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={e => { handleFile(e.target.files?.[0] || null); e.target.value = '' }} />
    </label>)}

    {status === 'processing' && <div className="mt-4 rounded-2xl bg-white p-4 dark:bg-slate-950"><div className="flex items-center gap-3"><Loader2 className="animate-spin text-blue-600" size={19} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">Membaca {fileName}</p><p className="text-xs text-slate-400">OCR berjalan di browser — file tidak disimpan.</p></div><span className="text-sm font-extrabold text-blue-600">{Math.round(progress)}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} /></div></div>}

    {status === 'review' && result && <div className="mt-4 rounded-2xl bg-white p-4 dark:bg-slate-950"><div className="mb-4 flex items-center justify-between gap-3"><div><p className="font-extrabold text-slate-900 dark:text-slate-100">Verifikasi hasil</p><p className="text-xs text-slate-400">Koreksi bila perlu sebelum data disimpan sebagai pengeluaran.</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Confidence {Math.round(result.confidence || 0)}%</span></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-500">Merchant<input className={input} value={result.merchant || ''} onChange={e => update('merchant', e.target.value)} /></label><label className="text-xs font-bold text-slate-500">Tanggal<input type="date" className={input} value={result.receipt_date || ''} onChange={e => update('receipt_date', e.target.value)} /></label><label className="text-xs font-bold text-slate-500">Subtotal<input type="number" min="0" className={input} value={result.subtotal ?? ''} onChange={e => update('subtotal', e.target.value === '' ? null : Number(e.target.value))} /></label><label className="text-xs font-bold text-slate-500">Diskon<input type="number" min="0" className={input} value={result.discount ?? ''} onChange={e => update('discount', e.target.value === '' ? null : Number(e.target.value))} /></label><label className="text-xs font-bold text-slate-500">Pajak<input type="number" min="0" className={input} value={result.tax ?? ''} onChange={e => update('tax', e.target.value === '' ? null : Number(e.target.value))} /></label><label className="text-xs font-bold text-slate-500">Total<input type="number" min="0" className={input} value={result.total ?? ''} onChange={e => update('total', e.target.value === '' ? null : Number(e.target.value))} /></label></div><div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Teks OCR</p><pre className="max-h-28 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-600 dark:text-slate-300">{result.rawText || 'Tidak ada teks terbaca.'}</pre></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={confirm} disabled={disabled} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><CheckCircle2 size={16} className="mr-1 inline" />Gunakan Hasil</button><button type="button" onClick={reset} disabled={disabled} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"><RotateCcw size={16} className="mr-1 inline" />Scan Ulang</button><button type="button" onClick={reset} disabled={disabled} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"><X size={16} className="mr-1 inline" />Batal</button></div><p className="mt-3 text-[11px] leading-4 text-slate-400">File asli dilepas setelah konfirmasi. Yang diteruskan hanya data hasil ekstraksi.</p></div>}
    {error && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}
  </>

  return embedded ? content : <div className="wm-photo-card rounded-2xl p-4 sm:p-5">{content}</div>
}
