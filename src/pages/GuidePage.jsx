import { useState } from 'react'
import { AlertTriangle, ArrowRightLeft, BookOpen, ChevronDown, CircleHelp, ShieldCheck, UserX, Wallet } from 'lucide-react'
import packageJson from '../../package.json'
import AppShell from '../components/layout/AppShell'

const faqs = [
  ['Mengapa saldo dompet berubah?', 'Saldo dompet dihitung dari saldo awal ditambah pemasukan, dikurangi pengeluaran, lalu disesuaikan dengan transfer masuk dan keluar.'],
  ['Apakah transfer dihitung sebagai pengeluaran?', 'Tidak. Transfer hanya memindahkan uang antar dompet sehingga total saldo semua dompet tetap sama.'],
  ['Apa yang terjadi jika transaksi dihapus?', 'Nilai transaksi langsung dikeluarkan dari perhitungan saldo dan laporan.'],
  ['Apa fungsi Reset Data Keuangan?', 'Reset menghapus seluruh transaksi dan transfer milik akun serta mengembalikan saldo awal semua dompet menjadi Rp 0. Dompet dan kategori tetap dipertahankan. Tindakan ini tidak dapat dibatalkan.'],
  ['Bagaimana cara menghapus akun?', 'Penghapusan akun tidak dilakukan langsung dari aplikasi. Pengguna harus mengosongkan seluruh data terlebih dahulu, lalu mengirim pengajuan penghapusan kepada administrator. Sistem menolak pengajuan jika masih ada transaksi, transfer, dompet, kategori, anggaran, struk, atau transaksi berulang. Administrator yang memproses penghapusan setelah pemeriksaan.'],
  ['Apakah data pengguna lain dapat terlihat?', 'Tidak. Data keuangan dipisahkan berdasarkan user_id dan dilindungi Row Level Security di Supabase.'],
]

export default function GuidePage() {
  const [open, setOpen] = useState(0)
  return <AppShell title="Tentang & Bantuan">
    <div className="mb-5"><h2 className="text-2xl font-extrabold tracking-tight">Tentang & Bantuan</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Panduan penggunaan, pertanyaan umum, dan informasi aplikasi We MONEY.</p></div>
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.3fr_.7fr]">
      <section className="wm-panel">
        <div className="flex items-start gap-3 sm:gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 sm:h-12 sm:w-12"><BookOpen size={24}/></span><div className="min-w-0"><h2 className="text-lg font-extrabold sm:text-xl">Mulai menggunakan We MONEY</h2><p className="mt-1 text-sm text-slate-500">Catat Uangmu, Rencanakan Masa Depanmu.</p></div></div>
        <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4"><Step icon={<Wallet size={19}/>} title="1. Siapkan dompet" text="Buat dompet seperti Kas, Bank, atau E-Wallet dan masukkan saldo awal yang benar." /><Step icon={<ArrowRightLeft size={19}/>} title="2. Catat transaksi" text="Pilih jenis pemasukan atau pengeluaran, dompet, kategori, nominal, dan tanggal." /><Step icon={<ArrowRightLeft size={19}/>} title="3. Gunakan transfer" text="Gunakan Transfer saat uang berpindah antar dompet. Transfer tidak memengaruhi total kekayaan." /><Step icon={<ShieldCheck size={19}/>} title="4. Kelola data dengan aman" text="Gunakan Export Data sebelum melakukan reset. Reset bersifat permanen untuk data keuangan." /><Step icon={<UserX size={19}/>} title="5. Penghapusan akun wajib melalui administrator" text="Akun tidak dapat dihapus langsung oleh pengguna. Kosongkan seluruh data keuangan terlebih dahulu, lalu buka Pengaturan → Ajukan Hapus Akun. Sistem akan memeriksa bahwa transaksi, transfer, dompet, kategori, anggaran, struk, dan transaksi berulang benar-benar kosong sebelum pengajuan dikirim ke administrator." /></div>
      </section>
      <div className="space-y-4 sm:space-y-6">
        <section className="wm-panel"><div className="flex items-center gap-3"><CircleHelp className="text-blue-600"/><h2 className="font-extrabold">FAQ</h2></div><div className="mt-4 divide-y divide-slate-100">{faqs.map(([q,a],i)=><div key={q} className="py-3"><button className="flex w-full items-center justify-between gap-3 text-left text-sm font-bold" onClick={()=>setOpen(open===i?-1:i)}><span className="min-w-0">{q}</span><ChevronDown size={17} className={`shrink-0 transition-transform ${open===i?'rotate-180':''}`}/></button>{open===i&&<p className="mt-2 text-sm leading-6 text-slate-500">{a}</p>}</div>)}</div><div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={19}/><p className="text-xs leading-5 text-amber-800">Peringatan: pengajuan penghapusan akun bukan proses otomatis. Administrator harus meninjau dan memproses penghapusan setelah persyaratan terpenuhi.</p></div></section>
        <section className="wm-panel"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tentang aplikasi</p><h2 className="mt-1 font-extrabold">We MONEY</h2></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">V{packageJson.version}</span></div><p className="mt-3 text-sm leading-6 text-slate-500">Teman finansial untuk membantu mencatat pengeluaran, memantau saldo, mengelola anggaran, dan memahami kondisi keuangan sehari-hari.</p><p className="mt-3 text-xs font-semibold text-slate-400">Catat Uangmu, Rencanakan Masa Depanmu</p></section>
      </div>
    </div>
  </AppShell>
}

function Step({icon,title,text}) { return <div className="flex gap-3 rounded-xl bg-slate-50 p-3 sm:gap-4 sm:p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-blue-600 ring-1 ring-slate-200">{icon}</span><div className="min-w-0"><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div></div> }
