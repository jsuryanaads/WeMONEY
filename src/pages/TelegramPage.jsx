import { useEffect, useState } from 'react'
import { Bot, CheckCircle2, Copy, Link2, Unlink, AlertTriangle, KeyRound, RefreshCw, ShieldCheck, Sparkles, Radio, WalletCards, Activity, LockKeyhole } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { createTelegramLinkCode, getTelegramConnection, unlinkTelegram, hasTelegramBotToken, setTelegramBotToken } from '../services/telegramService'

const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-webhook`
const AI_MODEL = 'openrouter/free'
const AI_THRESHOLD = '70%'

const card = 'rounded-2xl border border-[var(--wm-border)] bg-[var(--wm-surface)] shadow-lg shadow-black/5'
const button = 'rounded-xl bg-[var(--wm-primary)] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButton = 'rounded-xl border border-[var(--wm-border)] bg-[var(--wm-surface2)] px-4 py-3 text-sm font-bold text-[var(--wm-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'

function StatusPill({ ok, children }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />{children}
  </span>
}

function InfoRow({ label, value, ok }) {
  return <div className="flex items-center justify-between gap-4 border-b border-[var(--wm-border)] py-3 last:border-b-0">
    <span className="text-xs font-semibold text-[var(--wm-muted)]">{label}</span>
    <span className="text-right text-xs font-extrabold text-[var(--wm-text)]">{ok === undefined ? value : <StatusPill ok={ok}>{value}</StatusPill>}</span>
  </div>
}

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
      // Opening the page is read-only. Webhook registration is only changed by an explicit check/save action.
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

  async function disconnect() {
    if (!window.confirm('Putuskan koneksi Telegram dari akun We MONEY?')) return
    setBusy(true); setError('')
    try { await unlinkTelegram(); setConnection(null); setCode(null) } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function copyCode() { if (!code?.code) return; await navigator.clipboard?.writeText(code.code) }

  const botReady = Boolean(botInfo?.bot && botInfo?.webhook_info?.url === webhookUrl)
  const telegramConnected = Boolean(connection)

  return <AppShell title="Telegram">
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--wm-border)] bg-[var(--wm-surface)] p-5 shadow-xl sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[var(--wm-primary)]/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--wm-primary)]/10 text-[var(--wm-accent)] ring-1 ring-[var(--wm-primary)]/20"><Bot size={28}/></div>
            <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-black tracking-tight text-[var(--wm-text)]">Telegram Control Center</h2><StatusPill ok={botReady}>{botReady ? 'ONLINE' : configured ? 'READY' : 'SETUP'}</StatusPill></div><p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--wm-muted)]">Kelola koneksi Bot Telegram, status AI Assistant, dan keamanan integrasi We MONEY dari satu tempat.</p></div>
          </div>
          <button disabled={checking || !configured} onClick={checkBot} className={secondaryButton}><RefreshCw size={16} className={`mr-1 inline ${checking ? 'animate-spin' : ''}`}/>{checking ? 'Memeriksa...' : 'Periksa Status'}</button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-300"><AlertTriangle size={17} className="mr-1 inline"/>{error}</div>}

      <div className="grid gap-5 lg:grid-cols-3">
        <section className={`${card} p-5`}>
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/10 text-sky-400"><Radio size={20}/></div><div><h3 className="font-extrabold text-[var(--wm-text)]">Bot Status</h3><p className="text-xs text-[var(--wm-muted)]">Koneksi Telegram</p></div></div>
          <div className="mt-4"><InfoRow label="Bot Token" value={configured ? 'Tersimpan aman' : 'Belum dikonfigurasi'} ok={configured}/><InfoRow label="Bot" value={botInfo?.bot ? `@${botInfo.bot}` : 'Belum diperiksa'}/><InfoRow label="Webhook" value={botReady ? 'Aktif & sesuai' : configured ? 'Belum diverifikasi' : '—'} ok={botReady}/><InfoRow label="Handler" value={botInfo?.handler_version ? `v${botInfo.handler_version}` : '—'}/></div>
        </section>

        <section className={`${card} p-5`}>
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-400"><Sparkles size={20}/></div><div><h3 className="font-extrabold text-[var(--wm-text)]">AI Assistant</h3><p className="text-xs text-[var(--wm-muted)]">Klasifikasi transaksi</p></div></div>
          <div className="mt-4"><InfoRow label="Engine" value="Hybrid AI"/><InfoRow label="Local AI" value="Prioritas" ok={true}/><InfoRow label="OpenRouter" value="Server-side fallback" ok={true}/><InfoRow label="Model" value={AI_MODEL}/><InfoRow label="Fallback threshold" value={AI_THRESHOLD}/></div>
          <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-xs leading-5 text-[var(--wm-muted)]"><ShieldCheck size={15} className="mr-1 inline text-violet-400"/>API key AI tidak ditampilkan atau dikirim dari browser.</div>
        </section>

        <section className={`${card} p-5`}>
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400"><WalletCards size={20}/></div><div><h3 className="font-extrabold text-[var(--wm-text)]">Akun We MONEY</h3><p className="text-xs text-[var(--wm-muted)]">Status koneksi akun</p></div></div>
          <div className="mt-4"><InfoRow label="Status" value={telegramConnected ? 'Terhubung' : 'Belum terhubung'} ok={telegramConnected}/><InfoRow label="Telegram" value={connection?.telegram_username ? `@${connection.telegram_username}` : '—'}/><InfoRow label="Terhubung sejak" value={connection?.linked_at ? new Date(connection.linked_at).toLocaleDateString('id-ID') : '—'}/><InfoRow label="Aktivitas terakhir" value={connection?.last_seen_at ? new Date(connection.last_seen_at).toLocaleString('id-ID') : '—'}/></div>
          {connection && <button disabled={busy} onClick={disconnect} className="mt-4 w-full rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm font-bold text-rose-300 hover:bg-rose-500/10"><Unlink size={16} className="mr-1 inline"/>Putuskan Telegram</button>}
        </section>
      </div>

      <section className={`${card} p-5 sm:p-6`}>
        <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--wm-primary)]/10 text-[var(--wm-accent)]"><KeyRound size={21}/></div><div><h3 className="font-extrabold text-[var(--wm-text)]">Konfigurasi Bot</h3><p className="mt-1 text-sm text-[var(--wm-muted)]">Token Bot disimpan melalui backend. Tidak pernah dimasukkan ke database transaksi atau dikirim sebagai data UI.</p></div></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><label className="text-sm font-bold text-[var(--wm-text)]">Bot Token Telegram</label><div className="mt-2 flex gap-2"><input value={token} onChange={e => setToken(e.target.value)} type={showToken ? 'text' : 'password'} autoComplete="new-password" placeholder="123456789:AA..." className="min-w-0 flex-1 rounded-xl border border-[var(--wm-border)] bg-[var(--wm-surface2)] px-3 py-3 text-sm text-[var(--wm-text)] outline-none placeholder:text-[var(--wm-muted)] focus:border-[var(--wm-primary)]"/><button type="button" onClick={() => setShowToken(v => !v)} className={secondaryButton}>{showToken ? 'Sembunyikan' : 'Tampilkan'}</button></div></div>
          <button disabled={busy || !token.trim()} onClick={saveToken} className={button}><KeyRound size={16} className="mr-1 inline"/>{busy ? 'Menyimpan...' : 'Simpan & Aktifkan'}</button>
        </div>
      </section>

      {!connection && <section className={`${card} p-5 sm:p-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><Activity size={18} className="text-[var(--wm-accent)]"/><h3 className="font-extrabold text-[var(--wm-text)]">Hubungkan akun Telegram</h3></div><p className="mt-2 text-sm leading-6 text-[var(--wm-muted)]">Buat kode satu kali, lalu kirim ke Bot dengan format <code className="rounded bg-[var(--wm-surface2)] px-1.5 py-0.5 font-bold text-[var(--wm-text)]">/hubungkan KODE</code>. Kode berlaku 15 menit.</p></div><button disabled={busy || !configured} onClick={generate} className={`${button} shrink-0`}><Link2 size={17} className="mr-1 inline"/>{busy ? 'Membuat...' : configured ? 'Buat Kode Koneksi' : 'Konfigurasi Bot Dulu'}</button></div>
        {code?.code && <div className="mt-4 rounded-2xl border border-[var(--wm-primary)]/30 bg-[var(--wm-primary)]/5 p-4"><p className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--wm-accent)]">Kode koneksi</p><div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 break-all text-2xl font-black tracking-[0.18em] text-[var(--wm-text)]">{code.code}</code><button onClick={copyCode} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--wm-surface)] text-[var(--wm-accent)] shadow-sm" aria-label="Salin kode"><Copy size={18}/></button></div><p className="mt-2 text-xs text-[var(--wm-muted)]">Kode hanya dapat digunakan sekali dan kedaluwarsa setelah 15 menit.</p></div>}
      </section>}

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"><div className="flex items-center gap-3"><ShieldCheck size={20} className="text-emerald-400"/><h3 className="font-extrabold text-[var(--wm-text)]">Alur Aman</h3></div><p className="mt-2 text-sm leading-6 text-[var(--wm-muted)]">Pesan diproses oleh klasifikasi lokal terlebih dahulu. OpenRouter hanya menjadi fallback saat confidence rendah. Transaksi tetap membutuhkan konfirmasi sebelum disimpan.</p></div>
        <div className="rounded-2xl border border-[var(--wm-border)] bg-[var(--wm-surface)] p-5"><div className="flex items-center gap-3"><LockKeyhole size={20} className="text-[var(--wm-accent)]"/><h3 className="font-extrabold text-[var(--wm-text)]">Contoh Perintah</h3></div><p className="mt-2 text-sm leading-6 text-[var(--wm-muted)]"><code>beli makan 25rb</code> · <code>pengeluaran bensin 50000</code> · <code>pemasukan gaji 5jt</code></p></div>
      </section>

      {botInfo?.webhook_info?.last_error_message && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300"><AlertTriangle size={17} className="mr-1 inline"/><b>Telegram error terakhir:</b> {botInfo.webhook_info.last_error_message}</div>}
    </div>
  </AppShell>
}
