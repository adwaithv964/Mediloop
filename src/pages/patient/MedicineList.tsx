import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, Edit, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';
import { Medicine } from '../../types';
import { getExpiryStatus, getDaysUntilExpiry, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function MedicineList() {
  const { user } = useAuthStore();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'expiry' | 'quantity'>('name');

  useEffect(() => {
    if (user) {
      loadMedicines();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortMedicines();
  }, [medicines, searchTerm, categoryFilter, sortBy]);

  const loadMedicines = async () => {
    if (!user) return;
    const meds = await db.medicines.where('userId').equals(user.id).toArray();
    setMedicines(meds);
  };

  const filterAndSortMedicines = () => {
    let filtered = [...medicines];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((m) => m.category === categoryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'expiry') {
        return a.expiryDate.getTime() - b.expiryDate.getTime();
      } else {
        return (b.quantity || 0) - (a.quantity || 0);
      }
    });

    setFilteredMedicines(filtered);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await db.medicines.delete(id);
        await db.schedules.where('medicineId').equals(id).delete();
        toast.success('Medicine deleted successfully');
        loadMedicines();
      } catch (error) {
        toast.error('Failed to delete medicine');
      }
    }
  };

  const categories = ['all', 'Painkiller', 'Antibiotic', 'Vitamin', 'Supplement', 'Prescription', 'Other'];

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Medicines
        </h1>
        <Link to="/medicines/add" className="btn btn-primary">
          <Plus size={18} />
          <span>Add Medicine</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
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

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              className="input pl-10"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <select
            className="input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="name">Sort by Name</option>
            <option value="expiry">Sort by Expiry</option>
            <option value="quantity">Sort by Quantity</option>
          </select>
        </div>
      </div>

      {/* Medicine List */}
      {filteredMedicines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedicines.map((medicine) => {
            const status = getExpiryStatus(medicine.expiryDate);
            const daysLeft = getDaysUntilExpiry(medicine.expiryDate);

            return (
              <div key={medicine.id} className="card card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {medicine.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {medicine.category}
                    </p>
                  </div>
                  <span className={`badge badge-${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Dosage:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {medicine.dosage}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {medicine.quantity} {medicine.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Expires:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(medicine.expiryDate)}
                    </span>
                  </div>
                  {daysLeft >= 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Days Left:</span>
                      <span className={`font-medium ${
                        daysLeft <= 30 ? 'text-red-600' : daysLeft <= 90 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {daysLeft} days
                      </span>
                    </div>
                  )}
                </div>

                {daysLeft < 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
                      <AlertCircle size={16} />
                      <span className="text-sm font-medium">This medicine has expired</span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Link
                    to={`/medicines/add?edit=${medicine.id}`}
                    className="btn btn-secondary flex-1"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(medicine.id, medicine.name)}
                    className="btn bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-gray-400 mb-4">
            <AlertCircle size={48} className="mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Medicines Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm || categoryFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start by adding your first medicine'}
          </p>
          {!searchTerm && categoryFilter === 'all' && (
            <Link to="/medicines/add" className="btn btn-primary inline-flex">
              <Plus size={18} />
              <span>Add Medicine</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
