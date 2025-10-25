import { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck,
  Mail,
  Phone,
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
import { db } from '../../db';
import { User } from '../../types';
import { formatDate } from '../../utils/helpers';
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

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const allUsers = await db.users.toArray();
      const donations = await db.donations.toArray();
      const medicines = await db.medicines.toArray();

      const usersWithStats: UserWithStats[] = allUsers.map(user => {
        const userDonations = donations.filter(d => d.userId === user.id);
        const userMedicines = medicines.filter(m => m.userId === user.id);
        
        return {
          ...user,
          donationCount: userDonations.length,
          medicineCount: userMedicines.length,
          lastActive: user.createdAt, // In real app, track last login
          isVerified: user.role === 'admin' || user.role === 'ngo' || user.role === 'hospital', // Simplified verification
        };
      });

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'verified') {
        filtered = filtered.filter(user => user.isVerified);
      } else if (statusFilter === 'unverified') {
        filtered = filtered.filter(user => !user.isVerified);
      } else if (statusFilter === 'active') {
        // Users with recent activity (last 7 days)
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
      await db.users.update(userId, { role: newRole as any });
      toast.success('User role updated successfully');
      loadUsers();
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      // In real app, this would update verification status
      toast.success('User verification status updated');
      loadUsers();
    } catch (error) {
      toast.error('Failed to update verification status');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      try {
        await db.users.delete(userId);
        // Also delete related data
        await db.medicines.where('userId').equals(userId).delete();
        await db.donations.where('userId').equals(userId).delete();
        await db.schedules.where('userId').equals(userId).delete();
        toast.success('User deleted successfully');
        loadUsers();
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

    try {
      switch (action) {
        case 'verify':
          toast.success(`${selectedUsers.length} users verified`);
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
            for (const userId of selectedUsers) {
              await db.users.delete(userId);
            }
            toast.success(`${selectedUsers.length} users deleted`);
          }
          break;
        case 'export':
          exportUsers();
          break;
      }
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      toast.error(`Failed to perform bulk ${action}`);
    }
  };

  const exportUsers = () => {
    const data = filteredUsers.map(user => ({
      Name: user.name,
      Email: user.email,
      Role: user.role,
      'Donation Count': user.donationCount,
      'Medicine Count': user.medicineCount,
      'Last Active': formatDate(user.lastActive),
      Verified: user.isVerified ? 'Yes' : 'No',
      'Created At': formatDate(user.createdAt),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'mediloop-users.xlsx');
    toast.success('Users exported successfully');
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
            <span>Export</span>
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
          {/* Search */}
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

          {/* Role Filter */}
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

          {/* Status Filter */}
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

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('verify')}
                className="btn btn-secondary text-sm"
              >
                <ShieldCheck size={16} />
                <span>Verify</span>
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="btn bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 text-sm"
              >
                <Trash2 size={16} />
                <span>Delete</span>
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
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center space-x-2"
                  >
                    {selectedUsers.length === filteredUsers.length ? (
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
                    <button
                      onClick={() => handleUserSelect(user.id)}
                      className="flex items-center"
                    >
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
                        <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <p className="text-gray-900 dark:text-white">
                        {user.donationCount} donations
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {user.medicineCount} medicines
                      </p>
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
                        onClick={() => handleVerifyUser(user.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        title={user.isVerified ? 'Unverify' : 'Verify'}
                      >
                        {user.isVerified ? (
                          <Ban size={16} className="text-red-600" />
                        ) : (
                          <ShieldCheck size={16} className="text-green-600" />
                        )}
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
                : 'No users have been registered yet'}
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  User Details
                </h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedUser.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedUser.email}
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedUser.donationCount} Donations
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Pill className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedUser.medicineCount} Medicines
                    </span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Verification Status</p>
                    <div className="flex items-center space-x-2">
                      {selectedUser.isVerified ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedUser.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleVerifyUser(selectedUser.id)}
                  className="btn btn-primary"
                >
                  <ShieldCheck size={18} />
                  <span>{selectedUser.isVerified ? 'Unverify' : 'Verify'} User</span>
                </button>
                <button
                  onClick={() => handleDeleteUser(selectedUser.id, selectedUser.name)}
                  className="btn bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800"
                >
                  <Trash2 size={18} />
                  <span>Delete User</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
