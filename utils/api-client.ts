import { config } from '../config/api';

interface ChatResponse {
  content: string;
  username: string;
  avatarUrl: string;
}

interface ChatRequest {
  message: string;
  mentionedUsername?: string;
  environment: string;
}

export const fetchWithCors = async (url: string, options: RequestInit = {}) => {
  try {
    console.log('Making request with options:', {
      url,
      method: options.method,
      headers: options.headers,
    });

    const response = await fetch(url, options);

    if (!response.ok) {
      console.error('Response not OK:', {
        status: response.status,
        statusText: response.statusText,
      });
      const errorBody = await response.text();
      console.error('Error response body:', errorBody);
      try {
        const error = JSON.parse(errorBody);
        throw new Error(error.message || 'API request failed');
      } catch {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export class TensaiClient {
  private baseUrl: string;
  private apiKey: string;
  private environment: string;

  constructor() {
    if (!config.apiUrl) {
      throw new Error('API URL is not configured');
    }
    if (!config.tensaiKey) {
      throw new Error('API key is not configured');
    }
    this.baseUrl = config.apiUrl;
    this.apiKey = config.tensaiKey;
    this.environment = 'production';
  }

  async sendMessage(message: string, mentionedUsername?: string): Promise<ChatResponse> {
    console.log('Sending request to:', `${this.baseUrl}/ai/chat`);
    return await fetchWithCors(`${this.baseUrl}/ai/chat`, {
      method: 'POST',
      headers: {
        'x-tensai-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        mentionedUsername,
        environment: this.environment
      } as ChatRequest)
    });
  }
} 