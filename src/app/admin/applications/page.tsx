// @ts-nocheck
import Link from 'next/link'
import { prisma } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

const statusStyles: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  reviewing: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const sourceStyles: Record<string, string> = {
  self: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  admin: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

export default async function ApplicationsPage() {
  let applications: any[] = []
  try {
    applications = await (prisma as any).modelApplication.findMany({
      orderBy: { createdAt: 'desc' },
    })
  } catch {}

  const counts = {
    all: applications.length,
    new: applications.filter(a => a.status === 'new').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Applications</h1>
          <p className="text-sm text-zinc-500 mt-1">Model intake forms (self-registration & back office)</p>
        </div>
        <Link href="/admin/models/new"
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors duration-150"
        >
          + Add Manually
        </Link>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-8">
        {Object.entries(counts).map(([key, val]) => (
          <div key={key} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 text-center">
            <p className="text-2xl font-semibold text-zinc-100">{val}</p>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">{key}</p>
          </div>
        ))}
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 font-medium">No applications yet</p>
          <p className="text-sm text-zinc-600 mt-1">Applications from /join and /admin/models/new will appear here</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Age / Nationality</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Rates</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Services</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Source</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {applications.map((app: any) => (
                <tr key={app.id} className="hover:bg-zinc-800/20 transition-colors duration-100">
                  <td className="px-4 py-3 text-sm font-medium text-zinc-200">{app.name}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {[app.age && `${app.age}y`, app.nationality].filter(Boolean).join(' \u00b7 ') || '\u2014'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {app.rate1hIn ? `\u00a3${app.rate1hIn}/1h` : '\u2014'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {app.services?.length ? `${app.services.length} services` : '\u2014'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${sourceStyles[app.source] || sourceStyles.admin}`}>
                      {app.source === 'self' ? 'Self-reg' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${statusStyles[app.status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {new Date(app.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/applications/${app.id}`}
                      className="text-amber-400 text-xs hover:text-amber-300 font-medium transition-colors duration-150"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
