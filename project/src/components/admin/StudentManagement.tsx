import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  Receipt,
  DollarSign,
  Download,
  Filter,
  Upload
} from 'lucide-react';
import StudentForm from './students/StudentForm';
import BulkImport from './students/BulkImport';

interface Student {
  id: string;
  tc_no: string;
  first_name: string;
  last_name: string;
  phone: string;
  grade: string;
  department: string;
  group_course: string;
  has_private_lesson: boolean;
  total_fee: number;
  paid_amount: number;
  remaining_amount: number;
  school_name: string;
  status: string;
}

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, filterGrade, filterDepartment]);

  async function loadStudents() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterStudents() {
    let filtered = students;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.first_name.toLowerCase().includes(search) ||
          s.last_name.toLowerCase().includes(search) ||
          s.tc_no.includes(search)
      );
    }

    if (filterGrade) {
      filtered = filtered.filter(s => s.grade === filterGrade);
    }

    if (filterDepartment) {
      filtered = filtered.filter(s => s.department === filterDepartment);
    }

    setFilteredStudents(filtered);
  }

  async function deleteStudent(id: string) {
    if (!confirm('Bu öğrenciyi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      loadStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Öğrenci silinirken hata oluştu');
    }
  }

  function downloadList() {
    const headers = ['TC', 'Ad', 'Soyad', 'Telefon', 'Sınıf', 'Bölüm', 'Grup', 'Toplam Ücret', 'Ödenen', 'Kalan', 'Durum'];
    const rows = filteredStudents.map(s => [
      s.tc_no,
      s.first_name,
      s.last_name,
      s.phone,
      s.grade,
      s.department,
      s.group_course || '',
      s.total_fee,
      s.paid_amount,
      s.remaining_amount,
      s.status === 'active' ? 'Aktif' : 'Pasif'
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ogrenciler_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const grades = [...new Set(students.map(s => s.grade).filter(Boolean))];
  const departments = [...new Set(students.map(s => s.department).filter(Boolean))];

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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Öğrenci Yönetimi</h2>
          <p className="text-gray-600">Toplam: {filteredStudents.length} öğrenci</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadList}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            Dışa Aktar
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
              setSelectedStudent(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Öğrenci Ekle
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ad, soyad veya TC ile ara..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Tüm sınıflar</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Tüm bölümler</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setSearchTerm('');
              setFilterGrade('');
              setFilterDepartment('');
            }}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Filtreleri Temizle
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">TC</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Ad Soyad</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Telefon</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Sınıf</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Bölüm</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Toplam</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Ödenen</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Kalan</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Durum</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600">{student.tc_no}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {student.first_name} {student.last_name}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{student.phone}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{student.grade}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{student.department}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">₺{student.total_fee?.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-green-600">₺{student.paid_amount?.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-orange-600">₺{student.remaining_amount?.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        student.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowForm(true);
                        }}
                        className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 hover:bg-green-50 text-green-600 rounded transition-colors"
                        title="Sözleşme"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 hover:bg-purple-50 text-purple-600 rounded transition-colors"
                        title="Makbuz"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 hover:bg-orange-50 text-orange-600 rounded transition-colors"
                        title="Ödeme"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteStudent(student.id)}
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

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Öğrenci bulunamadı</p>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <StudentForm
          student={selectedStudent}
          onClose={() => {
            setShowForm(false);
            setSelectedStudent(null);
          }}
          onSave={() => {
            setShowForm(false);
            setSelectedStudent(null);
            loadStudents();
          }}
        />
      )}

      {showBulkImport && (
        <BulkImport
          type="students"
          onClose={() => setShowBulkImport(false)}
          onComplete={() => {
            loadStudents();
          }}
        />
      )}
    </div>
  );
}
