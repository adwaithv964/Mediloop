import { useState, useEffect } from 'react';
import { Sparkles, Heart, Pill, Apple, Activity, Brain, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../db';

interface Tip {
  id: string;
  category: 'medicine' | 'nutrition' | 'exercise' | 'sleep' | 'mental' | 'general';
  title: string;
  content: string;
  icon: any;
  color: string;
}

export default function HealthTips() {
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tips, setTips] = useState<Tip[]>([]);
  const [userMedicines, setUserMedicines] = useState<any[]>([]);

  useEffect(() => {
    loadUserMedicines();
    generateTips();
  }, [user]);

  const loadUserMedicines = async () => {
    if (!user) return;
    const meds = await db.medicines.where('userId').equals(user.id).toArray();
    setUserMedicines(meds);
  };

  const generateTips = () => {
    const allTips: Tip[] = [
      // Medicine Tips
      {
        id: '1',
        category: 'medicine',
        title: 'Take Medicines on Time',
        content: 'Consistency is key! Taking medicines at the same time daily helps maintain stable levels in your body and improves effectiveness.',
        icon: Pill,
        color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600',
      },
      {
        id: '2',
        category: 'medicine',
        title: 'Never Skip Doses',
        content: 'Skipping doses can reduce treatment effectiveness and may lead to drug resistance. Set alarms and reminders to stay on track.',
        icon: Pill,
        color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600',
      },
      {
        id: '3',
        category: 'medicine',
        title: 'Store Medicines Properly',
        content: 'Keep medicines in a cool, dry place away from direct sunlight. Check expiry dates regularly and dispose of expired medications safely.',
        icon: Pill,
        color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600',
      },
      {
        id: '4',
        category: 'medicine',
        title: 'Check Drug Interactions',
        content: 'Before combining medicines, check for potential interactions. Use our Drug Safety checker to ensure your medicines are safe together.',
        icon: Pill,
        color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600',
      },

      // Nutrition Tips
      {
        id: '5',
        category: 'nutrition',
        title: 'Stay Hydrated',
        content: 'Drink 8-10 glasses of water daily. Proper hydration helps your body absorb medications better and supports overall health.',
        icon: Apple,
        color: 'bg-green-100 dark:bg-green-900/20 text-green-600',
      },
      {
        id: '6',
        category: 'nutrition',
        title: 'Eat Balanced Meals',
        content: 'Include fruits, vegetables, whole grains, and lean proteins. A balanced diet enhances medicine effectiveness and supports recovery.',
        icon: Apple,
        color: 'bg-green-100 dark:bg-green-900/20 text-green-600',
      },
      {
        id: '7',
        category: 'nutrition',
        title: 'Avoid Empty Calories',
        content: 'Limit processed foods, sugary drinks, and excessive salt. Choose nutritious whole foods to support your treatment.',
        icon: Apple,
        color: 'bg-green-100 dark:bg-green-900/20 text-green-600',
      },
      {
        id: '8',
        category: 'nutrition',
        title: 'Check Food-Drug Interactions',
        content: 'Some medicines interact with certain foods. Grapefruit, dairy, and alcohol can affect many medications. Ask your doctor!',
        icon: Apple,
        color: 'bg-green-100 dark:bg-green-900/20 text-green-600',
      },

      // Exercise Tips
      {
        id: '9',
        category: 'exercise',
        title: 'Move Every Day',
        content: 'Aim for 30 minutes of moderate activity daily. Walking, stretching, or light exercise improves circulation and boosts mood.',
        icon: Activity,
        color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600',
      },
      {
        id: '10',
        category: 'exercise',
        title: 'Start Slow',
        content: 'If you\'re new to exercise, begin with gentle activities. Gradually increase intensity as your fitness improves.',
        icon: Activity,
        color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600',
      },
      {
        id: '11',
        category: 'exercise',
        title: 'Listen to Your Body',
        content: 'Stop if you feel dizzy, chest pain, or extreme fatigue. Consult your doctor before starting any new exercise program.',
        icon: Activity,
        color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600',
      },

      // Sleep Tips
      {
        id: '12',
        category: 'sleep',
        title: 'Maintain Sleep Schedule',
        content: 'Go to bed and wake up at the same time daily. Consistent sleep patterns improve medicine metabolism and recovery.',
        icon: Moon,
        color: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600',
      },
      {
        id: '13',
        category: 'sleep',
        title: 'Create Bedtime Routine',
        content: 'Wind down with relaxing activities like reading or meditation. Avoid screens 1 hour before bed for better sleep quality.',
        icon: Moon,
        color: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600',
      },
      {
        id: '14',
        category: 'sleep',
        title: 'Optimize Sleep Environment',
        content: 'Keep your bedroom cool, dark, and quiet. A comfortable sleep environment enhances rest and supports healing.',
        icon: Moon,
        color: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600',
      },

      // Mental Health Tips
      {
        id: '15',
        category: 'mental',
        title: 'Practice Mindfulness',
        content: 'Take 5-10 minutes daily for meditation or deep breathing. Managing stress improves treatment outcomes and well-being.',
        icon: Brain,
        color: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600',
      },
      {
        id: '16',
        category: 'mental',
        title: 'Stay Connected',
        content: 'Maintain social connections with family and friends. Emotional support is crucial for mental health and recovery.',
        icon: Brain,
        color: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600',
      },
      {
        id: '17',
        category: 'mental',
        title: 'Set Realistic Goals',
        content: 'Break large goals into small, achievable steps. Celebrate small wins to maintain motivation and positive mindset.',
        icon: Brain,
        color: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600',
      },

      // General Tips
      {
        id: '18',
        category: 'general',
        title: 'Regular Check-ups',
        content: 'Schedule routine appointments with your healthcare provider. Regular monitoring ensures treatment is working effectively.',
        icon: Heart,
        color: 'bg-red-100 dark:bg-red-900/20 text-red-600',
      },
      {
        id: '19',
        category: 'general',
        title: 'Keep Health Records',
        content: 'Maintain organized records of medications, lab results, and medical history. Use our Health Records feature!',
        icon: Heart,
        color: 'bg-red-100 dark:bg-red-900/20 text-red-600',
      },
      {
        id: '20',
        category: 'general',
        title: 'Report Side Effects',
        content: 'Tell your doctor about any unusual symptoms or side effects. Early reporting prevents complications and allows adjustments.',
        icon: Heart,
        color: 'bg-red-100 dark:bg-red-900/20 text-red-600',
      },
    ];

    setTips(allTips);
  };

  const categories = [
    { id: 'all', name: 'All Tips', icon: Sparkles, color: 'text-purple-600' },
    { id: 'medicine', name: 'Medicine', icon: Pill, color: 'text-purple-600' },
    { id: 'nutrition', name: 'Nutrition', icon: Apple, color: 'text-green-600' },
    { id: 'exercise', name: 'Exercise', icon: Activity, color: 'text-blue-600' },
    { id: 'sleep', name: 'Sleep', icon: Moon, color: 'text-indigo-600' },
    { id: 'mental', name: 'Mental Health', icon: Brain, color: 'text-pink-600' },
    { id: 'general', name: 'General', icon: Heart, color: 'text-red-600' },
  ];

  const filteredTips = selectedCategory === 'all'
    ? tips
    : tips.filter(tip => tip.category === selectedCategory);

  const getTipOfTheDay = () => {
    const today = new Date().getDate();
    return tips[today % tips.length];
  };

  const tipOfDay = getTipOfTheDay();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-green-500 to-teal-600 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <Sparkles className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Daily Health Tips</h1>
        </div>
        <p>Personalized wellness tips based on your health journey</p>
      </div>

      {/* Tip of the Day */}
      {tipOfDay && (
        <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-yellow-400 dark:bg-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Sun className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                💡 Tip of the Day
              </h2>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {tipOfDay.title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {tipOfDay.content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Personalized Insight */}
      {userMedicines.length > 0 && (
        <div className="card bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-start space-x-3">
            <Pill className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Your Medicine Profile
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You're managing {userMedicines.length} medicine{userMedicines.length !== 1 ? 's' : ''}. 
                Keep up the great work with your treatment adherence! Check the Medicine tips below for best practices.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedCategory === cat.id
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
              }`}
            >
              <cat.icon className={`w-6 h-6 mx-auto mb-1 ${cat.color}`} />
              <p className="text-xs font-medium text-center">{cat.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Tips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTips.map((tip) => (
          <div key={tip.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tip.color}`}>
                <tip.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {tip.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {tip.content}
                </p>
                <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 capitalize">
                  {tip.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Resources */}
      <div className="card bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <h2 className="text-lg font-semibold mb-3">📚 Additional Resources</h2>
        <div className="space-y-2 text-sm">
          <p>• Use our <strong>AI Assistant</strong> for personalized health guidance</p>
          <p>• Check <strong>Drug Safety</strong> before combining medicines</p>
          <p>• Track your progress with <strong>Analytics</strong></p>
          <p>• Store important documents in <strong>Health Records</strong></p>
        </div>
      </div>
    </div>
  );
}
