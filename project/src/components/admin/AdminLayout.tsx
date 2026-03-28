import { useState, ReactNode } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  LayoutDashboard,
  Users,
  UserCog,
  BookOpen,
  DollarSign,
  Shield,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: string[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Ana Panel', icon: LayoutDashboard },
  { id: 'students', label: 'Öğrenci İşlemleri', icon: Users },
  { id: 'staff', label: 'Personel İşlemleri', icon: UserCog },
  { id: 'courses', label: 'Kurs İşlemleri', icon: BookOpen },
  { id: 'finance', label: 'Finansal İşlemler', icon: DollarSign, roles: ['admin', 'finance'] },
  { id: 'roles', label: 'Kullanıcı Tanımlama', icon: Shield, roles: ['admin'] },
  { id: 'settings', label: 'Sistem Ayarları', icon: Settings, roles: ['admin'] }
];

export default function AdminLayout({ children, currentPage, onNavigate }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { profile, signOut } = useAdminAuth();

  const filteredNavItems = navItems.filter(item =>
    !item.roles || item.roles.includes(profile?.role || '')
  );

  async function handleSignOut() {
    await signOut();
    window.location.href = '/admin';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <img src="/logo-icon.png" alt="Logo" className="w-10 h-10" />
                <div>
                  <h2 className="font-bold text-gray-900">Yönetim Paneli</h2>
                  <p className="text-xs text-gray-500">Kurs Merkezi</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {profile?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                {sidebarOpen && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-gray-900 truncate">{profile?.full_name || profile?.username}</p>
                    <p className="text-xs text-gray-500 truncate capitalize">{profile?.role}</p>
                  </div>
                )}
                {sidebarOpen && <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {profileMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    {sidebarOpen && <span>Çıkış Yap</span>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {navItems.find(item => item.id === currentPage)?.label || 'Yönetim Paneli'}
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
