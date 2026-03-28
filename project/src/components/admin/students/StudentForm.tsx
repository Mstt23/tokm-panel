import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface StudentFormProps {
  student?: any;
  onClose: () => void;
  onSave: () => void;
}

export default function StudentForm({ student, onClose, onSave }: StudentFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    student_no: student?.student_no || '',
    tc_no: student?.tc_no || '',
    first_name: student?.first_name || '',
    last_name: student?.last_name || '',
    phone: student?.phone || '',
    birth_date: student?.birth_date || '',
    parent_name: student?.parent_name || '',
    parent_phone: student?.parent_phone || '',
    parent_email: student?.parent_email || '',
    address: student?.address || '',
    grade: student?.grade || '',
    department: student?.department || '',
    school_name: student?.school_name || '',
    group_course: student?.group_course || '',
    has_private_lesson: student?.has_private_lesson || false,
    total_fee: student?.total_fee || 0,
    paid_amount: student?.paid_amount || 0,
    installment_count: student?.installment_count || 1,
    registration_date: student?.registration_date || new Date().toISOString().split('T')[0],
    notes: student?.notes || '',
    status: student?.status || 'active'
  });

  useEffect(() => {
    loadSettings();
    if (!student) {
      generateStudentNo();
    }
  }, []);

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

  const generateStudentNo = async () => {
    const { data } = await supabase
      .from('students')
      .select('student_no')
      .order('student_no', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const lastNo = parseInt(data[0].student_no) || 1000;
      setFormData(prev => ({ ...prev, student_no: String(lastNo + 1) }));
    } else {
      setFormData(prev => ({ ...prev, student_no: '1001' }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        remaining_amount: formData.total_fee - formData.paid_amount,
        updated_at: new Date().toISOString()
      };

      if (student) {
        const { error } = await supabase
          .from('students')
          .update(dataToSave)
          .eq('id', student.id);

        if (error) throw error;
      } else {
        const { data: newStudent, error } = await supabase
          .from('students')
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;

        if (formData.installment_count > 1 && newStudent) {
          const installmentAmount = Math.ceil(formData.total_fee / formData.installment_count);
          const installments = [];

          for (let i = 1; i <= formData.installment_count; i++) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + i);

            installments.push({
              student_id: newStudent.id,
              installment_number: i,
              amount: installmentAmount,
              due_date: dueDate.toISOString().split('T')[0],
              is_paid: false
            });
          }

          await supabase.from('student_installments').insert(installments);
        }
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Kayıt hatası:', error);
      alert('Kaydetme sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {student ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Ekle'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          {[
            { num: 1, label: 'Kişisel Bilgiler' },
            { num: 2, label: 'Eğitim Bilgileri' },
            { num: 3, label: 'Veli Bilgileri' },
            { num: 4, label: 'Ödeme Bilgileri' }
          ].map(s => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                step === s.num
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s.num}. {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Öğrenci No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="student_no"
                    value={formData.student_no}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TC Kimlik No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="tc_no"
                    value={formData.tc_no}
                    onChange={handleChange}
                    maxLength={11}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Soyad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doğum Tarihi</label>
                  <input
                    type="date"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sınıf <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seçiniz</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bölüm <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seçiniz</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Okul Adı</label>
                <input
                  type="text"
                  name="school_name"
                  value={formData.school_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grup Adı</label>
                <input
                  type="text"
                  name="group_course"
                  value={formData.group_course}
                  onChange={handleChange}
                  placeholder="Örn: TYT-A, AYT-SAY-1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="has_private_lesson"
                  checked={formData.has_private_lesson}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">Bireysel Ders Alıyor</label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Veli Adı Soyadı</label>
                <input
                  type="text"
                  name="parent_name"
                  value={formData.parent_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Veli Telefon</label>
                  <input
                    type="tel"
                    name="parent_phone"
                    value={formData.parent_phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Veli E-posta</label>
                  <input
                    type="email"
                    name="parent_email"
                    value={formData.parent_email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kayıt Tarihi</label>
                  <input
                    type="date"
                    name="registration_date"
                    value={formData.registration_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Ücret (₺)</label>
                  <input
                    type="number"
                    name="total_fee"
                    value={formData.total_fee}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peşinat (₺)</label>
                  <input
                    type="number"
                    name="paid_amount"
                    value={formData.paid_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taksit Sayısı</label>
                  <input
                    type="number"
                    name="installment_count"
                    value={formData.installment_count}
                    onChange={handleChange}
                    min="1"
                    max="12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Toplam Ücret:</span>
                    <p className="font-bold text-lg">{formData.total_fee.toLocaleString('tr-TR')} ₺</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Peşinat:</span>
                    <p className="font-bold text-lg text-green-600">{formData.paid_amount.toLocaleString('tr-TR')} ₺</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Kalan:</span>
                    <p className="font-bold text-lg text-red-600">
                      {(formData.total_fee - formData.paid_amount).toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                </div>
                {formData.installment_count > 1 && (
                  <p className="mt-2 text-sm text-gray-600">
                    Aylık Taksit: {Math.ceil((formData.total_fee - formData.paid_amount) / formData.installment_count).toLocaleString('tr-TR')} ₺
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <div className="flex space-x-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Geri
                </button>
              )}
            </div>

            <div className="flex space-x-2">
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  İleri
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Kaydediliyor...' : 'Kaydet'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
