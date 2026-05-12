import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import ConfirmDialog from '../components/ConfirmDialog'
import { SkeletonTable } from '../components/Skeleton'
import Navbar from '../components/Navbar'

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

interface PaymentTaskResult {
  checkedCount: number
  paidCount: number
  failedCount: number
  skippedCount: number
  details: string[]
}

export default function Admin() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)
  const [taskResult, setTaskResult] = useState<PaymentTaskResult | null>(null)
  const [taskLoading, setTaskLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [processingSubId, setProcessingSubId] = useState<number | null>(null)

  const loadSubscriptions = () => {
    setLoadingSubs(true)
    api.subscriptions.getAll()
      .then(setSubscriptions)
      .catch(console.error)
      .finally(() => setLoadingSubs(false))
  }

  useEffect(() => { loadSubscriptions() }, [])

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.subscriptions.update(id, { status: newStatus })
      addToast(`Subscription status changed to ${newStatus}`, 'success')
      loadSubscriptions()
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.subscriptions.delete(id)
      addToast('Subscription deleted', 'success')
      setDeleteTarget(null)
      loadSubscriptions()
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }

  const handleTriggerPaymentCheck = async () => {
    setTaskLoading(true)
    setTaskResult(null)
    try {
      const result = await api.paymentTask.processOverdue()
      setTaskResult(result)
      loadSubscriptions()
    } catch (err: any) {
      setTaskResult({ checkedCount: 0, paidCount: 0, failedCount: 0, skippedCount: 0, details: [`Error: ${err.message}`] })
    } finally {
      setTaskLoading(false)
    }
  }

  const handleProcessSubscription = async (id: number) => {
    setProcessingSubId(id)
    try {
      const result = await api.paymentTask.processSubscription(id)
      addToast(`Processed: ${result.paidCount} paid, ${result.failedCount} failed, ${result.skippedCount} skipped`, 'success')
      setTaskResult(result)
      loadSubscriptions()
    } catch (err: any) {
      addToast(err.message, 'error')
    } finally {
      setProcessingSubId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Subscription"
        message="Are you sure you want to delete this subscription? This action cannot be undone."
        onConfirm={() => deleteTarget !== null && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
          <p className="text-sm text-slate-500 mt-1">Signed in as {user?.email}</p>
        </div>

        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">All Subscriptions</h2>
          {loadingSubs ? (
            <SkeletonTable rows={6} cols={10} />
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
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Price</th>
                    <th className="pb-2 font-medium">Billing</th>
                    <th className="pb-2 font-medium">Next Payment</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map(sub => (
                    <tr key={sub.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2.5 text-slate-600">{sub.customerId}</td>
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
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleProcessSubscription(sub.id)}
                            disabled={processingSubId === sub.id}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-xs rounded transition-colors cursor-pointer disabled:cursor-not-allowed"
                          >
                            {processingSubId === sub.id ? '...' : 'Process'}
                          </button>
                          <select
                            value={sub.status}
                            onChange={e => handleStatusChange(sub.id, e.target.value)}
                            className="border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                          >
                            <option value="Active">Active</option>
                            <option value="Passive">Passive</option>
                          </select>
                          <button
                            onClick={() => setDeleteTarget(sub.id)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Process Overdue Payments</h2>
              <p className="text-sm text-slate-500 mt-1">Manual trigger — the system also runs this automatically every 6 hours via background service.</p>
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
