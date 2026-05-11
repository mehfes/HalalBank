import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'

interface Plan {
  id: number
  name: string
  category: string
  defaultPrice: number
  defaultBillingCycle: string
}

export default function Discover() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    api.subscriptionPlans.getAll()
      .then(setPlans)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSubscribe = async (plan: Plan) => {
    if (!user || user.role !== 'Customer' || !user.customerId) return
    try {
      await api.subscriptions.create({
        customerId: user.customerId,
        subscriptionNumber: '',
        providerName: plan.name,
        category: plan.category,
        price: plan.defaultPrice,
        billingCycle: plan.defaultBillingCycle,
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      setToast(`Subscribed to ${plan.name}!`)
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err: any) {
      setToast(`Error: ${err.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-slate-500 text-lg">Loading plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-in">
          {toast}
        </div>
      )}
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Discover Plans</h1>
          <p className="text-sm text-slate-500 mt-1">Browse available subscription plans and subscribe instantly.</p>
        </div>

        {plans.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-12">No plans available yet.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <div className="flex-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 mb-3">
                  {plan.category}
                </span>
                <h3 className="text-lg font-semibold text-slate-800">{plan.name}</h3>
                <p className="mt-3 text-3xl font-bold text-slate-800">${plan.defaultPrice.toFixed(2)}</p>
                <p className="text-sm text-slate-500 mt-1">{plan.defaultBillingCycle}</p>
              </div>
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={user?.role !== 'Customer'}
                className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {user?.role === 'Customer' ? 'Subscribe' : 'Sign in as Customer'}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
