import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'

interface Subscription {
  id: number
  customerId: number
  subscriptionNumber: string
  providerName: string
  category: string
  price: number
  billingCycle: string
  nextPaymentDate: string
  status: string
}

interface Plan {
  id: number
  name: string
  category: string
  defaultPrice: number
  defaultBillingCycle: string
}

export default function Admin() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'users' | 'plans'>('users')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [form, setForm] = useState({ name: '', category: '', defaultPrice: '', defaultBillingCycle: 'Monthly' })
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    api.subscriptions.getAll()
      .then(setSubscriptions)
      .catch(console.error)
      .finally(() => setLoadingSubs(false))
  }, [])

  const loadPlans = () => {
    setLoadingPlans(true)
    api.subscriptionPlans.getAll()
      .then(setPlans)
      .catch(console.error)
      .finally(() => setLoadingPlans(false))
  }

  useEffect(() => {
    if (tab === 'plans') loadPlans()
  }, [tab])

  const resetForm = () => {
    setForm({ name: '', category: '', defaultPrice: '', defaultBillingCycle: 'Monthly' })
    setEditPlan(null)
  }

  const handleSavePlan = async () => {
    if (!form.name.trim() || !form.category.trim() || !form.defaultPrice.trim()) return
    const data = {
      name: form.name.trim(),
      category: form.category.trim(),
      defaultPrice: parseFloat(form.defaultPrice),
      defaultBillingCycle: form.defaultBillingCycle,
    }
    try {
      if (editPlan) {
        await api.subscriptionPlans.update(editPlan.id, data)
        setToast('Plan updated')
      } else {
        await api.subscriptionPlans.create(data)
        setToast('Plan created')
      }
      resetForm()
      loadPlans()
    } catch (err: any) {
      setToast(`Error: ${err.message}`)
    }
  }

  const handleEdit = (plan: Plan) => {
    setEditPlan(plan)
    setForm({
      name: plan.name,
      category: plan.category,
      defaultPrice: String(plan.defaultPrice),
      defaultBillingCycle: plan.defaultBillingCycle,
    })
  }

  const handleDelete = async (id: number) => {
    try {
      await api.subscriptionPlans.delete(id)
      setToast('Plan deleted')
      loadPlans()
    } catch (err: any) {
      setToast(`Error: ${err.message}`)
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

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
          <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
          <p className="text-sm text-slate-500 mt-1">Signed in as {user?.email}</p>
        </div>

        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setTab('users')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              tab === 'users' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            All Users Overview
          </button>
          <button
            onClick={() => setTab('plans')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              tab === 'plans' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Manage Plans
          </button>
        </div>

        {tab === 'users' && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">All Subscriptions</h2>
            {loadingSubs ? (
              <p className="text-slate-400 text-sm text-center py-8">Loading subscriptions...</p>
            ) : subscriptions.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No subscriptions in the system.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="pb-2 font-medium">Customer ID</th>
                      <th className="pb-2 font-medium">Subscription #</th>
                      <th className="pb-2 font-medium">Provider</th>
                      <th className="pb-2 font-medium">Category</th>
                      <th className="pb-2 font-medium">Price</th>
                      <th className="pb-2 font-medium">Billing</th>
                      <th className="pb-2 font-medium">Next Payment</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map(sub => (
                      <tr key={sub.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-2.5 text-slate-600">{sub.customerId}</td>
                        <td className="py-2.5 text-slate-600 font-mono text-xs">{sub.subscriptionNumber}</td>
                        <td className="py-2.5 text-slate-800">{sub.providerName}</td>
                        <td className="py-2.5 text-slate-600">{sub.category}</td>
                        <td className="py-2.5 text-slate-800 font-medium">${sub.price.toFixed(2)}</td>
                        <td className="py-2.5 text-slate-600">{sub.billingCycle}</td>
                        <td className={`py-2.5 ${new Date(sub.nextPaymentDate) <= new Date() ? 'text-red-600 font-medium' : 'text-slate-700'}`}>
                          {formatDate(sub.nextPaymentDate)}
                        </td>
                        <td className="py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sub.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab === 'plans' && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Plan Catalog</h2>

            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">{editPlan ? 'Edit Plan' : 'Add New Plan'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  placeholder="Name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  placeholder="Category"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
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
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSavePlan}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {editPlan ? 'Update' : 'Add'} Plan
                </button>
                {editPlan && (
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {loadingPlans ? (
              <p className="text-slate-400 text-sm text-center py-8">Loading plans...</p>
            ) : plans.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No plans defined.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Category</th>
                      <th className="pb-2 font-medium">Price</th>
                      <th className="pb-2 font-medium">Billing</th>
                      <th className="pb-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map(plan => (
                      <tr key={plan.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-2.5 text-slate-800">{plan.name}</td>
                        <td className="py-2.5 text-slate-600">{plan.category}</td>
                        <td className="py-2.5 text-slate-800 font-medium">${plan.defaultPrice.toFixed(2)}</td>
                        <td className="py-2.5 text-slate-600">{plan.defaultBillingCycle}</td>
                        <td className="py-2.5 flex gap-2">
                          <button
                            onClick={() => handleEdit(plan)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
