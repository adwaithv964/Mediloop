// Pure Gemini API implementation using direct HTTP calls (no npm package needed)

class GeminiAPIService {
  private apiKey: string = '';
  // Updated to use Gemini 1.5 Flash (faster and more reliable)


  constructor() {
    this.initializeGemini();
  }

  private initializeGemini() {
    // Load API key from environment variable
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      console.warn('Gemini API key not configured. AI features will use fallback responses.');
      console.info('To enable AI features, add VITE_GEMINI_API_KEY to your .env file');
    } else {
      console.log('Gemini API initialized successfully');
    }
  }

  public isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== 'your_gemini_api_key_here';
  }

  private models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-flash-latest',
    'gemini-1.5-flash',
    'gemini-1.5-flash-001',
    'gemini-1.5-pro',
    'gemini-1.0-pro',
    'gemini-pro'
  ];

  async generateResponse(prompt: string, context?: string): Promise<string> {
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      return this.getFallbackResponse(prompt);
    }

    const fullPrompt = context
      ? `${context}\n\nUser Question: ${prompt}`
      : prompt;

    // Try models in sequence
    for (const model of this.models) {
      try {
        const result = await this.callModel(model, fullPrompt);
        return result;
      } catch (error: any) {
        // If it's not a 404, throw it immediately (e.g. auth error)
        if (!error.message?.includes('404') && !error.message?.includes('not found')) {
          // Handle specific error codes for the user
          if (error.message.includes('400')) return "Configuration Error: Invalid request.";
          if (error.message.includes('401')) return "Authentication Error: Invalid API key.";
          if (error.message.includes('403')) return "Permission Error: API key missing permissions.";
          if (error.message.includes('429')) return "Rate Limit Error: Too many requests.";
          throw error;
        }
        console.warn(`Model ${model} failed, trying next...`);
      }
    }

    // If all models failed, diagnose the connection
    return this.diagnoseConnection();
  }

  private async diagnoseConnection(): Promise<string> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);

      if (!response.ok) {
        return "API Access Error: Please ensure your API Key is valid and the 'Google Generative Language API' is enabled in your Google Cloud Console.";
      }

      const data = await response.json();
      const availableModels = data.models?.map((m: any) => m.name.replace('models/', '')) || [];
      console.log('Available models:', availableModels);

      return `Model Error: Your API key is valid, but no compatible models were found. Available models: ${availableModels.join(', ')}`;
    } catch (error) {
      return "Connection Error: Unable to reach Google API. Please check your internet connection.";
    }
  }

  private async callModel(model: string, prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text;
      }

      if (candidate.finishReason === 'SAFETY') {
        throw new Error('Response blocked by safety filters. Please try rephrasing your request.');
      }
    }

    if (data.promptFeedback && data.promptFeedback.blockReason) {
      throw new Error(`Request blocked: ${data.promptFeedback.blockReason}`);
    }

    console.error('Unexpected API response:', JSON.stringify(data));
    throw new Error('No valid content in response');
  }

  // Removed tryFallbackModel as it is now integrated into generateResponse

  async analyzeSymptoms(symptoms: Array<{ name: string, severity: string, duration: string }>): Promise<string> {
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      return this.getSymptomFallbackAnalysis(symptoms);
    }

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

    // Try models in sequence
    for (const model of this.models) {
      try {
        const result = await this.callModel(model, prompt);
        return result;
      } catch (error: any) {
        if (!error.message?.includes('404') && !error.message?.includes('not found')) {
          console.error('Gemini API Error (Symptoms):', error);
          break;
        }
        console.warn(`Model ${model} failed for symptoms, trying next...`);
      }
    }

    return this.getSymptomFallbackAnalysis(symptoms);
  }

  async generateHealthTips(category?: string, userMedicines?: any[]): Promise<Array<{ title: string, content: string, category: string }>> {
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      return this.getDefaultHealthTips(category, userMedicines);
    }

    const medicineCount = userMedicines?.length || 0;
    const medicineNames = userMedicines?.map(m => m.name).join(', ') || 'various medicines';

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

    // Try models in sequence
    for (const model of this.models) {
      try {
        const text = await this.callModel(model, prompt);
        const tips = this.parseTipsFromResponse(text, category || 'general');
        return tips.length > 0 ? tips : this.getDefaultHealthTips(category, userMedicines);
      } catch (error: any) {
        if (!error.message?.includes('404') && !error.message?.includes('not found')) {
          console.error('Gemini API Error (Health Tips):', error);
          break;
        }
        console.warn(`Model ${model} failed for health tips, trying next...`);
      }
    }

    return this.getDefaultHealthTips(category, userMedicines);
  }

  private parseTipsFromResponse(response: string, category: string): Array<{ title: string, content: string, category: string }> {
    const tips: Array<{ title: string, content: string, category: string }> = [];
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
          // Continue content if it's multi-line
          content += ' ' + line;
        }
      }

      if (title && content) {
        tips.push({ title, content, category });
      }

      // Limit to 5 tips
      if (tips.length >= 5) break;
    }

    return tips;
  }

  private getDefaultHealthTips(category?: string, userMedicines?: any[]): Array<{ title: string, content: string, category: string }> {
    const medicineCount = userMedicines?.length || 0;
    const medicineNames = userMedicines?.map(m => m.name).join(', ') || 'various medicines';

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

  private getFallbackResponse(prompt: string): string {
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

  private getSymptomFallbackAnalysis(symptoms: Array<{ name: string, severity: string, duration: string }>): string {
    const hasSevere = symptoms.some(s => s.severity === 'severe');

    return `Based on your symptoms (${symptoms.map(s => s.name).join(', ')}), here's general guidance:\n\n` +
      `These symptoms could be related to various conditions. ${hasSevere ? 'Given the severity, ' : ''}` +
      `it's important to monitor your condition closely.\n\n` +
      `General recommendations:\n` +
      `• Rest and stay hydrated\n` +
      `• Monitor your symptoms\n` +
      `• Avoid self-medication\n` +
      `• Keep a symptom diary\n\n` +
      `Please consult a healthcare professional for proper diagnosis and treatment.`;
  }

  async checkDrugInteractions(medicines: Array<{ name: string, dosage: string }>): Promise<{ interactions: Array<{ severity: string, medicines: string[], description: string, recommendation: string }>, analysis: string }> {
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      return this.getFallbackDrugInteractions(medicines);
    }

    const medicineList = medicines.map(m => `${m.name} (${m.dosage})`).join(', ');
    const prompt = `You are a pharmaceutical safety expert. Analyze potential drug interactions and side effects for these medicines: ${medicineList}

Provide analysis in this exact format:

SECTION 1: INTERACTIONS
1) If interactions exist: List each interaction with severity (mild/moderate/severe), affected medicines, description, and recommendation
2) If no interactions: Say "NO_INTERACTION"

SECTION 2: SIDE_EFFECT_ANALYSIS
Provide a small analysis report like "Here are common side effects for the medicines you mentioned:
* **Medicine Name:** [Common side effects]. [Serious side effects to watch for].
* **Medicine Name:** [Common side effects]. [Serious side effects to watch for].

**Always consult a healthcare professional for medical decisions or if you experience any concerning side effects.**"

IMPORTANT: 
- Be conservative and safety-focused
- Always recommend consulting a healthcare provider
- Consider common interaction categories: pharmacokinetic, pharmacodynamic, physical/chemical

Format example for interactions:
INTERACTION
Severity: moderate
Medicines: Medicine A, Medicine B
Description: [brief explanation]
Recommendation: [safe practice advice]`;

    // Try models in sequence
    for (const model of this.models) {
      try {
        const text = await this.callModel(model, prompt);
        return this.parseInteractionsAndAnalysis(text, medicines);
      } catch (error: any) {
        if (!error.message?.includes('404') && !error.message?.includes('not found')) {
          console.error('Gemini API Error (Drug Interactions):', error);
          break; // Stop on non-404 errors
        }
        console.warn(`Model ${model} failed for interactions, trying next...`);
      }
    }

    return this.getFallbackDrugInteractions(medicines);
  }

  private parseInteractionsAndAnalysis(response: string, medicines: Array<{ name: string, dosage: string }>): { interactions: Array<{ severity: string, medicines: string[], description: string, recommendation: string }>, analysis: string } {
    const result = {
      interactions: [] as Array<{ severity: string, medicines: string[], description: string, recommendation: string }>,
      analysis: ''
    };

    // Split into sections
    const parts = response.split('SECTION 2: SIDE_EFFECT_ANALYSIS');
    const interactionPart = parts[0] || '';
    const analysisPart = parts[1] || '';

    // Parse Analysis
    result.analysis = analysisPart.trim();

    // Parse Interactions
    if (!interactionPart.includes('NO_INTERACTION')) {
      const sections = interactionPart.split(/INTERACTION|Severity:|Medicines:|Description:|Recommendation:/g);

      for (let i = 1; i < sections.length; i += 5) {
        if (i + 3 < sections.length) {
          const severity = sections[i]?.trim() || 'moderate';
          const medicinesStr = sections[i + 1]?.trim() || medicines.map(m => m.name).join(', ');
          const description = sections[i + 2]?.trim() || 'Potential interaction detected.';
          const recommendation = sections[i + 3]?.trim() || 'Consult your healthcare provider before combining these medicines.';

          // Filter out empty or malformed entries
          if (description && recommendation) {
            result.interactions.push({
              severity: severity.toLowerCase(),
              medicines: medicinesStr.split(',').map(m => m.trim()),
              description,
              recommendation,
            });
          }

          if (result.interactions.length >= 3) break; // Limit to 3 interactions
        }
      }
    }

    return result;
  }

  private getFallbackDrugInteractions(medicines: Array<{ name: string, dosage: string }>): { interactions: Array<{ severity: string, medicines: string[], description: string, recommendation: string }>, analysis: string } {
    // Conservative fallback - suggest consulting healthcare provider
    const analysis = `Here are common side effects for the medicines you mentioned:\n\n` +
      medicines.map(m => `* **${m.name}:** Common side effects may include nausea, dizziness, or stomach upset. Consult your doctor for a complete list.`).join('\n') +
      `\n\n**Always consult a healthcare professional for medical decisions or if you experience any concerning side effects.**`;

    if (medicines.length < 2) {
      return { interactions: [], analysis };
    }

    return {
      interactions: [{
        severity: 'moderate',
        medicines: medicines.map(m => m.name),
        description: 'Potential interactions between multiple medicines. Always consult with healthcare professionals before combining medicines.',
        recommendation: 'Consult your doctor or pharmacist to verify these medicines are safe to take together. Consider timing, food interactions, and monitoring for side effects.',
      }],
      analysis
    };
  }
}

export const geminiAPI = new GeminiAPIService();
