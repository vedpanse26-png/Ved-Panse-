
import { GoogleGenAI, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';

const logIncidentDeclaration: FunctionDeclaration = {
  name: 'log_incident',
  parameters: {
    type: Type.OBJECT,
    description: 'Log a suspicious behavior incident during the exam.',
    properties: {
      type: {
        type: Type.STRING,
        description: 'The category of suspicious behavior (e.g., MULTIPLE_PEOPLE, LOOKING_AWAY, TALKING, UNAUTHORIZED_DEVICE).',
      },
      description: {
        type: Type.STRING,
        description: 'A brief description of what was observed.',
      },
      severity: {
        type: Type.STRING,
        description: 'Severity level: LOW, MEDIUM, HIGH, or CRITICAL.',
      },
    },
    required: ['type', 'description', 'severity'],
  },
};

export class ProctorService {
  private ai: GoogleGenAI;
  // Use sessionPromise to prevent race conditions during initialization
  private sessionPromise: Promise<any> | null = null;
  private onIncidentCallback?: (data: any) => void;
  private onLogCallback?: (msg: string) => void;

  constructor() {
    // Initialize GoogleGenAI with the provided API key
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(callbacks: {
    onIncident: (data: any) => void;
    onLog?: (msg: string) => void;
  }) {
    this.onIncidentCallback = callbacks.onIncident;
    this.onLogCallback = callbacks.onLog;

    this.sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          this.onLogCallback?.('Live Proctoring Session Established');
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
              if (fc.name === 'log_incident') {
                this.onIncidentCallback?.(fc.args);
                // Send function response back to the model using sessionPromise
                this.sessionPromise?.then((session) => {
                  session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: "Incident logged successfully" },
                    }
                  });
                });
              }
            }
          }
        },
        onerror: (e: any) => {
          console.error('Proctoring Error:', e);
          this.onLogCallback?.('Error: Connection Issue');
        },
        onclose: () => {
          this.onLogCallback?.('Session Closed');
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        tools: [{ functionDeclarations: [logIncidentDeclaration] }],
        systemInstruction: `You are an AI Exam Proctor. 
        Monitor the live video and audio feed for academic dishonesty. 
        Identify:
        1. MULTIPLE_PEOPLE: More than one person in the frame.
        2. LOOKING_AWAY: The student looking away from the screen consistently for more than 3 seconds.
        3. TALKING: The student speaking or hearing external voices giving answers.
        4. UNAUTHORIZED_DEVICE: Detection of phones, tablets, or books.
        5. ABSENCE: Student leaving the frame.
        Note: The system also automatically detects when the user switches browser tabs or windows (WINDOW_SWITCH). 
        Your job is primarily to watch the video/audio and log behavioral incidents.
        When you detect these, call the 'log_incident' function immediately. 
        Be professional and strict but fair. Do not provide help with the exam.`,
      },
    });

    return this.sessionPromise;
  }

  sendAudio(data: Float32Array) {
    if (!this.sessionPromise) return;
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    
    // Manually encode audio bytes to base64
    const binary = this.encode(new Uint8Array(int16.buffer));
    this.sessionPromise.then((session) => {
      session.sendRealtimeInput({
        media: {
          data: binary,
          // Use correct audio/pcm MIME type
          mimeType: 'audio/pcm;rate=16000',
        }
      });
    });
  }

  sendFrame(base64Data: string) {
    if (!this.sessionPromise) return;
    // Send visual frames to the model using sessionPromise
    this.sessionPromise.then((session) => {
      session.sendRealtimeInput({
        media: { data: base64Data, mimeType: 'image/jpeg' }
      });
    });
  }

  // Implementation of base64 encoding as required by guidelines
  private encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  disconnect() {
    if (this.sessionPromise) {
      this.sessionPromise.then((session) => {
        session.close();
      });
      this.sessionPromise = null;
    }
  }
}
