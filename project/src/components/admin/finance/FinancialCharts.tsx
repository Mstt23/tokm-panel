import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface FinancialChartsProps {
  onBack: () => void;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export default function FinancialCharts({ onBack }: FinancialChartsProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'3months' | '6months' | '12months'>('6months');

  useEffect(() => {
    loadChartData();
  }, [period]);

  async function loadChartData() {
    try {
      const months = period === '3months' ? 3 : period === '6months' ? 6 : 12;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data } = await supabase
        .from('cashbox_transactions')
        .select('transaction_type, amount, transaction_date')
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .order('transaction_date');

      const monthlyMap = new Map<string, { income: number; expense: number }>();

      data?.forEach(t => {
        const month = t.transaction_date.substring(0, 7);
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, { income: 0, expense: 0 });
        }
        const entry = monthlyMap.get(month)!;
        if (t.transaction_type === 'income') {
          entry.income += parseFloat(t.amount);
        } else {
          entry.expense += parseFloat(t.amount);
        }
      });

      const chartData: MonthlyData[] = [];
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().substring(0, 7);
        const entry = monthlyMap.get(monthKey) || { income: 0, expense: 0 };
        chartData.push({
          month: date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
          income: entry.income,
          expense: entry.expense,
          balance: entry.income - entry.expense
        });
      }

      setMonthlyData(chartData);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  }

  const maxValue = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)));

  const totalIncome = monthlyData.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = monthlyData.reduce((sum, d) => sum + d.expense, 0);
  const totalBalance = totalIncome - totalExpense;

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
          <h2 className="text-2xl font-bold text-gray-900">Finansal Raporlar</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="3months">Son 3 Ay</option>
            <option value="6months">Son 6 Ay</option>
            <option value="12months">Son 12 Ay</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Toplam Gelir</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {totalIncome.toLocaleString('tr-TR')} ₺
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Toplam Gider</span>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">
            {totalExpense.toLocaleString('tr-TR')} ₺
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Net Bakiye</span>
          </div>
          <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalBalance.toLocaleString('tr-TR')} ₺
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Aylık Gelir/Gider Grafiği</h3>
        <div className="space-y-6">
          {monthlyData.map((data, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{data.month}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-green-600">+{data.income.toLocaleString('tr-TR')} ₺</span>
                  <span className="text-red-600">-{data.expense.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>
              <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-green-500 rounded-full"
                  style={{ width: `${maxValue > 0 ? (data.income / maxValue) * 100 : 0}%` }}
                />
                <div
                  className="absolute left-0 bottom-0 h-1/2 bg-red-500 rounded-full"
                  style={{ width: `${maxValue > 0 ? (data.expense / maxValue) * 100 : 0}%` }}
                />
              </div>
              <div className="text-right text-xs">
                <span className={`font-semibold ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Bakiye: {data.balance.toLocaleString('tr-TR')} ₺
                </span>
              </div>
            </div>
          ))}
        </div>

        {monthlyData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Bu dönem için veri bulunamadı
          </div>
        )}
      </div>
    </div>
  );
}
