import Link from 'next/link'
import { prisma } from '@/lib/db/client'

export default async function AdminDashboard() {
  // Get stats
  const [
    totalModels,
    activeModels,
    pendingBookings,
    todayBookings,
  ] = await Promise.all([
    prisma.model.count(),
    prisma.model.count({ where: { status: 'ACTIVE' } }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
  ])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold">Virel Admin</h1>
          <Link href="/" className="text-sm hover:text-accent">
            ← Back to Site
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-muted/30 rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-2">Total Models</div>
            <div className="text-3xl font-bold">{totalModels}</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-2">Active Models</div>
            <div className="text-3xl font-bold text-green-500">{activeModels}</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-2">Pending Bookings</div>
            <div className="text-3xl font-bold text-yellow-500">{pendingBookings}</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-2">Today's Bookings</div>
            <div className="text-3xl font-bold text-blue-500">{todayBookings}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/models"
            className="block bg-muted/30 hover:bg-muted/50 rounded-lg p-6 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Manage Models</h3>
                <p className="text-sm text-muted-foreground">Add, edit, or remove companions</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/bookings"
            className="block bg-muted/30 hover:bg-muted/50 rounded-lg p-6 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Bookings</h3>
                <p className="text-sm text-muted-foreground">View and manage bookings</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="block bg-muted/30 hover:bg-muted/50 rounded-lg p-6 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Users</h3>
                <p className="text-sm text-muted-foreground">Manage admin & reception staff</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/analytics"
            className="block bg-muted/30 hover:bg-muted/50 rounded-lg p-6 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Analytics</h3>
                <p className="text-sm text-muted-foreground">View reports and statistics</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="block bg-muted/30 hover:bg-muted/50 rounded-lg p-6 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Settings</h3>
                <p className="text-sm text-muted-foreground">Configure system settings</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/logs"
            className="block bg-muted/30 hover:bg-muted/50 rounded-lg p-6 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Logs</h3>
                <p className="text-sm text-muted-foreground">Telegram & AppSheet logs</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Bookings */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
          <div className="bg-muted/30 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Booking ID</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Client</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Model</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Date</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No recent bookings
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
