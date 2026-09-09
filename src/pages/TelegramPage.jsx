import { useEffect, useState } from 'react'
import { Bot, CheckCircle2, Copy, Link2, Unlink, AlertTriangle } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { createTelegramLinkCode, getTelegramConnection, unlinkTelegram } from '../services/telegramService'

const button = 'rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'

export default function TelegramPage() {
  const [connection, setConnection] = useState(null)
  const [code, setCode] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const load = async () => { try { setConnection(await getTelegramConnection()) } catch (e) { setError(e.message) } }
  useEffect(() => { load() }, [])
  async function generate() { setBusy(true); setError(''); try { setCode(await createTelegramLinkCode()) } catch (e) { setError(e.message) } finally { setBusy(false) } }
  async function disconnect() { if (!window.confirm('Putuskan koneksi Telegram dari akun We MONEY?')) return; setBusy(true); setError(''); try { await unlinkTelegram(); setConnection(null); setCode(null) } catch (e) { setError(e.message) } finally { setBusy(false) } }
  async function copyCode() { if (!code?.code) return; await navigator.clipboard?.writeText(code.code) }
  return <AppShell title="Telegram">
    <div className="mx-auto max-w-2xl space-y-5">
      <div><h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Bot Telegram</h2><p className="mt-1 text-sm text-slate-500">Catat pemasukan dan pengeluaran dari Telegram tanpa membuka We MONEY.</p></div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-600"><Bot size={24}/></div><div className="min-w-0 flex-1"><h3 className="font-extrabold text-slate-900">Status koneksi</h3>{connection ? <p className="mt-1 text-sm text-emerald-700"><CheckCircle2 size={15} className="mr-1 inline"/>Terhubung{connection.telegram_username ? ` sebagai @${connection.telegram_username}` : ''}</p> : <p className="mt-1 text-sm text-slate-500">Belum terhubung</p>}</div>{connection && <button disabled={busy} onClick={disconnect} className="rounded-xl px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50"><Unlink size={17} className="mr-1 inline"/>Putuskan</button>}</div>
      </div>
      {!connection && <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="font-extrabold text-slate-900">Hubungkan akun</h3><p className="mt-2 text-sm leading-6 text-slate-600">Buat kode satu kali. Kirim kode tersebut ke Bot Telegram dengan format <code className="rounded bg-slate-100 px-1.5 py-0.5">/hubungkan KODE</code>. Kode berlaku 15 menit.</p>
        <button disabled={busy} onClick={generate} className={`${button} mt-4 w-full`}><Link2 size={17} className="mr-1 inline"/>{busy ? 'Membuat kode...' : 'Buat Kode Koneksi'}</button>
        {code?.code && <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Kode koneksi</p><div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 break-all text-2xl font-black tracking-[0.18em] text-slate-900">{code.code}</code><button onClick={copyCode} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm" aria-label="Salin kode"><Copy size={18}/></button></div><p className="mt-2 text-xs text-blue-700">Setelah berhasil, kode otomatis tidak dapat digunakan lagi.</p></div>}
      </div>}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="font-extrabold text-amber-900"><AlertTriangle size={17} className="mr-1 inline"/>Contoh penggunaan</p><p className="mt-2 text-sm leading-6 text-amber-800"><code>beli makan 25rb</code> · <code>pengeluaran bensin 50000</code> · <code>pemasukan gaji 5jt</code>. Bot akan meminta konfirmasi sebelum transaksi disimpan.</p></div>
    </div>
  </AppShell>
}
