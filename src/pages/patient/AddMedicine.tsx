import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Save, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';
import { Medicine } from '../../types';
import { generateId } from '../../utils/helpers';
import { OCRService } from '../../services/ocrService';
import toast from 'react-hot-toast';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
          userId: user.id,
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
        toast.success('Medicine added successfully!');
      }
      navigate('/medicines');
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update medicine' : 'Failed to add medicine');
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

        {/* Submit Button */}
        <div className="flex space-x-3 mt-6">
          <button type="submit" className="btn btn-primary flex-1">
            <Save size={18} />
            <span>{isEditMode ? 'Update Medicine' : 'Save Medicine'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/medicines')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
