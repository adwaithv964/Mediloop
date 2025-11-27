import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

export class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.model = null;
    this.isConfigured = false;
    
    this.initializeGemini();
  }

  initializeGemini() {
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      console.warn('⚠️  Gemini API key not configured. Using fallback mode.');
      this.isConfigured = false;
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      // Use gemini-1.5-flash for better performance
      this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.isConfigured = true;
      console.log('✅ Gemini API initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini:', error);
      this.isConfigured = false;
    }
  }

  isConfigured() {
    return this.isConfigured;
  }

  async generateResponse(prompt, context = null) {
    if (!this.isConfigured) {
      return this.getFallbackResponse(prompt);
    }

    try {
      const fullPrompt = context 
        ? `${context}\n\nUser Question: ${prompt}`
        : prompt;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.getFallbackResponse(prompt);
    }
  }

  async analyzeSymptoms(symptoms) {
    if (!this.isConfigured) {
      return this.getSymptomFallback(symptoms);
    }

    try {
      const symptomDescription = symptoms.map(s =>
        `${s.name} (${s.severity} severity, lasting ${s.duration})`
      ).join(', ');

      const prompt = `You are a medical assistant AI. Provide general health information only. Always recommend consulting a healthcare professional for proper diagnosis and treatment.

Analyze these symptoms: ${symptomDescription}

Please provide your analysis in this exact format:
1) Possible causes (list 3-4 common possibilities)
2) Self-care recommendations (practical steps the person can take)
3) When to see a doctor (clear guidance on when professional medical help is needed)

Keep your response concise but informative. Always end by emphasizing that this is not a diagnosis and they should consult healthcare professionals.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Symptom analysis error:', error);
      return this.getSymptomFallback(symptoms);
    }
  }

  async generateHealthTips(category = null, userMedicines = []) {
    if (!this.isConfigured) {
      return this.getDefaultHealthTips(category, userMedicines);
    }

    try {
      const medicineCount = userMedicines.length || 0;
      const medicineNames = userMedicines.map(m => m.name).join(', ') || 'various medicines';

      const prompt = `Generate 5 helpful, personalized health tips${category ? ` for the ${category} category` : ''}.

User context: This person is managing ${medicineCount} medicines (${medicineNames}).

For each tip, provide:
- Title: Brief and actionable (max 6 words)
- Content: 2-3 sentences with practical, personalized advice
- Category: ${category || 'general'}

Focus on medication management, healthy lifestyle, and general wellness. Make tips specific and actionable. Consider their medicine routine in your recommendations.

Format each tip as:
Title: [title]
Content: [content]
Category: [category]

Separate each tip with ---`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseTips(text, category || 'general');
    } catch (error) {
      console.error('Health tips error:', error);
      return this.getDefaultHealthTips(category, userMedicines);
    }
  }

  async checkDrugInteractions(medicines) {
    if (!this.isConfigured) {
      return this.getFallbackDrugInteractions(medicines);
    }

    try {
      const medicineList = medicines.map(m => `${m.name} (${m.dosage || 'unknown dosage'})`).join(', ');

      const prompt = `You are a pharmaceutical safety expert. Analyze potential drug interactions between these medicines: ${medicineList}

Provide analysis in this exact format:
1) If interactions exist: List each interaction with severity (mild/moderate/severe), affected medicines, description, and recommendation
2) If no interactions: Say "NO_INTERACTION"

IMPORTANT: 
- Be conservative and safety-focused
- Always recommend consulting a healthcare provider
- Consider common interaction categories: pharmacokinetic, pharmacodynamic, physical/chemical

Format example:
INTERACTION
Severity: moderate
Medicines: Medicine A, Medicine B
Description: [brief explanation]
Recommendation: [safe practice advice]

or

NO_INTERACTION
All medicines appear safe to take together (but always consult healthcare provider)`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseInteractions(text, medicines);
    } catch (error) {
      console.error('Drug interaction error:', error);
      return this.getFallbackDrugInteractions(medicines);
    }
  }

  parseTips(response, category) {
    const tips = [];
    const sections = response.split('---').filter(section => section.trim());

    for (const section of sections) {
      const lines = section.split('\n').map(line => line.trim()).filter(line => line);
      let title = '';
      let content = '';

      for (const line of lines) {
        if (line.startsWith('Title:')) {
          title = line.replace('Title:', '').trim();
        } else if (line.startsWith('Content:')) {
          content = line.replace('Content:', '').trim();
        } else if (content && line && !line.startsWith('Category:')) {
          content += ' ' + line;
        }
      }

      if (title && content) {
        tips.push({ title, content, category });
      }

      if (tips.length >= 5) break;
    }

    return tips.length > 0 ? tips : this.getDefaultHealthTips(category, []);
  }

  parseInteractions(response, medicines) {
    const interactions = [];

    if (response.includes('NO_INTERACTION')) {
      return [];
    }

    const sections = response.split(/INTERACTION|Severity:|Medicines:|Description:|Recommendation:/g);
    
    for (let i = 1; i < sections.length; i += 5) {
      if (i + 3 < sections.length) {
        const severity = sections[i]?.trim() || 'moderate';
        const medicinesStr = sections[i + 1]?.trim() || medicines.map(m => m.name).join(', ');
        const description = sections[i + 2]?.trim() || 'Potential interaction detected.';
        const recommendation = sections[i + 3]?.trim() || 'Consult your healthcare provider before combining these medicines.';

        interactions.push({
          severity: severity.toLowerCase(),
          medicines: medicinesStr.split(',').map(m => m.trim()),
          description,
          recommendation,
        });

        if (interactions.length >= 3) break;
      }
    }

    return interactions;
  }

  getFallbackResponse(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('side effect') || lowerPrompt.includes('effect')) {
      return "Common side effects may include nausea, dizziness, or mild headache. However, everyone reacts differently to medications. Always consult your healthcare provider about any side effects you experience.";
    }

    if (lowerPrompt.includes('time') || lowerPrompt.includes('when')) {
      return "Most medicines work best when taken at consistent times. Follow your doctor's instructions carefully. Some medicines need to be taken with food, while others should be taken on an empty stomach.";
    }

    if (lowerPrompt.includes('interaction') || lowerPrompt.includes('together')) {
      return "Drug interactions can be serious. Always consult your doctor or pharmacist before combining medications. Use our Drug Interaction Checker for general information.";
    }

    return "I'm here to provide general health information. For personalized medical advice, please consult with your healthcare provider. I can help with general questions about medicine management and health tips.";
  }

  getSymptomFallback(symptoms) {
    const hasSevere = symptoms.some(s => s.severity === 'severe');
    const symptomList = symptoms.map(s => s.name).join(', ');

    return `Based on your symptoms (${symptomList}), here's general guidance:\n\n` +
      `These symptoms could be related to various conditions. ${hasSevere ? 'Given the severity, ' : ''}` +
      `it's important to monitor your condition closely.\n\n` +
      `General recommendations:\n` +
      `• Rest and stay hydrated\n` +
      `• Monitor your symptoms\n` +
      `• Avoid self-medication\n` +
      `• Keep a symptom diary\n\n` +
      `Please consult a healthcare professional for proper diagnosis and treatment.`;
  }

  getDefaultHealthTips(category = null, userMedicines = []) {
    const medicineCount = userMedicines.length || 0;
    const medicineNames = userMedicines.map(m => m.name).join(', ') || 'various medicines';

    const allTips = [
      {
        title: 'Take Medicines on Time',
        content: `Consistency is key! Taking medicines at the same time daily helps maintain stable levels in your body and improves effectiveness. You currently have ${medicineCount} medicine${medicineCount !== 1 ? 's' : ''} tracked: ${medicineNames}.`,
        category: 'medicine'
      },
      {
        title: 'Stay Hydrated',
        content: 'Drink 8-10 glasses of water daily. Proper hydration helps your body absorb medications better and supports overall health.',
        category: 'nutrition'
      },
      {
        title: 'Move Every Day',
        content: 'Aim for 30 minutes of moderate activity daily. Walking, stretching, or light exercise improves circulation and boosts mood.',
        category: 'exercise'
      },
      {
        title: 'Maintain Sleep Schedule',
        content: 'Go to bed and wake up at the same time daily. Consistent sleep patterns improve medicine metabolism and recovery.',
        category: 'sleep'
      },
      {
        title: 'Practice Mindfulness',
        content: 'Take 5-10 minutes daily for meditation or deep breathing. Managing stress improves treatment outcomes and well-being.',
        category: 'mental'
      }
    ];

    if (category && category !== 'all') {
      return allTips.filter(tip => tip.category === category);
    }

    return allTips;
  }

  getFallbackDrugInteractions(medicines) {
    if (medicines.length < 2) {
      return [];
    }

    return [{
      severity: 'moderate',
      medicines: medicines.map(m => m.name),
      description: 'Potential interactions between multiple medicines. Always consult with healthcare professionals before combining medicines.',
      recommendation: 'Consult your doctor or pharmacist to verify these medicines are safe to take together. Consider timing, food interactions, and monitoring for side effects.',
    }];
  }
}

