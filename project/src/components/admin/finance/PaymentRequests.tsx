import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Plus, Send, X, MessageCircle, Smartphone } from 'lucide-react';

interface PaymentRequest {
  id: string;
  request_number: string;
  student_ids: string[];
  amount: number;
  description: string;
  due_date: string;
  status: string;
  whatsapp_sent: boolean;
  sms_sent: boolean;
  created_at: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_no: string;
}

interface PaymentRequestsProps {
  onBack: () => void;
}

export default function PaymentRequests({ onBack }: PaymentRequestsProps) {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    amount: 0,
    description: '',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [requestsRes, studentsRes] = await Promise.all([
        supabase.from('payment_requests_v2').select('*').order('created_at', { ascending: false }),
        supabase.from('students').select('id, first_name, last_name, student_no').eq('status', 'active')
      ]);

      if (requestsRes.data) setRequests(requestsRes.data);
      if (studentsRes.data) setStudents(studentsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStudents.length === 0) {
      alert('Lütfen en az bir öğrenci seçin');
      return;
    }

    try {
      const requestNumber = `PAY${Date.now()}`;
      const paymentLink = `${window.location.origin}/payment/${requestNumber}`;

      const { error } = await supabase.from('payment_requests_v2').insert([{
        request_number: requestNumber,
        student_ids: selectedStudents,
        amount: formData.amount,
        description: formData.description,
        due_date: formData.due_date,
        payment_link: paymentLink,
        status: 'pending'
      }]);

      if (error) throw error;

      setShowAddModal(false);
      setSelectedStudents([]);
      setFormData({
        amount: 0,
        description: '',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      loadData();
      alert('Ödeme talebi oluşturuldu! WhatsApp/SMS entegrasyonu için lütfen sistem yöneticinizle iletişime geçin.');
    } catch (error) {
      console.error('Error creating payment request:', error);
      alert('Ödeme talebi oluşturulurken hata oluştu');
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Bekliyor',
      paid: 'Ödendi',
      cancelled: 'İptal',
      expired: 'Süresi Doldu'
    };
    return statusMap[status] || status;
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Ödeme Talepleri</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Talep Oluştur
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-mono text-sm text-gray-600">{request.request_number}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-1">
                    {request.amount.toLocaleString('tr-TR')} ₺
                  </p>
                  <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Öğrenci: {request.student_ids.length}</span>
                    <span>•</span>
                    <span>Son Ödeme: {new Date(request.due_date).toLocaleDateString('tr-TR')}</span>
                    {request.whatsapp_sent && (
                      <>
                        <span>•</span>
                        <MessageCircle className="w-3 h-3 text-green-600" />
                      </>
                    )}
                    {request.sms_sent && (
                      <>
                        <span>•</span>
                        <Smartphone className="w-3 h-3 text-blue-600" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {requests.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Henüz ödeme talebi oluşturulmamış
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Yeni Ödeme Talebi</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci Seçimi</label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {students.map(student => (
                    <label key={student.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {student.student_no} - {student.first_name} {student.last_name}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-sm text-gray-500">{selectedStudents.length} öğrenci seçildi</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={3}
                  placeholder="Ödeme talebi açıklaması..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Son Ödeme Tarihi</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Ödeme talebi oluşturulduktan sonra, seçilen öğrencilerin velilerine WhatsApp veya SMS ile ödeme linki gönderilebilir.
                  Bu özellik için sistem yöneticinizle iletişime geçin.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Oluştur</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
