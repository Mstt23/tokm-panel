import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, Check, X } from 'lucide-react';

interface Permission {
  id: string;
  module_name: string;
  permission_type: string;
  description: string;
}

interface RolePermission {
  role: string;
  permission_id: string;
  granted: boolean;
}

export default function RoleManagement() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('admin');

  const roles = ['admin', 'staff', 'teacher'];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [permissionsRes, rolePermissionsRes] = await Promise.all([
        supabase.from('permissions').select('*').order('module_name'),
        supabase.from('role_permissions').select('*')
      ]);

      if (permissionsRes.data) setPermissions(permissionsRes.data);
      if (rolePermissionsRes.data) setRolePermissions(rolePermissionsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const hasPermission = (role: string, permissionId: string): boolean => {
    const rp = rolePermissions.find(
      rp => rp.role === role && rp.permission_id === permissionId
    );
    return rp?.granted || false;
  };

  const togglePermission = async (role: string, permissionId: string) => {
    try {
      const currentValue = hasPermission(role, permissionId);
      const newValue = !currentValue;

      const { error } = await supabase
        .from('role_permissions')
        .upsert({
          role,
          permission_id: permissionId,
          granted: newValue
        }, {
          onConflict: 'role,permission_id'
        });

      if (error) throw error;

      setRolePermissions(prev => {
        const existing = prev.find(
          rp => rp.role === role && rp.permission_id === permissionId
        );
        if (existing) {
          return prev.map(rp =>
            rp.role === role && rp.permission_id === permissionId
              ? { ...rp, granted: newValue }
              : rp
          );
        } else {
          return [...prev, { role, permission_id: permissionId, granted: newValue }];
        }
      });
    } catch (error) {
      console.error('Error toggling permission:', error);
      alert('İzin güncellenirken hata oluştu');
    }
  };

  const getModulePermissions = (moduleName: string) => {
    return permissions.filter(p => p.module_name === moduleName);
  };

  const modules = [...new Set(permissions.map(p => p.module_name))];

  const getPermissionTypeLabel = (type: string, moduleName?: string) => {
    if (moduleName === 'schedule' && type === 'view') {
      return 'Görüntüle / dışa aktar';
    }
    const labels: Record<string, string> = {
      view: 'Görüntüle',
      create: 'Oluştur',
      edit: 'Düzenle',
      delete: 'Sil',
      export: 'Dışa Aktar'
    };
    return labels[type] || type;
  };

  const getModuleLabel = (module: string) => {
    const labels: Record<string, string> = {
      students: 'Öğrenciler',
      staff: 'Personel',
      courses: 'Dersler',
      schedule: 'Ders programı',
      finance: 'Finans',
      documents: 'Dökümanlar',
      reports: 'Raporlar',
      roles: 'Roller',
      settings: 'Ayarlar'
    };
    return labels[module] || module;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Yönetici',
      staff: 'Personel',
      teacher: 'Öğretmen'
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Rol ve Yetki Yönetimi</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Rol Seçin</label>
          <div className="flex items-center space-x-2">
            {roles.map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedRole === role
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getRoleLabel(role)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {modules.map(module => {
            const modulePerms = getModulePermissions(module);
            return (
              <div key={module} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">{getModuleLabel(module)}</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {modulePerms.map(perm => {
                    const granted = hasPermission(selectedRole, perm.id);
                    return (
                      <button
                        key={perm.id}
                        onClick={() => togglePermission(selectedRole, perm.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          granted
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {getPermissionTypeLabel(perm.permission_type, perm.module_name)}
                        </span>
                        {granted ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Not:</strong> Yetki değişiklikleri anında etkili olur. Kullanıcıların yeni yetkilerini görebilmesi için
            oturumlarını yenilemeleri gerekebilir.
          </p>
        </div>
      </div>
    </div>
  );
}
