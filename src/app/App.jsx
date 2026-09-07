import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from './ProtectedRoute'
import Dashboard from '../pages/Dashboard'
import Login from '../pages/Login'
import Register from '../pages/Register'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'

function PublicOnly({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm font-semibold text-slate-500">Memuat WeMoney...</div>
  return session ? <Navigate to="/dashboard" replace /> : children
}

function Placeholder({ title }) {
  return <div className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"><h1 className="text-2xl font-extrabold">{title}</h1><p className="mt-2 text-sm text-slate-500">Modul akan dibangun pada phase berikutnya.</p></div></div>
}

export default function App() {
  return <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
    <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
    <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/transaksi" element={<Placeholder title="Transaksi" />} />
      <Route path="/kategori" element={<Placeholder title="Kategori" />} />
      <Route path="/laporan" element={<Placeholder title="Laporan" />} />
      <Route path="/pengaturan" element={<Placeholder title="Pengaturan" />} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
}
