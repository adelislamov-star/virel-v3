// ADMIN LAYOUT с Sidebar (UPDATED WITH AVAILABILITY V2)
import Link from 'next/link';
import './admin.css';

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
            href="/admin/availability-v2"
            className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            🗓️ Availability PRO
          </Link>
          
          <div className="pt-4 mt-4 border-t">
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
