import { useState, useEffect } from 'react';
import {
  Bell,
  Database,
  Shield,
  Server,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Download,
  Upload,
  Key,
  Globe,
  Mail,
  Smartphone,
  Users,
  Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface SystemConfig {
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    reminderInterval: number;
    expiryWarningDays: number;
  };
  platform: {
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    donationEnabled: boolean;
    maxUsersPerDay: number;
    maxDonationsPerUser: number;
  };
  security: {
    sessionTimeout: number;
    passwordMinLength: number;
    requireEmailVerification: boolean;
    enableTwoFactor: boolean;
  };
  database: {
    backupEnabled: boolean;
    backupInterval: number;
    retentionDays: number;
    compressionEnabled: boolean;
  };
}

export default function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig>({
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      reminderInterval: 30,
      expiryWarningDays: 7,
    },
    platform: {
      maintenanceMode: false,
      registrationEnabled: true,
      donationEnabled: true,
      maxUsersPerDay: 100,
      maxDonationsPerUser: 10,
    },
    security: {
      sessionTimeout: 24,
      passwordMinLength: 8,
      requireEmailVerification: true,
      enableTwoFactor: false,
    },
    database: {
      backupEnabled: true,
      backupInterval: 24,
      retentionDays: 30,
      compressionEnabled: true,
    },
  });

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'platform' | 'security' | 'database'>('notifications');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // In a real app we'd use the configured base URL
      const response = await axios.get('http://localhost:5000/api/admin/settings', { withCredentials: true });
      setConfig(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    }
  };

  const handleConfigChange = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post('http://localhost:5000/api/admin/settings', config, { withCredentials: true });
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      toast.loading('Creating backup...');
      // In real app, trigger backup
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.dismiss();
      toast.success('Backup created successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to create backup');
    }
  };

  const handleRestore = async () => {
    try {
      toast.loading('Restoring from backup...');
      // In real app, restore from backup
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.dismiss();
      toast.success('Restore completed successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to restore from backup');
    }
  };

  const handleClearCache = async () => {
    try {
      toast.loading('Clearing cache...');
      // In real app, clear cache
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.dismiss();
      toast.success('Cache cleared successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to clear cache');
    }
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'platform', label: 'Platform', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'database', label: 'Database', icon: Database },
  ] as const;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            System Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure platform settings and system preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          <Save size={18} className={saving ? 'animate-spin' : ''} />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">System Status</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                Online
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Database</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                Healthy
              </p>
            </div>
            <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last Backup</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">
                2h ago
              </p>
            </div>
            <Download className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cache</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400 mt-1">
                45MB
              </p>
            </div>
            <Server className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="card">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Notification Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Send notifications via email</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConfigChange('notifications', 'emailEnabled', !config.notifications.emailEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.notifications.emailEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.notifications.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">SMS Notifications</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Send notifications via SMS</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConfigChange('notifications', 'smsEnabled', !config.notifications.smsEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.notifications.smsEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.notifications.smsEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Send browser push notifications</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConfigChange('notifications', 'pushEnabled', !config.notifications.pushEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.notifications.pushEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.notifications.pushEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Reminder Interval (minutes)</label>
                    <input
                      type="number"
                      className="input"
                      value={config.notifications.reminderInterval}
                      onChange={(e) => handleConfigChange('notifications', 'reminderInterval', parseInt(e.target.value))}
                      min="5"
                      max="1440"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Expiry Warning (days)</label>
                    <input
                      type="number"
                      className="input"
                      value={config.notifications.expiryWarningDays}
                      onChange={(e) => handleConfigChange('notifications', 'expiryWarningDays', parseInt(e.target.value))}
                      min="1"
                      max="30"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Platform Settings */}
          {activeTab === 'platform' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Platform Settings
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Maintenance Mode</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Temporarily disable platform access</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConfigChange('platform', 'maintenanceMode', !config.platform.maintenanceMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.platform.maintenanceMode ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.platform.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">User Registration</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Allow new user registrations</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConfigChange('platform', 'registrationEnabled', !config.platform.registrationEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.platform.registrationEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.platform.registrationEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Donation System</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Enable medicine donations</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConfigChange('platform', 'donationEnabled', !config.platform.donationEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.platform.donationEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.platform.donationEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Users Per Day</label>
                    <input
                      type="number"
                      className="input"
                      value={config.platform.maxUsersPerDay}
                      onChange={(e) => handleConfigChange('platform', 'maxUsersPerDay', parseInt(e.target.value))}
                      min="1"
                      max="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Donations Per User</label>
                    <input
                      type="number"
                      className="input"
                      value={config.platform.maxDonationsPerUser}
                      onChange={(e) => handleConfigChange('platform', 'maxDonationsPerUser', parseInt(e.target.value))}
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Security Settings
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Email Verification</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Require email verification for new users</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConfigChange('security', 'requireEmailVerification', !config.security.requireEmailVerification)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.security.requireEmailVerification ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.security.requireEmailVerification ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Enable 2FA for enhanced security</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConfigChange('security', 'enableTwoFactor', !config.security.enableTwoFactor)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.security.enableTwoFactor ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.security.enableTwoFactor ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Session Timeout (hours)</label>
                    <input
                      type="number"
                      className="input"
                      value={config.security.sessionTimeout}
                      onChange={(e) => handleConfigChange('security', 'sessionTimeout', parseInt(e.target.value))}
                      min="1"
                      max="168"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Password Min Length</label>
                    <input
                      type="number"
                      className="input"
                      value={config.security.passwordMinLength}
                      onChange={(e) => handleConfigChange('security', 'passwordMinLength', parseInt(e.target.value))}
                      min="6"
                      max="32"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Database Settings */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Database Settings
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Database className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Automatic Backups</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Enable automatic database backups</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConfigChange('database', 'backupEnabled', !config.database.backupEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.database.backupEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.database.backupEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Server className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Compression</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Compress backup files</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConfigChange('database', 'compressionEnabled', !config.database.compressionEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.database.compressionEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.database.compressionEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Backup Interval (hours)</label>
                    <input
                      type="number"
                      className="input"
                      value={config.database.backupInterval}
                      onChange={(e) => handleConfigChange('database', 'backupInterval', parseInt(e.target.value))}
                      min="1"
                      max="168"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Retention (days)</label>
                    <input
                      type="number"
                      className="input"
                      value={config.database.retentionDays}
                      onChange={(e) => handleConfigChange('database', 'retentionDays', parseInt(e.target.value))}
                      min="1"
                      max="365"
                    />
                  </div>
                </div>

                {/* Database Actions */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Database Actions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={handleBackup}
                      className="btn btn-primary"
                    >
                      <Download size={18} />
                      <span>Create Backup</span>
                    </button>
                    <button
                      onClick={handleRestore}
                      className="btn btn-secondary"
                    >
                      <Upload size={18} />
                      <span>Restore Backup</span>
                    </button>
                    <button
                      onClick={handleClearCache}
                      className="btn bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800"
                    >
                      <RefreshCw size={18} />
                      <span>Clear Cache</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
