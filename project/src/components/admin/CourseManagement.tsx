import { useEffect, useState } from 'react';
import { BookOpen, FileText, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { getSchedulePermissionsForRole } from '../../lib/schedule-permissions';
import MinistryDocuments from './courses/MinistryDocuments';
import ReportIssue from './courses/ReportIssue';

type CourseSection = 'menu' | 'documents' | 'reports';

function openDersProgramiWindow() {
  const url = `${window.location.origin}/admin/ders-programi`;
  const features = 'width=1400,height=900,scrollbars=yes,resizable=yes,menubar=no,toolbar=no';
  window.open(url, 'dersProgrami', features);
}

export default function CourseManagement() {
  const { profile } = useAdminAuth();
  const [activeSection, setActiveSection] = useState<CourseSection>('menu');
  const [scheduleCanView, setScheduleCanView] = useState(false);
  const [scheduleCanEdit, setScheduleCanEdit] = useState(false);
  const [schedulePermLoaded, setSchedulePermLoaded] = useState(false);

  useEffect(() => {
    if (!profile?.role) return;
    let cancelled = false;
    getSchedulePermissionsForRole(profile.role)
      .then((p) => {
        if (!cancelled) {
          setScheduleCanView(p.canView);
          setScheduleCanEdit(p.canEdit);
          setSchedulePermLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          const admin = String(profile.role ?? '').toLowerCase() === 'admin';
          setScheduleCanView(admin);
          setScheduleCanEdit(admin);
          setSchedulePermLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.role]);

  if (activeSection === 'documents') {
    return <MinistryDocuments onBack={() => setActiveSection('menu')} />;
  }

  if (activeSection === 'reports') {
    return <ReportIssue onBack={() => setActiveSection('menu')} />;
  }

  const scheduleDescription = scheduleCanEdit
    ? 'Ders Programlarını görüntüleyin, dışa aktarın'
    : 'Ders Programlarını görüntüleyin ve dışa aktarın (düzenleme yetkisi gerekir)';

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BookOpen className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Ders Yönetimi</h2>
      </div>

      <div className="flex items-center justify-center min-h-[500px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full px-4">
          <button
            type="button"
            onClick={() => scheduleCanView && openDersProgramiWindow()}
            disabled={!schedulePermLoaded || !scheduleCanView}
            title={
              !schedulePermLoaded
                ? 'Yetkiler yükleniyor…'
                : !scheduleCanView
                  ? 'Ders programı görüntüleme yetkiniz yok'
                  : undefined
            }
            className={`group relative bg-white rounded-2xl shadow-lg transition-all duration-300 p-8 border-2 text-left ${
              schedulePermLoaded && scheduleCanView
                ? 'border-gray-200 hover:border-blue-500 hover:shadow-2xl cursor-pointer'
                : 'border-gray-100 opacity-60 cursor-not-allowed shadow-md'
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-4 pointer-events-none">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ders Programı</h3>
                <p className="text-gray-600 text-sm">{scheduleDescription}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('documents')}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-gray-200 hover:border-green-500"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Bakanlık Evrakları</h3>
                <p className="text-gray-600 text-sm">
                  Resmi evrakları yönetin ve görüntüleyin
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('reports')}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-gray-200 hover:border-orange-500"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="w-10 h-10 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sorun Bildir</h3>
                <p className="text-gray-600 text-sm">
                  Teknik veya idari sorunları raporlayın
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
