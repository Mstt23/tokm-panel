import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SettingItem {
  id?: string;
  value: string;
  isEditing?: boolean;
}

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string[];
  description: string;
}

export default function SettingsManagement() {
  const [settings, setSettings] = useState<Record<string, SettingItem[]>>({
    grade_levels: [],
    classrooms: [],
    subjects: [],
    departments: [],
    time_slots: []
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newItems, setNewItems] = useState<Record<string, string>>({});

  const settingLabels: Record<string, string> = {
    grade_levels: 'Sınıf Düzeyleri',
    classrooms: 'Derslikler',
    subjects: 'Dersler',
    departments: 'Bölümler',
    time_slots: 'Ders Saatleri'
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .in('setting_key', ['grade_levels', 'classrooms', 'subjects', 'departments', 'time_slots']);

      if (error) throw error;

      const loadedSettings: Record<string, SettingItem[]> = {};

      data?.forEach((setting: SystemSetting) => {
        loadedSettings[setting.setting_key] = setting.setting_value.map((value, index) => ({
          id: `${setting.setting_key}-${index}`,
          value,
          isEditing: false
        }));
      });

      setSettings(loadedSettings);
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (key: string) => {
    setSaving(key);
    try {
      const values = settings[key].map(item => item.value).filter(v => v.trim());

      const { error } = await supabase
        .from('system_settings')
        .update({
          setting_value: values,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', key);

      if (error) throw error;

      await loadSettings();
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      alert('Ayarlar kaydedilirken bir hata oluştu');
    } finally {
      setSaving(null);
    }
  };

  const addItem = (key: string) => {
    const newValue = newItems[key]?.trim();
    if (!newValue) return;

    setSettings(prev => ({
      ...prev,
      [key]: [...prev[key], { id: `new-${Date.now()}`, value: newValue, isEditing: false }]
    }));

    setNewItems(prev => ({ ...prev, [key]: '' }));
    saveSettings(key);
  };

  const removeItem = (key: string, index: number) => {
    if (!confirm('Bu öğeyi silmek istediğinizden emin misiniz?')) return;

    setSettings(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }));

    setTimeout(() => saveSettings(key), 100);
  };

  const startEdit = (key: string, index: number) => {
    setSettings(prev => ({
      ...prev,
      [key]: prev[key].map((item, i) => ({
        ...item,
        isEditing: i === index
      }))
    }));
  };

  const cancelEdit = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: prev[key].map(item => ({ ...item, isEditing: false }))
    }));
  };

  const updateItem = (key: string, index: number, newValue: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: prev[key].map((item, i) =>
        i === index ? { ...item, value: newValue } : item
      )
    }));
  };

  const saveEdit = (key: string, index: number) => {
    setSettings(prev => ({
      ...prev,
      [key]: prev[key].map((item, i) =>
        i === index ? { ...item, isEditing: false } : item
      )
    }));

    saveSettings(key);
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
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Sistem Ayarları</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(settingLabels).map(([key, label]) => (
          <div key={key} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
              {saving === key && (
                <span className="text-sm text-blue-600">Kaydediliyor...</span>
              )}
            </div>

            <div className="space-y-2 mb-4">
              {settings[key]?.map((item, index) => (
                <div key={item.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                  {item.isEditing ? (
                    <>
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => updateItem(key, index, e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEdit(key, index)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Kaydet"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => cancelEdit(key)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="İptal"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-gray-700">{item.value}</span>
                      <button
                        onClick={() => startEdit(key, index)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Düzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(key, index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
              <input
                type="text"
                value={newItems[key] || ''}
                onChange={(e) => setNewItems(prev => ({ ...prev, [key]: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && addItem(key)}
                placeholder={`Yeni ${label.toLowerCase()} ekle`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => addItem(key)}
                disabled={!newItems[key]?.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Ekle</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Bilgi</h4>
        <p className="text-blue-700 text-sm">
          Bu ayarlar sistem genelinde kullanılır. Ders programı oluştururken,
          öğrenci ve personel eklerken bu listelerden seçim yapabilirsiniz.
          Değişiklikler anında uygulanır.
        </p>
      </div>
    </div>
  );
}
