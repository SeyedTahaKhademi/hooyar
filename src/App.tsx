import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { TerminalView } from './components/TerminalView';
import { SettingsModal } from './components/SettingsModal';
import { DEFAULT_PROVIDERS } from './services/aiProviders';
import { runAgentStep, executeTool, SYSTEM_PROMPT_DEFAULT } from './services/agentEngine';
import { AppConfig, ChatSession, FileNode, Message, ProviderId, ToolCall } from './types';

function generateId() {
  return Math.random().toString(36).substr(2, 12);
}

function nowStr() {
  return new Date().toLocaleTimeString('fa-IR');
}

interface TerminalLine {
  type: 'command' | 'stdout' | 'stderr' | 'info';
  text: string;
  timestamp: string;
}

const defaultConfig: AppConfig = {
  activeProvider: 'gemini',
  activeModel: 'gemini-3.6-flash',
  workspacePath: null,
  autoApproveTools: false,
  systemPrompt: SYSTEM_PROMPT_DEFAULT,
  providers: DEFAULT_PROVIDERS,
  chats: [{ id: 'default-chat', title: 'گفتگوی جدید', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: [] }],
  activeChatId: 'default-chat',
  theme: 'dark'
};

function App() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'thinking' | 'executing' | 'error'>('idle');
  const [isProcessing, setIsProcessing] = useState(false);

  const native = (window as any).hooyarNative;

  useEffect(() => {
    const loadConfig = async () => {
      if (native?.loadConfig) {
        const saved = await native.loadConfig();
        if (saved && Object.keys(saved).length > 0) {
          setConfig((prev) => ({
            ...prev,
            ...saved,
            providers: {
              ...DEFAULT_PROVIDERS,
              ...(saved.providers || {})
            },
            chats: Array.isArray(saved.chats) && saved.chats.length ? saved.chats : prev.chats,
            activeChatId: saved.activeChatId || prev.activeChatId
          }));
        }
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    if (native?.saveConfig) {
      native.saveConfig(config);
    }
  }, [config]);

  const refreshFileTree = useCallback(async (path: string) => {
    if (!native?.readDir) return;
    const res = await native.readDir(path);
    if (res.success && res.tree) {
      setFileTree(res.tree);
    }
  }, []);

  const handleSelectWorkspace = async () => {
    if (!native?.selectFolder) {
      alert('این قابلیت در محیط نرم‌افزار دسکتاپ ویندوز هویار فعال است.');
      return;
    }
    const selected = await native.selectFolder();
    if (selected) {
      setConfig((prev) => ({ ...prev, workspacePath: selected }));
      await refreshFileTree(selected);
      addTerminalLine('info', `پوشه کاری پروژه: ${selected}`);
    }
  };

  const handleSelectFile = async (filePath: string) => {
    if (!native?.readFile) return;
    const res = await native.readFile(filePath);
    if (res.success) {
      addMessage('user', `بررسی و تحلیل فایل پروژه:\n\nمسیر: ${filePath}\n\nمحتوا:\n\`\`\`\n${res.content?.substring(0, 3000)}\n\`\`\``);
    }
  };

  const activeChat = config.chats.find((chat) => chat.id === config.activeChatId) || config.chats[0];
  const messages = activeChat?.messages || [];

  const addMessage = (sender: 'user' | 'agent' | 'system', content: string, toolCalls?: ToolCall[]) => {
    const msg: Message = {
      id: generateId(),
      sender,
      content,
      timestamp: nowStr(),
      toolCalls
    };
    setConfig((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) => chat.id === prev.activeChatId
        ? {
            ...chat,
            title: chat.messages.length === 0 && sender === 'user'
              ? content.trim().slice(0, 42) || 'گفتگوی جدید'
              : chat.title,
            messages: [...chat.messages, msg],
            updatedAt: new Date().toISOString()
          }
        : chat)
    }));
    return msg;
  };

  const addTerminalLine = (type: TerminalLine['type'], text: string) => {
    setTerminalLines((prev) => [
      ...prev,
      { type, text, timestamp: new Date().toLocaleTimeString('fa-IR') }
    ]);
  };

  const handleExecuteTool = async (toolCall: ToolCall) => {
    setAgentStatus('executing');

    if (toolCall.tool === 'execute_terminal_command') {
      addTerminalLine('command', toolCall.args.command || '');
      setIsTerminalOpen(true);
    }

    const updatedToolCall = await executeTool(toolCall, config.workspacePath);

    if (updatedToolCall.tool === 'execute_terminal_command') {
      if (updatedToolCall.result) {
        addTerminalLine('stdout', String(updatedToolCall.result));
      }
      if (updatedToolCall.error) {
        addTerminalLine('stderr', updatedToolCall.error);
      }
    }

    if (
      (updatedToolCall.tool === 'write_file' || updatedToolCall.tool === 'list_directory') &&
      config.workspacePath
    ) {
      await refreshFileTree(config.workspacePath);
    }

    setConfig((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) => chat.id !== prev.activeChatId ? chat : {
        ...chat,
        updatedAt: new Date().toISOString(),
        messages: chat.messages.map((msg) => ({
          ...msg,
          toolCalls: msg.toolCalls?.map((tc) => tc.id === toolCall.id ? updatedToolCall : tc)
        }))
      })
    }));

    setAgentStatus('idle');
    return updatedToolCall;
  };

  const handleSendMessage = async (text: string) => {
    if (isProcessing) return;

    addMessage('user', text);
    setIsProcessing(true);
    setAgentStatus('thinking');

    const currentProvider = config.providers[config.activeProvider];
    const allMessages: Message[] = [
      ...messages,
      { id: generateId(), sender: 'user', content: text, timestamp: nowStr() }
    ];

    try {
      const result = await runAgentStep(
        currentProvider,
        allMessages,
        config.workspacePath,
        config.systemPrompt
      );

      addMessage('agent', result.text, result.toolCalls);

      if (config.autoApproveTools && result.toolCalls.length > 0) {
        setAgentStatus('executing');
        for (const tc of result.toolCalls) {
          await handleExecuteTool(tc);
        }
      }
    } catch (err: any) {
      addMessage('system', `خطا در برقراری ارتباط با مدل: ${err.message}`);
      setAgentStatus('error');
    } finally {
      setIsProcessing(false);
      setAgentStatus('idle');
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleNewChat = () => {
    const chat: ChatSession = {
      id: generateId(),
      title: 'گفتگوی جدید',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    setConfig((prev) => ({ ...prev, chats: [chat, ...prev.chats], activeChatId: chat.id }));
  };

  const handleSelectChat = (chatId: string) => {
    setConfig((prev) => ({ ...prev, activeChatId: chatId }));
  };

  const handleUpdateProvider = (providerId: ProviderId, updates: Partial<typeof DEFAULT_PROVIDERS[ProviderId]>) => {
    setConfig((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [providerId]: { ...prev.providers[providerId], ...updates }
      }
    }));
  };

  const handleChangeProvider = (id: ProviderId) => {
    const firstModel = config.providers[id]?.models[0]?.id || '';
    setConfig((prev) => ({
      ...prev,
      activeProvider: id,
      activeModel: config.providers[id]?.selectedModel || firstModel
    }));
  };

  const handleChangeModel = (model: string) => {
    setConfig((prev) => ({
      ...prev,
      activeModel: model,
      providers: {
        ...prev.providers,
        [prev.activeProvider]: {
          ...prev.providers[prev.activeProvider],
          selectedModel: model
        }
      }
    }));
  };

  const handleToggleAutoApprove = () => {
    setConfig((prev) => ({ ...prev, autoApproveTools: !prev.autoApproveTools }));
  };

  return (
    <div className="flex flex-col h-screen bg-[#070a12] text-slate-100 overflow-hidden">
      {/* Header */}
      <Header
        workspacePath={config.workspacePath}
        onSelectWorkspace={handleSelectWorkspace}
        providers={config.providers}
        activeProviderId={config.activeProvider}
        activeModel={config.activeModel}
        onChangeProvider={handleChangeProvider}
        onChangeModel={handleChangeModel}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleTerminal={() => setIsTerminalOpen((v) => !v)}
        isTerminalOpen={isTerminalOpen}
        agentStatus={agentStatus}
        onNewChat={handleNewChat}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          workspacePath={config.workspacePath}
          fileTree={fileTree}
          onRefreshFileTree={() => config.workspacePath && refreshFileTree(config.workspacePath)}
          onSelectFile={handleSelectFile}
          onQuickPrompt={handleQuickPrompt}
          providers={config.providers}
          activeProviderId={config.activeProvider}
          chats={config.chats}
          activeChatId={config.activeChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
        />

        {/* Chat & Terminal Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Area */}
          <ChatArea
            messages={messages}
            onSendMessage={handleSendMessage}
            onExecuteTool={handleExecuteTool}
            autoApproveTools={config.autoApproveTools}
            onToggleAutoApprove={handleToggleAutoApprove}
            isProcessing={isProcessing}
          />

          {/* Terminal Panel */}
          <TerminalView
            lines={terminalLines}
            isVisible={isTerminalOpen}
            onClose={() => setIsTerminalOpen(false)}
            onClear={() => setTerminalLines([])}
          />
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        providers={config.providers}
        onUpdateProvider={handleUpdateProvider}
        systemPrompt={config.systemPrompt}
        onUpdateSystemPrompt={(p) => setConfig((prev) => ({ ...prev, systemPrompt: p }))}
        autoApproveTools={config.autoApproveTools}
        onToggleAutoApprove={handleToggleAutoApprove}
      />
    </div>
  );
}

export default App;
