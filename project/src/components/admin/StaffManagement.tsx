import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Edit, Trash2, Download, UserCog, Upload } from 'lucide-react';
import StaffForm from './staff/StaffForm';
import BulkImport from './students/BulkImport';

interface Staff {
  id: string;
  tc_no: string;
  first_name: string;
  last_name: string;
  phone: string;
  position: string;
  monthly_salary: number;
  subjects: string[];
  hire_date: string;
  status: string;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [staff, searchTerm]);

  async function loadStaff() {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterStaff() {
    let filtered = staff;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.first_name.toLowerCase().includes(search) ||
          s.last_name.toLowerCase().includes(search) ||
          s.tc_no.includes(search) ||
          s.position.toLowerCase().includes(search)
      );
    }

    setFilteredStaff(filtered);
  }

  async function deleteStaff(id: string) {
    if (!confirm('Bu personeli silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase.from('staff').delete().eq('id', id);
      if (error) throw error;
      loadStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Personel silinirken hata oluştu');
    }
  }

  function downloadList() {
    const headers = ['TC', 'Ad', 'Soyad', 'Telefon', 'Pozisyon', 'Dersler', 'Aylık Maaş', 'İşe Başlama', 'Durum'];
    const rows = filteredStaff.map(s => [
      s.tc_no,
      s.first_name,
      s.last_name,
      s.phone,
      s.position,
      s.subjects?.join(';') || '',
      s.monthly_salary,
      s.hire_date,
      s.status === 'active' ? 'Aktif' : 'Pasif'
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personel_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserCog className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Personel İşlemleri</h2>
            <p className="text-gray-600">Toplam: {filteredStaff.length} personel</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadList}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            Listeyi İndir
          </button>
          <button
            onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Toplu İçe Aktar
          </button>
          <button
            onClick={() => {
              setSelectedStaff(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Personel Ekle
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ad, soyad, TC veya pozisyon ile ara..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">TC</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Ad Soyad</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Telefon</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Pozisyon</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Dersler</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Maaş</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">İşe Başlama</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Durum</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((member) => (
                <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600">{member.tc_no}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {member.first_name} {member.last_name}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{member.phone}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{member.position}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {member.subjects?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {member.subjects.slice(0, 2).map((sub, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {sub}
                          </span>
                        ))}
                        {member.subjects.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            +{member.subjects.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    ₺{member.monthly_salary?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(member.hire_date).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        member.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {member.status === 'active' ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedStaff(member);
                          setShowForm(true);
                        }}
                        className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteStaff(member.id)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Personel bulunamadı</p>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <StaffForm
          staff={selectedStaff}
          onClose={() => {
            setShowForm(false);
            setSelectedStaff(null);
          }}
          onSave={() => {
            setShowForm(false);
            setSelectedStaff(null);
            loadStaff();
          }}
        />
      )}

      {showBulkImport && (
        <BulkImport
          type="staff"
          onClose={() => setShowBulkImport(false)}
          onComplete={() => loadStaff()}
        />
      )}
    </div>
  );
}
