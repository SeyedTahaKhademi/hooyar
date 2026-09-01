import React, { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { TerminalView } from './components/TerminalView';
import { SettingsModal } from './components/SettingsModal';
import { DEFAULT_PROVIDERS } from './services/aiProviders';
import { runAgentStep, executeTool, buildToolResultsPrompt, SYSTEM_PROMPT_DEFAULT } from './services/agentEngine';
import { AppConfig, ChatSession, FileNode, Message, ProviderId, ToolCall } from './types';

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    : Math.random().toString(36).slice(2, 14);
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
          // Re-register the restored workspace in the main process so the
          // file-system sandbox knows the allowed root from startup.
          if (native?.setWorkspace && saved.workspacePath) {
            native.setWorkspace(saved.workspacePath);
          }
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
      // Keep the main-process sandbox in sync with the renderer state.
      if (native?.setWorkspace) {
        await native.setWorkspace(selected);
      }
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

  // Mirror of the conversation used by async agent flows without relying
  // on possibly-stale closure state.
  const messagesRef = useRef<Message[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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

  /** Executes a single tool call and updates chat/terminal/file-tree state. */
  const runSingleTool = async (toolCall: ToolCall): Promise<ToolCall> => {
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
      (updatedToolCall.tool === 'write_file' ||
        updatedToolCall.tool === 'list_directory' ||
        updatedToolCall.tool === 'search_workspace') &&
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

    return updatedToolCall;
  };

  /**
   * The autonomous agent loop: calls the model, executes the tools it
   * requests (auto-approve mode), feeds the real results back and repeats
   * until the model delivers its final answer or the step budget ends.
   */
  const MAX_AGENT_STEPS = 8;

  const driveAgent = async (
    initialMessages: Array<Pick<Message, 'sender' | 'content'>>
  ): Promise<void> => {
    let apiMessages = initialMessages;

    for (let step = 0; step < MAX_AGENT_STEPS; step++) {
      setAgentStatus('thinking');

      const result = await runAgentStep(
        config.providers[config.activeProvider],
        apiMessages as Message[],
        config.workspacePath,
        config.systemPrompt
      );

      addMessage('agent', result.text, result.toolCalls);

      const shouldAutoRun = config.autoApproveTools && result.toolCalls.length > 0;
      if (!shouldAutoRun) return;

      setAgentStatus('executing');
      const executed: ToolCall[] = [];
      for (const tc of result.toolCalls) {
        executed.push(await runSingleTool(tc));
      }

      if (step === MAX_AGENT_STEPS - 1) {
        addMessage(
          'system',
          `حداکثر تعداد گام‌های اجرای خودکار (${MAX_AGENT_STEPS}) به پایان رسید. برای ادامه کار، درخواست خود را تکرار کنید.`
        );
        return;
      }

      apiMessages = [
        ...apiMessages,
        { sender: 'agent' as const, content: result.text },
        { sender: 'user' as const, content: buildToolResultsPrompt(executed) }
      ];
    }
  };

  /** Manual tool approval (auto-approve OFF): execute, then let the model continue. */
  const handleExecuteTool = async (toolCall: ToolCall) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setAgentStatus('executing');

    try {
      const updated = await runSingleTool(toolCall);
      await driveAgent([
        ...messagesRef.current,
        { sender: 'user' as const, content: buildToolResultsPrompt([updated]) }
      ]);
    } catch (err: any) {
      addMessage('system', `خطا در ادامه اجرای ایجنت: ${err.message}`);
      setAgentStatus('error');
    } finally {
      setIsProcessing(false);
      setAgentStatus('idle');
    }
  };

  const handleSendMessage = async (text: string) => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const baseMessages: Array<Pick<Message, 'sender' | 'content'>> = [
        ...messagesRef.current,
        { sender: 'user' as const, content: text }
      ];
      addMessage('user', text);

      await driveAgent(baseMessages);
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

  /** Exports the active chat as a Markdown file via a native save dialog. */
  const handleExportChat = async () => {
    if (!native?.saveTextFile || !activeChat || activeChat.messages.length === 0) return;

    const senderLabel = (sender: string) =>
      sender === 'user' ? 'کاربر' : sender === 'agent' ? 'هویار (Hooyar AI)' : 'سیستم';

    const markdown = [
      `# ${activeChat.title}`,
      '',
      `> خروجی گرفته‌شده از هویار — ${new Date().toLocaleString('fa-IR')}`,
      '',
      ...activeChat.messages.map(
        (m) => `## ${senderLabel(m.sender)} — ${m.timestamp}\n\n${m.content}\n`
      )
    ].join('\n');

    const safeName = (activeChat.title || 'hooyar-chat').replace(/[\\/:*?"<>|]/g, '-');
    await native.saveTextFile(`${safeName}.md`, markdown);
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
          onExportChat={handleExportChat}
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
