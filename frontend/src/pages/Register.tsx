import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({
    firstName: false, lastName: false, email: false, password: false, confirmPassword: false
  })

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const firstNameError = touched.firstName && !firstName.trim() ? 'First name is required' : ''
  const lastNameError = touched.lastName && !lastName.trim() ? 'Last name is required' : ''
  const emailError = touched.email && !email.trim() ? 'Email is required' :
    touched.email && !emailRegex.test(email) ? 'Invalid email format' : ''
  const passwordError = touched.password && !password ? 'Password is required' :
    touched.password && password.length < 6 ? 'Password must be at least 6 characters' : ''
  const confirmError = touched.confirmPassword && !confirmPassword ? 'Please confirm your password' :
    touched.confirmPassword && confirmPassword !== password ? 'Passwords do not match' : ''

  const isValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    emailRegex.test(email) &&
    password.length >= 6 &&
    confirmPassword === password

  const handleSubmit = async () => {
    setTouched({ firstName: true, lastName: true, email: true, password: true, confirmPassword: true })
    if (!isValid) return
    setError('')
    setLoading(true)
    try {
      await register(firstName.trim(), lastName.trim(), email.trim(), password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (err: string) =>
    `w-full border ${err ? 'border-red-400' : 'border-slate-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${err ? 'focus:ring-red-400' : 'focus:ring-emerald-500'} transition-colors`

  const onBlur = (field: string) => () => setTouched(t => ({ ...t, [field]: true }))

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">HalalBank</h1>
          <p className="text-sm text-slate-500 mt-1">Create a new account</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              onBlur={onBlur('firstName')}
              placeholder="John"
              className={inputClass(firstNameError)}
            />
            {firstNameError && <p className="text-xs text-red-500 mt-1">{firstNameError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              onBlur={onBlur('lastName')}
              placeholder="Doe"
              className={inputClass(lastNameError)}
            />
            {lastNameError && <p className="text-xs text-red-500 mt-1">{lastNameError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={onBlur('email')}
              placeholder="you@example.com"
              className={inputClass(emailError)}
            />
            {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={onBlur('password')}
              placeholder="At least 6 characters"
              className={inputClass(passwordError)}
            />
            {passwordError && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onBlur={onBlur('confirmPassword')}
              placeholder="Re-enter your password"
              className={inputClass(confirmError)}
            />
            {confirmError && <p className="text-xs text-red-500 mt-1">{confirmError}</p>}
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </div>
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
