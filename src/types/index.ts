export type ProviderId = 
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'deepseek'
  | 'groq'
  | 'openrouter'
  | 'bluesminds'
  | 'ollama'
  | 'mistral'
  | 'together'
  | 'perplexity'
  | 'sambanova'
  | 'cerebras'
  | 'siliconflow'
  | 'novita'
  | 'huggingface'
  | 'xai'
  | 'alibaba'
  | 'custom';

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  isFree?: boolean;
  contextWindow?: string;
}

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  nameFa: string;
  description: string;
  website: string;
  apiKey: string;
  baseUrl?: string;
  isFreeTierAvailable: boolean;
  requiresKey: boolean;
  models: ModelOption[];
  selectedModel: string;
  isVerified?: boolean;
}

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

export type AgentToolType = 
  | 'read_file'
  | 'write_file'
  | 'list_directory'
  | 'execute_terminal_command'
  | 'search_workspace';

export interface ToolCall {
  id: string;
  tool: AgentToolType;
  args: any;
  result?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  thinking?: string;
  toolCalls?: ToolCall[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface AppConfig {
  activeProvider: ProviderId;
  activeModel: string;
  workspacePath: string | null;
  autoApproveTools: boolean;
  systemPrompt: string;
  providers: Record<ProviderId, ProviderConfig>;
  chats: ChatSession[];
  activeChatId: string;
  theme: 'dark' | 'light' | 'glass';
  fontSize: number;
}
