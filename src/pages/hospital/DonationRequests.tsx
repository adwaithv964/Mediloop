import { useEffect, useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Package,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Eye,
  MessageCircle,
  Download,
  RefreshCw,
  Users,
  Pill,
  XCircle,
  Stethoscope,
  Shield,
  Activity,
  Heart,
  Star,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';
import { Donation, User } from '../../types';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function HospitalDonationRequests() {
  const { user } = useAuthStore();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [showModal, setShowModal] = useState(false);

  const departments = [
    'Emergency', 'Cardiology', 'Oncology', 'Pediatrics', 
    'Surgery', 'ICU', 'Pharmacy', 'General Ward'
  ];

  const priorities = [
    { value: 'critical', label: 'Critical', color: 'red', icon: AlertCircle },
    { value: 'high', label: 'High', color: 'orange', icon: Zap },
    { value: 'medium', label: 'Medium', color: 'yellow', icon: Clock },
    { value: 'low', label: 'Low', color: 'green', icon: CheckCircle },
  ];

  useEffect(() => {
    if (user) {
      loadDonations();
    }
  }, [user]);

  useEffect(() => {
    filterDonations();
  }, [donations, searchTerm, statusFilter, priorityFilter, departmentFilter]);

  const loadDonations = async () => {
    try {
      setLoading(true);
      const donationRequests = await db.donations.where('hospitalId').equals(user?.id || '').toArray();
      setDonations(donationRequests);
    } catch (error) {
      console.error('Error loading donations:', error);
      toast.error('Failed to load donation requests');
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

    if (priorityFilter !== 'all') {
      // Simulate priority based on medicine type and urgency
      filtered = filtered.filter(donation => {
        const hasCriticalMeds = donation.medicines.some(med => 
          med.category.toLowerCase().includes('emergency') || 
          med.category.toLowerCase().includes('critical')
        );
        const isOverdue = donation.createdAt < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        
        if (priorityFilter === 'critical') return hasCriticalMeds || isOverdue;
        if (priorityFilter === 'high') return !hasCriticalMeds && !isOverdue && donation.medicines.length > 5;
        if (priorityFilter === 'medium') return !hasCriticalMeds && !isOverdue && donation.medicines.length <= 5;
        if (priorityFilter === 'low') return donation.status === 'completed';
        return true;
      });
    }

    if (departmentFilter !== 'all') {
      // Simulate department assignment based on medicine categories
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

  const handleStatusUpdate = async (donationId: string, newStatus: string) => {
    try {
      await db.donations.update(donationId, { status: newStatus });
      toast.success('Donation status updated successfully');
      loadDonations();
      setShowModal(false);
    } catch (error) {
      console.error('Error updating donation status:', error);
      toast.error('Failed to update donation status');
    }
  };

  const getPriorityInfo = (donation: Donation) => {
    const hasCriticalMeds = donation.medicines.some(med => 
      med.category.toLowerCase().includes('emergency') || 
      med.category.toLowerCase().includes('critical')
    );
    const isOverdue = donation.createdAt < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    
    if (hasCriticalMeds || isOverdue) {
      return { value: 'critical', label: 'Critical', color: 'red', icon: AlertCircle };
    } else if (donation.medicines.length > 5) {
      return { value: 'high', label: 'High', color: 'orange', icon: Zap };
    } else if (donation.medicines.length <= 5) {
      return { value: 'medium', label: 'Medium', color: 'yellow', icon: Clock };
    } else {
      return { value: 'low', label: 'Low', color: 'green', icon: CheckCircle };
    }
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

  const exportData = () => {
    const data = filteredDonations.map(donation => ({
      'Donation ID': donation.id,
      'Donor': donation.userId,
      'Medicines': donation.medicines.map(m => m.name).join(', '),
      'Status': donation.status,
      'Priority': getPriorityInfo(donation).label,
      'Department': getDepartmentForDonation(donation),
      'Date': formatDate(donation.createdAt),
      'Notes': donation.notes || '',
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hospital-donation-requests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully');
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Donation Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage incoming donation requests and coordinate with departments
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
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={20} />
            <span>Export</span>
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
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
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
                setPriorityFilter('all');
                setDepartmentFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredDonations.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredDonations.filter(d => d.status === 'pending').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredDonations.filter(d => getPriorityInfo(d).value === 'critical').length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredDonations.filter(d => d.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Donations List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Donation Requests ({filteredDonations.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredDonations.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No donation requests found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || departmentFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Donation requests will appear here when donors submit them.'}
              </p>
            </div>
          ) : (
            filteredDonations.map((donation) => {
              const priorityInfo = getPriorityInfo(donation);
              const department = getDepartmentForDonation(donation);
              const PriorityIcon = priorityInfo.icon;
              
              return (
                <div key={donation.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg bg-${priorityInfo.color}-100 dark:bg-${priorityInfo.color}-900`}>
                        <PriorityIcon className={`h-6 w-6 text-${priorityInfo.color}-600 dark:text-${priorityInfo.color}-400`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {donation.medicines.length} Medicines
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${priorityInfo.color}-100 text-${priorityInfo.color}-800 dark:bg-${priorityInfo.color}-900 dark:text-${priorityInfo.color}-200`}>
                            {priorityInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Stethoscope className="h-4 w-4" />
                            <span>{department}</span>
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
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
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
                      <button
                        onClick={() => {
                          setSelectedDonation(donation);
                          setShowModal(true);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Donation Details Modal */}
      {showModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Donation Request Details
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status and Actions */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    selectedDonation.status === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : selectedDonation.status === 'confirmed'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : selectedDonation.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {selectedDonation.status}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full bg-${getPriorityInfo(selectedDonation).color}-100 text-${getPriorityInfo(selectedDonation).color}-800 dark:bg-${getPriorityInfo(selectedDonation).color}-900 dark:text-${getPriorityInfo(selectedDonation).color}-200`}>
                    {getPriorityInfo(selectedDonation).label} Priority
                  </span>
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {getDepartmentForDonation(selectedDonation)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedDonation.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(selectedDonation.id, 'confirmed')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Confirm Pickup
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedDonation.id, 'completed')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Mark Complete
                      </button>
                    </>
                  )}
                  {selectedDonation.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedDonation.id, 'completed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>

              {/* Donation Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Donation Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Request Date</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedDonation.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Donor ID</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedDonation.userId}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Medicines</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedDonation.medicines.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Department Assignment</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Stethoscope className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Assigned Department</p>
                        <p className="font-medium text-gray-900 dark:text-white">{getDepartmentForDonation(selectedDonation)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Hospital</p>
                        <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medicines List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Medicines</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedDonation.medicines.map((medicine, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{medicine.name}</h4>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {medicine.category}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p><span className="font-medium">Quantity:</span> {medicine.quantity}</p>
                        <p><span className="font-medium">Expiry:</span> {formatDate(medicine.expiryDate)}</p>
                        {medicine.notes && (
                          <p><span className="font-medium">Notes:</span> {medicine.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedDonation.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notes</h3>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300">{selectedDonation.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
