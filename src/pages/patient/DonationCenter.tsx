import { useEffect, useState } from 'react';
import { Heart, MapPin, Phone, Mail, Clock, CheckCircle, Package } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';
import { Medicine, NGO, Hospital, Donation } from '../../types';
import { generateId, calculateDistance, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function DonationCenter() {
  const { user } = useAuthStore();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [orgType, setOrgType] = useState<'ngo' | 'hospital'>('ngo');
  const [userLocation] = useState({ lat: 28.7041, lng: 77.1025 }); // Default Delhi
  const [myDonations, setMyDonations] = useState<Donation[]>([]);
  const [activeTab, setActiveTab] = useState<'donate' | 'history'>('donate');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load non-expired medicines
    const meds = await db.medicines
      .where('userId')
      .equals(user.id)
      .filter((m) => m.expiryDate > new Date())
      .toArray();
    setMedicines(meds);

    // Load NGOs and Hospitals
    const ngoList = await db.ngos.toArray();
    const hospitalList = await db.hospitals.toArray();
    setNgos(ngoList);
    setHospitals(hospitalList);

    // Load user's donations
    const donations = await db.donations.where('userId').equals(user.id).toArray();
    setMyDonations(donations);
  };

  const handleMedicineToggle = (medId: string) => {
    setSelectedMedicines((prev) =>
      prev.includes(medId) ? prev.filter((id) => id !== medId) : [...prev, medId]
    );
  };

  const handleSubmitDonation = async () => {
    if (!user || selectedMedicines.length === 0 || !selectedOrg) {
      toast.error('Please select medicines and an organization');
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

      const donation: Donation = {
        id: generateId('donation-'),
        userId: user.id,
        medicines: donationMedicines,
        ngoId: orgType === 'ngo' ? selectedOrg : undefined,
        hospitalId: orgType === 'hospital' ? selectedOrg : undefined,
        status: 'pending',
        pickupAddress: 'User Address', // In real app, get from user profile
        pickupDate: undefined,
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.donations.add(donation);
      toast.success('Donation request submitted successfully!');
      setSelectedMedicines([]);
      setSelectedOrg('');
      loadData();
      setActiveTab('history');
    } catch (error) {
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
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'donate'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Make Donation
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'history'
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
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    orgType === 'ngo'
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
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    orgType === 'hospital'
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
                    className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedOrg === org.id
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

            <button
              onClick={handleSubmitDonation}
              disabled={selectedMedicines.length === 0 || !selectedOrg}
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Heart size={18} />
              <span>Submit Donation Request</span>
            </button>
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
                    <span
                      className={`badge ${
                        donation.status === 'completed'
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
