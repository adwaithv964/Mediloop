import { ChatMessage } from '../types';

export class AIService {
  private static apiKey: string = ''; // Set via settings
  private static baseUrl: string = 'https://api.openai.com/v1/chat/completions';

  static setApiKey(key: string) {
    this.apiKey = key;
  }

  static async chat(messages: ChatMessage[]): Promise<string> {
    // If no API key, return helpful responses
    if (!this.apiKey) {
      return this.getFallbackResponse(messages[messages.length - 1].content);
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI Service Error:', error);
      return this.getFallbackResponse(messages[messages.length - 1].content);
    }
  }

  static async getHealthSuggestion(medicineName: string): Promise<string> {
    const suggestions: Record<string, string> = {
      'vitamin d': 'Best taken in the morning with a meal containing healthy fats for better absorption.',
      'calcium': 'Take with vitamin D for better absorption. Avoid taking with iron supplements.',
      'iron': 'Best absorbed on an empty stomach. Take with vitamin C (orange juice) to enhance absorption.',
      'aspirin': 'Take with food or milk to reduce stomach irritation.',
      'antibiotic': 'Complete the full course even if you feel better. Take at evenly spaced intervals.',
      'paracetamol': 'Do not exceed 4g per day. Space doses at least 4-6 hours apart.',
      'ibuprofen': 'Take with food to minimize stomach upset. Avoid alcohol while taking this medication.',
    };

    const lowerName = medicineName.toLowerCase();
    for (const [key, value] of Object.entries(suggestions)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }

    return 'Always take medications as prescribed by your doctor. If you have any concerns, consult your healthcare provider.';
  }

  private static getFallbackResponse(question: string): string {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('how') && lowerQuestion.includes('add')) {
      return 'To add a medicine, click the "Add Medicine" button on your dashboard. You can manually enter details or scan the medicine strip using OCR.';
    }

    if (lowerQuestion.includes('reminder')) {
      return 'You can set reminders for each medicine in the Medicine Schedule section. Enable notifications in your browser for timely alerts.';
    }

    if (lowerQuestion.includes('donate') || lowerQuestion.includes('donation')) {
      return 'To donate medicines, go to the Donations section, select medicines that are not expired, and request a pickup from nearby NGOs or hospitals.';
    }

    if (lowerQuestion.includes('expiry') || lowerQuestion.includes('expire')) {
      return 'Medicines are color-coded: Green (>90 days), Yellow (30-90 days), Red (<30 days). Check your dashboard for expiring medicines.';
    }

    if (lowerQuestion.includes('scan') || lowerQuestion.includes('ocr')) {
      return 'Use the "Scan Medicine" feature to photograph your medicine strip. Our OCR technology will automatically extract the name and expiry date.';
    }

    return 'I can help you with: adding medicines, setting reminders, managing donations, checking expiry dates, and using the scan feature. What would you like to know?';
  }
}
