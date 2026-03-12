import { Message } from '../types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

export async function fetchOpenRouterChat(
  messages: Message[],
  modelId: string,
  apiKey: string
): Promise<string> {
  const message = await fetchOpenRouterChatFull(messages, modelId, apiKey);
  return message?.content || '';
}

export async function fetchOpenRouterChatFull(
  messages: any[],
  modelId: string,
  apiKey: string,
  tools?: any[]
): Promise<any> {
  if (!apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  const body: any = {
    model: modelId,
    messages: messages,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AI Coding Evolution Course',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message;
}

