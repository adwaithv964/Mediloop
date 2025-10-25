import { useEffect, useState } from 'react';
import { FileText, Download, Printer, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';
import { Medicine, MedicineSchedule } from '../../types';
import { formatDate, calculateAdherenceRate } from '../../utils/helpers';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export default function Reports() {
  const { user } = useAuthStore();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [schedules, setSchedules] = useState<MedicineSchedule[]>([]);
  const [reportType, setReportType] = useState<'inventory' | 'adherence' | 'expiry'>('inventory');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

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

  const generateInventoryReport = () => {
    const today = new Date();
    return {
      title: 'Medicine Inventory Report',
      date: formatDate(today),
      userName: user?.name || 'User',
      medicines: medicines.map((m) => ({
        name: m.name,
        category: m.category,
        quantity: m.quantity,
        unit: m.unit || 'tablets',
        dosage: m.dosage,
        expiry: formatDate(m.expiryDate),
        manufacturer: m.manufacturer || 'N/A',
        batchNumber: m.batchNumber || 'N/A',
      })),
      summary: {
        total: medicines.length,
        expiringSoon: medicines.filter((m) => {
          const days = Math.floor(
            (m.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          return days >= 0 && days <= 30;
        }).length,
        expired: medicines.filter((m) => m.expiryDate < today).length,
      },
    };
  };

  const generateAdherenceReport = () => {
    const schedulesWithMeds = schedules.map((s) => {
      const medicine = medicines.find((m) => m.id === s.medicineId);
      const adherenceRate = calculateAdherenceRate(s.taken || [], s.times?.length || 1);
      return {
        medicine: medicine?.name || 'Unknown',
        frequency: s.frequency,
        times: s.times?.join(', ') || '',
        adherenceRate,
        totalDoses: s.taken?.length || 0,
      };
    });

    return {
      title: 'Medication Adherence Report',
      date: formatDate(new Date()),
      userName: user?.name || 'User',
      schedules: schedulesWithMeds,
      overallAdherence:
        schedulesWithMeds.reduce((sum, s) => sum + s.adherenceRate, 0) /
        (schedulesWithMeds.length || 1),
    };
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const report = reportType === 'inventory' ? generateInventoryReport() : generateAdherenceReport();

    // Title
    doc.setFontSize(18);
    doc.text(report.title, 20, 20);

    // Date and User
    doc.setFontSize(10);
    doc.text(`Generated: ${report.date}`, 20, 30);
    doc.text(`Patient: ${report.userName}`, 20, 36);

    doc.setFontSize(12);

    if (reportType === 'inventory') {
      const invReport = report as ReturnType<typeof generateInventoryReport>;
      
      // Summary
      doc.text('Summary:', 20, 50);
      doc.setFontSize(10);
      doc.text(`Total Medicines: ${invReport.summary.total}`, 30, 58);
      doc.text(`Expiring Soon (30 days): ${invReport.summary.expiringSoon}`, 30, 64);
      doc.text(`Expired: ${invReport.summary.expired}`, 30, 70);

      // Medicines List
      doc.setFontSize(12);
      doc.text('Medicines:', 20, 85);
      doc.setFontSize(9);

      let y = 93;
      invReport.medicines.forEach((med, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(
          `${index + 1}. ${med.name} - ${med.quantity} ${med.unit} - Exp: ${med.expiry}`,
          25,
          y
        );
        y += 6;
      });
    } else {
      const adhReport = report as ReturnType<typeof generateAdherenceReport>;
      
      doc.text(`Overall Adherence: ${adhReport.overallAdherence.toFixed(1)}%`, 20, 50);
      doc.setFontSize(10);

      let y = 65;
      adhReport.schedules.forEach((sched, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${index + 1}. ${sched.medicine}`, 25, y);
        doc.text(`Adherence: ${sched.adherenceRate.toFixed(1)}%`, 35, y + 6);
        doc.text(`Times: ${sched.times}`, 35, y + 12);
        y += 20;
      });
    }

    doc.save(`mediloop-${reportType}-report.pdf`);
    toast.success('PDF downloaded successfully!');
  };

  const exportToExcel = () => {
    const report = reportType === 'inventory' ? generateInventoryReport() : generateAdherenceReport();
    
    let data: any[] = [];
    let filename = '';

    if (reportType === 'inventory') {
      const invReport = report as ReturnType<typeof generateInventoryReport>;
      data = invReport.medicines;
      filename = 'medicine-inventory.xlsx';
    } else {
      const adhReport = report as ReturnType<typeof generateAdherenceReport>;
      data = adhReport.schedules;
      filename = 'adherence-report.xlsx';
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, filename);
    toast.success('Excel file downloaded successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  const report =
    reportType === 'inventory' ? generateInventoryReport() : generateAdherenceReport();

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate and export medication reports
          </p>
        </div>
      </div>

      {/* Report Controls */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Report Type</label>
            <select
              className="input"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
            >
              <option value="inventory">Medicine Inventory</option>
              <option value="adherence">Medication Adherence</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              className="input"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              className="input"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button onClick={exportToPDF} className="btn btn-primary">
            <FileText size={18} />
            <span>Export PDF</span>
          </button>
          <button onClick={exportToExcel} className="btn btn-secondary">
            <Download size={18} />
            <span>Export Excel</span>
          </button>
          <button onClick={handlePrint} className="btn btn-secondary">
            <Printer size={18} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="card print:shadow-none">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {report.title}
          </h2>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <Calendar size={16} className="mr-2" />
              {report.date}
            </div>
            <div>Patient: {report.userName}</div>
          </div>
        </div>

        {reportType === 'inventory' ? (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Medicines</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(report as ReturnType<typeof generateInventoryReport>).summary.total}
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(report as ReturnType<typeof generateInventoryReport>).summary.expiringSoon}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Expired</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(report as ReturnType<typeof generateInventoryReport>).summary.expired}
                </p>
              </div>
            </div>

            {/* Medicines Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold">Medicine</th>
                    <th className="text-left py-3 px-4 font-semibold">Category</th>
                    <th className="text-left py-3 px-4 font-semibold">Quantity</th>
                    <th className="text-left py-3 px-4 font-semibold">Dosage</th>
                    <th className="text-left py-3 px-4 font-semibold">Expiry Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Batch</th>
                  </tr>
                </thead>
                <tbody>
                  {(report as ReturnType<typeof generateInventoryReport>).medicines.map(
                    (med, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 dark:border-gray-800"
                      >
                        <td className="py-3 px-4">{med.name}</td>
                        <td className="py-3 px-4">{med.category}</td>
                        <td className="py-3 px-4">
                          {med.quantity} {med.unit}
                        </td>
                        <td className="py-3 px-4">{med.dosage}</td>
                        <td className="py-3 px-4">{med.expiry}</td>
                        <td className="py-3 px-4">{med.batchNumber}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            {/* Overall Adherence */}
            <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-lg mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Overall Adherence Rate
              </p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                {(report as ReturnType<typeof generateAdherenceReport>).overallAdherence.toFixed(
                  1
                )}
                %
              </p>
            </div>

            {/* Schedules Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold">Medicine</th>
                    <th className="text-left py-3 px-4 font-semibold">Frequency</th>
                    <th className="text-left py-3 px-4 font-semibold">Times</th>
                    <th className="text-left py-3 px-4 font-semibold">Adherence</th>
                    <th className="text-left py-3 px-4 font-semibold">Total Doses</th>
                  </tr>
                </thead>
                <tbody>
                  {(report as ReturnType<typeof generateAdherenceReport>).schedules.map(
                    (sched, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 dark:border-gray-800"
                      >
                        <td className="py-3 px-4">{sched.medicine}</td>
                        <td className="py-3 px-4">{sched.frequency}</td>
                        <td className="py-3 px-4">{sched.times}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-semibold ${
                              sched.adherenceRate >= 80
                                ? 'text-green-600'
                                : sched.adherenceRate >= 60
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {sched.adherenceRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4">{sched.totalDoses}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
