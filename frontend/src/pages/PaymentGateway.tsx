import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

interface DebtInfo {
  amount: number
  dueDate: string
  period: string
}

interface PaymentResult {
  id: number
  subscriptionId: number
  amount: number
  paymentDate: string
  status: string
}

function luhnCheck(card: string): boolean {
  const digits = card.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10)
    if (alt) { n *= 2; if (n > 9) n -= 9 }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

function detectBrand(card: string): string {
  const d = card.replace(/\D/g, '')
  if (/^4/.test(d)) return 'VISA'
  if (/^5[1-5]/.test(d)) return 'MC'
  if (/^3[47]/.test(d)) return 'AMEX'
  if (/^6(?:011|5)/.test(d)) return 'Discover'
  return ''
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return digits.slice(0, 2) + '/' + digits.slice(2)
}

export default function PaymentGateway() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>()
  const navigate = useNavigate()

  const [debt, setDebt] = useState<DebtInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [alreadyPaid, setAlreadyPaid] = useState(false)

  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [touched, setTouched] = useState({ cardNumber: false, expiry: false, cvv: false, cardName: false })

  const cardDigits = cardNumber.replace(/\D/g, '')
  const isCardValid = luhnCheck(cardDigits)
  const brand = detectBrand(cardDigits)

  const expiryRegex = /^(0[1-9]|1[0-2])\/(\d{2})$/
  const expiryMatch = expiry.match(expiryRegex)
  let isExpiryValid = false
  if (expiryMatch) {
    const expMonth = parseInt(expiryMatch[1], 10)
    const expYear = parseInt(expiryMatch[2], 10) + 2000
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    isExpiryValid = expYear > currentYear || (expYear === currentYear && expMonth >= currentMonth)
  }

  const cvvDigits = cvv.replace(/\D/g, '')
  const requiredCvvLen = brand === 'AMEX' ? 4 : 3
  const isCvvValid = cvvDigits.length === requiredCvvLen

  const isFormValid = isCardValid && isExpiryValid && isCvvValid && cardName.trim().length >= 2

  const getError = (field: string) => {
    if (!touched[field as keyof typeof touched]) return ''
    switch (field) {
      case 'cardNumber':
        if (cardDigits.length === 0) return 'Card number is required'
        if (cardDigits.length < 13) return 'Card number too short'
        if (!isCardValid) return 'Invalid card number'
        return ''
      case 'expiry':
        if (expiry.length === 0) return 'Expiry date is required'
        if (!expiryRegex.test(expiry)) return 'Use MM/YY format'
        if (!isExpiryValid) return 'Card is expired'
        return ''
      case 'cvv':
        if (cvv.length === 0) return 'CVV is required'
        if (cvvDigits.length < requiredCvvLen) return `CVV must be ${requiredCvvLen} digits`
        return ''
      case 'cardName':
        if (cardName.trim().length === 0) return 'Cardholder name is required'
        if (cardName.trim().length < 2) return 'Enter full name'
        return ''
      default:
        return ''
    }
  }

  useEffect(() => {
    if (!subscriptionId) return
    api.payments.queryDebt(Number(subscriptionId))
      .then(data => {
        if (data.amount === 0) setAlreadyPaid(true)
        setDebt(data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [subscriptionId])

  useEffect(() => {
    if (!alreadyPaid) return
    const t = setTimeout(() => navigate('/dashboard'), 5000)
    return () => clearTimeout(t)
  }, [alreadyPaid, navigate])

  const handleConfirm = async () => {
    setProcessing(true)
    await new Promise(r => setTimeout(r, 2000))
    try {
      const result: PaymentResult = await api.payments.pay({
        subscriptionId: Number(subscriptionId),
        amount: debt?.amount ?? 0,
      })
      if (result.status === 'Success') {
        setDone(true)
        setTimeout(() => navigate('/dashboard', { state: { paymentSuccess: true } }), 1500)
      } else {
        setError('Payment was declined by the bank. Please try again.')
      }
    } catch (err: any) {
      if (err.message.includes('Already paid')) {
        setAlreadyPaid(true)
      } else {
        setError(err.message || 'Payment failed.')
      }
    } finally {
      setProcessing(false)
    }
  }

  const bankLogo = 'https://placehold.co/48x48/059669/ffffff?text=HB'

  const inputClass = (field: string) =>
    `w-full border ${getError(field) ? 'border-red-400' : 'border-slate-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${getError(field) ? 'focus:ring-red-400' : 'focus:ring-emerald-500'} transition-colors`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-emerald-700 px-6 py-5 flex items-center gap-3">
          <img src={bankLogo} alt="Bank" className="w-10 h-10 rounded-lg" />
          <div>
            <h1 className="text-white font-bold text-lg">HalalBank SecurePay</h1>
            <p className="text-emerald-200 text-xs">3rd Party Payment Gateway</p>
          </div>
          <div className="ml-auto flex gap-1">
            {['VISA', 'MC', 'AMEX'].map(b => (
              <div key={b} className={`w-8 h-5 rounded text-[8px] font-bold flex items-center justify-center ${brand === b ? 'ring-2 ring-emerald-300 scale-110' : ''} ${b === 'VISA' ? 'bg-yellow-400 text-slate-800' : b === 'MC' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'} transition-all`}>
                {b}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-6 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-slate-500">Fetching debt information...</span>
            </div>
          )}

          {error && !processing && !loading && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          {done && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 text-center font-medium">
              Payment successful! Redirecting to dashboard...
            </div>
          )}

          {alreadyPaid && (
            <div className="bg-emerald-100 border-2 border-emerald-500 text-emerald-800 rounded-xl px-6 py-5 text-center">
              <p className="text-lg font-bold">Already Paid for this Period</p>
              <p className="text-sm mt-1">This subscription has already been paid for {debt?.period ?? 'the current period'}.</p>
              <p className="text-xs mt-2 text-emerald-600">Redirecting to dashboard in 5 seconds...</p>
              <button onClick={() => navigate('/dashboard')} className="mt-4 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
                Go to Dashboard Now
              </button>
            </div>
          )}

          {debt && !done && !alreadyPaid && (
            <>
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subscription ID</span>
                  <span className="font-mono text-slate-800">{subscriptionId}</span>
                </div>
                <div className="border-t border-slate-100" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Amount Due</span>
                  <span className="text-2xl font-bold text-slate-800">${debt.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Due Date</span>
                  <span className="text-slate-700">{new Date(debt.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Period</span>
                  <span className="text-slate-700">{debt.period}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">Card Details</h3>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, cardName: true }))}
                    className={inputClass('cardName')}
                  />
                  {getError('cardName') && <p className="text-xs text-red-500 mt-1">{getError('cardName')}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Card Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                    onBlur={() => setTouched(t => ({ ...t, cardNumber: true }))}
                    className={inputClass('cardNumber')}
                  />
                  {cardNumber.length > 0 && brand && <span className="text-xs text-emerald-600 mt-1 block">{brand}</span>}
                  {getError('cardNumber') && <p className="text-xs text-red-500 mt-1">{getError('cardNumber')}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={e => setExpiry(formatExpiry(e.target.value))}
                      onBlur={() => setTouched(t => ({ ...t, expiry: true }))}
                      className={inputClass('expiry')}
                    />
                    {getError('expiry') && <p className="text-xs text-red-500 mt-1">{getError('expiry')}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">CVV</label>
                    <input
                      type="text"
                      placeholder="•••"
                      value={cvv}
                      onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, requiredCvvLen))}
                      onBlur={() => setTouched(t => ({ ...t, cvv: true }))}
                      className={inputClass('cvv')}
                    />
                    {getError('cvv') && <p className="text-xs text-red-500 mt-1">{getError('cvv')}</p>}
                  </div>
                </div>
              </div>

              {processing && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-3 text-sm text-slate-500">Processing payment with bank...</span>
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={!isFormValid || processing}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed text-sm"
              >
                {processing ? 'Please wait...' : `Confirm Payment — $${debt.amount.toFixed(2)}`}
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                disabled={processing}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Cancel and return to Dashboard
              </button>
            </>
          )}

          {!debt && !loading && !error && (
            <p className="text-sm text-slate-500 text-center py-4">No debt information available for this subscription.</p>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-between text-[10px] text-slate-400">
          <span>Secure connection • TLS 1.3</span>
          <span>HalalBank SecurePay v1.0</span>
        </div>
      </div>
    </div>
  )
}
