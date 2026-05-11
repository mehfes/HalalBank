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

export default function PaymentGateway() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>()
  const navigate = useNavigate()

  const [debt, setDebt] = useState<DebtInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [alreadyPaid, setAlreadyPaid] = useState(false)

  useEffect(() => {
    if (!subscriptionId) return
    api.payments.queryDebt(Number(subscriptionId))
      .then(data => {
        if (data.amount === 0) {
          setAlreadyPaid(true)
        }
        setDebt(data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [subscriptionId])

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
            <div className="w-8 h-5 bg-yellow-400 rounded text-[8px] font-bold flex items-center justify-center text-slate-800">VISA</div>
            <div className="w-8 h-5 bg-red-500 rounded text-[8px] font-bold flex items-center justify-center text-white">MC</div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-slate-500">Fetching debt information...</span>
            </div>
          )}

          {error && !processing && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
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

              {processing && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-3 text-sm text-slate-500">Processing payment with bank...</span>
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={processing}
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
