import { useState } from 'react';
import { Activity, AlertCircle, CheckCircle, Loader2, Plus, X } from 'lucide-react';
import { geminiAPI } from '../../services/geminiAPI';
import toast from 'react-hot-toast';

interface Symptom {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
}

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [newSymptom, setNewSymptom] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [duration, setDuration] = useState('1-2 days');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const addSymptom = () => {
    if (!newSymptom.trim()) {
      toast.error('Please enter a symptom');
      return;
    }

    const symptom: Symptom = {
      id: Date.now().toString(),
      name: newSymptom.trim(),
      severity,
      duration,
    };

    setSymptoms([...symptoms, symptom]);
    setNewSymptom('');
    setSeverity('mild');
    setDuration('1-2 days');
    toast.success('Symptom added');
  };

  const removeSymptom = (id: string) => {
    setSymptoms(symptoms.filter(s => s.id !== id));
  };

  const analyzeSymptoms = async () => {
    if (symptoms.length === 0) {
      toast.error('Please add at least one symptom');
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      // Try Gemini API first
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
        const analysis = await geminiAPI.analyzeSymptoms(symptoms);

        setResult({
          analysis,
          urgency: getUrgencyLevel(),
          recommendations: extractRecommendations(analysis),
        });
        setAnalyzing(false);
        return;
      }

      // Fallback to OpenAI if Gemini is not configured
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!openaiKey || openaiKey === 'your_openai_key_here') {
        setResult(getFallbackAnalysis());
        setAnalyzing(false);
        return;
      }

      const symptomDescription = symptoms.map(s =>
        `${s.name} (${s.severity} severity, lasting ${s.duration})`
      ).join(', ');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a medical assistant. Provide general health information only. Always recommend consulting a healthcare professional for proper diagnosis.'
            },
            {
              role: 'user',
              content: `Analyze these symptoms: ${symptomDescription}. Provide: 1) Possible causes (3-4), 2) Self-care recommendations, 3) When to see a doctor. Keep it concise and clear.`
            }
          ],
          temperature: 0.7,
          max_tokens: 600,
        }),
      });

      if (!response.ok) throw new Error('OpenAI API request failed');

      const data = await response.json();
      const analysis = data.choices[0]?.message?.content || '';

      setResult({
        analysis,
        urgency: getUrgencyLevel(),
        recommendations: extractRecommendations(analysis),
      });
    } catch (error) {
      console.error('Analysis error:', error);
      setResult(getFallbackAnalysis());
    } finally {
      setAnalyzing(false);
    }
  };

  const getFallbackAnalysis = () => {
    const hasSevere = symptoms.some(s => s.severity === 'severe');
    
    return {
      analysis: `Based on your symptoms (${symptoms.map(s => s.name).join(', ')}), here's general guidance:\n\n` +
        `These symptoms could be related to various conditions. ${hasSevere ? 'Given the severity, ' : ''}` +
        `it's important to monitor your condition closely.\n\n` +
        `General recommendations:\n` +
        `• Rest and stay hydrated\n` +
        `• Monitor your symptoms\n` +
        `• Avoid self-medication\n` +
        `• Keep a symptom diary\n\n` +
        `Please consult a healthcare professional for proper diagnosis and treatment.`,
      urgency: hasSevere ? 'high' : symptoms.length > 3 ? 'moderate' : 'low',
      recommendations: [
        'Consult a healthcare professional',
        'Monitor your symptoms',
        'Stay hydrated',
        'Get adequate rest',
      ],
    };
  };

  const getUrgencyLevel = () => {
    const hasSevere = symptoms.some(s => s.severity === 'severe');
    if (hasSevere || symptoms.length > 5) return 'high';
    if (symptoms.length > 3) return 'moderate';
    return 'low';
  };

  const extractRecommendations = (text: string): string[] => {
    const lines = text.split('\n').filter(l => l.trim());
    return lines.slice(0, 4);
  };

  const getSeverityColor = (sev: string) => {
    if (sev === 'severe') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (sev === 'moderate') return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  };

  const getUrgencyDisplay = () => {
    if (!result) return null;
    
    if (result.urgency === 'high') {
      return (
        <div className="card bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">High Priority</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Please seek medical attention soon. Your symptoms warrant professional evaluation.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    if (result.urgency === 'moderate') {
      return (
        <div className="card bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-orange-800 dark:text-orange-200">Moderate Priority</h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                Monitor your symptoms. If they worsen or persist, consult a healthcare provider.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="card bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-200">Low Priority</h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your symptoms appear manageable. Self-care may help, but consult a doctor if concerned.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-red-500 to-pink-600 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <Activity className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Symptom Checker</h1>
        </div>
        <p>AI-powered symptom analysis and health insights</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Add Your Symptoms</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Symptom</label>
            <input
              type="text"
              value={newSymptom}
              onChange={(e) => setNewSymptom(e.target.value)}
              placeholder="e.g., Headache, Fever, Cough..."
              className="input w-full"
              onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="input w-full"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="input w-full"
              >
                <option value="< 1 day">Less than 1 day</option>
                <option value="1-2 days">1-2 days</option>
                <option value="3-5 days">3-5 days</option>
                <option value="1 week">1 week</option>
                <option value="> 1 week">More than 1 week</option>
              </select>
            </div>
          </div>
          
          <button onClick={addSymptom} className="btn btn-primary w-full">
            <Plus className="w-5 h-5 mr-2" />
            Add Symptom
          </button>
        </div>
      </div>

      {symptoms.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Your Symptoms ({symptoms.length})</h2>
          <div className="space-y-2 mb-4">
            {symptoms.map((symptom) => (
              <div
                key={symptom.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{symptom.name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(symptom.severity)}`}>
                      {symptom.severity}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {symptom.duration}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeSymptom(symptom.id)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={analyzeSymptoms}
            disabled={analyzing}
            className="btn btn-primary w-full"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Symptoms'
            )}
          </button>
        </div>
      )}

      {result && (
        <>
          {getUrgencyDisplay()}
          
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Analysis</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {result.analysis}
              </p>
            </div>
          </div>
        </>
      )}

      <div className="card bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">Disclaimer</p>
            <p>
              This tool provides general health information only and is not a substitute for professional 
              medical advice, diagnosis, or treatment. Always consult your healthcare provider for medical concerns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
