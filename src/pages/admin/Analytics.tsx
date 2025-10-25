import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Heart, 
  Pill, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Activity,
  Target
} from 'lucide-react';
import { db } from '../../db';
import { User, Medicine, Donation } from '../../types';
import { formatDate } from '../../utils/helpers';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

interface AnalyticsData {
  userGrowth: { date: string; count: number }[];
  donationTrends: { date: string; count: number; completed: number }[];
  medicineCategories: { category: string; count: number }[];
  userRoles: { role: string; count: number }[];
  monthlyStats: {
    newUsers: number;
    totalDonations: number;
    completedDonations: number;
    totalMedicines: number;
  };
  topDonors: { userId: string; name: string; count: number }[];
  donationStatusBreakdown: { status: string; count: number }[];
}

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userGrowth: [],
    donationTrends: [],
    medicineCategories: [],
    userRoles: [],
    monthlyStats: {
      newUsers: 0,
      totalDonations: 0,
      completedDonations: 0,
      totalMedicines: 0,
    },
    topDonors: [],
    donationStatusBreakdown: [],
  });
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      // Load all data
      const users = await db.users.toArray();
      const medicines = await db.medicines.toArray();
      const donations = await db.donations.toArray();

      // Filter data by date range
      const filteredUsers = users.filter(u => 
        u.createdAt >= startDate && u.createdAt <= endDate
      );
      const filteredDonations = donations.filter(d => 
        d.createdAt >= startDate && d.createdAt <= endDate
      );

      // User growth data (last 30 days)
      const userGrowth = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = users.filter(u => 
          u.createdAt.toISOString().split('T')[0] === dateStr
        ).length;
        userGrowth.push({ date: dateStr, count });
      }

      // Donation trends
      const donationTrends = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayDonations = donations.filter(d => 
          d.createdAt.toISOString().split('T')[0] === dateStr
        );
        donationTrends.push({
          date: dateStr,
          count: dayDonations.length,
          completed: dayDonations.filter(d => d.status === 'completed').length,
        });
      }

      // Medicine categories
      const categoryMap = new Map<string, number>();
      medicines.forEach(med => {
        categoryMap.set(med.category, (categoryMap.get(med.category) || 0) + 1);
      });
      const medicineCategories = Array.from(categoryMap.entries()).map(([category, count]) => ({
        category,
        count,
      }));

      // User roles
      const roleMap = new Map<string, number>();
      users.forEach(user => {
        roleMap.set(user.role, (roleMap.get(user.role) || 0) + 1);
      });
      const userRoles = Array.from(roleMap.entries()).map(([role, count]) => ({
        role,
        count,
      }));

      // Monthly stats
      const monthlyStats = {
        newUsers: filteredUsers.length,
        totalDonations: filteredDonations.length,
        completedDonations: filteredDonations.filter(d => d.status === 'completed').length,
        totalMedicines: medicines.length,
      };

      // Top donors
      const donorMap = new Map<string, number>();
      donations.forEach(donation => {
        const userId = donation.userId;
        donorMap.set(userId, (donorMap.get(userId) || 0) + 1);
      });
      const topDonors = Array.from(donorMap.entries())
        .map(([userId, count]) => {
          const user = users.find(u => u.id === userId);
          return {
            userId,
            name: user?.name || 'Unknown User',
            count,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Donation status breakdown
      const statusMap = new Map<string, number>();
      donations.forEach(donation => {
        statusMap.set(donation.status, (statusMap.get(donation.status) || 0) + 1);
      });
      const donationStatusBreakdown = Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count,
      }));

      setAnalyticsData({
        userGrowth,
        donationTrends,
        medicineCategories,
        userRoles,
        monthlyStats,
        topDonors,
        donationStatusBreakdown,
      });

    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
    toast.success('Analytics data refreshed');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Mediloop Analytics Report', 20, 20);
    
    // Date range
    doc.setFontSize(10);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 20, 30);
    doc.text(`Generated: ${formatDate(new Date())}`, 20, 36);
    
    // Monthly stats
    doc.setFontSize(12);
    doc.text('Monthly Statistics:', 20, 50);
    doc.setFontSize(10);
    doc.text(`New Users: ${analyticsData.monthlyStats.newUsers}`, 30, 58);
    doc.text(`Total Donations: ${analyticsData.monthlyStats.totalDonations}`, 30, 64);
    doc.text(`Completed Donations: ${analyticsData.monthlyStats.completedDonations}`, 30, 70);
    doc.text(`Total Medicines: ${analyticsData.monthlyStats.totalMedicines}`, 30, 76);
    
    // User roles
    doc.setFontSize(12);
    doc.text('User Roles Distribution:', 20, 90);
    doc.setFontSize(10);
    let y = 98;
    analyticsData.userRoles.forEach(role => {
      doc.text(`${role.role}: ${role.count}`, 30, y);
      y += 6;
    });
    
    // Medicine categories
    doc.setFontSize(12);
    doc.text('Medicine Categories:', 20, y + 10);
    doc.setFontSize(10);
    y += 18;
    analyticsData.medicineCategories.forEach(cat => {
      doc.text(`${cat.category}: ${cat.count}`, 30, y);
      y += 6;
    });
    
    doc.save('mediloop-analytics-report.pdf');
    toast.success('Analytics report downloaded as PDF');
  };

  const exportToExcel = () => {
    const ws1 = XLSX.utils.json_to_sheet(analyticsData.userGrowth);
    const ws2 = XLSX.utils.json_to_sheet(analyticsData.donationTrends);
    const ws3 = XLSX.utils.json_to_sheet(analyticsData.medicineCategories);
    const ws4 = XLSX.utils.json_to_sheet(analyticsData.userRoles);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'User Growth');
    XLSX.utils.book_append_sheet(wb, ws2, 'Donation Trends');
    XLSX.utils.book_append_sheet(wb, ws3, 'Medicine Categories');
    XLSX.utils.book_append_sheet(wb, ws4, 'User Roles');
    
    XLSX.writeFile(wb, 'mediloop-analytics.xlsx');
    toast.success('Analytics data exported to Excel');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Platform insights and performance metrics
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button onClick={exportToPDF} className="btn btn-primary">
            <Download size={18} />
            <span>Export PDF</span>
          </button>
          <button onClick={exportToExcel} className="btn btn-secondary">
            <Download size={18} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <Filter size={20} className="text-gray-600 dark:text-gray-400" />
          <div className="flex items-center space-x-3">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                className="input"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                className="input"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">New Users</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {analyticsData.monthlyStats.newUsers}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Donations</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                {analyticsData.monthlyStats.totalDonations}
              </p>
            </div>
            <Heart className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {analyticsData.monthlyStats.completedDonations}
              </p>
            </div>
            <Target className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Medicines</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {analyticsData.monthlyStats.totalMedicines}
              </p>
            </div>
            <Pill className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              User Growth (Last 30 Days)
            </h2>
            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="h-64 flex items-end space-x-1">
            {analyticsData.userGrowth.map((data, index) => (
              <div
                key={index}
                className="flex-1 bg-blue-500 rounded-t"
                style={{ height: `${Math.max((data.count / Math.max(...analyticsData.userGrowth.map(d => d.count))) * 200, 4)}px` }}
                title={`${data.date}: ${data.count} users`}
              />
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Total: {analyticsData.userGrowth.reduce((sum, d) => sum + d.count, 0)} new users
          </div>
        </div>

        {/* Donation Trends Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Donation Trends (Last 30 Days)
            </h2>
            <Activity className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="h-64 flex items-end space-x-1">
            {analyticsData.donationTrends.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col space-y-1">
                <div
                  className="bg-red-500 rounded-t"
                  style={{ height: `${Math.max((data.count / Math.max(...analyticsData.donationTrends.map(d => d.count))) * 100, 2)}px` }}
                  title={`${data.date}: ${data.count} total`}
                />
                <div
                  className="bg-green-500 rounded-t"
                  style={{ height: `${Math.max((data.completed / Math.max(...analyticsData.donationTrends.map(d => d.count))) * 100, 2)}px` }}
                  title={`${data.date}: ${data.completed} completed`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Total</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Roles Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              User Roles Distribution
            </h2>
            <Eye className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="space-y-3">
            {analyticsData.userRoles.map((role, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {role.role}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {role.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Medicine Categories */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Medicine Categories
            </h2>
            <Pill className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="space-y-3">
            {analyticsData.medicineCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Pill className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {category.category}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {category.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Donors */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Top Donors
          </h2>
          <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-3">
          {analyticsData.topDonors.length > 0 ? (
            analyticsData.topDonors.map((donor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      {index + 1}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {donor.name}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {donor.count} donations
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No donation data available
            </p>
          )}
        </div>
      </div>

      {/* Donation Status Breakdown */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Donation Status Breakdown
          </h2>
          <BarChart3 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {analyticsData.donationStatusBreakdown.map((status, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {status.count}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {status.status.replace('-', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
