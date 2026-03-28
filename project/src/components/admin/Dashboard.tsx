import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  BookOpen,
  Clock
} from 'lucide-react';

interface Stats {
  totalStudents: number;
  activeStudents: number;
  totalStaff: number;
  todayRevenue: number;
  monthRevenue: number;
  pendingPayments: number;
}

interface ScheduleItem {
  id: string;
  course_name: string;
  teacher_name: string;
  start_time: string;
  end_time: string;
  room: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    activeStudents: 0,
    totalStaff: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    pendingPayments: 0
  });
  const [currentSchedule, setCurrentSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const { data: students } = await supabase
        .from('students')
        .select('status, remaining_amount');

      const { data: staff } = await supabase
        .from('staff')
        .select('status');

      const today = new Date().toISOString().split('T')[0];
      const { data: todayTransactions } = await supabase
        .from('finance_transactions')
        .select('amount, type')
        .eq('transaction_date', today)
        .eq('type', 'income');

      const monthStart = new Date();
      monthStart.setDate(1);
      const { data: monthTransactions } = await supabase
        .from('finance_transactions')
        .select('amount, type')
        .gte('transaction_date', monthStart.toISOString().split('T')[0])
        .eq('type', 'income');

      const currentDay = new Date().getDay();
      const currentTime = new Date().toTimeString().split(' ')[0];

      const { data: schedule } = await supabase
        .from('schedules')
        .select(`
          id,
          start_time,
          end_time,
          room,
          courses(name),
          staff(first_name, last_name)
        `)
        .eq('day_of_week', currentDay)
        .lte('start_time', currentTime)
        .gte('end_time', currentTime);

      setStats({
        totalStudents: students?.length || 0,
        activeStudents: students?.filter(s => s.status === 'active').length || 0,
        totalStaff: staff?.filter(s => s.status === 'active').length || 0,
        todayRevenue: todayTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        monthRevenue: monthTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        pendingPayments: students?.filter(s => Number(s.remaining_amount) > 0).length || 0
      });

      setCurrentSchedule(
        schedule?.map((s: any) => ({
          id: s.id,
          course_name: s.courses?.name || 'İsimsiz',
          teacher_name: s.staff ? `${s.staff.first_name} ${s.staff.last_name}` : 'Atanmamış',
          start_time: s.start_time,
          end_time: s.end_time,
          room: s.room || 'Atanmamış'
        })) || []
      );
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={Users}
          label="Aktif Öğrenciler"
          value={stats.activeStudents}
          subValue={`${stats.totalStudents} toplam`}
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Aktif Personel"
          value={stats.totalStaff}
          color="green"
        />
        <StatCard
          icon={DollarSign}
          label="Bugünkü Gelir"
          value={`₺${stats.todayRevenue.toLocaleString()}`}
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          label="Aylık Gelir"
          value={`₺${stats.monthRevenue.toLocaleString()}`}
          color="indigo"
        />
        <StatCard
          icon={Calendar}
          label="Bekleyen Ödemeler"
          value={stats.pendingPayments}
          color="orange"
        />
        <StatCard
          icon={BookOpen}
          label="Devam Eden Dersler"
          value={currentSchedule.length}
          color="teal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Şu Anda Devam Eden Dersler</h3>
          </div>
          {currentSchedule.length > 0 ? (
            <div className="space-y-3">
              {currentSchedule.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.course_name}</h4>
                      <p className="text-sm text-gray-600">{item.teacher_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.start_time} - {item.end_time} • Sınıf: {item.room}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-600">Canlı</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Şu anda devam eden ders bulunmuyor</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Finansal Özet</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Aylık Gelir</p>
                <p className="text-2xl font-bold text-green-600">₺{stats.monthRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Bekleyen Ödemeler</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingPayments}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: typeof Users;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
}

function StatCard({ icon: Icon, label, value, subValue, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    teal: 'bg-teal-50 text-teal-600 border-teal-200'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
