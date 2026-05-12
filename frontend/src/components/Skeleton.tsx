export function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-2">
          <div className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
      <div className="h-4 w-16 bg-slate-200 rounded mb-3" />
      <div className="h-6 w-3/4 bg-slate-200 rounded mb-2" />
      <div className="h-8 w-24 bg-slate-200 rounded mt-3" />
      <div className="h-4 w-20 bg-slate-200 rounded mt-2" />
    </div>
  )
}

export function SkeletonTable({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="animate-pulse">
      <div className="flex gap-4 mb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 rounded flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-3 border-b border-slate-100">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 bg-slate-200 rounded flex-1" style={{ opacity: 1 - c * 0.1 }} />
          ))}
        </div>
      ))}
    </div>
  )
}
