import { supabase } from './supabase';

export interface SchedulePermissions {
  canView: boolean;
  canEdit: boolean;
}

function isAdminRole(role: string | undefined | null): boolean {
  return String(role ?? '')
    .trim()
    .toLowerCase() === 'admin';
}

/**
 * Ders programı izinleri. Yönetici rolü veritabanında schedule satırları olmasa da tam erişime sahiptir
 * (migration uygulanmamış veya eski kurulumlar için).
 */
export async function getSchedulePermissionsForRole(role: string): Promise<SchedulePermissions> {
  if (isAdminRole(role)) {
    return { canView: true, canEdit: true };
  }

  const { data: permRows, error: permErr } = await supabase
    .from('permissions')
    .select('id, permission_type')
    .eq('module_name', 'schedule');

  if (permErr || !permRows?.length) {
    return { canView: false, canEdit: false };
  }

  const { data: rpRows, error: rpErr } = await supabase
    .from('role_permissions')
    .select('permission_id, granted')
    .eq('role', role);

  if (rpErr || !rpRows) {
    return { canView: false, canEdit: false };
  }

  const grantedByPermId = new Map(rpRows.map((r) => [r.permission_id, r.granted === true]));

  let canView = false;
  let canEdit = false;
  for (const p of permRows) {
    if (!grantedByPermId.get(p.id)) continue;
    if (p.permission_type === 'view') canView = true;
    if (p.permission_type === 'edit') canEdit = true;
  }

  return { canView, canEdit };
}
