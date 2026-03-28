-- Ders programı modülü: görüntüleme+dışa aktarma (view), düzenleme (edit)
INSERT INTO permissions (module_name, permission_type, description) VALUES
  ('schedule', 'view', 'Ders programını görüntüleme ve dışa aktarma'),
  ('schedule', 'edit', 'Ders programı düzenleme')
ON CONFLICT (module_name, permission_type) DO NOTHING;

-- Yönetici: her iki yetki
INSERT INTO role_permissions (role, permission_id, granted)
SELECT 'admin', p.id, true
FROM permissions p
WHERE p.module_name = 'schedule'
ON CONFLICT (role, permission_id) DO UPDATE SET granted = true;

-- Personel / öğretmen: yalnızca görüntüleme+dışa aktarma (düzenleme kapalı; panelden açılabilir)
INSERT INTO role_permissions (role, permission_id, granted)
SELECT r.role, p.id, (p.permission_type = 'view')
FROM permissions p
CROSS JOIN (VALUES ('staff'), ('teacher')) AS r(role)
WHERE p.module_name = 'schedule'
ON CONFLICT (role, permission_id) DO UPDATE SET granted = EXCLUDED.granted;
