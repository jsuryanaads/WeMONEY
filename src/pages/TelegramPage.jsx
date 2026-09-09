import { useEffect, useState } from 'react'
import { Bot, CheckCircle2, Copy, Link2, Unlink, AlertTriangle, KeyRound, RefreshCw } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { createTelegramLinkCode, getTelegramConnection, unlinkTelegram, hasTelegramBotToken, setTelegramBotToken } from '../services/telegramService'

const button = 'rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-webhook`

export default function TelegramPage() {
  const [connection, setConnection] = useState(null)
  const [code, setCode] = useState(null)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [configured, setConfigured] = useState(false)
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [botInfo, setBotInfo] = useState(null)

  const load = async () => {
    try {
      const [currentConnection, hasToken] = await Promise.all([getTelegramConnection(), hasTelegramBotToken()])
      setConnection(currentConnection)
      setConfigured(hasToken)
      // Always verify and repair the webhook when the Telegram integration is opened.
      // The backend performs an idempotent delete/set registration against Telegram.
      if (hasToken) {
        try { await checkBot() } catch (_) { /* manual check can retry below */ }
      }
    } catch (e) { setError(e.message) }
  }

  useEffect(() => { load() }, [])

  async function saveToken() {
    const value = token.trim()
    if (!value) return setError('Bot Token wajib diisi.')
    setBusy(true); setError('')
    try {
      await setTelegramBotToken(value)
      setToken('')
      setShowToken(false)
      setConfigured(true)
      await checkBot()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function checkBot() {
    setChecking(true); setError('')
    try {
      const response = await fetch(webhookUrl, { method: 'GET', cache: 'no-store' })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.message || data.error || 'Bot Telegram belum siap.')
      setBotInfo(data)
      setConfigured(true)
      return data
    } catch (e) { setError(e.message); throw e } finally { setChecking(false) }
  }

  async function generate() {
    setBusy(true); setError('')
    try {
      await checkBot()
      setCode(await createTelegramLinkCode())
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function disconnect() { if (!window.confirm('Putuskan koneksi Telegram dari akun We MONEY?')) return; setBusy(true); setError(''); try { await unlinkTelegram(); setConnection(null); setCode(null) } catch (e) { setError(e.message) } finally { setBusy(false) } }
  async function copyCode() { if (!code?.code) return; await navigator.clipboard?.writeText(code.code) }

  return <AppShell title="Telegram">
    <div className="mx-auto max-w-2xl space-y-5">
      <div><h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Bot Telegram</h2><p className="mt-1 text-sm text-slate-500">Kelola Bot Telegram dan catat transaksi tanpa membuka We MONEY.</p></div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-600"><Bot size={24}/></div><div className="min-w-0 flex-1"><h3 className="font-extrabold text-slate-900">Konfigurasi Bot</h3><p className={`mt-1 text-sm font-semibold ${configured ? 'text-emerald-700' : 'text-amber-700'}`}>{configured ? <><CheckCircle2 size={15} className="mr-1 inline"/>Bot Token sudah tersimpan aman</> : 'Bot Token belum dikonfigurasi'}</p></div></div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="text-sm font-bold text-slate-800">Bot Token Telegram</label>
          <p className="mt-1 text-xs leading-5 text-slate-500">Token disimpan terenkripsi di Supabase Vault dan tidak disimpan di browser/database transaksi.</p>
          <div className="mt-3 flex gap-2">
            <input value={token} onChange={e => setToken(e.target.value)} type={showToken ? 'text' : 'password'} autoComplete="new-password" placeholder="123456789:AA..." className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <button type="button" onClick={() => setShowToken(v => !v)} className="rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700">{showToken ? 'Sembunyikan' : 'Tampilkan'}</button>
          </div>
          <button disabled={busy || !token.trim()} onClick={saveToken} className={`${button} mt-3 w-full`}><KeyRound size={17} className="mr-1 inline"/>{busy ? 'Menyimpan...' : 'Simpan & Aktifkan Bot'}</button>
          <button disabled={checking || !configured} onClick={checkBot} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw size={16} className={`mr-1 inline ${checking ? 'animate-spin' : ''}`}/>{checking ? 'Memeriksa...' : 'Periksa Bot & Webhook'}</button>
          {botInfo && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <b>Bot:</b> @{botInfo.bot || '-'}<br/>
            <b>Handler:</b> v{botInfo.handler_version || '-'}<br/>
            <b>Webhook:</b> {botInfo.webhook_info?.url === webhookUrl ? 'aktif & sesuai' : 'perlu diperiksa'}<br/>
            <b>Pending update:</b> {botInfo.webhook_info?.pending_update_count ?? '-'}
            {botInfo.webhook_info?.last_error_message && <><br/><b>Telegram error terakhir:</b> {botInfo.webhook_info.last_error_message}</>}
          </div>}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600"><Link2 size={22}/></div><div className="min-w-0 flex-1"><h3 className="font-extrabold text-slate-900">Status akun We MONEY</h3>{connection ? <p className="mt-1 text-sm text-emerald-700"><CheckCircle2 size={15} className="mr-1 inline"/>Terhubung{connection.telegram_username ? ` sebagai @${connection.telegram_username}` : ''}</p> : <p className="mt-1 text-sm text-slate-500">Belum terhubung ke Telegram</p>}</div>{connection && <button disabled={busy} onClick={disconnect} className="rounded-xl px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50"><Unlink size={17} className="mr-1 inline"/>Putuskan</button>}</div>
      </div>

      {!connection && <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="font-extrabold text-slate-900">Hubungkan akun</h3><p className="mt-2 text-sm leading-6 text-slate-600">Buat kode satu kali. Kirim kode tersebut ke Bot Telegram dengan format <code className="rounded bg-slate-100 px-1.5 py-0.5">/hubungkan KODE</code>. Kode berlaku 15 menit.</p>
        <button disabled={busy || !configured} onClick={generate} className={`${button} mt-4 w-full`}><Link2 size={17} className="mr-1 inline"/>{busy ? 'Membuat kode...' : configured ? 'Buat Kode Koneksi' : 'Konfigurasi Bot Terlebih Dahulu'}</button>
        {code?.code && <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Kode koneksi</p><div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 break-all text-2xl font-black tracking-[0.18em] text-slate-900">{code.code}</code><button onClick={copyCode} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm" aria-label="Salin kode"><Copy size={18}/></button></div><p className="mt-2 text-xs text-blue-700">Setelah berhasil, kode otomatis tidak dapat digunakan lagi.</p></div>}
      </div>}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="font-extrabold text-amber-900"><AlertTriangle size={17} className="mr-1 inline"/>Contoh penggunaan</p><p className="mt-2 text-sm leading-6 text-amber-800"><code>beli makan 25rb</code> · <code>pengeluaran bensin 50000</code> · <code>pemasukan gaji 5jt</code>. Bot akan meminta konfirmasi sebelum transaksi disimpan.</p></div>
    </div>
  </AppShell>
}
