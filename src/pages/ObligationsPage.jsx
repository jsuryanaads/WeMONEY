import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CalendarClock, CheckCircle2, Edit3, HandCoins, Plus, ReceiptText, Search, Trash2, X } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { useAuth } from '../hooks/useAuth'
import { createObligation, deleteObligation, getObligations, updateObligation } from '../services/obligationService'

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))
const today = () => new Date().toISOString().slice(0, 10)
const blank = () => ({ kind: 'debt', title: '', counterparty: '', amount_total: '', amount_paid: '0', due_date: today(), status: 'open', is_recurring: false, recurrence: 'monthly', notes: '' })
const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700'
const input = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'
const button = 'rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50'

function labelKind(kind) { return kind === 'debt' ? 'Hutang' : kind === 'receivable' ? 'Piutang' : 'Tagihan' }
function remaining(row) { return Math.max(0, Number(row.amount_total || 0) - Number(row.amount_paid || 0)) }
function dueLabel(date, status) {
  if (!date) return 'Tanpa jatuh tempo'
  const diff = Math.ceil((new Date(date + 'T23:59:59') - new Date()) / 86400000)
  if (status === 'paid') return 'Lunas'
  if (diff < 0) return `Terlambat ${Math.abs(diff)} hari`
  if (diff === 0) return 'Jatuh tempo hari ini'
  return `Jatuh tempo ${diff} hari lagi`
}

export default function ObligationsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [tab, setTab] = useState('all')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(blank())
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    if (!user?.id) return
    try { setError(''); setRows(await getObligations(user.id, { kind: tab, status, search })) }
    catch (e) { setError(e.message || 'Gagal memuat hutang dan tagihan.') }
  }
  useEffect(() => { load() }, [user?.id, tab, status, search])

  const summary = useMemo(() => rows.reduce((a, row) => {
    a[row.kind].total += Number(row.amount_total || 0); a[row.kind].remaining += remaining(row)
    if (row.status === 'open') a.open += 1
    return a
  }, { debt: { total: 0, remaining: 0 }, receivable: { total: 0, remaining: 0 }, bill: { total: 0, remaining: 0 }, open: 0 }), [rows])

  function edit(row) { setEditing(row); setForm({ kind: row.kind, title: row.title, counterparty: row.counterparty || '', amount_total: String(row.amount_total), amount_paid: String(row.amount_paid || 0), due_date: row.due_date || '', status: row.status, is_recurring: row.is_recurring, recurrence: row.recurrence || 'monthly', notes: row.notes || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function cancel() { setEditing(null); setForm(blank()) }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      if (editing) await updateObligation(editing.id, user.id, form)
      else await createObligation(user.id, form)
      cancel(); await load()
    } catch (e) { setError(e.message || 'Gagal menyimpan data.') } finally { setBusy(false) }
  }
  async function remove(id) {
    if (!window.confirm('Hapus catatan ini? Tindakan ini permanen.')) return
    try { setError(''); await deleteObligation(id, user.id); await load() } catch (e) { setError(e.message || 'Gagal menghapus data.') }
  }

  return <AppShell title="Hutang & Tagihan">
    <div className="mb-5">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Hutang & Tagihan</h1>
      <p className="mt-1 text-sm text-slate-500">Kelola hutang, piutang, dan kewajiban yang memiliki jatuh tempo.</p>
    </div>
    {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}
    <section className="grid gap-3 sm:grid-cols-3">
      <Summary title="Sisa Hutang" value={summary.debt.remaining} icon={HandCoins} />
      <Summary title="Sisa Piutang" value={summary.receivable.remaining} icon={HandCoins} />
      <Summary title="Sisa Tagihan" value={summary.bill.remaining} icon={ReceiptText} />
    </section>
    <form onSubmit={save} className={`${card} mt-5 grid gap-4 md:grid-cols-2`}>
      <div className="md:col-span-2 flex items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold">{editing ? 'Edit Catatan' : 'Tambah Hutang / Tagihan'}</h2><p className="text-sm text-slate-400">Versi awal menyimpan catatan kewajiban tanpa mengubah transaksi atau saldo.</p></div>{editing && <button type="button" onClick={cancel} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Batal edit"><X size={19}/></button>}</div>
      <label className="text-sm font-semibold">Jenis<select className={input} value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })}><option value="debt">Hutang</option><option value="receivable">Piutang</option><option value="bill">Tagihan</option></select></label>
      <label className="text-sm font-semibold">Nama / Judul<input required className={input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Contoh: Hutang ke Andi / Internet"/></label>
      <label className="text-sm font-semibold">Pihak terkait<input className={input} value={form.counterparty} onChange={e => setForm({ ...form, counterparty: e.target.value })} placeholder="Nama orang / penyedia"/></label>
      <label className="text-sm font-semibold">Nominal total<input required min="1" step="1" type="number" className={input} value={form.amount_total} onChange={e => setForm({ ...form, amount_total: e.target.value })}/></label>
      <label className="text-sm font-semibold">Sudah dibayar / diterima<input min="0" step="1" type="number" className={input} value={form.amount_paid} onChange={e => setForm({ ...form, amount_paid: e.target.value })}/></label>
      <label className="text-sm font-semibold">Jatuh tempo<input type="date" className={input} value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}/></label>
      <label className="text-sm font-semibold">Status<select className={input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="open">Aktif</option><option value="cancelled">Dibatalkan</option><option value="paid">Lunas</option></select></label>
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700"><input type="checkbox" checked={form.is_recurring} onChange={e => setForm({ ...form, is_recurring: e.target.checked })}/><span><b className="block">Berulang</b><small className="text-slate-400">Cocok untuk tagihan bulanan/tahunan.</small></span></label>
      {form.is_recurring && <label className="text-sm font-semibold">Periode<select className={input} value={form.recurrence} onChange={e => setForm({ ...form, recurrence: e.target.value })}><option value="monthly">Bulanan</option><option value="yearly">Tahunan</option></select></label>}
      <label className="md:col-span-2 text-sm font-semibold">Catatan<textarea className={input} rows="3" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}/></label>
      <div className="md:col-span-2 flex gap-2"><button disabled={busy} className={button}>{busy ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : <><Plus size={17} className="mr-1 inline"/>Simpan</>}</button>{editing && <button type="button" onClick={cancel} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold dark:border-slate-700" >Batal</button>}</div>
    </form>
    <section className={`${card} mt-5`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">{[['all','Semua'],['debt','Hutang'],['receivable','Piutang'],['bill','Tagihan']].map(([key,label]) => <button type="button" key={key} onClick={()=>setTab(key)} className={`rounded-xl px-3 py-2 text-sm font-bold ${tab===key?'bg-blue-600 text-white':'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{label}</button>)}</div>
        <div className="flex gap-2"><div className="relative"><Search size={16} className="absolute left-3 top-4 text-slate-400"/><input className={`${input} mt-0 w-56 pl-9`} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari..."/></div><select className={`${input} mt-0 w-auto`} value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Semua status</option><option value="open">Aktif</option><option value="paid">Lunas</option><option value="cancelled">Dibatalkan</option></select></div>
      </div>
      <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
        {rows.length ? rows.map(row => <article key={row.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40"><CalendarClock size={19}/></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><b className="truncate">{row.title}</b><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold dark:bg-slate-800">{labelKind(row.kind)}</span>{row.status==='paid'&&<CheckCircle2 size={15} className="text-emerald-500"/>}</div><p className="text-xs text-slate-400">{row.counterparty || 'Tanpa pihak terkait'} · {dueLabel(row.due_date,row.status)}{row.is_recurring?' · '+(row.recurrence==='monthly'?'Bulanan':'Tahunan'):''}</p></div></div>
          <div className="flex items-center justify-between gap-3 sm:justify-end"><div className="text-right"><b className="block">{money(remaining(row))}</b><small className="text-xs text-slate-400">sisa dari {money(row.amount_total)}</small></div><button onClick={()=>edit(row)} className="rounded-lg p-2 text-slate-400 hover:text-blue-600" aria-label="Edit"><Edit3 size={17}/></button><button onClick={()=>remove(row.id)} className="rounded-lg p-2 text-slate-400 hover:text-rose-600" aria-label="Hapus"><Trash2 size={17}/></button></div>
        </article>) : <div className="py-10 text-center text-sm text-slate-400"><AlertCircle size={20} className="mx-auto mb-2"/>Belum ada data.</div>}
      </div>
    </section>
  </AppShell>
}
function Summary({ title, value, icon: Icon }) { return <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40"><Icon size={19}/></span><div><span className="block text-xs font-semibold text-slate-400">{title}</span><b className="text-lg">{money(value)}</b></div></div></div> }
