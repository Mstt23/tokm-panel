import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Download,
  Send,
  PieChart,
  BarChart3
} from 'lucide-react';
import CashboxTransactions from './finance/CashboxTransactions';
import PaymentRequests from './finance/PaymentRequests';
import FinancialCharts from './finance/FinancialCharts';

type FinanceSection = 'overview' | 'cashbox' | 'payments' | 'charts';

export default function FinanceManagement() {
  const [activeSection, setActiveSection] = useState<FinanceSection>('overview');
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: transactions } = await supabase
        .from('cashbox_transactions')
        .select('transaction_type, amount')
        .gte('transaction_date', startOfMonth.toISOString().split('T')[0]);

      let income = 0;
      let expense = 0;

      transactions?.forEach(t => {
        if (t.transaction_type === 'income') {
          income += parseFloat(t.amount);
        } else {
          expense += parseFloat(t.amount);
        }
      });

      const { count } = await supabase
        .from('payment_requests_v2')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalIncome: income,
        totalExpense: expense,
        balance: income - expense,
        pendingPayments: count || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (activeSection === 'cashbox') {
    return <CashboxTransactions onBack={() => setActiveSection('overview')} onUpdate={loadStats} />;
  }

  if (activeSection === 'payments') {
    return <PaymentRequests onBack={() => setActiveSection('overview')} />;
  }

  if (activeSection === 'charts') {
    return <FinancialCharts onBack={() => setActiveSection('overview')} />;
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
      <div className="flex items-center space-x-3">
        <DollarSign className="w-8 h-8 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">Mali Yönetim</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Toplam Gelir</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalIncome.toLocaleString('tr-TR')} ₺
          </p>
          <p className="text-xs text-gray-500 mt-1">Bu ay</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Toplam Gider</span>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalExpense.toLocaleString('tr-TR')} ₺
          </p>
          <p className="text-xs text-gray-500 mt-1">Bu ay</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Net Bakiye</span>
            <Wallet className="w-5 h-5 text-blue-600" />
          </div>
          <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.balance.toLocaleString('tr-TR')} ₺
          </p>
          <p className="text-xs text-gray-500 mt-1">Bu ay</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Bekleyen Ödemeler</span>
            <Send className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.pendingPayments}
          </p>
          <p className="text-xs text-gray-500 mt-1">Ödeme talebi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setActiveSection('cashbox')}
          className="group bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-green-500 p-8 transition-all duration-300 hover:shadow-lg"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Kasa Yönetimi</h3>
              <p className="text-sm text-gray-600">
                Gelir ve gider işlemlerini yönetin
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveSection('payments')}
          className="group bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-blue-500 p-8 transition-all duration-300 hover:shadow-lg"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Send className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Ödeme Talepleri</h3>
              <p className="text-sm text-gray-600">
                WhatsApp/SMS ile ödeme talebi gönderin
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveSection('charts')}
          className="group bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-purple-500 p-8 transition-all duration-300 hover:shadow-lg"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Raporlar & Grafikler</h3>
              <p className="text-sm text-gray-600">
                Detaylı finansal analizler ve grafikler
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
