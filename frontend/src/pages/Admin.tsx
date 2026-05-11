import Navbar from '../components/Navbar'

export default function Admin() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-800">Admin Panel</h2>
          <p className="text-slate-500 mt-2">Admin features coming soon.</p>
        </div>
      </main>
    </div>
  )
}
