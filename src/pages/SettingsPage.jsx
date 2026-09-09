import { useEffect, useState } from 'react'
import { AlertTriangle, Bot, ChevronRight, Database, Download, Smartphone, Trash2, User, UserX, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { exportTransactionsCsv, getDataStats, requestAccountDeletion, resetFinancialData } from '../services/dataService'
import { getDeviceId, getMyDevices, revokeDevice, setDeviceName } from '../services/deviceService'

const input = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
const button = 'rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
const statItems = [['Transaksi', 'transactions'], ['Transfer', 'transfers'], ['Kategori', 'categories'], ['Dompet', 'wallets'], ['Anggaran', 'budgets'], ['Struk', 'receipts'], ['Berulang', 'recurring_transactions']]

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [name, setName] = useState(user?.user_metadata?.full_name || '')
  const [stats, setStats] = useState(null)
  const [devices, setDevices] = useState([])
  const [deviceName, setDeviceNameState] = useState('')
  const [deleteRequest, setDeleteRequest] = useState(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [deviceBusy, setDeviceBusy] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [resetText, setResetText] = useState('')
  const [requestText, setRequestText] = useState('')

  const loadStats = async () => {
    try {
      setStats(await getDataStats())
      const { data, error: requestError } = await supabase.from('account_deletion_requests').select('id,status,requested_at,reviewed_at,admin_note').eq('user_id', user.id).maybeSingle()
      if (requestError) throw requestError
      setDeleteRequest(data)
    } catch (e) { setError(e.message) }
  }

  const loadDevices = async () => {
    try {
      const data = await getMyDevices()
      setDevices(data)
      const current = data.find(item => item.device_id === getDeviceId())
      setDeviceNameState(current?.device_name || '')
    } catch (e) { setError(e.message) }
  }

  useEffect(() => {
    if (!user?.id) return
    loadStats()
    loadDevices()
  }, [user?.id])

  async function save(e) {
    e.preventDefault(); setError(''); setSaved(false)
    const { error: authError } = await supabase.auth.updateUser({ data: { full_name: name.trim() } })
    if (authError) return setError(authError.message)
    const { error: profileError } = await supabase.from('profiles').update({ full_name: name.trim(), updated_at: new Date().toISOString() }).eq('user_id', user.id)
    if (profileError) return setError(profileError.message)
    setSaved(true); setModal(null)
  }

  async function exportData() {
    setError(''); setBusy(true)
    try { await exportTransactionsCsv(user.id) } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function resetData() {
    if (resetText !== 'RESET') return
    setError(''); setBusy(true)
    try {
      await resetFinancialData()
      setResetText(''); setModal(null); await loadStats()
      window.alert('Reset selesai. Semua data keuangan dihapus, kecuali kategori dan akun pengguna.')
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function submitDeletionRequest() {
    if (requestText !== 'AJUKAN HAPUS') return
    setError(''); setBusy(true)
    try {
      await requestAccountDeletion()
      setRequestText(''); setModal(null); await loadStats()
      window.alert('Pengajuan penghapusan akun berhasil dikirim ke administrator. Akun tidak dihapus otomatis.')
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function saveCurrentDeviceName(e) {
    e.preventDefault()
    setError(''); setDeviceBusy(true)
    try {
      setDeviceName(deviceName)
      await loadDevices()
      window.alert('Nama perangkat berhasil disimpan.')
    } catch (e) { setError(e.message) } finally { setDeviceBusy(false) }
  }

  async function removeDevice(deviceId, name) {
    if (!window.confirm(`Cabut perangkat "${name || 'Perangkat'}" dari daftar perangkat akun?`)) return
    setError(''); setDeviceBusy(true)
    try {
      await revokeDevice(deviceId)
      await loadDevices()
      window.alert('Perangkat berhasil dicabut dari daftar.')
    } catch (e) { setError(e.message) } finally { setDeviceBusy(false) }
  }

  function closeModal() {
    if (busy || deviceBusy) return
    setModal(null); setResetText(''); setRequestText('')
  }

  const remaining = stats ? statItems.filter(([, key]) => Number(stats[key] || 0) > 0) : []
  const currentDeviceId = getDeviceId()

  return <AppShell title="Pengaturan">
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
      <div><h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Pengaturan</h2><p className="mt-1 text-sm text-slate-500">Kelola akun dan data We MONEY.</p></div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}
      {stats && <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">{statItems.map(([label, key]) => <div key={key} className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-0.5 text-lg font-extrabold text-slate-900">{Number(stats[key] || 0).toLocaleString('id-ID')}</p></div>)}</div>}
      <div className="pt-1"><p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Akun & Integrasi</p><SettingItem icon={Smartphone} title="Perangkat Saya" description={`${devices.length} perangkat terhubung ke akun`} onClick={() => setModal('devices')} /><div className="h-2"/><SettingItem icon={User} title="Profil" description="Nama dan email akun" onClick={() => setModal('profile')} /><div className="h-2"/><SettingItem icon={Bot} title="Telegram" description="Integrasi privat untuk mencatat lewat Bot Telegram" onClick={() => navigate('/telegram')} /></div>
      <div className="pt-1"><p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Data</p><SettingItem icon={Download} title="Export" description="Backup transaksi ke CSV" onClick={exportData} disabled={busy} /><div className="h-2"/><SettingItem icon={Database} title="Reset Data" description="Hapus seluruh data keuangan, kategori dan akun tetap" onClick={() => setModal('reset')} /></div>
      <div className="pt-1"><p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Zona Berbahaya</p><SettingItem icon={UserX} title="Ajukan Hapus Akun" description={deleteRequest?.status === 'pending' ? 'Pengajuan sedang menunggu administrator' : 'Penghapusan harus disetujui administrator'} danger onClick={() => setModal('delete-request')} disabled={busy || deleteRequest?.status === 'pending'} /></div>
      {deleteRequest?.status === 'pending' && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><p className="font-extrabold">Pengajuan penghapusan sedang diproses</p><p className="mt-1 leading-6">Administrator akan memeriksa pengajuan. Akun tidak dihapus otomatis.</p></div>}
      {stats && remaining.length > 0 && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><p className="font-extrabold">Data masih tersimpan</p><p className="mt-1 leading-6">Pengajuan hapus akun belum dapat diproses. Selesaikan data berikut: {remaining.map(([label, key]) => `${label} (${Number(stats[key] || 0).toLocaleString('id-ID')})`).join(', ')}.</p></div>}
      {stats && remaining.length === 0 && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><p className="font-extrabold">Data keuangan kosong</p><p className="mt-1 leading-6">Akun sudah memenuhi pemeriksaan data untuk mengajukan penghapusan kepada administrator.</p></div>}
    </div>

    {modal === 'devices' && <Modal title="Perangkat Saya" icon={Smartphone} onClose={closeModal}>
      <div className="space-y-4">
        <form onSubmit={saveCurrentDeviceName} className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-extrabold text-slate-900">Nama perangkat ini</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Gunakan nama seperti “HP Saya”, “HP Istri”, atau “Laptop Kantor”.</p>
          <input className={input} value={deviceName} onChange={e => setDeviceNameState(e.target.value)} maxLength={80} placeholder="Nama perangkat" />
          <button disabled={deviceBusy || !deviceName.trim()} className={`${button} mt-3 w-full`}>Simpan Nama Perangkat</button>
        </form>
        <div className="space-y-2">
          <p className="text-sm font-extrabold text-slate-900">Perangkat terdaftar</p>
          {devices.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Belum ada perangkat terdaftar.</p>}
          {devices.map(device => <div key={device.device_id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Smartphone size={18} /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="font-bold text-slate-900">{device.device_name || 'Perangkat'}</p>{device.device_id === currentDeviceId && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">PERANGKAT INI</span>}</div><p className="mt-1 text-xs text-slate-500">{device.platform || 'perangkat'} · terakhir aktif {new Date(device.last_seen_at).toLocaleString('id-ID')}</p></div><button type="button" disabled={deviceBusy} onClick={() => removeDevice(device.device_id, device.device_name)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-40" aria-label={`Cabut ${device.device_name || 'perangkat'}`}><Trash2 size={17} /></button></div></div>)}
        </div>
      </div>
    </Modal>}

    {modal === 'profile' && <Modal title="Profil" icon={User} onClose={closeModal}>
      <form onSubmit={save} className="space-y-4"><label className="block text-sm font-semibold">Nama lengkap<input className={input} value={name} onChange={e => setName(e.target.value)} /></label><label className="block text-sm font-semibold">Email<input disabled className={`${input} bg-slate-50`} value={user?.email || ''} /></label><button disabled={busy} className={`${button} w-full`}>Simpan Profil</button>{saved && <p className="text-sm font-semibold text-emerald-600">Profil tersimpan.</p>}</form>
    </Modal>}

    {modal === 'reset' && <Modal title="Reset Data" icon={Database} danger onClose={closeModal}>
      <div className="rounded-xl bg-rose-50 p-4"><p className="text-sm leading-6 text-rose-700">Semua data keuangan akan dihapus: transaksi, transfer, dompet, anggaran, struk, dan transaksi berulang. <strong>Kategori dan akun pengguna tetap dipertahankan.</strong></p><label className="mt-3 block text-xs font-bold text-rose-700">Ketik RESET<input autoFocus className={`${input} border-rose-200`} value={resetText} onChange={e => setResetText(e.target.value.toUpperCase())} placeholder="RESET" /></label><button disabled={busy || resetText !== 'RESET'} onClick={resetData} className="mt-3 w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Trash2 size={17} className="mr-1 inline" />Reset Semua Data Keuangan</button></div>
    </Modal>}

    {modal === 'delete-request' && <Modal title="Ajukan Penghapusan Akun" icon={AlertTriangle} danger onClose={closeModal}>
      <div className="space-y-4"><div className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="font-extrabold text-red-800">PERINGATAN — akun harus benar-benar kosong.</p><p className="mt-2 text-sm leading-6 text-red-700">Pengajuan hanya dapat diproses jika transaksi, transfer, dompet, kategori, anggaran, struk, dan transaksi berulang sudah kosong.</p></div><div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600"><p className="font-bold text-slate-800">Status data saat ini:</p><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{statItems.map(([label, key]) => <div key={key} className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200"><p className="text-[10px] text-slate-400">{label}</p><p className="font-extrabold text-slate-800">{Number(stats?.[key] || 0).toLocaleString('id-ID')}</p></div>)}</div></div><label className="block text-xs font-bold text-red-700">Ketik AJUKAN HAPUS<input autoFocus className={`${input} border-red-200`} value={requestText} onChange={e => setRequestText(e.target.value.toUpperCase())} placeholder="AJUKAN HAPUS" /></label><button disabled={busy || requestText !== 'AJUKAN HAPUS'} onClick={submitDeletionRequest} className="w-full rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><UserX size={17} className="mr-1 inline" />Kirim Pengajuan ke Administrator</button></div>
    </Modal>}
  </AppShell>
}

function SettingItem({ icon: Icon, title, description, onClick, danger = false, disabled = false }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="group flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-px hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${danger ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}><Icon size={19} /></div><div className="min-w-0 flex-1"><h3 className="font-bold text-slate-900">{title}</h3><p className="truncate text-xs text-slate-500">{description}</p></div><ChevronRight size={18} className="shrink-0 text-slate-400" /></button>
}

function Modal({ title, icon: Icon, children, onClose, danger = false }) {
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}><button type="button" aria-label="Tutup" className="absolute inset-0 cursor-default" onClick={onClose} /><div className="relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6"><div className="mb-5 flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-xl ${danger ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}><Icon size={19}/></div><h3 className="flex-1 text-lg font-extrabold text-slate-900">{title}</h3><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Tutup"><X size={19} /></button></div>{children}</div></div>
}
