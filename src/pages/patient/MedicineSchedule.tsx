import { useEffect, useState } from 'react';
import { Plus, Clock, CheckCircle, XCircle, Calendar as CalendarIcon, Bell, Edit2, Trash2, Save } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';
import { Medicine } from '../../types';
import type { MedicineSchedule } from '../../types';
import { formatDate, generateId } from '../../utils/helpers';
import { NotificationService } from '../../services/notificationService';
import { stockMonitoringService } from '../../services/stockMonitoringService';
import toast from 'react-hot-toast';

export default function MedicineSchedule() {
  const { user } = useAuthStore();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [schedules, setSchedules] = useState<MedicineSchedule[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    frequency: 'daily' as 'once' | 'daily' | 'weekly' | 'custom',
    times: ['08:00'],
    dosagePerIntake: '1 tablet',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    reminderEnabled: true,
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const meds = await db.medicines.where('userId').equals(user.id).toArray();
    const scheds = await db.schedules.where('userId').equals(user.id).toArray();
    setMedicines(meds);
    setSchedules(scheds);
  };

  const handleAddSchedule = async () => {
    if (!user || !selectedMedicine) {
      toast.error('Please select a medicine');
      return;
    }

    try {
      const schedule: MedicineSchedule = {
        id: generateId('schedule-'),
        medicineId: selectedMedicine,
        userId: user.id,
        frequency: formData.frequency,
        times: formData.times,
        dosagePerIntake: formData.dosagePerIntake,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        reminderEnabled: formData.reminderEnabled,
        taken: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.schedules.add(schedule);
      
      // Schedule notifications if enabled
      if (formData.reminderEnabled) {
        const medicine = medicines.find(m => m.id === selectedMedicine);
        if (medicine) {
          // Schedule reminder for each time slot
          for (const time of formData.times) {
            await NotificationService.scheduleReminder(user.id, medicine.name, time, new Date(formData.startDate));
          }
        }
      }

      toast.success('Schedule created successfully!');
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Failed to create schedule');
    }
  };

  const handleMarkAsTaken = async (scheduleId: string, time: string) => {
    try {
      const schedule = schedules.find(s => s.id === scheduleId);
      if (!schedule) return;

      const takenRecord = {
        date: new Date(),
        time,
        taken: true,
      };

      const updatedTaken = [...(schedule.taken || []), takenRecord];
      
      await db.schedules.update(scheduleId, {
        taken: updatedTaken,
        updatedAt: new Date(),
      });

      // Auto-decrement medicine stock
      const medicine = medicines.find(m => m.id === schedule.medicineId);
      if (medicine) {
        // Extract quantity from dosage (e.g., "1 tablet" -> 1)
        const dosageMatch = schedule.dosagePerIntake.match(/^(\d+)/);
        const amount = dosageMatch ? parseInt(dosageMatch[1]) : 1;
        await stockMonitoringService.decrementStock(schedule.medicineId, amount);
      }

      toast.success('Marked as taken! Stock updated.');
      loadData();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleSkipDose = async (scheduleId: string, time: string) => {
    try {
      const schedule = schedules.find(s => s.id === scheduleId);
      if (!schedule) return;

      const takenRecord = {
        date: new Date(),
        time,
        taken: false,
      };

      const updatedTaken = [...(schedule.taken || []), takenRecord];
      
      await db.schedules.update(scheduleId, {
        taken: updatedTaken,
        updatedAt: new Date(),
      });

      toast.success('Marked as skipped');
      loadData();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const resetForm = () => {
    setSelectedMedicine('');
    setEditingScheduleId(null);
    setFormData({
      frequency: 'daily',
      times: ['08:00'],
      dosagePerIntake: '1 tablet',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      reminderEnabled: true,
    });
  };

  const handleEditSchedule = (schedule: MedicineSchedule) => {
    setEditingScheduleId(schedule.id);
    setSelectedMedicine(schedule.medicineId);
    setFormData({
      frequency: schedule.frequency,
      times: schedule.times,
      dosagePerIntake: schedule.dosagePerIntake,
      startDate: schedule.startDate.toISOString().split('T')[0],
      endDate: schedule.endDate ? schedule.endDate.toISOString().split('T')[0] : '',
      reminderEnabled: schedule.reminderEnabled,
    });
    setShowEditModal(true);
  };

  const handleUpdateSchedule = async () => {
    if (!user || !selectedMedicine || !editingScheduleId) return;

    try {
      await db.schedules.update(editingScheduleId, {
        frequency: formData.frequency,
        times: formData.times,
        dosagePerIntake: formData.dosagePerIntake,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        reminderEnabled: formData.reminderEnabled,
        updatedAt: new Date(),
      });

      toast.success('Schedule updated successfully!');
      setShowEditModal(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Failed to update schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string, medicineName: string) => {
    if (confirm(`Delete schedule for ${medicineName}?`)) {
      try {
        await db.schedules.delete(scheduleId);
        toast.success('Schedule deleted successfully!');
        loadData();
      } catch (error) {
        toast.error('Failed to delete schedule');
      }
    }
  };

  const addTime = () => {
    setFormData({ ...formData, times: [...formData.times, '12:00'] });
  };

  const removeTime = (index: number) => {
    setFormData({ ...formData, times: formData.times.filter((_, i) => i !== index) });
  };

  const updateTime = (index: number, value: string) => {
    const newTimes = [...formData.times];
    newTimes[index] = value;
    setFormData({ ...formData, times: newTimes });
  };

  const getTodaySchedules = () => {
    const today = new Date();
    return schedules.filter(s => {
      const isActive = s.startDate <= today && (!s.endDate || s.endDate >= today);
      return isActive;
    });
  };

  const todaySchedules = getTodaySchedules();

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Medicine Schedule
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your medication schedule and reminders
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={18} />
          <span>Add Schedule</span>
        </button>
      </div>

      {/* Today's Schedule */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Today's Doses</h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(new Date())}
          </span>
        </div>

        {todaySchedules.length > 0 ? (
          <div className="space-y-4">
            {todaySchedules.map((schedule) => {
              const medicine = medicines.find(m => m.id === schedule.medicineId);
              if (!medicine) return null;

              return (
                <div key={schedule.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {medicine.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {schedule.dosagePerIntake} • {schedule.frequency}
                      </p>
                      {schedule.reminderEnabled && (
                        <div className="flex items-center space-x-2 mt-2">
                          <Bell className="text-primary-600" size={16} />
                          <span className="text-xs text-primary-600 font-medium">
                            Reminder: {schedule.times.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditSchedule(schedule)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                        title="Edit Schedule"
                      >
                        <Edit2 size={16} className="text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id, medicine.name)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                        title="Delete Schedule"
                      >
                        <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {schedule.times.map((time, index) => {
                      const today = new Date();
                      const takenToday = schedule.taken?.find(
                        t => t.time === time && 
                             new Date(t.date).toDateString() === today.toDateString()
                      );

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Clock size={18} className="text-gray-400" />
                            <span className="font-medium">{time}</span>
                            {takenToday && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                takenToday.taken 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                              }`}>
                                {takenToday.taken ? 'Taken' : 'Skipped'}
                              </span>
                            )}
                          </div>

                          {!takenToday && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleMarkAsTaken(schedule.id, time)}
                                className="btn btn-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 hover:bg-green-200"
                              >
                                <CheckCircle size={16} />
                                <span>Take</span>
                              </button>
                              <button
                                onClick={() => handleSkipDose(schedule.id, time)}
                                className="btn btn-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              >
                                <XCircle size={16} />
                                <span>Skip</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <CalendarIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p>No schedules for today</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary mt-4"
            >
              Create First Schedule
            </button>
          </div>
        )}
      </div>

      {/* All Schedules */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">All Schedules</h2>
        {schedules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((schedule) => {
              const medicine = medicines.find(m => m.id === schedule.medicineId);
              if (!medicine) return null;

              return (
                <div key={schedule.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {medicine.name}
                    </h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditSchedule(schedule)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                        title="Edit Schedule"
                      >
                        <Edit2 size={16} className="text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id, medicine.name)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                        title="Delete Schedule"
                      >
                        <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center justify-between">
                      <span>Dosage:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{schedule.dosagePerIntake}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Frequency:</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{schedule.frequency}</span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span>Reminder Times:</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                        {schedule.times.map((time, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded text-xs font-medium">
                            <Clock size={12} className="mr-1" />
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Start Date:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatDate(schedule.startDate)}</span>
                    </div>
                    {schedule.endDate && (
                      <div className="flex items-center justify-between">
                        <span>End Date:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatDate(schedule.endDate)}</span>
                      </div>
                    )}
                    {schedule.reminderEnabled && (
                      <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <Bell className="text-primary-600" size={14} />
                        <span className="text-xs text-primary-600 font-medium">Alarms Enabled</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">
            No schedules created yet
          </p>
        )}
      </div>

      {/* Edit Schedule Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Edit Medicine Schedule</h2>

              <div className="space-y-4">
                {/* Medicine Name (Read-only) */}
                <div>
                  <label className="block text-sm font-medium mb-2">Medicine</label>
                  <input
                    type="text"
                    className="input bg-gray-100 dark:bg-gray-700"
                    value={medicines.find(m => m.id === selectedMedicine)?.name || ''}
                    disabled
                  />
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium mb-2">Frequency *</label>
                  <select
                    className="input"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                  >
                    <option value="once">Once</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {/* Times */}
                <div>
                  <label className="block text-sm font-medium mb-2">Reminder Times *</label>
                  {formData.times.map((time, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="time"
                        className="input flex-1"
                        value={time}
                        onChange={(e) => updateTime(index, e.target.value)}
                      />
                      {formData.times.length > 1 && (
                        <button
                          onClick={() => removeTime(index)}
                          className="btn btn-secondary"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addTime} className="btn btn-secondary btn-sm">
                    <Plus size={16} /> Add Time
                  </button>
                </div>

                {/* Dosage */}
                <div>
                  <label className="block text-sm font-medium mb-2">Dosage per Intake *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.dosagePerIntake}
                    onChange={(e) => setFormData({ ...formData, dosagePerIntake: e.target.value })}
                    placeholder="e.g., 1 tablet"
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date *</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Date (Optional)</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Reminder Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">Enable Alarms & Reminders</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get notified with sound and alerts at scheduled times
                    </p>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, reminderEnabled: !formData.reminderEnabled })}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      formData.reminderEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        formData.reminderEnabled ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex space-x-3 mt-6">
                <button onClick={handleUpdateSchedule} className="btn btn-primary flex-1">
                  <Save size={18} />
                  <span>Update Schedule</span>
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Create Medicine Schedule</h2>

              <div className="space-y-4">
                {/* Select Medicine */}
                <div>
                  <label className="block text-sm font-medium mb-2">Select Medicine *</label>
                  <select
                    className="input"
                    value={selectedMedicine}
                    onChange={(e) => setSelectedMedicine(e.target.value)}
                    required
                  >
                    <option value="">Choose a medicine</option>
                    {medicines.map((med) => (
                      <option key={med.id} value={med.id}>
                        {med.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium mb-2">Frequency *</label>
                  <select
                    className="input"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                  >
                    <option value="once">Once</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {/* Times */}
                <div>
                  <label className="block text-sm font-medium mb-2">Times *</label>
                  {formData.times.map((time, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="time"
                        className="input flex-1"
                        value={time}
                        onChange={(e) => updateTime(index, e.target.value)}
                      />
                      {formData.times.length > 1 && (
                        <button
                          onClick={() => removeTime(index)}
                          className="btn btn-secondary"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addTime} className="btn btn-secondary btn-sm">
                    <Plus size={16} /> Add Time
                  </button>
                </div>

                {/* Dosage */}
                <div>
                  <label className="block text-sm font-medium mb-2">Dosage per Intake *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.dosagePerIntake}
                    onChange={(e) => setFormData({ ...formData, dosagePerIntake: e.target.value })}
                    placeholder="e.g., 1 tablet"
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date *</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Date (Optional)</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Reminder Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">Enable Alarms & Reminders</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get notified with sound and alerts at scheduled times
                    </p>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, reminderEnabled: !formData.reminderEnabled })}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      formData.reminderEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                        formData.reminderEnabled ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex space-x-3 mt-6">
                <button onClick={handleAddSchedule} className="btn btn-primary flex-1">
                  Create Schedule
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
