import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, FileText, CreditCard, Calendar, Download } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Student {
  id: string;
  student_no: string;
  tc_no: string;
  first_name: string;
  last_name: string;
  phone: string;
  grade: string;
  department: string;
  total_fee: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  registration_date: string;
}

interface StudentListProps {
  onAdd: () => void;
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  onViewContract: (student: Student) => void;
  onTakePayment: (student: Student) => void;
  onViewAttendance: (student: Student) => void;
}

export default function StudentList({
  onAdd,
  onEdit,
  onDelete,
  onViewContract,
  onTakePayment,
  onViewAttendance
}: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [sortField, setSortField] = useState<keyof Student>('student_no');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const [grades, setGrades] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    loadSettings();
    loadStudents();
  }, []);

  useEffect(() => {
    filterAndSortStudents();
  }, [students, searchTerm, filterGrade, filterDepartment, sortField, sortDirection]);

  const loadSettings = async () => {
    const { data } = await supabase
      .from('system_settings')
      .select('*')
      .in('setting_key', ['grade_levels', 'departments']);

    data?.forEach(setting => {
      if (setting.setting_key === 'grade_levels') {
        setGrades(setting.setting_value);
      } else if (setting.setting_key === 'departments') {
        setDepartments(setting.setting_value);
      }
    });
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('student_no', { ascending: true });

      if (error) throw error;

      setStudents(data || []);
    } catch (error) {
      console.error('Öğrenciler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortStudents = () => {
    let filtered = [...students];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.tc_no.includes(search) ||
        s.first_name.toLowerCase().includes(search) ||
        s.last_name.toLowerCase().includes(search) ||
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(search)
      );
    }

    if (filterGrade) {
      filtered = filtered.filter(s => s.grade === filterGrade);
    }

    if (filterDepartment) {
      filtered = filtered.filter(s => s.department === filterDepartment);
    }

    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal, 'tr')
          : bVal.localeCompare(aVal, 'tr');
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    setFilteredStudents(filtered);
  };

  const handleSort = (field: keyof Student) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu öğrenciyi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadStudents();
      setSelectedStudent(null);
    } catch (error) {
      console.error('Öğrenci silinirken hata:', error);
      alert('Öğrenci silinirken bir hata oluştu');
    }
  };

  const exportToExcel = () => {
    const headers = ['No', 'TC', 'Ad', 'Soyad', 'Sınıf', 'Bölüm', 'Toplam Ücret', 'Ödenen', 'Kalan', 'Durum'];
    const rows = filteredStudents.map(s => [
      s.student_no,
      s.tc_no,
      s.first_name,
      s.last_name,
      s.grade,
      s.department,
      s.total_fee,
      s.paid_amount,
      s.remaining_amount,
      s.status === 'active' ? 'Aktif' : 'Pasif'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ogrenciler_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const selectedStudentData = students.find(s => s.id === selectedStudent);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="TC, Ad veya Soyad ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tüm Sınıflar</option>
            {grades.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>

          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tüm Bölümler</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Dışa Aktar</span>
          </button>

          <button
            onClick={onAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Öğrenci Ekle</span>
          </button>
        </div>
      </div>

      {selectedStudent && selectedStudentData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <span className="font-semibold text-blue-900">
              {selectedStudentData.first_name} {selectedStudentData.last_name}
            </span>
            <span className="text-blue-700 ml-2">seçildi</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(selectedStudentData)}
              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center space-x-1"
            >
              <Edit2 className="w-4 h-4" />
              <span>Düzenle</span>
            </button>
            <button
              onClick={() => handleDelete(selectedStudent)}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center space-x-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>Sil</span>
            </button>
            <button
              onClick={() => onViewContract(selectedStudentData)}
              className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center space-x-1"
            >
              <FileText className="w-4 h-4" />
              <span>Sözleşme</span>
            </button>
            <button
              onClick={() => onTakePayment(selectedStudentData)}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 flex items-center space-x-1"
            >
              <CreditCard className="w-4 h-4" />
              <span>Ödeme Al</span>
            </button>
            <button
              onClick={() => onViewAttendance(selectedStudentData)}
              className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 flex items-center space-x-1"
            >
              <Calendar className="w-4 h-4" />
              <span>Yoklama</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('student_no')}>
                  No {sortField === 'student_no' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('tc_no')}>
                  TC {sortField === 'tc_no' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('first_name')}>
                  Ad {sortField === 'first_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('last_name')}>
                  Soyad {sortField === 'last_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('grade')}>
                  Sınıf {sortField === 'grade' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('department')}>
                  Bölüm {sortField === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('total_fee')}>
                  Toplam {sortField === 'total_fee' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('remaining_amount')}>
                  Kalan {sortField === 'remaining_amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  onClick={() => setSelectedStudent(student.id)}
                  className={`cursor-pointer hover:bg-gray-50 ${selectedStudent === student.id ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{student.student_no}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{student.tc_no}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.first_name}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.last_name}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{student.phone}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{student.grade}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{student.department}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {student.total_fee?.toLocaleString('tr-TR')} ₺
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right font-semibold">
                    <span className={student.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'}>
                      {student.remaining_amount?.toLocaleString('tr-TR')} ₺
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {student.status === 'active' ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Öğrenci bulunamadı
            </div>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Toplam {filteredStudents.length} öğrenci gösteriliyor
      </div>
    </div>
  );
}
