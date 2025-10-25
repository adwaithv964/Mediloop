import { useEffect, useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Calendar,
  BarChart3,
  TrendingUp,
  Users,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Stethoscope,
  Shield,
  Activity,
  Heart,
  Pill,
  FileText,
  Database,
  Target,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';
import { Donation } from '../../types';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function HospitalDonationHistory() {
  const { user } = useAuthStore();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const departments = [
    'Emergency', 'Cardiology', 'Oncology', 'Pediatrics', 
    'Surgery', 'ICU', 'Pharmacy', 'General Ward'
  ];

  useEffect(() => {
    if (user) {
      loadDonations();
    }
  }, [user]);

  useEffect(() => {
    filterDonations();
  }, [donations, searchTerm, statusFilter, dateFilter, departmentFilter]);

  const loadDonations = async () => {
    try {
      setLoading(true);
      const donationHistory = await db.donations.where('hospitalId').equals(user?.id || '').toArray();
      setDonations(donationHistory);
    } catch (error) {
      console.error('Error loading donation history:', error);
      toast.error('Failed to load donation history');
    } finally {
      setLoading(false);
    }
  };

  const filterDonations = () => {
    let filtered = [...donations];

    if (searchTerm) {
      filtered = filtered.filter(donation =>
        donation.medicines.some(med => 
          med.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(donation => donation.status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(donation => donation.createdAt >= filterDate);
          break;
        case 'week':
          filterDate.setDate(filterDate.getDate() - 7);
          filtered = filtered.filter(donation => donation.createdAt >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(filterDate.getMonth() - 1);
          filtered = filtered.filter(donation => donation.createdAt >= filterDate);
          break;
        case 'year':
          filterDate.setFullYear(filterDate.getFullYear() - 1);
          filtered = filtered.filter(donation => donation.createdAt >= filterDate);
          break;
      }
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(donation => {
        const medCategories = donation.medicines.map(med => med.category.toLowerCase());
        const departmentMap: { [key: string]: string[] } = {
          'emergency': ['emergency', 'trauma', 'critical'],
          'cardiology': ['cardiac', 'heart', 'cardiovascular'],
          'oncology': ['cancer', 'oncology', 'chemotherapy'],
          'pediatrics': ['pediatric', 'children', 'infant'],
          'surgery': ['surgical', 'anesthesia', 'operation'],
          'icu': ['intensive', 'critical', 'ventilator'],
          'pharmacy': ['general', 'common', 'routine'],
          'general ward': ['general', 'routine', 'maintenance']
        };
        
        const deptKeywords = departmentMap[departmentFilter.toLowerCase()] || [];
        return medCategories.some(cat => 
          deptKeywords.some(keyword => cat.includes(keyword))
        );
      });
    }

    setFilteredDonations(filtered);
  };

  const getDepartmentForDonation = (donation: Donation) => {
    const medCategories = donation.medicines.map(med => med.category.toLowerCase());
    const departmentMap: { [key: string]: string[] } = {
      'Emergency': ['emergency', 'trauma', 'critical'],
      'Cardiology': ['cardiac', 'heart', 'cardiovascular'],
      'Oncology': ['cancer', 'oncology', 'chemotherapy'],
      'Pediatrics': ['pediatric', 'children', 'infant'],
      'Surgery': ['surgical', 'anesthesia', 'operation'],
      'ICU': ['intensive', 'critical', 'ventilator'],
      'Pharmacy': ['general', 'common', 'routine'],
      'General Ward': ['general', 'routine', 'maintenance']
    };
    
    for (const [dept, keywords] of Object.entries(departmentMap)) {
      if (medCategories.some(cat => keywords.some(keyword => cat.includes(keyword)))) {
        return dept;
      }
    }
    return 'General Ward';
  };

  const getAnalytics = () => {
    const totalDonations = filteredDonations.length;
    const completedDonations = filteredDonations.filter(d => d.status === 'completed').length;
    const successRate = totalDonations > 0 ? (completedDonations / totalDonations) * 100 : 0;
    const totalMedicines = filteredDonations.reduce((sum, d) => sum + d.medicines.length, 0);
    
    const departmentStats = departments.map(dept => {
      const deptDonations = filteredDonations.filter(d => getDepartmentForDonation(d) === dept);
      return {
        department: dept,
        donations: deptDonations.length,
        medicines: deptDonations.reduce((sum, d) => sum + d.medicines.length, 0),
        successRate: deptDonations.length > 0 ? 
          (deptDonations.filter(d => d.status === 'completed').length / deptDonations.length) * 100 : 0
      };
    });

    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthDonations = filteredDonations.filter(d => 
        d.createdAt >= monthStart && d.createdAt <= monthEnd
      );
      
      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        donations: monthDonations.length,
        completed: monthDonations.filter(d => d.status === 'completed').length,
        medicines: monthDonations.reduce((sum, d) => sum + d.medicines.length, 0)
      });
    }

    return {
      totalDonations,
      completedDonations,
      successRate,
      totalMedicines,
      departmentStats,
      monthlyTrends
    };
  };

  const exportToPDF = () => {
    const analytics = getAnalytics();
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Hospital Donation History Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Hospital: ${user?.name}`, 20, 40);
    
    let y = 50;
    doc.setFontSize(14);
    doc.text('Summary Statistics', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.text(`Total Donations: ${analytics.totalDonations}`, 20, y);
    y += 7;
    doc.text(`Completed Donations: ${analytics.completedDonations}`, 20, y);
    y += 7;
    doc.text(`Success Rate: ${analytics.successRate.toFixed(1)}%`, 20, y);
    y += 7;
    doc.text(`Total Medicines: ${analytics.totalMedicines}`, 20, y);
    y += 15;
    
    doc.setFontSize(14);
    doc.text('Department Statistics', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    analytics.departmentStats.forEach(dept => {
      if (dept.donations > 0) {
        doc.text(`${dept.department}: ${dept.donations} donations, ${dept.medicines} medicines`, 20, y);
        y += 7;
      }
    });
    
    doc.save(`hospital-donation-history-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF report generated successfully');
  };

  const exportToExcel = () => {
    const analytics = getAnalytics();
    
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Donations', analytics.totalDonations],
      ['Completed Donations', analytics.completedDonations],
      ['Success Rate (%)', analytics.successRate.toFixed(1)],
      ['Total Medicines', analytics.totalMedicines],
    ];
    
    const departmentData = [
      ['Department', 'Donations', 'Medicines', 'Success Rate (%)'],
      ...analytics.departmentStats.map(dept => [
        dept.department,
        dept.donations,
        dept.medicines,
        dept.successRate.toFixed(1)
      ])
    ];
    
    const donationData = [
      ['Donation ID', 'Date', 'Status', 'Department', 'Medicines Count', 'Donor ID'],
      ...filteredDonations.map(donation => [
        donation.id,
        formatDate(donation.createdAt),
        donation.status,
        getDepartmentForDonation(donation),
        donation.medicines.length,
        donation.userId
      ])
    ];
    
    const wb = XLSX.utils.book_new();
    wb.Sheets['Summary'] = XLSX.utils.aoa_to_sheet(summaryData);
    wb.Sheets['Departments'] = XLSX.utils.aoa_to_sheet(departmentData);
    wb.Sheets['Donations'] = XLSX.utils.aoa_to_sheet(donationData);
    
    XLSX.utils.book_append_sheet(wb, wb.Sheets['Summary'], 'Summary');
    XLSX.utils.book_append_sheet(wb, wb.Sheets['Departments'], 'Departments');
    XLSX.utils.book_append_sheet(wb, wb.Sheets['Donations'], 'Donations');
    
    XLSX.writeFile(wb, `hospital-donation-history-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel report generated successfully');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-20"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const analytics = getAnalytics();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Donation History
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and analyze donation history with detailed reporting
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadDonations}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={20} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FileText size={20} />
            <span>Export PDF</span>
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={20} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Medicines
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by medicine name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
                setDepartmentFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Donations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalDonations}</p>
            </div>
            <Heart className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.successRate.toFixed(1)}%</p>
            </div>
            <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Medicines Received</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalMedicines}</p>
            </div>
            <Pill className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.completedDonations}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Monthly Trends Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Monthly Donation Trends</h2>
            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {analytics.monthlyTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{trend.month}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {trend.completed}/{trend.donations} completed
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{trend.donations}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Donations</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{trend.medicines}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Medicines</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Department Performance</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.departmentStats.map((dept, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">{dept.department}</h3>
                  <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Donations:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{dept.donations}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Medicines:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{dept.medicines}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                    <span className={`font-medium ${dept.successRate >= 80 ? 'text-green-600 dark:text-green-400' : dept.successRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                      {dept.successRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Donations List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Donation History ({filteredDonations.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredDonations.length === 0 ? (
            <div className="p-12 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No donation history found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || departmentFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Donation history will appear here as donations are processed.'}
              </p>
            </div>
          ) : (
            filteredDonations.map((donation) => (
              <div key={donation.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Heart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {donation.medicines.length} Medicines
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          donation.status === 'completed' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : donation.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : donation.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {donation.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Stethoscope className="h-4 w-4" />
                          <span>{getDepartmentForDonation(donation)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(donation.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>Donor: {donation.userId}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {donation.medicines.slice(0, 3).map(med => med.name).join(', ')}
                          {donation.medicines.length > 3 && ` +${donation.medicines.length - 3} more`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {donation.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
