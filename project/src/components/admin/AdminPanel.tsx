import { useState } from 'react';
import { AdminAuthProvider, useAdminAuth } from '../../contexts/AdminAuthContext';
import LoginPage from './LoginPage';
import AdminLayout from './AdminLayout';
import Dashboard from './Dashboard';
import StudentManagement from './StudentManagement';
import StaffManagement from './StaffManagement';
import CourseManagement from './CourseManagement';
import FinanceManagement from './FinanceManagement';
import RoleManagement from './RoleManagement';
import SettingsManagement from './SettingsManagement';

function AdminPanelContent() {
  const { user, profile, loading } = useAdminAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginPage onLoginSuccess={() => setCurrentPage('dashboard')} />;
  }

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <StudentManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'courses':
        return <CourseManagement />;
      case 'finance':
        return <FinanceManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'settings':
        return <SettingsManagement />;
      default:
        return <Dashboard />;
    }
  }

  return (
    <AdminLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </AdminLayout>
  );
}

export default function AdminPanel() {
  return (
    <AdminAuthProvider>
      <AdminPanelContent />
    </AdminAuthProvider>
  );
}
