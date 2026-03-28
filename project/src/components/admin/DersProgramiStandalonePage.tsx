import { useEffect, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import LoginPage from './LoginPage';
import DersProgramiModule from '../../../ai_programmer';
import { getSchedulePermissionsForRole } from '../../lib/schedule-permissions';
import { ShieldAlert } from 'lucide-react';

export default function DersProgramiStandalonePage() {
  const { user, profile, loading } = useAdminAuth();
  const [permLoading, setPermLoading] = useState(true);
  const [canView, setCanView] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!profile?.role) {
      if (!loading && !user) setPermLoading(false);
      return;
    }

    let cancelled = false;
    setPermLoading(true);
    getSchedulePermissionsForRole(profile.role)
      .then((p) => {
        if (!cancelled) {
          setCanView(p.canView);
          setCanEdit(p.canEdit);
          setPermLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          const admin = String(profile.role ?? '').toLowerCase() === 'admin';
          setCanView(admin);
          setCanEdit(admin);
          setPermLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.role, user, loading]);

  if (loading || (user && profile && permLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  if (!canView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <ShieldAlert className="w-14 h-14 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Yetkisiz erişim</h1>
          <p className="text-gray-600 text-sm">
            Ders programı modülünü görüntüleme yetkiniz yok. Yöneticinizden &quot;Ders programı — Görüntüle&quot; iznini talep edin.
          </p>
        </div>
      </div>
    );
  }

  return <DersProgramiModule canEdit={canEdit} supabaseUserId={user?.id ?? null} />;
}
