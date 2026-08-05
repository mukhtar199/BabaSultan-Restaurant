import { IAIService, AIChatResponse } from '../../domain/services/IAIService';

export class GeminiAdvisorServiceImpl implements IAIService {
  async askAIAdvisor(prompt: string, language: string, currentData: any): Promise<AIChatResponse> {
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        language,
        currentData
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `AI Server Error: ${res.statusText}`);
    }

    const data: AIChatResponse = await res.json();
    return data;
  }
}
