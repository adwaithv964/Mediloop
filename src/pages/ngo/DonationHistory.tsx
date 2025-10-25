import { useEffect, useState } from 'react';
import { 
  Heart, 
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
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';
import { Donation } from '../../types';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function DonationHistory() {
  const { user } = useAuthStore();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDonations();
    }
  }, [user]);

  useEffect(() => {
    filterDonations();
  }, [donations, searchTerm, statusFilter, dateFilter]);

  const loadDonations = async () => {
    try {
      setLoading(true);
      const donationHistory = await db.donations.where('ngoId').equals(user?.id || '').toArray();
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

    setFilteredDonations(filtered);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('NGO Donation History Report', 20, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDate(new Date())}`, 20, 30);
    doc.text(`Organization: ${user?.name || 'NGO'}`, 20, 36);
    
    doc.setFontSize(12);
    doc.text('Summary:', 20, 50);
    doc.setFontSize(10);
    doc.text(`Total Donations: ${donations.length}`, 30, 58);
    doc.text(`Completed: ${donations.filter(d => d.status === 'completed').length}`, 30, 64);
    doc.text(`Total Medicines: ${donations.reduce((sum, d) => sum + d.medicines.length, 0)}`, 30, 70);
    
    doc.setFontSize(12);
    doc.text('Donation History:', 20, 85);
    doc.setFontSize(9);
    
    let y = 93;
    filteredDonations.forEach((donation, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${index + 1}. ${donation.medicines.length} medicines - ${donation.status} - ${formatDate(donation.createdAt)}`, 25, y);
      y += 6;
    });
    
    doc.save('ngo-donation-history.pdf');
    toast.success('Donation history exported as PDF');
  };

  const exportToExcel = () => {
    const data = filteredDonations.map(donation => ({
      'Request ID': donation.id.slice(-6),
      'Date': formatDate(donation.createdAt),
      'Status': donation.status,
      'Medicines Count': donation.medicines.length,
      'Total Medicines': donation.medicines.reduce((sum, med) => sum + med.quantity, 0),
      'Pickup Address': donation.pickupAddress,
      'Notes': donation.notes || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Donation History');
    XLSX.writeFile(wb, 'ngo-donation-history.xlsx');
    toast.success('Donation history exported to Excel');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      case 'confirmed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
      case 'picked-up': return 'text-purple-600 bg-purple-100 dark:bg-purple-900';
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:bg-red-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'picked-up': return <Package className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
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
            Donation History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track all donation requests and their outcomes
          </p>
        </div>
        <div className="flex space-x-3">
          <button onClick={loadDonations} className="btn btn-secondary">
            <RefreshCw size={18} />
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

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Donations</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {donations.length}
              </p>
            </div>
            <Heart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {donations.length > 0 ? Math.round((donations.filter(d => d.status === 'completed').length / donations.length) * 100) : 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Medicines Received</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {donations.reduce((sum, d) => sum + d.medicines.length, 0)}
              </p>
            </div>
            <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">This Month</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {donations.filter(d => {
                  const thisMonth = new Date();
                  thisMonth.setDate(1);
                  return d.createdAt >= thisMonth;
                }).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              className="input pl-10"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="picked-up">Picked Up</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <select
            className="input"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          <button className="btn btn-secondary">
            <BarChart3 size={18} />
            <span>View Analytics</span>
          </button>
        </div>
      </div>

      {/* Donation History */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold">Request ID</th>
                <th className="text-left py-3 px-4 font-semibold">Date</th>
                <th className="text-left py-3 px-4 font-semibold">Medicines</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
                <th className="text-left py-3 px-4 font-semibold">Pickup Address</th>
                <th className="text-left py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.map((donation) => (
                <tr
                  key={donation.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                        <Heart className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        #{donation.id.slice(-6)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(donation.createdAt)}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <p className="text-gray-900 dark:text-white">
                        {donation.medicines.length} medicine(s)
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {donation.medicines.reduce((sum, med) => sum + med.quantity, 0)} total units
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${getStatusColor(donation.status)}`}>
                      {getStatusIcon(donation.status)}
                      <span className="capitalize">{donation.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {donation.pickupAddress}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                        <BarChart3 size={16} className="text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDonations.length === 0 && (
          <div className="text-center py-12">
            <Heart size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Donation History
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No donation requests have been made yet'}
            </p>
          </div>
        )}
      </div>

      {/* Monthly Chart */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Monthly Donation Trends
        </h2>
        <div className="h-64 flex items-end space-x-1">
          {Array.from({ length: 12 }, (_, i) => {
            const month = new Date();
            month.setMonth(month.getMonth() - (11 - i));
            const monthDonations = donations.filter(d => 
              d.createdAt.getMonth() === month.getMonth() && 
              d.createdAt.getFullYear() === month.getFullYear()
            ).length;
            const maxDonations = Math.max(...Array.from({ length: 12 }, (_, j) => {
              const m = new Date();
              m.setMonth(m.getMonth() - (11 - j));
              return donations.filter(d => 
                d.createdAt.getMonth() === m.getMonth() && 
                d.createdAt.getFullYear() === m.getFullYear()
              ).length;
            }));
            
            return (
              <div
                key={i}
                className="flex-1 bg-blue-500 rounded-t"
                style={{ height: `${Math.max((monthDonations / maxDonations) * 200, 4)}px` }}
                title={`${month.toLocaleDateString('en-US', { month: 'short' })}: ${monthDonations} donations`}
              />
            );
          })}
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Last 12 months donation activity
        </div>
      </div>
    </div>
  );
}
