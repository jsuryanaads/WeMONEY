import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Bell, Check, ChevronRight, Clock3, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getFinancialNotifications } from '../../services/notificationService'

const READ_KEY = 'wemoney:notifications:read'

function readIds(userId) {
  try {
    const data = JSON.parse(localStorage.getItem(READ_KEY) || '{}')
    return new Set(Array.isArray(data[userId]) ? data[userId] : [])
  } catch {
    return new Set()
  }
}

function saveReadIds(userId, ids) {
  try {
    const data = JSON.parse(localStorage.getItem(READ_KEY) || '{}')
    data[userId] = [...ids].slice(-100)
    localStorage.setItem(READ_KEY, JSON.stringify(data))
  } catch {}
}

export default function NotificationCenter() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [read, setRead] = useState(() => readIds(user?.id))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setRead(readIds(user?.id))
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    const refresh = () => {
      setLoading(true)
      getFinancialNotifications(user.id)
        .then(data => { if (!cancelled) setItems(data) })
        .catch(() => { if (!cancelled) setItems([]) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }
    refresh()
    const interval = window.setInterval(refresh, 60_000)
    window.addEventListener('focus', refresh)
    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
    }
  }, [user?.id])

  useEffect(() => {
    if (!open) return
    const onPointerDown = event => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const unread = useMemo(() => items.filter(item => !read.has(item.id)), [items, read])

  const markRead = id => {
    const next = new Set(read)
    next.add(id)
    setRead(next)
    if (user?.id) saveReadIds(user.id, next)
  }

  const markAllRead = () => {
    const next = new Set([...read, ...items.map(item => item.id)])
    setRead(next)
    if (user?.id) saveReadIds(user.id, next)
  }

  const goTo = item => {
    markRead(item.id)
    setOpen(false)
    navigate(item.action)
  }

  return <div ref={ref} className="relative">
    <button
      type="button"
      onClick={() => setOpen(value => !value)}
      className="relative grid h-10 w-10 place-items-center rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
      aria-label={unread.length ? `Notifikasi, ${unread.length} belum dibaca` : 'Notifikasi'}
      aria-expanded={open}
      title="Notifikasi"
    >
      <Bell size={19} />
      {unread.length > 0 && <span className="absolute right-1.5 top-1.5 grid min-h-3.5 min-w-3.5 place-items-center rounded-full bg-red-500 px-1 text-[8px] font-extrabold leading-none text-white ring-2 ring-[var(--wm-header)]">{unread.length > 9 ? '9+' : unread.length}</span>}
    </button>

    {open && <div className="absolute right-0 top-12 z-[60] w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border bg-[var(--wm-surface)] text-[var(--wm-text)] shadow-2xl">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div><p className="text-sm font-extrabold">Notifikasi</p><p className="text-[10px] opacity-55">{unread.length ? `${unread.length} belum dibaca` : 'Semua sudah dibaca'}</p></div>
        <div className="flex items-center gap-1">
          {items.length > 0 && unread.length > 0 && <button type="button" onClick={markAllRead} className="rounded-lg p-2 text-[10px] font-bold opacity-70 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/5" title="Tandai semua sudah dibaca"><Check size={15}/></button>}
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 opacity-60 hover:bg-black/5 dark:hover:bg-white/5" aria-label="Tutup"><X size={16}/></button>
        </div>
      </div>

      <div className="max-h-[min(28rem,65vh)] overflow-y-auto">
        {loading && <div className="px-4 py-8 text-center text-xs opacity-60">Memuat notifikasi...</div>}
        {!loading && items.length === 0 && <div className="px-4 py-10 text-center"><Bell className="mx-auto mb-3 opacity-30" size={28}/><p className="text-sm font-bold">Tidak ada notifikasi</p><p className="mt-1 text-[11px] opacity-55">Belum ada tagihan mendekat atau anggaran yang perlu diperhatikan.</p></div>}
        {!loading && items.map(item => {
          const isUnread = !read.has(item.id)
          return <button key={item.id} type="button" onClick={() => goTo(item)} className={`flex w-full gap-3 border-b px-4 py-3 text-left transition hover:bg-black/[.04] dark:hover:bg-white/[.04] ${isUnread ? 'bg-blue-500/[.06]' : ''}`}>
            <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>{item.type === 'danger' ? <AlertTriangle size={17}/> : <Clock3 size={17}/>}</span>
            <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5"><span className="truncate text-xs font-extrabold">{item.title}</span>{isUnread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"/>}</span><span className="mt-0.5 block text-[11px] leading-4 opacity-65">{item.message}</span><span className="mt-1 flex items-center gap-1 text-[10px] font-bold opacity-50">{item.actionLabel}<ChevronRight size={11}/></span></span>
          </button>
        })}
      </div>
    </div>}
  </div>
}
