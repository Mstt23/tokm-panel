import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, X, Save, Search } from 'lucide-react';

interface Transaction {
  id: string;
  transaction_type: 'income' | 'expense';
  amount: number;
  description: string;
  transaction_date: string;
  payment_method: string;
  category_id: string | null;
  reference_number: string | null;
}

interface Category {
  id: string;
  name: string;
  category_type: string;
  color: string;
}

interface CashboxTransactionsProps {
  onBack: () => void;
  onUpdate: () => void;
}

export default function CashboxTransactions({ onBack, onUpdate }: CashboxTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    transaction_type: 'income' as 'income' | 'expense',
    amount: 0,
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    category_id: '',
    reference_number: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [transactionsRes, categoriesRes, incomeCatRes, expenseCatRes, customCatRes] = await Promise.all([
        supabase.from('cashbox_transactions').select('*').order('transaction_date', { ascending: false }).limit(100),
        supabase.from('income_categories').select('id, name').eq('is_active', true),
        supabase.from('expense_categories').select('id, name').eq('is_active', true),
        supabase.from('custom_categories').select('*').eq('is_active', true)
      ]);

      if (transactionsRes.data) setTransactions(transactionsRes.data);

      const allCategories: Category[] = [];
      categoriesRes.data?.forEach(cat => allCategories.push({ ...cat, category_type: 'income', color: '#10B981' }));
      incomeCatRes.data?.forEach(cat => allCategories.push({ ...cat, category_type: 'expense', color: '#EF4444' }));
      customCatRes.data?.forEach(cat => allCategories.push(cat));

      setCategories(allCategories);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('cashbox_transactions').insert([formData]);

      if (error) throw error;

      setShowAddModal(false);
      setFormData({
        transaction_type: 'income',
        amount: 0,
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        category_id: '',
        reference_number: ''
      });
      loadData();
      onUpdate();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('İşlem eklenirken hata oluştu');
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter !== 'all' && t.transaction_type !== filter) return false;
    if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getCategory = (id: string | null) => {
    if (!id) return null;
    return categories.find(c => c.id === id);
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
          <h2 className="text-2xl font-bold text-gray-900">Kasa İşlemleri</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          İşlem Ekle
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter('income')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'income' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Gelir
            </button>
            <button
              onClick={() => setFilter('expense')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Gider
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Açıklama ara..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Tarih</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Tür</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Açıklama</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Kategori</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Ödeme Yöntemi</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => {
                const category = getCategory(transaction.category_id);
                return (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(transaction.transaction_date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-3 px-4">
                      {transaction.transaction_type === 'income' ? (
                        <span className="flex items-center space-x-1 text-green-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-medium">Gelir</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-red-600">
                          <TrendingDown className="w-4 h-4" />
                          <span className="text-sm font-medium">Gider</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{transaction.description}</td>
                    <td className="py-3 px-4">
                      {category && (
                        <span
                          className="px-2 py-1 text-xs rounded-full"
                          style={{ backgroundColor: category.color + '20', color: category.color }}
                        >
                          {category.name}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                      {transaction.payment_method?.replace('_', ' ')}
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold ${
                      transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.transaction_type === 'income' ? '+' : '-'}
                      {transaction.amount.toLocaleString('tr-TR')} ₺
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              İşlem bulunamadı
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Yeni İşlem Ekle</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Türü</label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_type: e.target.value as 'income' | 'expense', category_id: '' }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="income">Gelir</option>
                  <option value="expense">Gider</option>
                </select>
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
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seçiniz</option>
                  {categories
                    .filter(c => c.category_type === formData.transaction_type)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Nakit</option>
                  <option value="bank_transfer">Banka Havalesi</option>
                  <option value="credit_card">Kredi Kartı</option>
                  <option value="check">Çek</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referans No</label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                  placeholder="İsteğe bağlı"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
