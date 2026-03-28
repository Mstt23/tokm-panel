import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Plus, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';

interface IssueReport {
  id: string;
  issue_type: string;
  priority: string;
  title: string;
  description: string;
  status: string;
  reported_at: string;
  resolved_at: string | null;
}

interface ReportIssueProps {
  onBack: () => void;
}

export default function ReportIssue({ onBack }: ReportIssueProps) {
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    issue_type: 'technical',
    priority: 'medium',
    title: '',
    description: ''
  });

  useEffect(() => {
    loadIssues();
  }, []);

  async function loadIssues() {
    try {
      const { data, error } = await supabase
        .from('issue_reports')
        .select('*')
        .order('reported_at', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('issue_reports')
        .insert([{
          ...formData,
          status: 'open'
        }]);

      if (error) throw error;

      setShowAddModal(false);
      setFormData({
        issue_type: 'technical',
        priority: 'medium',
        title: '',
        description: ''
      });
      loadIssues();
    } catch (error) {
      console.error('Error creating issue:', error);
      alert('Sorun kaydedilirken hata oluştu');
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('issue_reports')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      loadIssues();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Durum güncellenirken hata oluştu');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Açık';
      case 'in_progress':
        return 'İşlemde';
      case 'resolved':
        return 'Çözüldü';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      default:
        return priority;
    }
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
          <h2 className="text-2xl font-bold text-gray-900">Sorun Raporları</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Sorun Bildir
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(issue.status)}
                    <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(issue.priority)}`}>
                      {getPriorityText(issue.priority)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{issue.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{issue.issue_type === 'technical' ? 'Teknik' : 'İdari'}</span>
                    <span>•</span>
                    <span>{new Date(issue.reported_at).toLocaleDateString('tr-TR')}</span>
                    {issue.resolved_at && (
                      <>
                        <span>•</span>
                        <span>Çözüm: {new Date(issue.resolved_at).toLocaleDateString('tr-TR')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <select
                    value={issue.status}
                    onChange={(e) => updateStatus(issue.id, e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="open">Açık</option>
                    <option value="in_progress">İşlemde</option>
                    <option value="resolved">Çözüldü</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          {issues.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Henüz sorun raporu yok
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Yeni Sorun Bildir</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sorun Türü</label>
                <select
                  value={formData.issue_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, issue_type: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="technical">Teknik</option>
                  <option value="administrative">İdari</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Öncelik</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Sorunun kısa açıklaması"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detaylı Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={4}
                  placeholder="Sorunun detaylı açıklaması..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Gönder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
