import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Save, X, Sparkles, Clock, Plus, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';
import { Medicine } from '../../types';
import { generateId } from '../../utils/helpers';
import { OCRService } from '../../services/ocrService';
import toast from 'react-hot-toast';
import axios from 'axios';
import { NotificationService } from '../../services/notificationService';

export default function AddMedicine() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const isScanMode = searchParams.get('scan') === 'true';
  const editId = searchParams.get('edit');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Other',
    dosage: '',
    quantity: 1,
    unit: 'tablets',
    expiryDate: '',
    batchNumber: '',
    manufacturer: '',
    notes: '',
  });

  // Interaction State
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [interactionResult, setInteractionResult] = useState<any[]>([]);
  const [isCheckingInteraction, setIsCheckingInteraction] = useState(false);

  // Schedule State
  const [scheduleData, setScheduleData] = useState({
    frequency: 'daily' as 'once' | 'daily' | 'weekly' | 'custom',
    times: ['08:00'],
    frequencyText: '',
  });
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Load existing medicine data if editing
  useEffect(() => {
    if (editId) {
      loadMedicineData(editId);
      setIsEditMode(true);
    }
  }, [editId]);

  const loadMedicineData = async (id: string) => {
    try {
      const medicine = await db.medicines.get(id);
      if (medicine) {
        setFormData({
          name: medicine.name,
          category: medicine.category,
          dosage: medicine.dosage,
          quantity: medicine.quantity,
          unit: 'tablets', // Default since unit not in Medicine type
          expiryDate: medicine.expiryDate.toISOString().split('T')[0],
          batchNumber: medicine.batchNumber || '',
          manufacturer: medicine.manufacturer || '',
          notes: medicine.notes || '',
        });
      }
    } catch (error) {
      toast.error('Failed to load medicine data');
      navigate('/medicines');
    }
  };

  const categories = ['Painkiller', 'Antibiotic', 'Vitamin', 'Supplement', 'Prescription', 'Other'];
  const units = ['tablets', 'capsules', 'ml', 'mg', 'strips', 'bottles', 'boxes'];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview image
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Perform OCR
    setIsScanning(true);
    toast.loading('Scanning medicine strip...');

    try {
      const result = await OCRService.scanMedicine(file);
      toast.dismiss();
      toast.success('Scan completed! Review the extracted data.');

      setFormData((prev) => ({
        ...prev,
        name: result.name || prev.name,
        expiryDate: result.expiryDate || prev.expiryDate,
        batchNumber: result.batchNumber || prev.batchNumber,
        manufacturer: result.manufacturer || prev.manufacturer,
      }));
    } catch (error) {
      toast.dismiss();
      toast.error('OCR failed. Please enter details manually.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSmartSchedule = async () => {
    if (!scheduleData.frequencyText.trim()) {
      toast.error('Please describe the frequency first');
      return;
    }

    setIsGeneratingSchedule(true);
    try {
      const response = await axios.post('http://localhost:5000/api/gemini/schedule', {
        frequency: scheduleData.frequencyText
      });

      const { frequency, times } = response.data.schedule;

      setScheduleData(prev => ({
        ...prev,
        frequency,
        times
      }));

      toast.success('Schedule generated!');
    } catch (error) {
      console.error('Smart schedule error:', error);
      toast.error('Failed to generate schedule. Please set manually.');
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const addTime = () => {
    setScheduleData(prev => ({
      ...prev,
      times: [...prev.times, '12:00']
    }));
  };

  const removeTime = (index: number) => {
    setScheduleData(prev => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index)
    }));
  };

  const updateTime = (index: number, value: string) => {
    const newTimes = [...scheduleData.times];
    newTimes[index] = value;
    setScheduleData(prev => ({
      ...prev,
      times: newTimes
    }));
  };

  const saveMedicine = async () => {
    if (!user) return;

    try {
      if (isEditMode && editId) {
        // Update existing medicine
        await db.medicines.update(editId, {
          name: formData.name,
          category: formData.category,
          dosage: formData.dosage,
          quantity: formData.quantity,
          expiryDate: new Date(formData.expiryDate),
          batchNumber: formData.batchNumber,
          manufacturer: formData.manufacturer,
          notes: formData.notes,
          updatedAt: new Date(),
        });
        toast.success('Medicine updated successfully!');
      } else {
        // Add new medicine
        const medicine: Medicine = {
          id: generateId('med-'),
          userId: user.id || '',
          name: formData.name,
          category: formData.category,
          dosage: formData.dosage,
          quantity: formData.quantity,
          expiryDate: new Date(formData.expiryDate),
          batchNumber: formData.batchNumber,
          manufacturer: formData.manufacturer,
          notes: formData.notes,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.medicines.add(medicine);

        // Add Schedule
        if (scheduleData.times.length > 0) {
          const schedule = {
            id: generateId('schedule-'),
            medicineId: medicine.id,
            userId: user.id || '',
            frequency: scheduleData.frequency,
            times: scheduleData.times,
            dosagePerIntake: formData.dosage, // Default to medicine dosage
            startDate: new Date(),
            reminderEnabled: true,
            taken: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.schedules.add(schedule);

          // Schedule initial notifications
          for (const time of scheduleData.times) {
            await NotificationService.scheduleReminder(
              user.id || '',
              medicine.name,
              time,
              new Date()
            );
          }
        }

        toast.success('Medicine and schedule added successfully!');
      }
      navigate('/medicines');
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update medicine' : 'Failed to add medicine');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Check for unique medicine name
    try {
      if (!isEditMode) { // Only check on new additions
        const existingMeds = await db.medicines.where('userId').equals(user.id).toArray();
        const duplicate = existingMeds.find(
          m => m.name.toLowerCase() === formData.name.toLowerCase()
        );
        if (duplicate) {
          toast.error('You have already added this medicine.');
          return;
        }

        // Drug Interaction Check
        setIsCheckingInteraction(true);
        const medsToCheck = [
          ...existingMeds,
          { name: formData.name, dosage: formData.dosage }
        ];

        const response = await axios.post('http://localhost:5000/api/gemini/drug-interactions', {
          medicines: medsToCheck
        });

        const interactions = response.data.interactions;
        const highSeverity = interactions.filter((i: any) =>
          ['high', 'severe', 'major', 'moderate'].includes(i.severity.toLowerCase())
        );

        if (highSeverity.length > 0) {
          setInteractionResult(highSeverity);
          setShowInteractionModal(true);
          setIsCheckingInteraction(false);
          return; // Stop submission to show warning
        }
      }

      setIsCheckingInteraction(false);
      await saveMedicine();

    } catch (error) {
      console.error('Pre-check error:', error);
      setIsCheckingInteraction(false);
      // Fallback: proceed to save if check fails (don't block user on API error)
      await saveMedicine();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Medicine' : isScanMode ? 'Scan Medicine' : 'Add Medicine'}
        </h1>
        <button
          onClick={() => navigate('/medicines')}
          className="btn btn-secondary"
        >
          <X size={18} />
          <span>Cancel</span>
        </button>
      </div>

      {/* OCR Upload Section */}
      {isScanMode && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Upload Medicine Strip</h2>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
          >
            {selectedImage ? (
              <div className="space-y-4">
                <img
                  src={selectedImage}
                  alt="Medicine strip"
                  className="max-w-full h-64 object-contain mx-auto rounded"
                />
                {isScanning && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Scanning...
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="btn btn-secondary"
                >
                  Upload Different Image
                </button>
              </div>
            ) : (
              <div>
                <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500">PNG, JPG, JPEG up to 10MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <h2 className="text-xl font-semibold mb-6">
          {isScanMode ? 'Review & Edit Details' : 'Medicine Details'}
        </h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Medicine Name *</label>
            <input
              type="text"
              required
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Paracetamol 500mg"
            />
          </div>

          {/* Category and Dosage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                className="input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Dosage *</label>
              <input
                type="text"
                required
                className="input"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="e.g., 1 tablet"
              />
            </div>
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Quantity *</label>
              <input
                type="number"
                required
                min="1"
                className="input"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Unit</label>
              <select
                className="input"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium mb-2">Expiry Date *</label>
            <input
              type="date"
              required
              className="input"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>

          {/* Batch Number and Manufacturer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Batch Number</label>
              <input
                type="text"
                className="input"
                value={formData.batchNumber}
                onChange={(e) =>
                  setFormData({ ...formData, batchNumber: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Manufacturer</label>
              <input
                type="text"
                className="input"
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              className="input"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information..."
            />
          </div>
        </div>

        {/* Smart Schedule Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="text-primary-600" size={20} />
            Smart Schedule
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                How often do you take this?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder='e.g., "Twice a day after meals" or "Every morning at 8"'
                  value={scheduleData.frequencyText}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, frequencyText: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={handleSmartSchedule}
                  disabled={isGeneratingSchedule}
                  className="btn btn-secondary whitespace-nowrap"
                >
                  {isGeneratingSchedule ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  ) : (
                    <Sparkles size={16} className="text-yellow-500 mr-2" />
                  )}
                  Auto-Schedule
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                AI will automatically set the best times based on your description.
              </p>
            </div>

            {/* Generated Times */}
            {scheduleData.times.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium">Scheduled Times</label>
                  <button type="button" onClick={addTime} className="text-primary-600 text-sm flex items-center gap-1 hover:underline">
                    <Plus size={14} /> Add Time
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {scheduleData.times.map((time, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="time"
                        className="input"
                        value={time}
                        onChange={(e) => updateTime(index, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeTime(index)}
                        className="text-red-500 hover:text-red-600 p-2"
                        title="Remove time"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex space-x-3 mt-6">
          <button
            type="submit"
            disabled={isCheckingInteraction}
            className="btn btn-primary flex-1"
          >
            {isCheckingInteraction ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Checking Interactions...</span>
              </div>
            ) : (
              <>
                <Save size={18} />
                <span>{isEditMode ? 'Update Medicine' : 'Save Medicine'}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/medicines')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form >

      {/* Interaction Warning Modal */}
      {showInteractionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 border-l-4 border-red-500">
            <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2">
              <span className="text-2xl">⚠️</span> Warning: Interaction Detected
            </h3>

            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Adding <strong>{formData.name}</strong> may cause a serious interaction with your current medicines:
            </p>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6 max-h-40 overflow-y-auto">
              {interactionResult.map((interaction, idx) => (
                <div key={idx} className="mb-2 last:mb-0">
                  <p className="font-semibold text-red-700 dark:text-red-400">
                    {interaction.medicines.join(' + ')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {interaction.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 italic">
                    {interaction.recommendation}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInteractionModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowInteractionModal(false);
                  saveMedicine();
                }}
                className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
