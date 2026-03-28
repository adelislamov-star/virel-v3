// ADMIN LAYOUT — new sidebar structure
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { siteConfig } from '@/../config/site';
import {
  UserCheck, CalendarDays, Clock, ClipboardList, RefreshCw,
  Star, Users, Shield, MessageSquare, Target,
  AppWindow, AlertTriangle, CreditCard,
  LineChart, Activity, MapPin, PieChart,
  BarChart3, TrendingUp, RotateCcw, Search, FileText,
  DollarSign, Crown, ConciergeBell,
  FolderOpen, Tag, SlidersHorizontal, Wrench, ListOrdered, Layers, BookOpen,
  Timer, Database, Bell, Briefcase, Settings, LogOut,
} from 'lucide-react';

interface Badges {
  bookingRequests?: number;
  reviews?: number;
  fraud?: number;
  leads?: number;
  actionCenter?: number;
  incidents?: number;
  payments?: number;
}

const sections = [
  {
    label: 'Core',
    items: [
      { href: '/admin/models',             label: 'Models',             icon: UserCheck,     badge: null },
      { href: '/admin/bookings',           label: 'Bookings',           icon: CalendarDays,  badge: null },
      { href: '/admin/availability',       label: 'Availability',       icon: Clock,         badge: null },
      { href: '/admin/booking-requests',   label: 'Booking Requests',   icon: ClipboardList, badge: 'bookingRequests' },
      { href: '/admin/alternative-offers', label: 'Alternative Offers', icon: RefreshCw,     badge: null },
      { href: '/admin/reviews',            label: 'Reviews',            icon: Star,          badge: 'reviews' },
      { href: '/admin/clients',            label: 'Clients',            icon: Users,         badge: null },
      { href: '/admin/fraud-monitor',       label: 'Fraud Monitor',      icon: Shield,        badge: 'fraud' },
      { href: '/admin/leads',              label: 'Leads',              icon: MessageSquare, badge: 'leads' },
      { href: '/admin/action-center',      label: 'Action Center',      icon: Target,        badge: 'actionCenter' },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/admin/applications', label: 'Applications', icon: AppWindow,     badge: null },
      { href: '/admin/incidents',    label: 'Incidents',    icon: AlertTriangle, badge: 'incidents' },
      { href: '/admin/payments',     label: 'Payments',     icon: CreditCard,    badge: 'payments' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { href: '/admin/dashboard',                   label: 'Dashboard',         icon: LineChart, badge: null },
      { href: '/admin/model-performance',             label: 'Model Performance', icon: Activity,  badge: null },
      { href: '/admin/staff-performance',           label: 'Staff Performance', icon: UserCheck, badge: null },
      { href: '/admin/demand',                      label: 'Demand',            icon: MapPin,    badge: null },
      { href: '/admin/owner-analytics',              label: 'Owner Analytics',   icon: PieChart,  badge: null },
    ],
  },
  {
    label: 'Performance',
    items: [
      { href: '/admin/unit-economics',            label: 'Unit Economics', icon: BarChart3,  badge: null },
      { href: '/admin/lost-revenue',             label: 'Lost Revenue',   icon: TrendingUp, badge: null },
      { href: '/admin/retention',                label: 'Retention',      icon: RotateCcw,  badge: null },
      { href: '/admin/seo-health',               label: 'SEO Health',     icon: Search,     badge: null },
      { href: '/admin/reports',                  label: 'Reports',        icon: FileText,   badge: null },
    ],
  },
  {
    label: 'Commercial',
    items: [
      { href: '/admin/pricing',    label: 'Pricing',    icon: DollarSign,    badge: null },
      { href: '/admin/membership', label: 'Membership', icon: Crown,         badge: null },
      { href: '/admin/concierge',  label: 'Concierge',  icon: ConciergeBell, badge: null },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/admin/category-groups',    label: 'Category Groups', icon: FolderOpen,        badge: null },
      { href: '/admin/categories',         label: 'Categories',      icon: Tag,               badge: null },
      { href: '/admin/attributes',         label: 'Attributes',      icon: SlidersHorizontal, badge: null },
      { href: '/admin/services',           label: 'Services',        icon: Wrench,            badge: null },
      { href: '/admin/call-rates',         label: 'Call Rates',      icon: ListOrdered,       badge: null },
      { href: '/admin/locations',          label: 'Locations',       icon: Layers,            badge: null },
      { href: '/admin/blog',               label: 'Blog',            icon: BookOpen,          badge: null },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/sla-monitor',     label: 'SLA Monitor',   icon: Timer,     badge: null },
      { href: '/admin/data-governance', label: 'Data Quality',  icon: Database,  badge: null },
      { href: '/admin/notifications',   label: 'Notifications', icon: Bell,      badge: null },
      { href: '/admin/jobs',            label: 'Jobs',          icon: Briefcase, badge: null },
      { href: '/admin/audit-log',       label: 'Audit Log',     icon: Search,    badge: null },
      { href: '/admin/settings',        label: 'Settings',      icon: Settings,  badge: null },
    ],
  },
];

function BadgeCount({ count }: { count: number }) {
  if (!count || count <= 0) return null;
  return (
    <span className="ml-auto flex-shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-semibold px-1 leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
}

interface CurrentUser {
  name: string;
  email: string;
  roles: string[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/admin/login') return <>{children}</>;
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [badges, setBadges] = useState<Badges>({});

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.success) setUser(d.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/v1/system/counts');
        if (!res.ok) return;
        const json = await res.json();
        if (json?.success && json?.data) {
          setBadges({
            bookingRequests: json.data.bookingRequestsNew  ?? 0,
            reviews:         json.data.reviewsNew         ?? 0,
            fraud:           json.data.fraudAlerts        ?? 0,
            leads:           json.data.leadsOpen          ?? 0,
            actionCenter:    json.data.actionCenterAlerts ?? 0,
            incidents:       json.data.incidentsOpen      ?? 0,
            payments:        json.data.paymentsPending    ?? 0,
          });
        }
      } catch {
        // non-critical
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const handleSignOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }, [router]);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--admin-bg)' }}>
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-zinc-800/50" style={{ background: 'var(--admin-bg)' }}>
        <div className="px-5 pt-6 pb-4">
          <p className="text-sm font-semibold tracking-widest text-zinc-400 uppercase">{siteConfig.name}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">Operations Platform</p>
        </div>

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
                const badgeCount = item.badge ? (badges[item.badge as keyof Badges] ?? 0) : 0;
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
                    <span className="flex-1 min-w-0 truncate">{item.label}</span>
                    <BadgeCount count={badgeCount} />
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-zinc-800/50">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-300 truncate">{user?.name ?? '...'}</p>
              <p className="text-[11px] text-zinc-600 truncate">{user?.email ?? ''}</p>
              {user?.roles?.[0] && (
                <p className="text-[10px] text-amber-500/70 uppercase tracking-wider mt-0.5">{user.roles[0]}</p>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
              title="Sign out"
            >
              <LogOut size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden" style={{ background: 'var(--admin-bg)' }}>
        {children}
      </main>
    </div>
  );
}
