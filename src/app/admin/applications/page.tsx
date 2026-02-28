// @ts-nocheck
import Link from 'next/link'
import { prisma } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

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

  const statusColor: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    reviewing: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-muted-foreground text-sm">Model intake forms (self-registration & back office)</p>
        </div>
        <Link href="/admin/models/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          + Add Manually
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {Object.entries(counts).map(([key, val]) => (
          <div key={key} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{val}</p>
            <p className="text-xs text-muted-foreground capitalize mt-1">{key}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {applications.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-4xl mb-4">📋</p>
          <p className="font-medium">No applications yet</p>
          <p className="text-sm mt-1">Applications from /join and /admin/models/new will appear here</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Age / Nationality</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rates</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Services</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {applications.map((app: any) => (
                <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-semibold">{app.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {[app.age && `${app.age}y`, app.nationality].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {app.rate1hIn ? `£${app.rate1hIn}/1h` : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {app.services?.length ? `${app.services.length} services` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${app.source === 'self' ? 'bg-purple-100 text-purple-700' : 'bg-zinc-100 text-zinc-600'}`}>
                      {app.source === 'self' ? 'Self-reg' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColor[app.status] || 'bg-muted text-muted-foreground'}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(app.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/applications/${app.id}`}
                      className="text-primary text-xs hover:underline font-medium"
                    >
                      View →
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
