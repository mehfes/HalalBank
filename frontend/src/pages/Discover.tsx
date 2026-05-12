import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import ConfirmDialog from '../components/ConfirmDialog'
import { SkeletonCard } from '../components/Skeleton'
import Navbar from '../components/Navbar'

interface Plan {
  id: number
  name: string
  category: string
  defaultPrice: number
  defaultBillingCycle: string
}

const SUBSCRIPTION_TYPES = [
  'Electricity', 'Water', 'Internet', 'Gsm', 'Streaming',
  'Music', 'Software', 'Health', 'Education', 'Other'
]

const emptyForm = { name: '', category: '', defaultPrice: '', defaultBillingCycle: 'Monthly' }

export default function Discover() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToast } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const loadPlans = () => {
    setLoading(true)
    api.subscriptionPlans.getAll()
      .then(setPlans)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPlans() }, [])

  const inferType = (category: string): string => {
    const cat = category.toLowerCase()
    if (cat.includes('electr') || cat.includes('utility')) return 'Electricity'
    if (cat.includes('water')) return 'Water'
    if (cat.includes('internet') || cat.includes('network')) return 'Internet'
    if (cat.includes('gsm') || cat.includes('mobile') || cat.includes('phone')) return 'Gsm'
    if (cat.includes('stream') || cat.includes('tv') || cat.includes('video')) return 'Streaming'
    if (cat.includes('music') || cat.includes('audio')) return 'Music'
    if (cat.includes('soft') || cat.includes('cloud') || cat.includes('storage')) return 'Software'
    if (cat.includes('health') || cat.includes('gym') || cat.includes('fitness')) return 'Health'
    if (cat.includes('edu')) return 'Education'
    return 'Other'
  }

  const handleSubscribe = async (plan: Plan) => {
    if (!user || isAdmin || !user.customerId) return
    try {
      await api.subscriptions.create({
        customerId: user.customerId,
        subscriptionNumber: '',
        providerName: plan.name,
        category: plan.category,
        subscriptionType: inferType(plan.category),
        price: plan.defaultPrice,
        billingCycle: plan.defaultBillingCycle,
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      addToast(`Subscribed to ${plan.name}!`, 'success')
      setSelectedPlan(null)
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.subscriptionPlans.delete(id)
      addToast('Plan deleted', 'success')
      setDeleteTarget(null)
      loadPlans()
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }

  const handleCreatePlan = async () => {
    if (!form.name.trim() || !form.category.trim() || !form.defaultPrice.trim()) return
    try {
      await api.subscriptionPlans.create({
        name: form.name.trim(),
        category: form.category.trim(),
        defaultPrice: parseFloat(form.defaultPrice),
        defaultBillingCycle: form.defaultBillingCycle,
      })
      addToast('Plan created', 'success')
      setForm(emptyForm)
      setShowForm(false)
      loadPlans()
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }

  const isAdmin = user?.role === 'Admin'

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Plan"
        message="Are you sure you want to delete this plan? This cannot be undone."
        onConfirm={() => deleteTarget !== null && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Discover Plans</h1>
            <p className="text-sm text-slate-500 mt-1">
              {isAdmin ? 'Manage the service catalog.' : 'Click on a plan to view details and subscribe.'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm(s => !s)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {showForm ? 'Cancel' : 'Create New Plan'}
            </button>
          )}
        </div>

        {isAdmin && showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">New Plan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                placeholder="Provider Name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">Select type...</option>
                {SUBSCRIPTION_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={form.defaultPrice}
                onChange={e => setForm(f => ({ ...f, defaultPrice: e.target.value }))}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={form.defaultBillingCycle}
                onChange={e => setForm(f => ({ ...f, defaultBillingCycle: e.target.value }))}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
            <button
              onClick={handleCreatePlan}
              className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Add Plan
            </button>
          </div>
        )}

        {plans.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-12">No plans available yet.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 mb-3">
                  {plan.category}
                </span>
                <h3 className="text-lg font-semibold text-slate-800">{plan.name}</h3>
                <p className="mt-3 text-3xl font-bold text-slate-800">${plan.defaultPrice.toFixed(2)}</p>
                <p className="text-sm text-slate-500 mt-1">{plan.defaultBillingCycle}</p>
              </div>
              {isAdmin && (
                <button
                  onClick={e => { e.stopPropagation(); setDeleteTarget(plan.id) }}
                  className="mt-6 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </main>

      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedPlan(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                {selectedPlan.category}
              </span>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedPlan.name}</h2>
            <p className="mt-4 text-4xl font-bold text-slate-800">${selectedPlan.defaultPrice.toFixed(2)}</p>
            <p className="text-sm text-slate-500 mt-1 mb-6">{selectedPlan.defaultBillingCycle}</p>

            <div className="border-t border-slate-100 pt-4 space-y-2 text-sm text-slate-600 mb-6">
              <div className="flex justify-between">
                <span>Plan ID</span>
                <span className="font-mono text-slate-800">#{selectedPlan.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Category</span>
                <span className="text-slate-800">{selectedPlan.category}</span>
              </div>
              <div className="flex justify-between">
                <span>Billing Cycle</span>
                <span className="text-slate-800">{selectedPlan.defaultBillingCycle}</span>
              </div>
              <div className="flex justify-between">
                <span>Price</span>
                <span className="text-slate-800 font-medium">${selectedPlan.defaultPrice.toFixed(2)}</span>
              </div>
            </div>

            {!isAdmin ? (
              <button
                onClick={() => handleSubscribe(selectedPlan)}
                disabled={!user || !user.customerId}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {user?.customerId ? `Subscribe - $${selectedPlan.defaultPrice.toFixed(2)}/mo` : 'Sign in as Customer'}
              </button>
            ) : (
              <button
                onClick={() => setSelectedPlan(null)}
                className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
