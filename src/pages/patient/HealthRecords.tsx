import { useState, useEffect } from 'react';
import { FileText, Trash2, Eye, FolderHeart, Plus, Edit2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';
import toast from 'react-hot-toast';

interface HealthRecord {
  id: string;
  userId: string;
  title: string;
  type: 'prescription' | 'lab_report' | 'medical_history' | 'insurance' | 'other';
  fileUrl?: string;
  fileName?: string;
  notes?: string;
  date: Date;
  createdAt: Date;
}

export default function HealthRecords() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState({
    title: '',
    type: 'prescription' as HealthRecord['type'],
    notes: '',
    date: new Date().toISOString().split('T')[0],
    fileUrl: '',
    fileName: ''
  });

  useEffect(() => {
    loadRecords();
  }, [user]);

  const loadRecords = async () => {
    if (!user) return;
    const data = await db.healthRecords.where('userId').equals(user.id).toArray();
    setRecords(data as any);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewRecord(prev => ({
          ...prev,
          fileUrl: reader.result as string,
          fileName: file.name
        }));
        toast.success(`File "${file.name}" ready to upload`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user || !newRecord.title) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      if (editingId) {
        await db.healthRecords.update(editingId, {
          title: newRecord.title,
          type: newRecord.type,
          notes: newRecord.notes,
          date: new Date(newRecord.date),
          fileUrl: newRecord.fileUrl,
          fileName: newRecord.fileName
        });
        toast.success('Health record updated!');
      } else {
        const record: HealthRecord = {
          id: `record-${Date.now()}`,
          userId: user.id,
          title: newRecord.title,
          type: newRecord.type,
          notes: newRecord.notes,
          date: new Date(newRecord.date),
          createdAt: new Date(),
          fileUrl: newRecord.fileUrl,
          fileName: newRecord.fileName
        };
        await db.healthRecords.add(record as any);
        toast.success('Health record added!');
      }

      closeModal();
      loadRecords();
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error('Failed to save record');
    }
  };

  const handleEdit = (record: HealthRecord) => {
    setEditingId(record.id);
    setNewRecord({
      title: record.title,
      type: record.type,
      notes: record.notes || '',
      date: new Date(record.date).toISOString().split('T')[0],
      fileUrl: record.fileUrl || '',
      fileName: record.fileName || ''
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setNewRecord({
      title: '',
      type: 'prescription',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      fileUrl: '',
      fileName: ''
    });
  };

  const handleView = (url?: string) => {
    if (url) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      }
    } else {
      toast.error('No file attached to this record');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this record?')) {
      await db.healthRecords.delete(id);
      toast.success('Record deleted');
      loadRecords();
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: any = {
      prescription: '💊',
      lab_report: '🧪',
      medical_history: '📋',
      insurance: '🏥',
      other: '📄',
    };
    return icons[type] || '📄';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FolderHeart className="w-8 h-8 text-pink-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Health Records</h1>
            <p className="text-gray-500 dark:text-gray-400">Store and manage your medical documents</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          Add Record
        </button>
      </div>

      {records.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No health records yet. Add your first record!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record) => (
            <div key={record.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{getTypeIcon(record.type)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{record.title}</h3>
                    <p className="text-sm text-gray-500 capitalize">{record.type.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
              {record.notes && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{record.notes}</p>
              )}
              <p className="text-xs text-gray-500 mb-3">
                Date: {new Date(record.date).toLocaleDateString()}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleView(record.fileUrl)}
                  className="btn btn-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 flex-1"
                  disabled={!record.fileUrl}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </button>
                <button
                  onClick={() => handleEdit(record)}
                  className="btn btn-sm bg-blue-100 text-blue-600 hover:bg-blue-200"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(record.id)} className="btn btn-sm bg-red-100 text-red-600 hover:bg-red-200">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Health Record' : 'Add Health Record'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={newRecord.title}
                  onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Blood Test Report"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newRecord.type}
                  onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value as any })}
                  className="input w-full"
                >
                  <option value="prescription">Prescription</option>
                  <option value="lab_report">Lab Report</option>
                  <option value="medical_history">Medical History</option>
                  <option value="insurance">Insurance</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={newRecord.date}
                  onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                  className="input w-full"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Upload File (Optional)</label>
                <input type="file" onChange={handleFileUpload} className="input w-full" accept=".pdf,.jpg,.png,.jpeg" />
                {newRecord.fileName && (
                  <p className="text-sm text-green-600 mt-1">Selected: {newRecord.fileName}</p>
                )}
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={closeModal} className="btn flex-1">Cancel</button>
              <button onClick={handleSave} className="btn btn-primary flex-1">Save Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
