import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Activity, Heart, Pill, Calendar, Award,
  RefreshCw, Info
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';
import { Medicine, MedicineSchedule } from '../../types';

/* ─────────────────────────── helpers ─────────────────────────── */

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


const CATEGORY_COLORS: Record<string, string> = {
  painkiller: '#ef4444',
  antibiotic: '#3b82f6',
  vitamin: '#22c55e',
  supplement: '#10b981',
  cardiac: '#f43f5e',
  diabetes: '#8b5cf6',
  respiratory: '#06b6d4',
  digestive: '#f59e0b',
  other: '#6b7280',
};

function adherenceColor(rate: number) {
  if (rate >= 90) return '#16a34a';
  if (rate >= 75) return '#ca8a04';
  if (rate >= 50) return '#ea580c';
  return '#dc2626';
}

function adherenceLabel(rate: number) {
  if (rate >= 90) return { text: 'Excellent', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
  if (rate >= 75) return { text: 'Good', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
  if (rate >= 50) return { text: 'Fair', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' };
  return { text: 'Needs Attention', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
}

/* ─────────────────────── Radial progress ────────────────────── */
function RadialProgress({ value, size = 120, stroke = 10 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = adherenceColor(value);
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
        strokeWidth={stroke} className="text-gray-200 dark:text-gray-700" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  );
}

/* ─────────────────────── Bar chart svg ──────────────────────── */
function BarChart({ data, height = 140 }: {
  data: { label: string; value: number; max: number; color: string }[];
  height?: number;
}) {
  const maxVal = Math.max(...data.map(d => d.max), 1);
  const barW = 28;
  const gap = 10;
  const totalW = data.length * (barW + gap) - gap;

  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(totalW, 300)} height={height + 34} className="min-w-full">
        {data.map((d, i) => {
          const barH = Math.max((d.value / maxVal) * height, d.value > 0 ? 4 : 0);
          const x = i * (barW + gap);
          const y = height - barH;
          return (
            <g key={i}>
              {/* bg bar */}
              <rect x={x} y={0} width={barW} height={height} rx={4}
                className="fill-gray-100 dark:fill-gray-700" />
              {/* value bar */}
              <rect x={x} y={y} width={barW} height={barH} rx={4}
                fill={d.color} style={{ transition: 'all 0.6s ease' }}>
                <title>{d.label}: {d.value}</title>
              </rect>
              {/* label */}
              <text x={x + barW / 2} y={height + 16} textAnchor="middle"
                className="fill-gray-500 dark:fill-gray-400" fontSize={10}>
                {d.label}
              </text>
              {/* count */}
              {d.value > 0 && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle"
                  className="fill-gray-700 dark:fill-gray-200" fontSize={9} fontWeight="600">
                  {d.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─────────────────── Mini donut chart ───────────────────────── */
function DonutChart({ categories }: { categories: { name: string; count: number; color: string }[] }) {
  const total = categories.reduce((s, c) => s + c.count, 0) || 1;
  const size = 120;
  const r = 44;
  const stroke = 22;
  const circ = 2 * Math.PI * r;
  let cumulative = 0;

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width={size} height={size} className="shrink-0 rotate-[-90deg]">
        {categories.map((cat, i) => {
          const pct = cat.count / total;
          const dash = pct * circ;
          const offset = circ - cumulative * circ / total;
          cumulative += cat.count;
          return (
            <circle key={i} cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={cat.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={offset - circ}
              strokeLinecap="butt">
              <title>{cat.name}: {cat.count}</title>
            </circle>
          );
        })}
        {categories.length === 0 && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke="#e5e7eb" strokeWidth={stroke} strokeDasharray={`${circ} 0`} />
        )}
      </svg>
      <div className="flex flex-col gap-1 text-xs min-w-0">
        {categories.map((cat, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
            <span className="text-gray-700 dark:text-gray-300 capitalize truncate max-w-[100px]">{cat.name}</span>
            <span className="ml-auto font-semibold text-gray-900 dark:text-white">{cat.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────── Heatmap calendar ───────────────────────── */
function AdherenceHeatmap({ dayMap }: { dayMap: Map<string, { taken: number; expected: number }> }) {
  const today = new Date();
  // Build 7-week grid (49 days)
  const cells: { date: Date; key: string }[] = [];
  for (let i = 48; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    cells.push({ date: d, key: d.toISOString().split('T')[0] });
  }

  const cellColor = (key: string) => {
    const data = dayMap.get(key);
    if (!data || data.expected === 0) return 'bg-gray-100 dark:bg-gray-700';
    const rate = data.taken / data.expected;
    if (rate >= 1) return 'bg-green-500';
    if (rate >= 0.75) return 'bg-green-300';
    if (rate >= 0.5) return 'bg-yellow-300';
    if (rate > 0) return 'bg-orange-300';
    return 'bg-red-300';
  };

  return (
    <div>
      <div className="flex gap-1 flex-wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 24px)' }}>
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs text-gray-400 dark:text-gray-500">{d[0]}</div>
        ))}
        {cells.map((cell) => (
          <div
            key={cell.key}
            className={`w-6 h-6 rounded ${cellColor(cell.key)} transition-all`}
            title={`${cell.key}: ${dayMap.get(cell.key)?.taken ?? 0}/${dayMap.get(cell.key)?.expected ?? 0} doses`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <span>Less</span>
        {['bg-red-300', 'bg-orange-300', 'bg-yellow-300', 'bg-green-300', 'bg-green-500'].map(c => (
          <span key={c} className={`w-4 h-4 rounded ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

/* ─────────────────── Main Component ────────────────────────── */

interface DayStats {
  day: string;
  date: string;
  taken: number;
  expected: number;
  rate: number;
}

interface AnalyticsState {
  adherenceRate: number;
  totalDoses: number;
  takenDoses: number;
  activeMedicines: number;
  expiringSoon: number;
  streak: number;
  weeklyData: DayStats[];
  categoryData: { name: string; count: number; color: string }[];
  dayMap: Map<string, { taken: number; expected: number }>;
  topMedicines: { name: string; count: number }[];
  monthlyTrend: { label: string; taken: number; expected: number }[];
  loaded: boolean;
}

const INIT: AnalyticsState = {
  adherenceRate: 0, totalDoses: 0, takenDoses: 0,
  activeMedicines: 0, expiringSoon: 0, streak: 0,
  weeklyData: [], categoryData: [], dayMap: new Map(),
  topMedicines: [], monthlyTrend: [], loaded: false,
};

export default function Analytics() {
  const { user } = useAuthStore();
  const [data, setData] = useState<AnalyticsState>(INIT);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<7 | 14 | 30>(7);

  useEffect(() => { if (user) load(); }, [user, period]);

  const load = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const medicines: Medicine[] = await db.medicines.where('userId').equals(user.id).toArray();
      const schedules: MedicineSchedule[] = await db.schedules.where('userId').equals(user.id).toArray();

      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setDate(now.getDate() - period + 1);
      periodStart.setHours(0, 0, 0, 0);

      /* ── helpers ── */
      const isScheduleActiveOnDay = (schedule: MedicineSchedule, day: Date): boolean => {
        const start = new Date(schedule.startDate as any);
        start.setHours(0, 0, 0, 0);
        const end = schedule.endDate ? new Date(schedule.endDate as any) : now;
        end.setHours(23, 59, 59, 999);
        if (day < start || day > end) return false;
        switch (schedule.frequency) {
          case 'once': return day.toISOString().split('T')[0] === start.toISOString().split('T')[0];
          case 'weekly': return day.getDay() === start.getDay();
          default: return true; // daily / custom
        }
      };

      /* ── Adherence over selected period ── */
      let totalExpected = 0, totalTaken = 0;
      const medicineUsage: Record<string, number> = {};
      const dayMap = new Map<string, { taken: number; expected: number }>();

      // fullDayMap covers 60 days always — used for streak (independent of selected period)
      const fullDayMap = new Map<string, { taken: number; expected: number }>();
      const streakStart = new Date(now);
      streakStart.setDate(now.getDate() - 59);
      streakStart.setHours(0, 0, 0, 0);

      schedules.forEach(schedule => {
        const cnt = schedule.times?.length || 0;
        if (cnt === 0) return;

        // Build period dayMap
        for (let d = new Date(periodStart); d <= now; d.setDate(d.getDate() + 1)) {
          const dCopy = new Date(d);
          dCopy.setHours(0, 0, 0, 0);
          if (isScheduleActiveOnDay(schedule, dCopy)) {
            const dayKey = dCopy.toISOString().split('T')[0];
            totalExpected += cnt;
            const existing = dayMap.get(dayKey) || { taken: 0, expected: 0 };
            dayMap.set(dayKey, { ...existing, expected: existing.expected + cnt });
          }
        }

        // Build 60-day fullDayMap for streak
        for (let d = new Date(streakStart); d <= now; d.setDate(d.getDate() + 1)) {
          const dCopy = new Date(d);
          dCopy.setHours(0, 0, 0, 0);
          if (isScheduleActiveOnDay(schedule, dCopy)) {
            const dayKey = dCopy.toISOString().split('T')[0];
            const existing = fullDayMap.get(dayKey) || { taken: 0, expected: 0 };
            fullDayMap.set(dayKey, { ...existing, expected: existing.expected + cnt });
          }
        }

        schedule.taken?.forEach((record: any) => {
          const td = new Date(record.date);
          if (record.taken) {
            // Period map
            if (td >= periodStart && td <= now) {
              totalTaken++;
              const dayKey = td.toISOString().split('T')[0];
              const existing = dayMap.get(dayKey) || { taken: 0, expected: 0 };
              dayMap.set(dayKey, { ...existing, taken: existing.taken + 1 });
              const medName = medicines.find(m => m.id === schedule.medicineId)?.name || 'Unknown';
              medicineUsage[medName] = (medicineUsage[medName] || 0) + 1;
            }
            // Full 60-day map
            if (td >= streakStart && td <= now) {
              const dayKey = td.toISOString().split('T')[0];
              const existing = fullDayMap.get(dayKey) || { taken: 0, expected: 0 };
              fullDayMap.set(dayKey, { ...existing, taken: existing.taken + 1 });
            }
          }
        });
      });

      const adherenceRate = totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : 0;

      /* ── Day streak (uses fullDayMap so it's not capped by selected period) ── */
      let streak = 0;
      const today0 = new Date(); today0.setHours(0, 0, 0, 0);
      for (let i = 0; i < 60; i++) {
        const check = new Date(today0); check.setDate(today0.getDate() - i);
        const key = check.toISOString().split('T')[0];
        const d = fullDayMap.get(key);
        if (!d || d.expected === 0) {
          // Day with no doses scheduled — don't break streak (skip gracefully)
          // but only if it's today (i===0) or before any schedule started
          if (i === 0) continue;
          // For past days: if there were never any expected medicines, skip silently
          // but if there are active medicines overall and day has no data, break
          if (schedules.length > 0) break;
          continue;
        }
        if (d.taken >= d.expected) streak++;
        else break;
      }

      /* ── Weekly bar data (last 7 days) ── */
      const weeklyData: DayStats[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const dayData = dayMap.get(key) || { taken: 0, expected: 0 };
        weeklyData.push({
          day: DAY_NAMES[d.getDay()],
          date: key,
          taken: dayData.taken,
          expected: dayData.expected,
          rate: dayData.expected > 0 ? Math.round((dayData.taken / dayData.expected) * 100) : 0,
        });
      }

      /* ── Monthly trend (last 4 weeks) ── */
      const monthlyTrend = [];
      for (let w = 3; w >= 0; w--) {
        let wTaken = 0, wExpected = 0;
        for (let d = 0; d < 7; d++) {
          const date = new Date(now);
          date.setDate(now.getDate() - w * 7 - d);
          const key = date.toISOString().split('T')[0];
          const wd = dayMap.get(key) || { taken: 0, expected: 0 };
          wTaken += wd.taken; wExpected += wd.expected;
        }
        const endD = new Date(now); endD.setDate(now.getDate() - w * 7);
        monthlyTrend.push({ label: `W${4 - w}`, taken: wTaken, expected: wExpected });
      }

      /* ── Medicine categories ── */
      const catMap: Record<string, number> = {};
      medicines.forEach(m => { catMap[m.category] = (catMap[m.category] || 0) + 1; });
      const categoryData = Object.entries(catMap)
        .sort(([, a], [, b]) => b - a)
        .map(([name, count]) => ({ name, count, color: CATEGORY_COLORS[name] || '#6b7280' }));

      /* ── Expiring soon ── */
      const in30 = new Date(now); in30.setDate(now.getDate() + 30);
      const expiringSoon = medicines.filter(m => {
        const expiry = new Date(m.expiryDate as any); // normalise
        return expiry <= in30 && expiry >= now;
      }).length;

      /* ── Top medicines ── */
      const topMedicines = Object.entries(medicineUsage)
        .sort(([, a], [, b]) => b - a).slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      setData({
        adherenceRate, totalDoses: totalExpected, takenDoses: totalTaken,
        activeMedicines: medicines.filter(m => schedules.some(s => s.medicineId === m.id)).length,
        expiringSoon, streak,
        weeklyData, categoryData, dayMap, topMedicines, monthlyTrend,
        loaded: true,
      });
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const adherence = adherenceLabel(data.adherenceRate);

  /* ── Insight messages ── */
  const insights = useMemo(() => {
    const msgs: { emoji: string; text: string; color: string }[] = [];
    if (!data.loaded) return msgs;
    if (data.adherenceRate >= 90)
      msgs.push({ emoji: '🏆', text: 'Excellent adherence! You\'re in the top tier. Keep it up!', color: 'text-green-700 dark:text-green-300' });
    else if (data.adherenceRate >= 75)
      msgs.push({ emoji: '👍', text: 'Good adherence! A little more consistency will get you to excellent.', color: 'text-yellow-700 dark:text-yellow-300' });
    else if (data.adherenceRate > 0)
      msgs.push({ emoji: '⚠️', text: 'Adherence needs improvement. Enable alarms in Schedule tab.', color: 'text-red-700 dark:text-red-300' });
    if (data.streak >= 7)
      msgs.push({ emoji: '🔥', text: `${data.streak}-day streak! You\'re building a fantastic habit!`, color: 'text-orange-700 dark:text-orange-300' });
    if (data.expiringSoon > 0)
      msgs.push({ emoji: '⏰', text: `${data.expiringSoon} medicine(s) expire within 30 days. Check your cabinet!`, color: 'text-red-700 dark:text-red-300' });
    if (data.activeMedicines === 0)
      msgs.push({ emoji: '📝', text: 'No medicine schedules found. Add medicines and set up a schedule.', color: 'text-gray-700 dark:text-gray-300' });
    if (data.totalDoses === 0 && data.activeMedicines > 0)
      msgs.push({ emoji: '📅', text: 'No doses tracked yet this period. Start marking doses as taken!', color: 'text-blue-700 dark:text-blue-300' });
    return msgs;
  }, [data]);

  return (
    <div className="space-y-6 fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Health Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track your medicine adherence and health trends
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Period selector */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {([7, 14, 30] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                {p}d
              </button>
            ))}
          </div>
          <button
            onClick={load}
            disabled={refreshing}
            className="btn btn-secondary"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Key Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Adherence rate with radial */}
        <div className={`card col-span-2 lg:col-span-1 flex flex-col items-center justify-center text-center py-6 ${adherence.bg}`}>
          <div className="relative">
            <RadialProgress value={data.adherenceRate} size={100} stroke={9} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${adherence.color}`}>{data.adherenceRate}%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Adherence Rate</p>
          <span className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full ${adherence.bg} ${adherence.color}`}>
            {adherence.text}
          </span>
        </div>

        <div className="card bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Doses Taken</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {data.takenDoses}
              </p>
              <p className="text-xs text-gray-400 mt-1">of {data.totalDoses} expected</p>
            </div>
            <Pill className="w-10 h-10 text-purple-300 dark:text-purple-600" />
          </div>
        </div>

        <div className="card bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Medicines</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {data.activeMedicines}
              </p>
              {data.expiringSoon > 0 && (
                <p className="text-xs text-orange-500 mt-1">⚠️ {data.expiringSoon} expiring soon</p>
              )}
            </div>
            <Heart className="w-10 h-10 text-blue-300 dark:text-blue-600" />
          </div>
        </div>

        <div className="card bg-orange-50 dark:bg-orange-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {data.streak} {data.streak > 0 ? '🔥' : ''}
              </p>
              <p className="text-xs text-gray-400 mt-1">consecutive days</p>
            </div>
            <Award className="w-10 h-10 text-orange-300 dark:text-orange-600" />
          </div>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly bar chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Daily Doses (Last 7 Days)
            </h2>
          </div>
          {data.weeklyData.length > 0 ? (
            <div className="space-y-3">
              {data.weeklyData.map((day) => (
                <div key={day.date} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium w-10 text-gray-700 dark:text-gray-300">{day.day}</span>
                    <div className="flex-1 mx-3 h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${day.rate}%`,
                          backgroundColor: adherenceColor(day.rate),
                        }}
                      />
                    </div>
                    <div className="text-right w-24">
                      <span className="text-gray-500 text-xs">{day.taken}/{day.expected}</span>
                      <span className="font-semibold ml-2" style={{ color: adherenceColor(day.rate) }}>
                        {day.expected > 0 ? `${day.rate}%` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No schedule data found</p>
            </div>
          )}
        </div>

        {/* Monthly trend bar chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" /> Weekly Trend
            </h2>
            <span className="text-xs text-gray-400">Last 4 weeks</span>
          </div>
          <BarChart
            height={140}
            data={data.monthlyTrend.map(w => ({
              label: w.label,
              value: w.taken,
              max: w.expected,
              color: adherenceColor(w.expected > 0 ? Math.round((w.taken / w.expected) * 100) : 0),
            }))}
          />
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Taken doses per week</span>
          </div>
        </div>
      </div>

      {/* ── Heatmap + Category ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" /> Adherence Heatmap
          </h2>
          <AdherenceHeatmap dayMap={data.dayMap} />
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Pill className="w-5 h-5 text-indigo-600" /> Medicine Categories
          </h2>
          {data.categoryData.length > 0 ? (
            <DonutChart categories={data.categoryData} />
          ) : (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">
              <Pill className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No medicines found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Top Medicines ── */}
      {data.topMedicines.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" /> Most Taken Medicines
          </h2>
          <div className="space-y-3">
            {data.topMedicines.map((med, idx) => {
              const max = data.topMedicines[0].count;
              const pct = max > 0 ? (med.count / max) * 100 : 0;
              return (
                <div key={med.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{med.name}</span>
                      <span className="text-gray-500">{med.count} doses</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Insights ── */}
      <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-indigo-600" /> Insights & Tips
        </h2>
        {insights.length > 0 ? (
          <div className="space-y-2 text-sm">
            {insights.map((ins, i) => (
              <p key={i} className={ins.color}>
                {ins.emoji} {ins.text}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Start tracking medicines to get personalized insights!
          </p>
        )}
      </div>
    </div>
  );
}
