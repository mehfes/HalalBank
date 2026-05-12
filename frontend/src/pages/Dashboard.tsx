import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Navbar from '../components/Navbar'
import PaymentHistoryModal from '../components/PaymentHistoryModal'
import { SkeletonTable } from '../components/Skeleton'

interface Subscription {
  id: number
  customerId: number
  subscriptionNumber: string
  providerName: string
  category: string
  subscriptionType: string
  price: number
  billingCycle: string
  nextPaymentDate: string
  status: string
}

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  createdDate: string
}

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { addToast } = useToast()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [historySub, setHistorySub] = useState<{ id: number; name: string } | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [allSubs, setAllSubs] = useState<Subscription[]>([])
  const [subSearch, setSubSearch] = useState('')

  const isAdmin = user?.role === 'Admin'

  useEffect(() => {
    if (location.state?.paymentSuccess) {
      addToast('Payment completed successfully!', 'success')
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  useEffect(() => {
    if (!user) return
    setLoading(true)

    if (isAdmin) {
      Promise.all([
        api.customers.getAll().catch(() => []),
        api.subscriptions.getAll().catch(() => []),
      ]).then(([cust, subs]) => {
        setCustomers(cust)
        setAllSubs(subs)
      }).finally(() => setLoading(false))
    } else if (user.customerId) {
      api.subscriptions.getByCustomerId(user.customerId)
        .then(setSubscriptions)
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  const activeSubscriptions = subscriptions.filter(s => s.status === 'Active')
  const now = new Date()
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingPayments = subscriptions.filter(s =>
    s.status === 'Active' && new Date(s.nextPaymentDate) >= now && new Date(s.nextPaymentDate) <= sevenDays
  )
  const filteredSubs = subSearch
    ? subscriptions.filter(s =>
        s.providerName.toLowerCase().includes(subSearch.toLowerCase()) ||
        s.category.toLowerCase().includes(subSearch.toLowerCase()) ||
        s.billingCycle.toLowerCase().includes(subSearch.toLowerCase()) ||
        s.status.toLowerCase().includes(subSearch.toLowerCase())
      )
    : subscriptions

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-8 w-16 bg-slate-200 rounded mt-3" />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-8 w-16 bg-slate-200 rounded mt-3" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
            <SkeletonTable rows={4} cols={8} />
          </div>
        </main>
      </div>
    )
  }

  if (isAdmin) {
    const totalActive = allSubs.filter(s => s.status === 'Active').length
    const overdueCount = allSubs.filter(s => s.status === 'Active' && new Date(s.nextPaymentDate) <= now).length

    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">System overview — signed in as {user?.email}</p>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Users</p>
              <p className="mt-2 text-4xl font-bold text-indigo-600">{customers.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Subscriptions</p>
              <p className="mt-2 text-4xl font-bold text-emerald-600">{allSubs.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Active Subscriptions</p>
              <p className="mt-2 text-4xl font-bold text-blue-600">{totalActive}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Overdue Payments</p>
              <p className="mt-2 text-4xl font-bold text-red-600">{overdueCount}</p>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">All Users</h2>
            {customers.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No registered users yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="pb-2 font-medium">ID</th>
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Email</th>
                      <th className="pb-2 font-medium">Registered</th>
                      <th className="pb-2 font-medium">Subscriptions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(c => {
                      const userSubs = allSubs.filter(s => s.customerId === c.id)
                      return (
                        <tr key={c.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-2.5 text-slate-600 font-mono text-xs">{c.id}</td>
                          <td className="py-2.5 text-slate-800 font-medium">{c.firstName} {c.lastName}</td>
                          <td className="py-2.5 text-slate-600">{c.email}</td>
                          <td className="py-2.5 text-slate-600">{formatDate(c.createdDate)}</td>
                          <td className="py-2.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                              {userSubs.length} ({userSubs.filter(s => s.status === 'Active').length} active)
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Active Subscriptions</p>
            <p className="mt-2 text-4xl font-bold text-emerald-600">{activeSubscriptions.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Upcoming Payments (7 days)</p>
            <p className="mt-2 text-4xl font-bold text-amber-600">{upcomingPayments.length}</p>
          </div>
        </section>

        {upcomingPayments.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Upcoming Payments</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-2 font-medium">Subscription #</th>
                    <th className="pb-2 font-medium">Provider</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Due Date</th>
                    <th className="pb-2 font-medium">Billing</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingPayments.map(sub => (
                    <tr key={sub.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2.5 text-slate-600 font-mono text-xs">{sub.subscriptionNumber}</td>
                      <td className="py-2.5 text-slate-800">{sub.providerName}</td>
                      <td className="py-2.5 text-slate-600">{sub.category}</td>
                      <td className="py-2.5"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{sub.subscriptionType}</span></td>
                      <td className="py-2.5 text-slate-800 font-medium">${sub.price.toFixed(2)}</td>
                      <td className="py-2.5 text-amber-700">{formatDate(sub.nextPaymentDate)}</td>
                      <td className="py-2.5 text-slate-600">{sub.billingCycle}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/payment-gateway/${sub.id}`)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                          >
                            Pay
                          </button>
                          <button
                            onClick={() => setHistorySub({ id: sub.id, name: sub.providerName })}
                            className="px-3 py-1 border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                          >
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">My Subscriptions</h2>
            <input
              type="text"
              placeholder="Filter subscriptions..."
              value={subSearch}
              onChange={e => setSubSearch(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-56"
            />
          </div>

          {subscriptions.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-8">No subscriptions found.</p>
          )}

          {subscriptions.length > 0 && (
            <div className="overflow-x-auto">
              {filteredSubs.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No subscriptions match your filter.</p>
              ) : (
                <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-2 font-medium">Subscription #</th>
                    <th className="pb-2 font-medium">Provider</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Price</th>
                    <th className="pb-2 font-medium">Billing</th>
                    <th className="pb-2 font-medium">Next Payment</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map(sub => (
                    <tr key={sub.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2.5 text-slate-600 font-mono text-xs">{sub.subscriptionNumber}</td>
                      <td className="py-2.5 text-slate-800">{sub.providerName}</td>
                      <td className="py-2.5 text-slate-600">{sub.category}</td>
                      <td className="py-2.5"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{sub.subscriptionType}</span></td>
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
                      <td className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/payment-gateway/${sub.id}`)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                          >
                            Pay
                          </button>
                          <button
                            onClick={() => setHistorySub({ id: sub.id, name: sub.providerName })}
                            className="px-3 py-1 border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                          >
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          )}
        </section>
      </main>

      {historySub && (
        <PaymentHistoryModal
          subscriptionId={historySub.id}
          providerName={historySub.name}
          onClose={() => setHistorySub(null)}
        />
      )}
    </div>
  )
}
