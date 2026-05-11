import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'

export default function Admin() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
          <p className="text-sm text-slate-500 mt-1">Signed in as {user?.email}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">System Status</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">Operational</p>
            <p className="text-xs text-slate-400 mt-1">All services running</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Mock Revenue</p>
            <p className="mt-2 text-3xl font-bold text-slate-800">$47,892</p>
            <p className="text-xs text-slate-400 mt-1">This month</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Registered Users</p>
            <p className="mt-2 text-3xl font-bold text-slate-800">3</p>
            <p className="text-xs text-slate-400 mt-1">Seed customers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Recent Payments</h2>
            <p className="text-sm text-slate-400">No payments recorded yet. Trigger a payment check from the Dashboard.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">System Overview</h2>
            <ul className="text-sm space-y-2 text-slate-600">
              <li className="flex justify-between"><span>API Status</span><span className="text-emerald-600 font-medium">Online</span></li>
              <li className="flex justify-between"><span>Database</span><span className="text-emerald-600 font-medium">Connected</span></li>
              <li className="flex justify-between"><span>Mock Bank Service</span><span className="text-emerald-600 font-medium">Available</span></li>
              <li className="flex justify-between"><span>Notification Service</span><span className="text-emerald-600 font-medium">Active</span></li>
              <li className="flex justify-between"><span>Active Subscriptions</span><span className="text-slate-800 font-medium">5</span></li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
