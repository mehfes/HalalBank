import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="text-2xl font-bold text-slate-800">HalalBank</Link>
        <div className="flex items-center gap-3">
          <nav className="flex gap-1">
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/dashboard'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Dashboard
            </Link>
            {user?.role === 'Admin' && (
              <Link
                to="/admin"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/admin'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Admin
              </Link>
            )}
          </nav>
          <div className="h-6 w-px bg-slate-200" />
          <span className="text-xs text-slate-400 hidden sm:block">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
