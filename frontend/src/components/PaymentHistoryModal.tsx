import { useEffect, useState } from 'react'
import { api } from '../services/api'

interface Payment {
  id: number
  subscriptionId: number
  amount: number
  paymentDate: string
  period: string
  status: string
}

interface Props {
  subscriptionId: number
  providerName: string
  onClose: () => void
}

export default function PaymentHistoryModal({ subscriptionId, providerName, onClose }: Props) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.payments.getBySubscriptionId(subscriptionId)
      .then(setPayments)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [subscriptionId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Payment History</h2>
            <p className="text-sm text-slate-500">{providerName} — Subscription #{subscriptionId}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none cursor-pointer">&times;</button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-slate-500">Loading payments...</span>
          </div>
        )}

        {!loading && payments.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-12">No payments recorded yet.</p>
        )}

        {!loading && payments.length > 0 && (
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Period</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 text-slate-600 font-mono text-xs">{payments.length - i}</td>
                    <td className="py-2.5 text-slate-800 font-medium">${p.amount.toFixed(2)}</td>
                    <td className="py-2.5 text-slate-600">{new Date(p.paymentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-2.5 text-slate-600 font-mono text-xs">{p.period}</td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'Success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button onClick={onClose} className="mt-4 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer">
          Close
        </button>
      </div>
    </div>
  )
}
