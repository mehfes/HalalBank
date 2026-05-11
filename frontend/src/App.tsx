import { useEffect, useState } from 'react'
import { api } from './services/api'

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
}

interface DashboardData {
  totalActiveSubscriptions: number
  upcomingPayments: Subscription[]
}

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

interface PaymentTaskResult {
  checkedCount: number
  paidCount: number
  failedCount: number
  skippedCount: number
  details: string[]
}

function App() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [taskResult, setTaskResult] = useState<PaymentTaskResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [taskLoading, setTaskLoading] = useState(false)
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.customers.getAll(),
      api.dashboard.get(),
    ]).then(([customers, dashboard]) => {
      setCustomers(customers)
      setDashboard(dashboard)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedCustomerId === '') {
      setSubscriptions([])
      return
    }
    setSubscriptionsLoading(true)
    api.subscriptions.getByCustomerId(Number(selectedCustomerId))
      .then(setSubscriptions)
      .catch(console.error)
      .finally(() => setSubscriptionsLoading(false))
  }, [selectedCustomerId])

  const handleTriggerPaymentCheck = async () => {
    setTaskLoading(true)
    setTaskResult(null)
    try {
      const result = await api.paymentTask.processOverdue()
      setTaskResult(result)
      const up = await api.dashboard.get()
      setDashboard(up)
    } catch (err: any) {
      setTaskResult({ checkedCount: 0, paidCount: 0, failedCount: 0, skippedCount: 0, details: [`Error: ${err.message}`] })
    } finally {
      setTaskLoading(false)
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-500 text-lg">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">HalalBank</h1>
          <span className="text-sm text-slate-500">Subscription & Auto-Payment Reminder</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Dashboard Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Active Subscriptions</p>
            <p className="mt-2 text-4xl font-bold text-emerald-600">{dashboard?.totalActiveSubscriptions ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Upcoming Payments (7 days)</p>
            <p className="mt-2 text-4xl font-bold text-amber-600">{dashboard?.upcomingPayments.length ?? 0}</p>
          </div>
        </section>

        {/* Upcoming Payments List */}
        {dashboard && dashboard.upcomingPayments.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Upcoming Payments</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-2 font-medium">Subscription #</th>
                    <th className="pb-2 font-medium">Provider</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Due Date</th>
                    <th className="pb-2 font-medium">Billing</th>
                  </tr>
                </thead>
                <tbody>
                    {dashboard.upcomingPayments.map(sub => (
                    <tr key={sub.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2.5 text-slate-600 font-mono text-xs">{sub.subscriptionNumber}</td>
                      <td className="py-2.5 text-slate-800">{sub.providerName}</td>
                      <td className="py-2.5 text-slate-600">{sub.category}</td>
                      <td className="py-2.5 text-slate-800 font-medium">${sub.price.toFixed(2)}</td>
                      <td className="py-2.5 text-amber-700">{formatDate(sub.nextPaymentDate)}</td>
                      <td className="py-2.5 text-slate-600">{sub.billingCycle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Customer Subscriptions */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Customer Subscriptions</h2>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value === '' ? '' : Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select a customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.email})</option>
              ))}
            </select>
          </div>

          {selectedCustomerId === '' && (
            <p className="text-slate-400 text-sm text-center py-8">Select a customer to view their subscriptions.</p>
          )}

          {subscriptionsLoading && (
            <p className="text-slate-400 text-sm text-center py-8">Loading subscriptions...</p>
          )}

          {!subscriptionsLoading && selectedCustomerId !== '' && subscriptions.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-8">This customer has no subscriptions yet.</p>
          )}

          {!subscriptionsLoading && subscriptions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
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

        {/* Trigger Payment Check */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Manual Payment Check</h2>
              <p className="text-sm text-slate-500 mt-1">Check all overdue subscriptions for debt and process payments automatically.</p>
            </div>
            <button
              onClick={handleTriggerPaymentCheck}
              disabled={taskLoading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {taskLoading ? 'Processing...' : 'Trigger Manual Payment Check'}
            </button>
          </div>

          {taskLoading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              Processing overdue subscriptions...
            </div>
          )}

          {taskResult && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-3">
                <span className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full">Checked: {taskResult.checkedCount}</span>
                <span className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">Paid: {taskResult.paidCount}</span>
                <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full">Failed: {taskResult.failedCount}</span>
                <span className="text-sm bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Skipped: {taskResult.skippedCount}</span>
              </div>
              {taskResult.details.length > 0 && (
                <ul className="text-xs text-slate-600 space-y-1 bg-slate-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {taskResult.details.map((d, i) => (
                    <li key={i} className="leading-relaxed">{d}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
