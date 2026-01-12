import { useEffect, useState } from 'react';
import { Heart, MapPin, Phone, Mail, Clock, CheckCircle, Package, Trash2, Edit2, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';
import { Medicine, NGO, Hospital, Donation } from '../../types';
import { generateId, calculateDistance, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { API_URL } from '../../config/api';

export default function DonationCenter() {
  const { user } = useAuthStore();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [orgType, setOrgType] = useState<'ngo' | 'hospital'>('ngo');
  const [userLocation, setUserLocation] = useState({ lat: 28.7041, lng: 77.1025 }); // Default Delhi
  const [myDonations, setMyDonations] = useState<Donation[]>([]);
  const [activeTab, setActiveTab] = useState<'donate' | 'history'>('donate');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Contact & Location State
  const [contactPhone, setContactPhone] = useState('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [preciseLocation, setPreciseLocation] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
      if (user.phone) setContactPhone(user.phone);
    }
    // Auto-fetch location for list sorting
    getPreciseLocation(true);
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load non-expired medicines from local DB
    const meds = await db.medicines
      .where('userId')
      .equals(user.id)
      .filter((m) => m.expiryDate > new Date())
      .toArray();
    setMedicines(meds);

    // Load NGOs and Hospitals
    try {
      const ngosResponse = await fetch(`${API_URL}/api/ngos`);
      if (ngosResponse.ok) {
        const ngoList = await ngosResponse.json();
        setNgos(ngoList);
      }
    } catch (e) {
      console.error("Failed to load NGOs from API", e);
      // Fallback or leave empty
      const ngoList = await db.ngos.toArray();
      setNgos(ngoList);
    }
    const hospitalList = await db.hospitals.toArray();
    setHospitals(hospitalList);

    // Load user's donations from Backend API
    try {
      const response = await fetch(`${API_URL}/api/donations/user/${user.id}`);
      if (response.ok) {
        const donations = await response.json();
        // Ensure dates are Date objects
        const parsedDonations = donations.map((d: any) => ({
          ...d,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
          expiryDate: d.expiryDate ? new Date(d.expiryDate) : undefined,
          pickupDate: d.pickupDate ? new Date(d.pickupDate) : undefined,
          medicines: d.medicines || []
        }));
        setMyDonations(parsedDonations);
      }
    } catch (error) {
      console.error("Failed to load donations", error);
      toast.error("Failed to load donation history");
    }
  };

  const getPreciseLocation = (isAuto: boolean = false) => {
    if (!navigator.geolocation) {
      if (!isAuto) toast.error('Geolocation is not supported');
      return;
    }
    if (!isAuto) setLocationStatus('loading');

    const successHandler = (position: GeolocationPosition) => {
      const newLoc = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      setPreciseLocation(newLoc);
      setUserLocation(newLoc); // Updating sorting location
      if (!isAuto) {
        setLocationStatus('success');
        toast.success('Location captured!');
      }
    };

    const errorHandler = (error: GeolocationPositionError) => {
      console.warn("High accuracy location failed, trying low accuracy...", error);
      // Fallback to low accuracy
      navigator.geolocation.getCurrentPosition(
        successHandler,
        (finalError) => {
          console.error(finalError);
          if (!isAuto) {
            setLocationStatus('error');
            toast.error('Failed to get location. Please enable GPS.');
          }
        },
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 0 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      successHandler,
      errorHandler,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleMedicineToggle = (medId: string) => {
    setSelectedMedicines((prev) =>
      prev.includes(medId) ? prev.filter((id) => id !== medId) : [...prev, medId]
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this specific donation request?')) return;

    try {
      const response = await fetch(`${API_URL}/api/donations/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        toast.success('Donation deleted successfully');
        loadData();
      } else {
        toast.error('Failed to delete donation');
      }
    } catch (e) {
      toast.error('Error deleting donation');
    }
  };

  const handleEdit = (donation: Donation) => {
    setEditingId(donation.id);
    setSelectedMedicines(donation.medicines.map(m => m.medicineId));
    if (donation.ngoId) {
      setOrgType('ngo');
      setSelectedOrg(donation.ngoId);
    } else if (donation.hospitalId) {
      setOrgType('hospital');
      setSelectedOrg(donation.hospitalId);
    }
    setActiveTab('donate');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSelectedMedicines([]);
    setSelectedOrg('');
  };

  const handleSubmitDonation = async () => {
    if (!user || selectedMedicines.length === 0 || !selectedOrg) {
      toast.error('Please select medicines and an organization');
      return;
    }

    if (!preciseLocation && !editingId) {
      toast.error('Please capture your location first');
      return;
    }

    try {
      const donationMedicines = medicines
        .filter((m) => selectedMedicines.includes(m.id))
        .map((m) => ({
          medicineId: m.id,
          name: m.name,
          quantity: m.quantity,
          expiryDate: m.expiryDate,
          batchNumber: m.batchNumber,
        }));

      const donationData = {
        id: editingId || generateId('donation-'), // Use existing ID if editing
        userId: user.id,
        medicines: donationMedicines,
        ngoId: orgType === 'ngo' ? selectedOrg : undefined,
        hospitalId: orgType === 'hospital' ? selectedOrg : undefined,
        status: 'pending',
        pickupAddress: 'User Current Location', // In a real app, reverse geocode this
        location: preciseLocation || { lat: 0, lng: 0 },
        donorName: user.name,
        donorPhone: contactPhone,
        donorEmail: user.email,
        pickupDate: undefined,
        notes: '',
      };

      const url = editingId
        ? `${API_URL}/api/donations/${editingId}`
        : `${API_URL}/api/donations`;

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donationData)
      });

      if (!response.ok) throw new Error('Failed to submit');

      toast.success(editingId ? 'Donation updated successfully!' : 'Donation request submitted successfully!');
      cancelEdit();
      // Reset form
      setPreciseLocation(null);
      setLocationStatus('idle');
      loadData();
      setActiveTab('history');
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit donation');
    }
  };

  const organizations = orgType === 'ngo' ? ngos : hospitals;

  const getOrgWithDistance = (org: NGO | Hospital) => {
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      org.location.lat,
      org.location.lng
    );
    return { ...org, distance };
  };

  const sortedOrgs = organizations
    .map(getOrgWithDistance)
    .sort((a, b) => a.distance - b.distance);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Donation Center
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Donate unused medicines to help those in need
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('donate')}
          className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'donate'
            ? 'border-b-2 border-primary-600 text-primary-600'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
        >
          {editingId ? 'Edit Donation' : 'Make Donation'}
        </button>
        <button
          onClick={() => { setActiveTab('history'); cancelEdit(); }}
          className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'history'
            ? 'border-b-2 border-primary-600 text-primary-600'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
        >
          My Donations ({myDonations.length})
        </button>
      </div>

      {activeTab === 'donate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Select Medicines */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Select Medicines to Donate</h2>
            {medicines.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {medicines.map((med) => (
                  <label
                    key={med.id}
                    className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMedicines.includes(med.id)}
                      onChange={() => handleMedicineToggle(med.id)}
                      className="w-5 h-5 text-primary-600 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{med.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Qty: {med.quantity} • Expires: {formatDate(med.expiryDate)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No medicines available for donation
              </p>
            )}
          </div>

          {/* Select Organization */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Choose Organization Type</h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setOrgType('ngo');
                    setSelectedOrg('');
                  }}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${orgType === 'ngo'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                >
                  NGOs ({ngos.length})
                </button>
                <button
                  onClick={() => {
                    setOrgType('hospital');
                    setSelectedOrg('');
                  }}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${orgType === 'hospital'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                >
                  Hospitals ({hospitals.length})
                </button>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">
                Nearby {orgType === 'ngo' ? 'NGOs' : 'Hospitals'}
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sortedOrgs.map((org) => (
                  <label
                    key={org.id}
                    className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedOrg === org.id
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="organization"
                      value={org.id}
                      checked={selectedOrg === org.id}
                      onChange={() => setSelectedOrg(org.id)}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                          {org.name}
                          {org.verified && (
                            <CheckCircle className="ml-2 text-green-500" size={16} />
                          )}
                        </h3>
                        <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <MapPin size={14} className="mr-2" />
                            {org.address} • {org.distance.toFixed(1)} km away
                          </div>
                          <div className="flex items-center">
                            <Phone size={14} className="mr-2" />
                            {org.phone}
                          </div>
                          {org.email && (
                            <div className="flex items-center">
                              <Mail size={14} className="mr-2" />
                              {org.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Contact & Location</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 99999 99999"
                      className="input pl-10 w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pickup Location
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => getPreciseLocation(false)}
                      className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors ${locationStatus === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                        }`}
                    >
                      <MapPin size={18} />
                      <span>
                        {locationStatus === 'loading' ? 'Getting Location...' :
                          locationStatus === 'success' ? 'Location Captured' : 'Get Current Location'}
                      </span>
                    </button>
                  </div>
                  {preciseLocation && (
                    <p className="text-xs text-green-600 mt-1 ml-1">
                      Coordinates: {preciseLocation.lat.toFixed(6)}, {preciseLocation.lng.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              {editingId && (
                <button
                  onClick={cancelEdit}
                  className="btn btn-secondary flex-1"
                >
                  <X size={18} />
                  <span>Cancel</span>
                </button>
              )}
              <button
                onClick={handleSubmitDonation}
                disabled={selectedMedicines.length === 0 || !selectedOrg || !contactPhone || !preciseLocation}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Heart size={18} />
                <span>{editingId ? 'Update Donation' : 'Submit Donation Request'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {myDonations.length > 0 ? (
            myDonations.map((donation) => {
              const org =
                [...ngos, ...hospitals].find(
                  (o) => o.id === donation.ngoId || o.id === donation.hospitalId
                ) || ({} as any);

              return (
                <div key={donation.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {org.name || 'Organization'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(donation.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`badge ${donation.status === 'completed'
                          ? 'badge-green'
                          : donation.status === 'confirmed'
                            ? 'badge-blue'
                            : donation.status === 'cancelled'
                              ? 'badge-red'
                              : 'badge-yellow'
                          }`}
                      >
                        {donation.status.toUpperCase()}
                      </span>

                      {donation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleEdit(donation)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-full transition-colors"
                            title="Edit Request"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(donation.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-full transition-colors"
                            title="Delete Request"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Package size={16} className="mr-2" />
                      {donation.medicines.length} medicine(s) donated
                    </div>
                    {donation.pickupDate && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Clock size={16} className="mr-2" />
                        Pickup: {formatDate(donation.pickupDate)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="card text-center py-12">
              <Heart size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No Donations Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Start making a difference by donating medicines
              </p>
              <button onClick={() => setActiveTab('donate')} className="btn btn-primary">
                Make Your First Donation
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
