// ADMIN LAYOUT с Sidebar (UPDATED PHASE 3)
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="p-6">
          <h2 className="text-2xl font-bold">VIREL v3</h2>
          <p className="text-sm text-muted-foreground">Operations Platform</p>
        </div>

        <nav className="px-3 space-y-1">
          <Link
            href="/admin/action-center"
            className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            🎯 Action Center
          </Link>

          <Link
            href="/admin/bookings"
            className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            📅 Bookings
          </Link>

          <Link
            href="/admin/inquiries"
            className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            📝 Inquiries
          </Link>

          <Link
            href="/admin/models"
            className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            👤 Models
          </Link>

          <Link
            href="/admin/models/new"
            className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm text-muted-foreground"
          >
            + Add Model
          </Link>

          <Link
            href="/admin/applications"
            className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            📋 Applications
          </Link>

          <Link
            href="/admin/availability-v2"
            className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            🗓️ Availability PRO
          </Link>

          <div className="pt-4 mt-4 border-t">
            <Link
              href="/admin/reviews"
              className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              ⭐ Reviews
            </Link>

            <Link
              href="/admin/incidents"
              className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              ⚠️ Incidents
            </Link>

            <Link
              href="/admin/fraud"
              className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              🛡️ Fraud Monitor
            </Link>

            <Link
              href="/admin/seo"
              className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              🔍 SEO Health
            </Link>

            <Link
              href="/admin/reports"
              className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              📋 Reports
            </Link>
          </div>

          {/* Phase 3 — Pricing & Membership */}
          <div className="pt-4 mt-4 border-t">
            <Link
              href="/admin/pricing"
              className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              💰 Pricing
            </Link>

            <Link
              href="/admin/membership"
              className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              👑 Membership
            </Link>

            <Link
              href="/admin/sla"
              className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              ⏱️ SLA Monitor
            </Link>

            <Link
              href="/admin/data-governance"
              className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              🔎 Data Quality
            </Link>
          </div>

          {/* Analytics */}
          <div className="pt-4 mt-4 border-t">
            <Link
              href="/admin/analytics/owner"
              className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              📈 Owner Analytics
            </Link>

            <Link
              href="/admin/analytics/unit-economics"
              className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              💹 Unit Economics
            </Link>

            <Link
              href="/admin/analytics"
              className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              📊 Analytics
            </Link>

            <Link
              href="/admin/dashboard"
              className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              📊 Dashboard
            </Link>

            <Link
              href="/admin/settings"
              className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              ⚙️ Settings
            </Link>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="text-sm">
            <p className="font-semibold">Admin User</p>
            <p className="text-muted-foreground">admin@virel.com</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
