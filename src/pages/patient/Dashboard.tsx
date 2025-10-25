import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pill, Calendar, Heart, AlertCircle, Plus, Camera, MessageCircle, Clock, Bell, Sparkles, Activity, Zap, Brain, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';
import { Medicine, MedicineSchedule } from '../../types';
import { getExpiryStatus, getDaysUntilExpiry, formatDate } from '../../utils/helpers';
import { stockMonitoringService } from '../../services/stockMonitoringService';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [schedules, setSchedules] = useState<MedicineSchedule[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    expiringSoon: 0,
    todayDoses: 0,
    adherenceRate: 0,
    outOfStock: 0,
    lowStock: 0,
  });

  useEffect(() => {
    if (user) {
      loadData();
      // Check expiry warnings and stock levels (limited to 4 per day)
      stockMonitoringService.checkAllNotifications(user.id);
    }
  }, [user]);

  const calculateAdherenceRate = (schedules: MedicineSchedule[]): number => {
    if (schedules.length === 0) return 0;

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    let totalDoses = 0;
    let takenDoses = 0;

    schedules.forEach((schedule) => {
      // Calculate expected doses in last 7 days
      const startDate = new Date(schedule.startDate);
      const endDate = schedule.endDate ? new Date(schedule.endDate) : now;
      
      // Only count days within the last 7 days when schedule was active
      for (let d = new Date(sevenDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
        if (d >= startDate && d <= endDate) {
          // Add expected doses for this day
          totalDoses += schedule.times?.length || 0;
        }
      }

      // Count taken doses in last 7 days
      schedule.taken?.forEach((record) => {
        const takenDate = new Date(record.date);
        if (takenDate >= sevenDaysAgo && takenDate <= now && record.taken) {
          takenDoses++;
        }
      });
    });

    if (totalDoses === 0) return 0;
    return Math.round((takenDoses / totalDoses) * 100);
  };

  const loadData = async () => {
    if (!user) return;

    const meds = await db.medicines.where('userId').equals(user.id).toArray();
    const scheds = await db.schedules.where('userId').equals(user.id).toArray();

    setMedicines(meds);
    setSchedules(scheds);

    // Calculate stats
    const expiringSoon = meds.filter((m) => {
      const days = getDaysUntilExpiry(m.expiryDate);
      return days >= 0 && days <= 30;
    }).length;

    const todayDoses = scheds.reduce((count, sched) => {
      return count + (sched.times?.length || 0);
    }, 0);

    // Get stock summary
    const stockSummary = await stockMonitoringService.getStockSummary(user.id);

    // Calculate adherence rate (last 7 days)
    const adherenceRate = calculateAdherenceRate(scheds);

    setStats({
      total: meds.length,
      expiringSoon,
      todayDoses,
      adherenceRate,
      outOfStock: stockSummary.outOfStock,
      lowStock: stockSummary.lowStock,
    });
  };

  const getUpcomingDoses = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return schedules
      .filter((schedule) => {
        // Only show active schedules
        const startDate = new Date(schedule.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const isStarted = startDate <= today;
        const notEnded = !schedule.endDate || new Date(schedule.endDate) >= today;
        
        return isStarted && notEnded;
      })
      .flatMap((schedule) => {
        const medicine = medicines.find((m) => m.id === schedule.medicineId);
        if (!medicine) return [];
        
        return (schedule.times || []).map((time) => {
          const [hours, minutes] = time.split(':').map(Number);
          const timeInMinutes = hours * 60 + minutes;
          
          // Check if already taken today
          const takenToday = schedule.taken?.some((t) => {
            const takenDate = new Date(t.date);
            return (
              takenDate.toDateString() === now.toDateString() &&
              t.time === time &&
              t.taken === true
            );
          });

          return {
            schedule,
            medicine,
            time,
            timeInMinutes,
            isPast: timeInMinutes < currentTime,
            isTaken: takenToday,
          };
        });
      })
      .filter((d) => !d.isPast && d.medicine && !d.isTaken)
      .sort((a, b) => a.timeInMinutes - b.timeInMinutes)
      .slice(0, 5);
  };

  const getExpiringMedicines = () => {
    return medicines
      .filter((m) => {
        const days = getDaysUntilExpiry(m.expiryDate);
        return days >= 0 && days <= 30;
      })
      .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())
      .slice(0, 3);
  };

  const upcomingDoses = getUpcomingDoses();
  const expiringMedicines = getExpiringMedicines();

  return (
    <div className="space-y-6 fade-in">
      {/* Stock Alerts */}
      {(stats.outOfStock > 0 || stats.lowStock > 0) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">
                Stock Alerts
              </h3>
              <div className="space-y-1 text-sm text-red-700 dark:text-red-300">
                {stats.outOfStock > 0 && (
                  <p>• {stats.outOfStock} medicine{stats.outOfStock !== 1 ? 's' : ''} out of stock</p>
                )}
                {stats.lowStock > 0 && (
                  <p>• {stats.lowStock} medicine{stats.lowStock !== 1 ? 's' : ''} running low (≤10 units)</p>
                )}
              </div>
              <Link
                to="/medicines"
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline mt-2 inline-block"
              >
                View & Refill →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Medicines
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Pill className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Expiring Soon
              </p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {stats.expiringSoon}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Today's Doses
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats.todayDoses}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Adherence Rate
              </p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {stats.adherenceRate}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/medicines/add"
          className="card card-hover flex items-center space-x-4 p-4"
        >
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
            <Plus className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Add Medicine
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manually or via scan
            </p>
          </div>
        </Link>

        <Link
          to="/medicines/add?scan=true"
          className="card card-hover flex items-center space-x-4 p-4"
        >
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <Camera className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Scan Medicine
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Use OCR technology
            </p>
          </div>
        </Link>

        <Link
          to="/donations"
          className="card card-hover flex items-center space-x-4 p-4"
        >
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
            <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Donate Medicines
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Help others in need
            </p>
          </div>
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Doses */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Upcoming Doses
            </h2>
            <Link
              to="/schedule"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingDoses.length > 0 ? (
              upcomingDoses.map((dose, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                      <Pill className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {dose.medicine?.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {dose.schedule.dosagePerIntake}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-primary-600" />
                      {dose.time}
                    </p>
                    {dose.schedule.reminderEnabled && (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center justify-end mt-1">
                        <Bell className="w-3 h-3 mr-1" />
                        Alarm set
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No upcoming doses for today
              </p>
            )}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Expiring Soon
            </h2>
            <Link
              to="/medicines"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {expiringMedicines.length > 0 ? (
              expiringMedicines.map((medicine) => {
                const status = getExpiryStatus(medicine.expiryDate);
                const days = getDaysUntilExpiry(medicine.expiryDate);

                return (
                  <div
                    key={medicine.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {medicine.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Expires: {formatDate(medicine.expiryDate)}
                        </p>
                      </div>
                    </div>
                    <span className={`badge badge-${status.color}`}>
                      {days} days
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No medicines expiring soon
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AI-Powered Features */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
            AI-Powered Health Features
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AI Health Assistant */}
          <Link to="/ai-assistant" className="card card-hover group">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center">
                  AI Health Assistant
                  <Sparkles className="w-4 h-4 ml-2 text-purple-600" />
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Get personalized health suggestions and medicine guidance
                </p>
                <button className="btn btn-primary btn-sm">
                  Chat Now →
                </button>
              </div>
            </div>
          </Link>

          {/* Symptom Checker */}
          <Link to="/symptom-checker" className="card card-hover group">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center">
                  Symptom Checker
                  <Brain className="w-4 h-4 ml-2 text-red-600" />
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  AI-powered symptom analysis and health insights
                </p>
                <button className="btn bg-red-600 hover:bg-red-700 text-white btn-sm">
                  Check Now →
                </button>
              </div>
            </div>
          </Link>

          {/* Drug Interactions */}
          <Link to="/drug-interactions" className="card card-hover group">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center">
                  Drug Interactions
                  <Zap className="w-4 h-4 ml-2 text-orange-600" />
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Check for potential drug interactions and side effects
                </p>
                <button className="btn bg-orange-600 hover:bg-orange-700 text-white btn-sm">
                  Check Safety →
                </button>
              </div>
            </div>
          </Link>

          {/* Health Tips */}
          <Link to="/health-tips" className="card card-hover group">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center">
                  Daily Health Tips
                  <Heart className="w-4 h-4 ml-2 text-green-600" />
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Personalized wellness tips based on your medications
                </p>
                <button className="btn bg-green-600 hover:bg-green-700 text-white btn-sm">
                  View Tips →
                </button>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
