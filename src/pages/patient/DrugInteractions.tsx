import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, Info, Pill } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';
import { geminiAPI } from '../../services/geminiAPI';
import toast from 'react-hot-toast';

export default function DrugInteractions() {
  const { user } = useAuthStore();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadMedicines();
  }, [user]);

  const loadMedicines = async () => {
    if (!user) return;
    const data = await db.medicines.where('userId').equals(user.id).toArray();
    setMedicines(data);
  };

  const checkInteractions = async () => {
    if (selected.length < 2) {
      toast.error('Select at least 2 medicines to check');
      return;
    }

    setChecking(true);
    setAnalysis(''); // Clear previous analysis

    try {
      // Get selected medicine details
      const selectedMedicines = medicines.filter(m => selected.includes(m.id));
      const medicineDetails = selectedMedicines.map(m => ({
        name: m.name,
        dosage: m.dosage || 'Not specified',
      }));

      // Check interactions using Gemini API
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
        const result = await geminiAPI.checkDrugInteractions(medicineDetails);
        setInteractions(result.interactions);
        setAnalysis(result.analysis);
        setChecking(false);

        if (result.interactions.length > 0) {
          toast('Found potential interactions', {
            icon: '⚠️',
            style: {
              background: '#fff7ed',
              color: '#c2410c',
            },
          });
        } else {
          toast.success('No known interactions detected!');
        }
        return;
      }

      // Fallback if Gemini is not configured
      const fallbackInteractions = [{
        severity: 'moderate',
        medicines: medicineDetails.map(m => m.name),
        description: 'Potential interactions between multiple medicines. Always consult with healthcare professionals before combining medicines.',
        recommendation: 'Consult your doctor or pharmacist to verify these medicines are safe to take together. Consider timing, food interactions, and monitoring for side effects.',
      }];

      const fallbackAnalysis = `Here are common side effects for the medicines you mentioned:\n\n` +
        medicineDetails.map(m => `* **${m.name}:** Common side effects may include nausea, dizziness, or stomach upset. Consult your doctor for a complete list.`).join('\n') +
        `\n\n**Always consult a healthcare professional for medical decisions or if you experience any concerning side effects.**`;

      setInteractions(selected.length > 1 ? fallbackInteractions : []);
      setAnalysis(fallbackAnalysis);
      setChecking(false);
      toast('Using fallback data', {
        icon: 'ℹ️',
      });
    } catch (error) {
      console.error('Interaction check error:', error);
      toast.error('Failed to check interactions. Please try again.');
      setChecking(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: any = {
      severe: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      moderate: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      mild: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return colors[severity] || colors.mild;
  };

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  // Helper to render text with bold markers
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <p key={i} className="mb-2 last:mb-0">
        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </p>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-orange-500 to-yellow-600 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <ShieldCheck className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Drug Interaction Checker</h1>
        </div>
        <p>Check if your medicines interact with each other to ensure safe use</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Select Medicines to Check</h2>
        {medicines.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No medicines found. Add medicines first.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {medicines.map((med) => (
              <button
                key={med.id}
                onClick={() => toggle(med.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${selected.includes(med.id)
                  ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <Pill className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-semibold">{med.name}</p>
                    <p className="text-sm text-gray-500">{med.dosage}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={checkInteractions}
          disabled={selected.length < 2 || checking}
          className="btn btn-primary w-full disabled:opacity-50"
        >
          {checking ? 'Checking...' : `Check Interactions (${selected.length} selected)`}
        </button>
      </div>

      {interactions.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Interaction Results</h2>
          <div className="space-y-4">
            {interactions.map((interaction, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Interaction Detected</h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${getSeverityColor(interaction.severity)}`}>
                        {interaction.severity}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">{interaction.description}</p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Recommendation:</strong> {interaction.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected.length >= 2 && interactions.length === 0 && !checking && (
        <div className="card bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">No Interactions Found</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                The selected medicines appear to be safe to take together
              </p>
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <div className="card bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Side Effect Analysis
          </h2>
          <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300">
            {renderFormattedText(analysis)}
          </div>
        </div>
      )}

      <div className="card bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">Important</p>
            <ul className="list-disc list-inside space-y-1">
              <li>This checker provides general information only</li>
              <li>Always consult your doctor or pharmacist before combining medicines</li>
              <li>Consider food interactions and timing as well</li>
              <li>Report any unusual symptoms to your healthcare provider</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
