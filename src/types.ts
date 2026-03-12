export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  type: 'config' | 'interactive' | 'informational';
}
