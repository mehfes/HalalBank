import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValid = emailRegex.test(email.trim())

  const handleSubmit = async () => {
    if (!isValid) return
    setError('')
    setLoading(true)
    try {
      await api.auth.forgotPassword({ email: email.trim() })
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
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
          <p className="text-sm text-slate-500 mt-1">Reset your password</p>
        </div>
        {sent ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3">
              If this email is registered, you'll receive a password reset link shortly.
            </div>
            <Link
              to="/login"
              className="block text-center w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass(error)}
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
            )}
            <button
              onClick={handleSubmit}
              disabled={!isValid || loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="text-center text-sm text-slate-500">
              <Link to="/login" className="text-emerald-600 hover:underline">Back to Sign In</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
