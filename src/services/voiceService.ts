interface VoiceCallback {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  onWakeWord?: () => void;
}

export class VoiceService {
  private recognition: any = null;
  private isListening = false;
  private isWaitingForWakeWord = false;
  private callbacks: VoiceCallback = {};
  private conversationMode = false;
  private conversationContext: any = {};
  private restartTimeout: any = null;
  private isRestarting = false;
  private abortCount = 0;
  private lastRestartTime = 0;

  constructor() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true; // Continuous listening for wake word
      this.recognition.interimResults = true; // Use interim results for faster detection
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 3; // Get multiple alternatives
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  // Start wake word detection
  startWakeWordDetection(callbacks: VoiceCallback): void {
    if (!this.recognition) {
      callbacks.onError?.('Speech recognition is not supported in your browser');
      return;
    }

    this.callbacks = callbacks;
    this.isWaitingForWakeWord = true;

    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const result = event.results[last];
      const isFinal = result.isFinal;
      
      // Reset abort count on successful speech recognition
      this.abortCount = 0;
      
      // Get all alternatives
      let transcripts = [];
      for (let i = 0; i < Math.min(result.length, 3); i++) {
        transcripts.push(result[i].transcript.toLowerCase().trim());
      }
      
      const mainTranscript = transcripts[0];

      if (this.isWaitingForWakeWord) {
        // Only process final results for wake word detection
        // Check for wake word with more precise matching to avoid false positives
        const hasWakeWord = transcripts.some(transcript => {
          // Direct exact matches (most reliable)
          if (transcript.includes('hey pulse') || 
              transcript.includes('hi pulse') || 
              transcript.includes('hello pulse') ||
              transcript.includes('ok pulse') ||
              transcript.includes('okay pulse')) {
            return true;
          }
          
          // Common misrecognitions (but more strict - must be at start or have "hey")
          if ((transcript.startsWith('hey polls') || transcript.includes('hey polls')) ||
              (transcript.startsWith('hey pals') || transcript.includes('hey pals')) ||
              (transcript.startsWith('hey post') || transcript.includes('hey post')) ||
              (transcript.startsWith('hey plus') || transcript.includes('hey plus'))) {
            return true;
          }
          
          // Split detection - but must have "hey" or "hi" or "hello" first
          const words = transcript.split(' ');
          const firstWord = words[0];
          if ((firstWord === 'hey' || firstWord === 'hi' || firstWord === 'hello') && 
              transcript.includes('pulse')) {
            return true;
          }
          
          return false;
        });
        
        if (hasWakeWord && isFinal) {
          this.isWaitingForWakeWord = false;
          this.callbacks.onWakeWord?.();
          this.speak('Yes, I am Pulse. How can I help you?');
          console.log('✅ Wake word detected:', mainTranscript, '(alternatives:', transcripts.join(', '), ')');
          // Continue listening for command
        } else if (isFinal) {
          console.log('🔍 Listening for wake word... heard:', mainTranscript, transcripts.length > 1 ? `(alt: ${transcripts.slice(1).join(', ')})` : '');
        }
      } else if (isFinal) {
        // Process command
        this.callbacks.onResult?.(mainTranscript);
        
        // If in conversation mode, keep listening
        if (!this.conversationMode) {
          this.isWaitingForWakeWord = true;
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      // Handle aborted error specially - stop the loop
      if (event.error === 'aborted') {
        this.abortCount++;
        console.log('⚠️ Voice recognition aborted (count:', this.abortCount, 'of 10)');
        
        // If too many aborts in short time, stop trying
        if (this.abortCount >= 10) {
          console.error('❌ Too many aborts (' + this.abortCount + '), stopping voice recognition');
          console.error('💡 Try clicking the microphone button to restart manually');
          this.stopListening();
          this.callbacks.onError?.('Too many recognition errors. Please restart manually.');
          return;
        }
        return; // Don't process abort further
      }
      
      if (event.error !== 'no-speech') {
        console.log('Voice recognition error:', event.error);
        this.callbacks.onError?.(event.error);
      }
      
      // Don't restart on critical errors
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        console.error('❌ Microphone permission denied');
        this.stopListening();
      }
    };

    this.recognition.onend = () => {
      console.log('Recognition ended. isListening:', this.isListening, 'isRestarting:', this.isRestarting);
      
      // Clear any existing restart timeout
      if (this.restartTimeout) {
        clearTimeout(this.restartTimeout);
        this.restartTimeout = null;
      }
      
      // Auto-restart for continuous wake word detection
      if (this.isListening && !this.isRestarting) {
        // Debounce restarts (minimum 300ms between attempts)
        const now = Date.now();
        const timeSinceLastRestart = now - this.lastRestartTime;
        const delay = Math.max(300, 300 - timeSinceLastRestart);
        
        this.isRestarting = true;
        this.restartTimeout = setTimeout(() => {
          try {
            console.log('🔄 Restarting recognition... (abort count:', this.abortCount, ')');
            this.lastRestartTime = Date.now();
            this.recognition?.start();
            this.isRestarting = false;
            // Don't reset abort count here - only reset on successful speech recognition
          } catch (e: any) {
            console.log('⚠️ Could not restart:', e.message);
            this.isRestarting = false;
            // If can't restart, try again after longer delay
            if (this.isListening) {
              this.restartTimeout = setTimeout(() => {
                this.isRestarting = false;
              }, 1000);
            }
          }
        }, delay);
      }
    };

    // Prevent multiple starts
    if (this.isListening) {
      console.log('⚠️ Recognition already running, stopping first...');
      this.stopListening();
      // Wait a bit before restarting
      setTimeout(() => this.startWakeWordDetection(callbacks), 500);
      return;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      console.log('✅ Wake word detection started. Listening for "hey pulse"...');
      console.log('💡 TIP: Say "Hey Pulse" clearly, or try "Hi Pulse" or "Hello Pulse"');
    } catch (error: any) {
      console.error('Failed to start recognition:', error);
      if (error.message?.includes('already started')) {
        console.log('⚠️ Recognition already running, will restart...');
        this.isListening = false;
        setTimeout(() => this.startWakeWordDetection(callbacks), 500);
      } else {
        this.callbacks.onError?.('Failed to start voice recognition');
      }
    }
  }

  // Original method for manual activation
  async startListening(onResult: (transcript: string) => void, onError?: (error: string) => void): Promise<void> {
    if (!this.recognition) {
      onError?.('Speech recognition is not supported in your browser');
      return;
    }

    if (this.isListening) {
      this.stopListening();
      return;
    }

    this.isWaitingForWakeWord = false;

    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      onResult(transcript);
    };

    this.recognition.onerror = (event: any) => {
      onError?.(event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      onError?.('Failed to start voice recognition');
      this.isListening = false;
    }
  }

  stopListening(): void {
    if (this.recognition) {
      // Clear any pending restart
      if (this.restartTimeout) {
        clearTimeout(this.restartTimeout);
        this.restartTimeout = null;
      }
      
      this.isListening = false;
      this.isWaitingForWakeWord = false;
      this.conversationMode = false;
      this.isRestarting = false;
      this.abortCount = 0;
      
      try {
        this.recognition.stop();
      } catch (e) {
        console.log('Error stopping recognition:', e);
      }
      
      console.log('🛑 Voice recognition stopped');
    }
  }

  setConversationMode(enabled: boolean): void {
    this.conversationMode = enabled;
  }

  setConversationContext(context: any): void {
    this.conversationContext = context;
  }

  getConversationContext(): any {
    return this.conversationContext;
  }

  clearConversationContext(): void {
    this.conversationContext = {};
  }

  getListeningState(): boolean {
    return this.isListening;
  }

  // Text to Speech
  speak(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }

  stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Parse voice commands - Enhanced version
  parseCommand(transcript: string): { action: string; data: any; requiresFollowUp?: boolean; question?: string } {
    const lowerTranscript = transcript.toLowerCase();

    // Add medicine with details
    if (lowerTranscript.includes('add medicine') || lowerTranscript.includes('add medication') || lowerTranscript.includes('new medicine')) {
      // Check if details are provided
      const hasName = lowerTranscript.includes('called') || lowerTranscript.includes('named');
      if (hasName) {
        return { action: 'add_medicine_interactive', data: transcript, requiresFollowUp: true };
      }
      return { action: 'add_medicine_start', data: null, requiresFollowUp: true, question: 'What is the medicine name?' };
    }

    // Analyze medicine from image/description
    if (lowerTranscript.includes('analyze') || lowerTranscript.includes('scan') || lowerTranscript.includes('identify')) {
      return { action: 'analyze_medicine', data: transcript };
    }

    // Check medicine stock/expiry
    if (lowerTranscript.includes('check') || lowerTranscript.includes('find') || lowerTranscript.includes('search')) {
      const medicine = transcript.split(/check|find|search/i)[1]?.trim();
      return { action: 'search_medicine', data: medicine };
    }

    // List all medicines
    if (lowerTranscript.includes('list all') || lowerTranscript.includes('show all') || lowerTranscript.includes('my medicines')) {
      return { action: 'list_medicines', data: null };
    }

    // Take medicine
    if (lowerTranscript.includes('take') || lowerTranscript.includes('took') || lowerTranscript.includes('mark as taken')) {
      const medicine = transcript.split(/take|took/i)[1]?.trim();
      return { action: 'mark_taken', data: medicine };
    }

    // Create schedule
    if (lowerTranscript.includes('create schedule') || lowerTranscript.includes('set reminder') || lowerTranscript.includes('schedule medicine')) {
      return { action: 'create_schedule_start', data: transcript, requiresFollowUp: true };
    }

    // Delete medicine
    if (lowerTranscript.includes('delete') || lowerTranscript.includes('remove')) {
      const medicine = transcript.split(/delete|remove/i)[1]?.trim();
      return { action: 'delete_medicine', data: medicine, requiresFollowUp: true };
    }

    // Update medicine
    if (lowerTranscript.includes('update') || lowerTranscript.includes('edit') || lowerTranscript.includes('change')) {
      const medicine = transcript.split(/update|edit|change/i)[1]?.trim();
      return { action: 'update_medicine', data: medicine, requiresFollowUp: true };
    }

    // Donate medicine
    if (lowerTranscript.includes('donate')) {
      return { action: 'donate_start', data: transcript, requiresFollowUp: true };
    }

    // Show reports
    if (lowerTranscript.includes('report') || lowerTranscript.includes('export') || lowerTranscript.includes('generate report')) {
      return { action: 'show_reports', data: null };
    }

    // Show statistics/dashboard
    if (lowerTranscript.includes('statistics') || lowerTranscript.includes('stats') || lowerTranscript.includes('summary')) {
      return { action: 'show_dashboard', data: null };
    }

    // Expiring medicines
    if (lowerTranscript.includes('expiring') || lowerTranscript.includes('expire soon')) {
      return { action: 'show_expiring', data: null };
    }

    // Low stock
    if (lowerTranscript.includes('low stock') || lowerTranscript.includes('running out')) {
      return { action: 'show_low_stock', data: null };
    }

    // Change settings
    if (lowerTranscript.includes('enable dark mode') || lowerTranscript.includes('dark mode on')) {
      return { action: 'toggle_dark_mode', data: true };
    }
    if (lowerTranscript.includes('disable dark mode') || lowerTranscript.includes('light mode on')) {
      return { action: 'toggle_dark_mode', data: false };
    }

    // Navigate to page
    if (lowerTranscript.includes('go to') || lowerTranscript.includes('open') || lowerTranscript.includes('show me')) {
      if (lowerTranscript.includes('dashboard')) {
        return { action: 'navigate', data: '/dashboard' };
      }
      if (lowerTranscript.includes('medicine')) {
        return { action: 'navigate', data: '/medicines' };
      }
      if (lowerTranscript.includes('schedule')) {
        return { action: 'navigate', data: '/schedule' };
      }
      if (lowerTranscript.includes('donation')) {
        return { action: 'navigate', data: '/donations' };
      }
      if (lowerTranscript.includes('settings')) {
        return { action: 'navigate', data: '/settings' };
      }
      if (lowerTranscript.includes('report')) {
        return { action: 'navigate', data: '/reports' };
      }
    }

    // Help command
    if (lowerTranscript.includes('help') || lowerTranscript.includes('what can you do')) {
      return { action: 'show_help', data: null };
    }

    // Exit/stop
    if (lowerTranscript.includes('stop') || lowerTranscript.includes('exit') || lowerTranscript.includes('cancel')) {
      return { action: 'stop_conversation', data: null };
    }

    return { action: 'unknown', data: transcript };
  }

  // Extract medicine details from natural language
  extractMedicineDetails(transcript: string): any {
    const details: any = {};

    // Extract medicine name
    const nameMatch = transcript.match(/(?:called|named|medicine|medication)\s+([\w\s]+?)(?:\s+with|\s+expir|\s+batch|\s+quantity|$)/i);
    if (nameMatch) {
      details.name = nameMatch[1].trim();
    }

    // Extract quantity
    const quantityMatch = transcript.match(/(\d+)\s*(?:tablet|pill|capsule|bottle|strip|piece|unit)/i);
    if (quantityMatch) {
      details.quantity = parseInt(quantityMatch[1]);
    }

    // Extract expiry date
    const expiryMatch = transcript.match(/expir(?:y|es|ing)?\s*(?:date)?\s*(?:is|on)?\s*([\w\s,]+)/i);
    if (expiryMatch) {
      details.expiryDate = expiryMatch[1].trim();
    }

    // Extract batch number
    const batchMatch = transcript.match(/batch\s*(?:number)?\s*(?:is)?\s*([\w\d-]+)/i);
    if (batchMatch) {
      details.batchNumber = batchMatch[1].trim();
    }

    // Extract dosage
    const dosageMatch = transcript.match(/(\d+)\s*(?:mg|mcg|g|ml)/i);
    if (dosageMatch) {
      details.dosage = dosageMatch[0];
    }

    return details;
  }

  // Provide help information
  getHelpText(): string {
    return `I can help you with: 
    Adding medicines with voice, 
    Searching medicines, 
    Creating schedules, 
    Marking medicines as taken, 
    Donating medicines, 
    Generating reports, 
    and much more. Just tell me what you need!`;
  }
}

export const voiceService = new VoiceService();
