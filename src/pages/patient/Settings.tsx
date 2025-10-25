import { useState, useEffect } from 'react';
import { Save, Bell, Moon, Sun, Eye, Key, User, MessageSquare, Volume2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { db } from '../../db';
import toast from 'react-hot-toast';
import { NotificationService } from '../../services/notificationService';
import { medicineAlarmService } from '../../services/medicineAlarmService';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const { theme, elderlyMode, toggleTheme, toggleElderlyMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState('general');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [aiApiKey, setAiApiKey] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    notificationsEnabled: user?.preferences?.notificationsEnabled ?? true,
    voiceEnabled: user?.preferences?.voiceEnabled ?? false,
    language: user?.preferences?.language || 'en',
  });

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    // Load AI API key from localStorage
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) setAiApiKey(savedKey);
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      await db.users.update(user.id, {
        name: formData.name,
        email: formData.email,
        preferences: {
          ...user.preferences,
          notificationsEnabled: formData.notificationsEnabled,
          voiceEnabled: formData.voiceEnabled,
          language: formData.language,
        },
      });

      updateUser({
        name: formData.name,
        email: formData.email,
        preferences: {
          theme: user.preferences?.theme || 'light',
          elderlyMode: user.preferences?.elderlyMode || false,
          notificationsEnabled: formData.notificationsEnabled,
          voiceEnabled: formData.voiceEnabled,
          language: formData.language,
        },
      });

      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const requestNotificationPermission = async () => {
    const permission = await NotificationService.requestPermission();
    if (permission) {
      setNotificationPermission('granted');
      toast.success('Notifications enabled!');
    } else {
      toast.error('Notification permission denied');
    }
  };

  const handleTestAlarm = async () => {
    if (!user) return;
    
    if (notificationPermission !== 'granted') {
      toast.error('Please enable browser notifications first');
      return;
    }

    toast.success('Testing alarm in 3 seconds...');
    
    setTimeout(async () => {
      await medicineAlarmService.testAlarm(user.id, 'Test Medicine');
      toast.success('Alarm test complete! Did you hear the beeps?');
    }, 3000);
  };

  const handleSaveAiKey = () => {
    localStorage.setItem('openai_api_key', aiApiKey);
    toast.success('AI API key saved!');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Eye },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'ai', label: 'AI Assistant', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="card p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {activeTab === 'general' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">General Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <select
                    className="input"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">Voice Input</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enable voice commands
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setFormData({ ...formData, voiceEnabled: !formData.voiceEnabled })
                    }
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      formData.voiceEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        formData.voiceEnabled ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
                <button onClick={handleSaveProfile} className="btn btn-primary">
                  <Save size={18} />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Appearance</h2>
              <div className="space-y-6">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium flex items-center">
                      {theme === 'dark' ? <Moon size={18} className="mr-2" /> : <Sun size={18} className="mr-2" />}
                      Dark Mode
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {theme === 'dark' ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      theme === 'dark' ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        theme === 'dark' ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Elderly Mode */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium flex items-center">
                      <Eye size={18} className="mr-2" />
                      Elderly-Friendly Mode
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Larger fonts and simplified interface
                    </p>
                  </div>
                  <button
                    onClick={toggleElderlyMode}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      elderlyMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        elderlyMode ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    💡 <strong>Tip:</strong> Elderly mode increases text size, button sizes, and
                    simplifies navigation for better accessibility.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>
              <div className="space-y-6">
                {/* Browser Notifications */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">Browser Notifications</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Status: <span className="capitalize font-semibold">{notificationPermission}</span>
                      </p>
                    </div>
                    {notificationPermission !== 'granted' && (
                      <button onClick={requestNotificationPermission} className="btn btn-primary">
                        Enable
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification Types */}
                <div className="space-y-3">
                  <h3 className="font-medium">Notification Types</h3>
                  {[
                    { id: 'reminders', label: 'Medicine Reminders', desc: 'Get notified for scheduled doses' },
                    { id: 'expiry', label: 'Expiry Warnings', desc: 'Alerts for medicines expiring soon' },
                    { id: 'refill', label: 'Refill Alerts', desc: 'Notify when medicine stock is low' },
                    { id: 'donations', label: 'Donation Updates', desc: 'Updates on your donations' },
                  ].map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{notif.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{notif.desc}</p>
                      </div>
                      <button
                        className={`relative w-12 h-6 rounded-full transition-colors bg-primary-600`}
                      >
                        <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full translate-x-5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Test Alarm */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                  <h3 className="font-medium mb-3 flex items-center">
                    <Volume2 size={20} className="mr-2 text-blue-600" />
                    Test Medicine Alarm
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Click the button below to test your medicine reminder alarm. You will hear 3 beeps and see a notification.
                  </p>
                  <button
                    onClick={handleTestAlarm}
                    disabled={notificationPermission !== 'granted'}
                    className="btn btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Bell size={18} />
                    <span>Test Alarm Sound</span>
                  </button>
                  {notificationPermission !== 'granted' && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      ⚠️ Please enable browser notifications first
                    </p>
                  )}
                </div>

                {/* Alarm Info */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2 text-sm">
                  <p className="font-medium">💡 Alarm System Information:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Alarms trigger automatically at scheduled times</li>
                    <li>You'll hear 3 beeps (800Hz tone)</li>
                    <li>Browser notification will appear</li>
                    <li>Red badge shows on notification icon</li>
                    <li>Keep browser tab open for alarms to work</li>
                    <li>Enable "Alarms & Reminders" in schedule settings</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">AI Assistant Configuration</h2>
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    🤖 The AI Assistant uses OpenAI's GPT to provide personalized health suggestions
                    and answer your medicine-related questions.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <span className="flex items-center">
                      <Key size={16} className="mr-2" />
                      OpenAI API Key
                    </span>
                  </label>
                  <input
                    type="password"
                    className="input"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="sk-..."
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Get your API key from{' '}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      OpenAI Platform
                    </a>
                  </p>
                </div>

                <button onClick={handleSaveAiKey} className="btn btn-primary">
                  <Save size={18} />
                  <span>Save API Key</span>
                </button>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    ⚠️ <strong>Note:</strong> Your API key is stored locally on your device and
                    never sent to our servers. API usage charges apply directly from OpenAI.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
