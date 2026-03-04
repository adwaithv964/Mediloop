import { useEffect, useState } from 'react';
import {
  BarChart3, Users, Heart, Pill,
  Download, RefreshCw, Activity
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { API_URL } from '../../config/api';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

/* ─────────── types ─────────── */
interface MonthlyStats { newUsers: number; totalDonations: number; completedDonations: number; totalMedicines: number; }
interface StatusItem { status: string; count: number; }
interface TrendItem { _id: string; count: number; completed: number; }
interface RoleItem { role: string; count: number; }
interface DonorItem { userId: string; name: string; count: number; }

interface AnalyticsPayload {
  monthlyStats: MonthlyStats;
  donationStatusBreakdown: StatusItem[];
  donationTrends: TrendItem[];
  userRoles: RoleItem[];
  topDonors: DonorItem[];
  totals: { totalUsers: number; totalDonations: number; totalMedicines: number };
}

const EMPTY: AnalyticsPayload = {
  monthlyStats: { newUsers: 0, totalDonations: 0, completedDonations: 0, totalMedicines: 0 },
  donationStatusBreakdown: [], donationTrends: [], userRoles: [], topDonors: [],
  totals: { totalUsers: 0, totalDonations: 0, totalMedicines: 0 },
};

/* ─────────── status colour helper ─────────── */
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  confirmed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  'picked-up': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

/* ─────────── stacked bar chart (CSS) ─────────── */
function TrendBars({ trends }: { trends: TrendItem[] }) {
  if (trends.length === 0) return (
    <div className="h-40 flex items-center justify-center text-gray-400 dark:text-gray-500">
      No donation data in this period
    </div>
  );
  const maxVal = Math.max(...trends.map(t => t.count), 1);
  // Show at most last 30 points
  const display = trends.slice(-30);
  const BAR_HEIGHT = 130; // px

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-0.5 min-w-[300px]" style={{ height: `${BAR_HEIGHT}px` }}>
        {display.map((t) => {
          const totalH = Math.max((t.count / maxVal) * BAR_HEIGHT, t.count > 0 ? 4 : 0);
          const completedH = t.count > 0 ? (t.completed / t.count) * totalH : 0;
          const pendingH = totalH - completedH;
          return (
            <div
              key={t._id}
              className="flex-1 flex flex-col justify-end"
              style={{ height: `${totalH}px` }}
              title={`${t._id}: ${t.count} total, ${t.completed} completed`}
            >
              {/* pending (top portion) */}
              {pendingH > 0 && (
                <div
                  className="w-full bg-blue-500 rounded-t transition-all duration-500"
                  style={{ height: `${pendingH}px` }}
                />
              )}
              {/* completed (bottom portion, stacked above baseline) */}
              {completedH > 0 && (
                <div
                  className="w-full bg-green-400 transition-all duration-500"
                  style={{ height: `${completedH}px` }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{display[0]?._id?.slice(5)}</span>
        <span>{display[display.length - 1]?._id?.slice(5)}</span>
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Pending/Other</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block" /> Completed</span>
      </div>
    </div>
  );
}

/* ─────────── role bar chart ─────────── */
function RoleBars({ roles }: { roles: RoleItem[] }) {
  const max = Math.max(...roles.map(r => r.count), 1);
  const COLORS: Record<string, string> = {
    patient: 'bg-blue-500', admin: 'bg-purple-500', ngo: 'bg-green-500', hospital: 'bg-orange-500',
  };
  return (
    <div className="space-y-3">
      {roles.map(r => (
        <div key={r.role}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="capitalize font-medium text-gray-700 dark:text-gray-300">{r.role}</span>
            <span className="font-bold text-gray-900 dark:text-white">{r.count}</span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${COLORS[r.role] || 'bg-gray-500'}`}
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────── Main component ─────────── */
export default function Analytics() {
  const [data, setData] = useState<AnalyticsPayload>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState(30);

  useEffect(() => { loadData(); }, [days]);

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/analytics?days=${days}`);
      if (!res.ok) throw new Error('Analytics fetch failed');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load analytics. Is the server running?');
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('Mediloop Analytics Report', 20, 20);
    doc.setFontSize(10); doc.text(`Period: Last ${days} days`, 20, 30);
    doc.text(`Generated: ${formatDate(new Date())}`, 20, 36);
    doc.setFontSize(12); doc.text('Platform Statistics:', 20, 50);
    doc.setFontSize(10);
    doc.text(`Total Users: ${data.totals.totalUsers}`, 30, 58);
    doc.text(`Total Donations: ${data.totals.totalDonations}`, 30, 64);
    doc.text(`Total Medicines: ${data.totals.totalMedicines}`, 30, 70);
    doc.setFontSize(12); doc.text('Period Stats:', 20, 82);
    doc.setFontSize(10);
    doc.text(`New Users: ${data.monthlyStats.newUsers}`, 30, 90);
    doc.text(`Donations in Period: ${data.monthlyStats.totalDonations}`, 30, 96);
    doc.text(`Completed Donations: ${data.monthlyStats.completedDonations}`, 30, 102);
    let y = 116;
    doc.setFontSize(12); doc.text('Donation Status:', 20, 110);
    doc.setFontSize(10);
    data.donationStatusBreakdown.forEach(s => { doc.text(`${s.status}: ${s.count}`, 30, y); y += 6; });
    doc.setFontSize(12); doc.text('Top Donors:', 20, y + 8); y += 16;
    doc.setFontSize(10);
    data.topDonors.slice(0, 5).forEach(d => { doc.text(`${d.name}: ${d.count} donations`, 30, y); y += 6; });
    doc.save('mediloop-analytics.pdf');
    toast.success('PDF downloaded');
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.donationTrends), 'Donation Trends');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.donationStatusBreakdown), 'Status');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.userRoles), 'User Roles');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.topDonors), 'Top Donors');
    XLSX.writeFile(wb, 'mediloop-analytics.xlsx');
    toast.success('Excel exported');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
    </div>
  );

  const completionRate = data.monthlyStats.totalDonations > 0
    ? Math.round((data.monthlyStats.completedDonations / data.monthlyStats.totalDonations) * 100)
    : 0;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Platform insights and performance metrics</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Period selector */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {([7, 14, 30, 90] as const).map(d => (
              <button key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${days === d
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}>{d}d</button>
            ))}
          </div>
          <button onClick={handleRefresh} disabled={refreshing} className="btn btn-secondary">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button onClick={exportToPDF} className="btn btn-primary">
            <Download size={16} /><span>PDF</span>
          </button>
          <button onClick={exportToExcel} className="btn btn-secondary">
            <Download size={16} /><span>Excel</span>
          </button>
        </div>
      </div>

      {/* Overall totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{data.totals.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Donations</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{data.totals.totalDonations}</p>
            </div>
            <Heart className="w-8 h-8 text-red-400" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Medicines</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">{data.totals.totalMedicines}</p>
            </div>
            <Pill className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Period stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-sm text-gray-500 mb-1">New Users</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.monthlyStats.newUsers}</p>
          <p className="text-xs text-gray-400">last {days} days</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500 mb-1">Donations</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{data.monthlyStats.totalDonations}</p>
          <p className="text-xs text-gray-400">last {days} days</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{data.monthlyStats.completedDonations}</p>
          <p className="text-xs text-gray-400">last {days} days</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500 mb-1">Success Rate</p>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{completionRate}%</p>
          <p className="text-xs text-gray-400">completion</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donation trend */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" /> Donation Trends
            </h2>
          </div>
          <TrendBars trends={data.donationTrends} />
        </div>

        {/* User roles */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" /> User Roles Distribution
            </h2>
          </div>
          {data.userRoles.length > 0 ? (
            <RoleBars roles={data.userRoles} />
          ) : (
            <p className="text-gray-400 text-center py-8">No user data found</p>
          )}
        </div>
      </div>

      {/* Status breakdown */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" /> Donation Status Breakdown
          </h2>
        </div>
        {data.donationStatusBreakdown.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {data.donationStatusBreakdown.map((s) => (
              <div key={s.status} className={`text-center p-4 rounded-xl ${STATUS_COLORS[s.status] || 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>
                <div className="text-2xl font-bold">{s.count}</div>
                <div className="text-xs mt-1 capitalize font-medium">{s.status.replace('-', ' ')}</div>
                {data.totals.totalDonations > 0 && (
                  <div className="text-xs opacity-70 mt-0.5">
                    {Math.round((s.count / data.totals.totalDonations) * 100)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No donation status data found</p>
        )}
      </div>

      {/* Top donors */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-600" /> Top Donors
          </h2>
        </div>
        {data.topDonors.length > 0 ? (
          <div className="space-y-3">
            {data.topDonors.map((donor, index) => {
              const max = data.topDonors[0].count;
              return (
                <div key={donor.userId} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{donor.name}</span>
                      <span className="text-gray-500 text-xs">{donor.count} donations</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full transition-all duration-700"
                        style={{ width: `${(donor.count / max) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No donation data available</p>
        )}
      </div>
    </div>
  );
}
