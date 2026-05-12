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

interface CustomerInfo {
  id: number
  firstName: string
  lastName: string
  email: string
  createdDate: string
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
  const [emailLoading, setEmailLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [processingSubId, setProcessingSubId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [customers, setCustomers] = useState<CustomerInfo[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState<number | null>(null)
  const [customerForm, setCustomerForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [createForm, setCreateForm] = useState({
    customerId: '',
    providerName: '',
    category: '',
    price: '',
    billingCycle: 'Monthly',
    nextPaymentDate: '',
  })

  const loadSubscriptions = () => {
    setLoadingSubs(true)
    api.subscriptions.getAll()
      .then(setSubscriptions)
      .catch(console.error)
      .finally(() => setLoadingSubs(false))
  }

  const loadCustomers = () => {
    setLoadingCustomers(true)
    api.customers.getAll()
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setLoadingCustomers(false))
  }

  useEffect(() => { loadSubscriptions(); loadCustomers() }, [])

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

  const handleSendOverdueEmails = async () => {
    setEmailLoading(true)
    try {
      const result = await api.paymentTask.sendOverdueEmails()
      addToast(`Overdue emails sent: ${result.overdueEmailsSent}`, 'success')
    } catch (err: any) {
      addToast(err.message, 'error')
    } finally {
      setEmailLoading(false)
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

  const filteredSubs = subscriptions.filter(s =>
    s.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.subscriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customerId.toString().includes(searchTerm) ||
    s.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateSubscription = async () => {
    try {
      await api.subscriptions.create({
        customerId: parseInt(createForm.customerId),
        providerName: createForm.providerName,
        category: createForm.category,
        price: parseFloat(createForm.price),
        billingCycle: createForm.billingCycle,
        nextPaymentDate: new Date(createForm.nextPaymentDate).toISOString(),
      })
      addToast('Subscription created', 'success')
      setShowCreateForm(false)
      setCreateForm({ customerId: '', providerName: '', category: '', price: '', billingCycle: 'Monthly', nextPaymentDate: '' })
      loadSubscriptions()
    } catch (err: any) {
      addToast(err.message, 'error')
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

  const handleCreateCustomer = async () => {
    try {
      await api.customers.create(customerForm)
      addToast('Customer created', 'success')
      setShowCreateCustomer(false)
      setCustomerForm({ firstName: '', lastName: '', email: '', password: '' })
      loadCustomers()
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }

  const handleDeleteCustomer = async (id: number) => {
    try {
      await api.customers.delete(id)
      addToast('Customer deleted', 'success')
      setDeleteCustomerTarget(null)
      loadCustomers()
    } catch (err: any) {
      addToast(err.message, 'error')
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
      <ConfirmDialog
        open={deleteCustomerTarget !== null}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This will also remove all their subscriptions. This action cannot be undone."
        onConfirm={() => deleteCustomerTarget !== null && handleDeleteCustomer(deleteCustomerTarget)}
        onCancel={() => setDeleteCustomerTarget(null)}
      />
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
          <p className="text-sm text-slate-500 mt-1">Signed in as {user?.email}</p>
        </div>

        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">All Subscriptions</h2>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
              />
              <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {showCreateForm ? 'Cancel' : '+ Create Subscription'}
            </button>
          </div>
          </div>

          {showCreateForm && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">New Subscription</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <input placeholder="Customer ID" value={createForm.customerId} onChange={e => setCreateForm(f => ({ ...f, customerId: e.target.value }))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input placeholder="Provider Name" value={createForm.providerName} onChange={e => setCreateForm(f => ({ ...f, providerName: e.target.value }))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input placeholder="Category" value={createForm.category} onChange={e => setCreateForm(f => ({ ...f, category: e.target.value }))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input placeholder="Price" type="number" step="0.01" value={createForm.price} onChange={e => setCreateForm(f => ({ ...f, price: e.target.value }))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <select value={createForm.billingCycle} onChange={e => setCreateForm(f => ({ ...f, billingCycle: e.target.value }))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                </select>
                <input placeholder="Next Payment Date" type="date" value={createForm.nextPaymentDate} onChange={e => setCreateForm(f => ({ ...f, nextPaymentDate: e.target.value }))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <button
                onClick={handleCreateSubscription}
                disabled={!createForm.customerId || !createForm.providerName || !createForm.price || !createForm.nextPaymentDate}
                className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Add Subscription
              </button>
            </div>
          )}

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
                  {filteredSubs.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-8 text-slate-400 text-sm">No subscriptions match your search.</td></tr>
                  ) : (filteredSubs.map(sub => (
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
                  )))}
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

        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Send Overdue Email Notifications</h2>
              <p className="text-sm text-slate-500 mt-1">Send overdue payment emails to customers with past-due subscriptions.</p>
            </div>
            <button
              onClick={handleSendOverdueEmails}
              disabled={emailLoading}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {emailLoading ? 'Sending...' : 'Send Overdue Emails'}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Customer Management</h2>
            <button
              onClick={() => setShowCreateCustomer(!showCreateCustomer)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {showCreateCustomer ? 'Cancel' : '+ Create Customer'}
            </button>
          </div>

          {showCreateCustomer && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">New Customer</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input placeholder="First Name" value={customerForm.firstName} onChange={e => setCustomerForm(f => ({ ...f, firstName: e.target.value }))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input placeholder="Last Name" value={customerForm.lastName} onChange={e => setCustomerForm(f => ({ ...f, lastName: e.target.value }))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input placeholder="Email" type="email" value={customerForm.email} onChange={e => setCustomerForm(f => ({ ...f, email: e.target.value }))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input placeholder="Password" type="password" value={customerForm.password} onChange={e => setCustomerForm(f => ({ ...f, password: e.target.value }))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <button
                onClick={handleCreateCustomer}
                disabled={!customerForm.firstName || !customerForm.lastName || !customerForm.email || !customerForm.password}
                className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Add Customer
              </button>
            </div>
          )}

          {loadingCustomers ? (
            <p className="text-slate-400 text-sm text-center py-8">Loading customers...</p>
          ) : customers.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No customers yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-2 font-medium">ID</th>
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Registered</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2.5 text-slate-600 font-mono text-xs">{c.id}</td>
                      <td className="py-2.5 text-slate-800 font-medium">{c.firstName} {c.lastName}</td>
                      <td className="py-2.5 text-slate-600">{c.email}</td>
                      <td className="py-2.5 text-slate-600">{formatDate(c.createdDate)}</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => setDeleteCustomerTarget(c.id)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors cursor-pointer"
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
      </main>
    </div>
  )
}
