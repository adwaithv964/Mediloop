import { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  UserPlus,
  Eye,
  Ban,
  CheckSquare,
  Square
} from 'lucide-react';
import { User } from '../../types';
import { formatDate } from '../../utils/helpers';
import { API_URL } from '../../config/api';
import toast from 'react-hot-toast';

interface UserWithStats extends User {
  donationCount: number;
  medicineCount: number;
  lastActive: Date;
  isVerified: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const toDate = (v: any) => v ? new Date(v) : new Date(0);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data from MongoDB backend (contains all synced user data)
      const [usersRes, donationsRes, medicinesRes] = await Promise.all([
        fetch(`${API_URL}/api/sync/users`),
        fetch(`${API_URL}/api/sync/donations`),
        fetch(`${API_URL}/api/sync/medicines`),
      ]);

      if (!usersRes.ok) {
        throw new Error('Failed to fetch users from server');
      }

      const allUsers: User[] = usersRes.ok ? await usersRes.json() : [];
      const donations: any[] = donationsRes.ok ? await donationsRes.json() : [];
      const medicines: any[] = medicinesRes.ok ? await medicinesRes.json() : [];

      const usersWithStats: UserWithStats[] = allUsers.map(user => {
        const userDonations = donations.filter(d => d.userId === user.id);
        const userMedicines = medicines.filter(m => m.userId === user.id);

        return {
          ...user,
          createdAt: toDate(user.createdAt),
          updatedAt: toDate(user.updatedAt),
          donationCount: userDonations.length,
          medicineCount: userMedicines.length,
          lastActive: toDate(user.createdAt),
          isVerified: user.role === 'admin' || user.role === 'ngo' || user.role === 'hospital',
        };
      });

      setUsers(usersWithStats);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Could not load users. Make sure the backend server is running.');
      toast.error('Failed to load users from server');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'verified') {
        filtered = filtered.filter(user => user.isVerified);
      } else if (statusFilter === 'unverified') {
        filtered = filtered.filter(user => !user.isVerified);
      } else if (statusFilter === 'active') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = filtered.filter(user => user.lastActive > sevenDaysAgo);
      }
    }

    setFilteredUsers(filtered);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      const updated = { ...user, role: newRole as any, updatedAt: new Date() };
      await fetch(`${API_URL}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: [updated] }),
      });
      toast.success('User role updated successfully');
      loadUsers();
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      try {
        // MongoDB deletion would require a dedicated delete endpoint
        // For now, use local approach; in production add DELETE /api/sync/users/:id
        toast.info('Delete functionality requires backend endpoint — contact developer');
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }

    switch (action) {
      case 'export':
        exportUsers();
        break;
      default:
        toast.info(`Bulk ${action} requires backend support`);
    }
    setSelectedUsers([]);
  };

  const exportUsers = () => {
    const rows = [
      ['Name', 'Email', 'Role', 'Donations', 'Medicines', 'Verified', 'Created At'],
      ...filteredUsers.map(user => [
        user.name,
        user.email,
        user.role,
        String(user.donationCount),
        String(user.medicineCount),
        user.isVerified ? 'Yes' : 'No',
        formatDate(user.createdAt),
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mediloop-users.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Users exported as CSV');
  };

  const openUserModal = (user: UserWithStats) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'ngo': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'hospital': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'patient': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-600 dark:text-red-400 text-center max-w-md">{error}</p>
        <button onClick={loadUsers} className="btn btn-primary">
          <RefreshCw size={18} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage platform users and their permissions
          </p>
        </div>
        <div className="flex space-x-3">
          <button onClick={loadUsers} className="btn btn-secondary">
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
          <button onClick={exportUsers} className="btn btn-primary">
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {users.length}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Verified Users</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {users.filter(u => u.isVerified).length}
              </p>
            </div>
            <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Users</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {users.filter(u => {
                  const sevenDaysAgo = new Date();
                  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                  return u.lastActive > sevenDaysAgo;
                }).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">New This Week</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {users.filter(u => {
                  const sevenDaysAgo = new Date();
                  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                  return u.createdAt > sevenDaysAgo;
                }).length}
              </p>
            </div>
            <UserPlus className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              className="input pl-10"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="patient">Patients</option>
              <option value="ngo">NGOs</option>
              <option value="hospital">Hospitals</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="active">Active</option>
          </select>

          {selectedUsers.length > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('export')}
                className="btn btn-secondary text-sm"
              >
                <Download size={16} />
                <span>Export Selected</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4">
                  <button onClick={handleSelectAll} className="flex items-center space-x-2">
                    {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 ? (
                      <CheckSquare size={20} className="text-primary-600" />
                    ) : (
                      <Square size={20} className="text-gray-400" />
                    )}
                    <span className="font-semibold">Select All</span>
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-semibold">User</th>
                <th className="text-left py-3 px-4 font-semibold">Role</th>
                <th className="text-left py-3 px-4 font-semibold">Stats</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
                <th className="text-left py-3 px-4 font-semibold">Created</th>
                <th className="text-left py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="py-3 px-4">
                    <button onClick={() => handleUserSelect(user.id)} className="flex items-center">
                      {selectedUsers.includes(user.id) ? (
                        <CheckSquare size={20} className="text-primary-600" />
                      ) : (
                        <Square size={20} className="text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getRoleColor(user.role)}`}
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    >
                      <option value="patient">patient</option>
                      <option value="ngo">ngo</option>
                      <option value="hospital">hospital</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <p className="text-gray-900 dark:text-white">{user.donationCount} donations</p>
                      <p className="text-gray-500 dark:text-gray-400">{user.medicineCount} medicines</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {user.isVerified ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {user.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openUserModal(user)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} className="text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Users Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No users have synced their data to the server yet'}
            </p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Details</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 dark:text-primary-400 font-bold text-xl">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedUser.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedUser.donationCount} Donations
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedUser.medicineCount} Medicines
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                    <div className="mt-1">
                      <select
                        className={`px-3 py-1 rounded-full text-sm font-medium border-0 cursor-pointer ${getRoleColor(selectedUser.role)}`}
                        value={selectedUser.role}
                        onChange={(e) => {
                          handleRoleChange(selectedUser.id, e.target.value);
                          setShowUserModal(false);
                        }}
                      >
                        <option value="patient">patient</option>
                        <option value="ngo">ngo</option>
                        <option value="hospital">hospital</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    handleDeleteUser(selectedUser.id, selectedUser.name);
                    setShowUserModal(false);
                  }}
                  className="btn bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800"
                >
                  <Trash2 size={18} />
                  <span>Delete User</span>
                </button>
                <button onClick={() => setShowUserModal(false)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
