import { useEffect, useState } from 'react';
import {
  Heart,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  MapPin,
  Calendar,
  Eye,
  Download,
  RefreshCw,
  Pill,
  XCircle,
  Phone,
  Mail
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Donation } from '../../types';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { API_URL } from '../../config/api';

export default function DonationRequests() {
  const { user } = useAuthStore();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadDonations();
    }
  }, [user]);

  useEffect(() => {
    filterDonations();
  }, [donations, searchTerm, statusFilter]);

  const loadDonations = async () => {
    try {
      setLoading(true);
      // const donationRequests = await db.donations.where('ngoId').equals(user?.id || '').toArray();
      const response = await fetch(`${API_URL}/api/donations/ngo/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        // Ensure dates are Date objects
        const parsedDonations = data.map((d: any) => ({
          ...d,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
          expiryDate: d.expiryDate ? new Date(d.expiryDate) : undefined,
          pickupDate: d.pickupDate ? new Date(d.pickupDate) : undefined,
          medicines: d.medicines.map((m: any) => ({
            ...m,
            expiryDate: new Date(m.expiryDate)
          }))
        }));
        setDonations(parsedDonations);
      } else {
        // Fallback or error handling
        toast.error('Failed to load donation requests from server');
      }
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

    setFilteredDonations(filtered);
  };

  const handleStatusUpdate = async (donationId: string, newStatus: string) => {
    try {
      //   await db.donations.update(donationId, { 
      //     status: newStatus as any,
      //     updatedAt: new Date()
      //   });
      const response = await fetch(`${API_URL}/api/donations/${donationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update');

      toast.success('Donation status updated');
      loadDonations();
    } catch (error) {
      toast.error('Failed to update donation status');
    }
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

  const openDonationModal = (donation: Donation) => {
    setSelectedDonation(donation);
    setShowModal(true);
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
            Donation Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage incoming donation requests from patients
          </p>
        </div>
        <div className="flex space-x-3">
          <button onClick={loadDonations} className="btn btn-secondary">
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary">
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Requests</p>
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {donations.filter(d => d.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Confirmed</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {donations.filter(d => d.status === 'confirmed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {donations.filter(d => d.status === 'completed').length}
              </p>
            </div>
            <Package className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <button className="btn btn-secondary">
            <Download size={18} />
            <span>Export Filtered</span>
          </button>
        </div>
      </div>

      {/* Donations List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold">Donation</th>
                <th className="text-left py-3 px-4 font-semibold">Medicines</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
                <th className="text-left py-3 px-4 font-semibold">Date</th>
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
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Request #{donation.id.slice(-6)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {donation.pickupAddress}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Pill className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {donation.medicines.length} medicine(s)
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${getStatusColor(donation.status)}`}>
                      {getStatusIcon(donation.status)}
                      <span className="capitalize">{donation.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(donation.createdAt)}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openDonationModal(donation)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} className="text-gray-600 dark:text-gray-400" />
                      </button>
                      {donation.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(donation.id, 'confirmed')}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Confirm"
                        >
                          <CheckCircle size={16} className="text-green-600" />
                        </button>
                      )}

                      {donation.donorPhone && (
                        <a
                          href={`tel:${donation.donorPhone}`}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Call Donor"
                        >
                          <Phone size={16} className="text-blue-600" />
                        </a>
                      )}
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
              No Donation Requests
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No donation requests have been made yet'}
            </p>
          </div>
        )}
      </div>

      {/* Donation Details Modal */}
      {showModal && selectedDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(selectedDonation.status)}`}>
                    {getStatusIcon(selectedDonation.status)}
                    <span className="capitalize">{selectedDonation.status}</span>
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Request #{selectedDonation.id.slice(-6)}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {selectedDonation.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedDonation.id, 'confirmed')}
                      className="btn btn-primary"
                    >
                      <CheckCircle size={18} />
                      <span>Confirm</span>
                    </button>
                  )}
                  {selectedDonation.donorPhone && (
                    <a href={`tel:${selectedDonation.donorPhone}`} className="btn btn-secondary">
                      <Phone size={18} />
                      <span>Call</span>
                    </a>
                  )}
                  {selectedDonation.donorEmail && (
                    <a href={`mailto:${selectedDonation.donorEmail}`} className="btn btn-secondary">
                      <Mail size={18} />
                      <span>Email</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Medicines List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Donated Medicines ({selectedDonation.medicines.length})
                </h3>
                <div className="space-y-3">
                  {selectedDonation.medicines.map((medicine, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {medicine.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Quantity: {medicine.quantity} • Expires: {formatDate(medicine.expiryDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Batch: {medicine.batchNumber || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Donation Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Pickup Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin size={16} className="text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {selectedDonation.pickupAddress}
                      </span>
                    </div>
                    {selectedDonation.pickupDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} className="text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatDate(selectedDonation.pickupDate)}
                        </span>
                      </div>
                    )}
                    {selectedDonation.location && (
                      <div className="mt-2">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedDonation.location.lat},${selectedDonation.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 underline text-sm flex items-center"
                        >
                          <MapPin size={16} className="mr-1" />
                          View on Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Request Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} className="text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Requested: {formatDate(selectedDonation.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock size={16} className="text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Last Updated: {formatDate(selectedDonation.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedDonation.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Notes
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    {selectedDonation.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
