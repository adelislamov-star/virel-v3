// ADMIN LAYOUT — Linear/Notion style sidebar
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Target, CalendarDays, MessageSquare, Users, Star,
  AlertTriangle, Shield, FileText, AppWindow, Clock,
  DollarSign, Crown, BarChart3, LineChart, TrendingUp,
  Timer, Database, Settings, Layers
} from 'lucide-react';

const sections = [
  {
    label: 'Core',
    items: [
      { href: '/admin/action-center', label: 'Action Center', icon: Target },
      { href: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
      { href: '/admin/inquiries', label: 'Inquiries', icon: MessageSquare },
      { href: '/admin/models', label: 'Models', icon: Users },
    ]
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/reviews', label: 'Reviews', icon: Star },
      { href: '/admin/incidents', label: 'Incidents', icon: AlertTriangle },
      { href: '/admin/fraud', label: 'Fraud Monitor', icon: Shield },
      { href: '/admin/services', label: 'Service Catalogue', icon: Layers },
      { href: '/admin/applications', label: 'Applications', icon: AppWindow },
      { href: '/admin/availability-v2', label: 'Availability PRO', icon: Clock },
    ]
  },
  {
    label: 'Business',
    items: [
      { href: '/admin/pricing', label: 'Pricing', icon: DollarSign },
      { href: '/admin/membership', label: 'Membership', icon: Crown },
      { href: '/admin/reports', label: 'Reports', icon: FileText },
      { href: '/admin/seo', label: 'SEO Health', icon: BarChart3 },
    ]
  },
  {
    label: 'Analytics',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LineChart },
      { href: '/admin/analytics/owner', label: 'Owner Analytics', icon: TrendingUp },
      { href: '/admin/analytics/unit-economics', label: 'Unit Economics', icon: BarChart3 },
    ]
  },
  {
    label: 'System',
    items: [
      { href: '/admin/sla', label: 'SLA Monitor', icon: Timer },
      { href: '/admin/data-governance', label: 'Data Quality', icon: Database },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--admin-bg)' }}>
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-zinc-800/50" style={{ background: 'var(--admin-bg)' }}>
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <p className="text-sm font-semibold tracking-widest text-zinc-400 uppercase">Virel</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">Operations Platform</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {sections.map((section, si) => (
            <div key={section.label}>
              {si > 0 && <div className="h-px bg-zinc-800/30 my-2 mx-3" />}
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mt-4 mb-2 px-3">
                {section.label}
              </p>
              {section.items.map(item => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                      isActive
                        ? 'text-white bg-zinc-800/70'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.5} className="flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-800/50">
          <p className="text-xs text-zinc-600">admin@virel.com</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto" style={{ background: 'var(--admin-bg)' }}>
        {children}
      </main>
    </div>
  );
}
