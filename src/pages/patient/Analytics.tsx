import { useState, useEffect } from 'react';
import { TrendingUp, Activity, Heart, Pill, Calendar, Award } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';

export default function Analytics() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    adherenceRate: 0,
    totalDoses: 0,
    takenDoses: 0,
    activeMedicines: 0,
    upcomingDoses: 0,
    streak: 0,
  });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [topMedicines, setTopMedicines] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    const medicines = await db.medicines.where('userId').equals(user.id).toArray();
    const schedules = await db.schedules.where('userId').equals(user.id).toArray();

    // Calculate adherence for last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    let totalExpected = 0;
    let totalTaken = 0;
    const medicineUsage: any = {};

    schedules.forEach((schedule) => {
      const startDate = new Date(schedule.startDate);
      const endDate = schedule.endDate ? new Date(schedule.endDate) : now;

      for (let d = new Date(sevenDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
        if (d >= startDate && d <= endDate) {
          totalExpected += schedule.times?.length || 0;
        }
      }

      // Count taken doses
      schedule.taken?.forEach((record: any) => {
        const takenDate = new Date(record.date);
        if (takenDate >= sevenDaysAgo && takenDate <= now && record.taken) {
          totalTaken++;
          
          const medName = medicines.find(m => m.id === schedule.medicineId)?.name || 'Unknown';
          medicineUsage[medName] = (medicineUsage[medName] || 0) + 1;
        }
      });
    });

    const adherenceRate = totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : 0;

    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      let dayComplete = false;
      schedules.forEach((schedule) => {
        const taken = schedule.taken?.some((t: any) => {
          const td = new Date(t.date);
          return td.toDateString() === checkDate.toDateString() && t.taken;
        });
        if (taken) dayComplete = true;
      });
      
      if (dayComplete) streak++;
      else break;
    }

    // Generate weekly data
    const weekly = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      
      let dayTaken = 0;
      let dayExpected = 0;
      
      schedules.forEach((schedule) => {
        const startDate = new Date(schedule.startDate);
        const endDate = schedule.endDate ? new Date(schedule.endDate) : now;
        
        if (date >= startDate && date <= endDate) {
          dayExpected += schedule.times?.length || 0;
          
          schedule.taken?.forEach((record: any) => {
            const td = new Date(record.date);
            if (td.toDateString() === date.toDateString() && record.taken) {
              dayTaken++;
            }
          });
        }
      });
      
      weekly.push({
        day: dayName,
        taken: dayTaken,
        expected: dayExpected,
        rate: dayExpected > 0 ? Math.round((dayTaken / dayExpected) * 100) : 0,
      });
    }

    // Top medicines
    const top = Object.entries(medicineUsage)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    setStats({
      adherenceRate,
      totalDoses: totalExpected,
      takenDoses: totalTaken,
      activeMedicines: medicines.filter(m => 
        schedules.some(s => s.medicineId === m.id)
      ).length,
      upcomingDoses: schedules.reduce((sum, s) => sum + (s.times?.length || 0), 0),
      streak,
    });
    
    setWeeklyData(weekly);
    setTopMedicines(top);
  };

  const getAdherenceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    if (rate >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAdherenceBg = (rate: number) => {
    if (rate >= 90) return 'bg-green-100 dark:bg-green-900/20';
    if (rate >= 75) return 'bg-yellow-100 dark:bg-yellow-900/20';
    if (rate >= 60) return 'bg-orange-100 dark:bg-orange-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <TrendingUp className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Health Analytics</h1>
        </div>
        <p>Track your medicine adherence and health trends</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`card ${getAdherenceBg(stats.adherenceRate)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Adherence Rate</p>
              <p className={`text-3xl font-bold ${getAdherenceColor(stats.adherenceRate)}`}>
                {stats.adherenceRate}%
              </p>
            </div>
            <Activity className={`w-10 h-10 ${getAdherenceColor(stats.adherenceRate)}`} />
          </div>
        </div>

        <div className="card bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Doses Taken</p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.takenDoses}/{stats.totalDoses}
              </p>
            </div>
            <Pill className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="card bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Medicines</p>
              <p className="text-3xl font-bold text-blue-600">{stats.activeMedicines}</p>
            </div>
            <Heart className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="card bg-orange-50 dark:bg-orange-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
              <p className="text-3xl font-bold text-orange-600">{stats.streak} 🔥</p>
            </div>
            <Award className="w-10 h-10 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Weekly Adherence Chart */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Weekly Adherence (Last 7 Days)
        </h2>
        <div className="space-y-3">
          {weeklyData.map((day) => (
            <div key={day.day} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium w-12">{day.day}</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {day.taken}/{day.expected} doses
                </span>
                <span className={`font-semibold w-12 text-right ${getAdherenceColor(day.rate)}`}>
                  {day.rate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    day.rate >= 90
                      ? 'bg-green-600'
                      : day.rate >= 75
                      ? 'bg-yellow-600'
                      : day.rate >= 60
                      ? 'bg-orange-600'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${day.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Medicines */}
      {topMedicines.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Pill className="w-5 h-5 mr-2 text-purple-600" />
            Most Taken Medicines (Last 7 Days)
          </h2>
          <div className="space-y-3">
            {topMedicines.map((med, index) => (
              <div key={med.name} className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <span className="font-bold text-purple-600">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{med.name}</p>
                  <p className="text-sm text-gray-500">{med.count} doses taken</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <h2 className="text-xl font-semibold mb-3">💡 Insights & Tips</h2>
        <div className="space-y-2 text-sm">
          {stats.adherenceRate >= 90 && (
            <p className="text-green-700 dark:text-green-300">
              ✅ Excellent adherence! Keep up the great work!
            </p>
          )}
          {stats.adherenceRate < 90 && stats.adherenceRate >= 75 && (
            <p className="text-yellow-700 dark:text-yellow-300">
              ⚠️ Good adherence, but there's room for improvement. Set reminders!
            </p>
          )}
          {stats.adherenceRate < 75 && (
            <p className="text-red-700 dark:text-red-300">
              ⚠️ Adherence needs attention. Enable alarms and check notifications regularly.
            </p>
          )}
          {stats.streak >= 7 && (
            <p className="text-orange-700 dark:text-orange-300">
              🔥 Amazing {stats.streak}-day streak! You're building a great habit!
            </p>
          )}
          {stats.activeMedicines === 0 && (
            <p className="text-gray-700 dark:text-gray-300">
              📝 No active medicines scheduled. Add your medicines and create schedules.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
