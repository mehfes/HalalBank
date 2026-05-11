import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({ email: false, password: false })

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const emailError = touched.email && !email.trim() ? 'Email is required' :
    touched.email && !emailRegex.test(email) ? 'Invalid email format' : ''

  const passwordError = touched.password && !password.trim() ? 'Password is required' :
    touched.password && password.length < 6 ? 'Password must be at least 6 characters' : ''

  const isValid = emailRegex.test(email) && password.length >= 6

  const handleSubmit = async () => {
    setTouched({ email: true, password: true })
    if (!isValid) return
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (err: string) =>
    `w-full border ${err ? 'border-red-400' : 'border-slate-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${err ? 'focus:ring-red-400' : 'focus:ring-emerald-500'} transition-colors`

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">HalalBank</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              placeholder="you@example.com"
              className={inputClass(emailError)}
            />
            {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
            {!emailError && <p className="text-xs text-slate-400 mt-1">Try <span className="font-mono">john.doe@email.com</span> (Customer) or <span className="font-mono">admin@test.com</span> (Admin)</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, password: true }))}
              placeholder="••••••••"
              className={inputClass(passwordError)}
            />
            {passwordError && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}
