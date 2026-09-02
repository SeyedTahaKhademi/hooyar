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

const DEFAULT_PROVIDER_ORDER: ProviderId[] = Object.keys(DEFAULT_PROVIDERS) as ProviderId[];
const DEFAULT_MODEL_ORDER: Record<ProviderId, string[]> = Object.fromEntries(
  Object.entries(DEFAULT_PROVIDERS).map(([id, cfg]) => [id, cfg.models.map((m) => m.id)])
) as Record<ProviderId, string[]>;

const defaultConfig: AppConfig = {
  activeProvider: 'gemini',
  activeModel: 'gemini-3.6-flash',
  workspacePath: null,
  autoApproveTools: false,
  systemPrompt: SYSTEM_PROMPT_DEFAULT,
  providers: DEFAULT_PROVIDERS,
  chats: [{ id: 'default-chat', title: 'گفتگوی جدید', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: [] }],
  activeChatId: 'default-chat',
  theme: 'dark',
  fontSize: 13,
  providerOrder: DEFAULT_PROVIDER_ORDER,
  modelOrder: DEFAULT_MODEL_ORDER
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
          const mergedModelOrder: Record<ProviderId, string[]> = { ...DEFAULT_MODEL_ORDER };
          if (saved.modelOrder && typeof saved.modelOrder === 'object') {
            for (const k of Object.keys(saved.modelOrder) as ProviderId[]) {
              if (Array.isArray(saved.modelOrder[k])) mergedModelOrder[k] = saved.modelOrder[k];
            }
          }
          const finalConfig = {
            ...defaultConfig,
            ...saved,
            providers: {
              ...DEFAULT_PROVIDERS,
              ...(saved.providers || {})
            },
            chats: Array.isArray(saved.chats) && saved.chats.length ? saved.chats : defaultConfig.chats,
            activeChatId: saved.activeChatId || defaultConfig.activeChatId,
            providerOrder: Array.isArray(saved.providerOrder) && saved.providerOrder.length
              ? saved.providerOrder
              : DEFAULT_PROVIDER_ORDER,
            modelOrder: mergedModelOrder
          };
          setConfig(finalConfig);
          if (finalConfig.workspacePath && native?.setWorkspace) {
            await native.setWorkspace(finalConfig.workspacePath);
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

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', config.theme || 'dark');
      const win = document.querySelector('#app-root') || document.body;
      if (win) {
        win.setAttribute('data-theme', config.theme || 'dark');
      }
    }
  }, [config.theme]);

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
    const result = await native.selectFolder();
    if (!result) return;
    const selectedPath = typeof result === 'string' ? result : result.path;

    if (result && typeof result === 'object' && result.canceled) {
      setConfig((prev) => ({ ...prev, workspacePath: null }));
      if (native?.setWorkspace) await native.setWorkspace(null);
      return;
    }

    if (selectedPath) {
      if (native?.setWorkspace) await native.setWorkspace(selectedPath);
      setConfig((prev) => ({ ...prev, workspacePath: selectedPath }));
      await refreshFileTree(selectedPath);
      addTerminalLine('info', `پوشه کاری پروژه: ${selectedPath}`);
      const trusted = result && typeof result === 'object' ? result.trusted : true;
      if (!trusted) {
        addTerminalLine('info', 'پروژه تایید نشده. برای فعال‌سازی کامل دسترسی‌ها پروژه را Trust کنید.');
      }
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

  const handleExecuteTool = async (toolCall: ToolCall, continueLoop: boolean = false) => {
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

    if (continueLoop) {
      const out =
        updatedToolCall.status === 'completed'
          ? (updatedToolCall.result !== undefined
            ? (typeof updatedToolCall.result === 'string'
              ? updatedToolCall.result
              : JSON.stringify(updatedToolCall.result, null, 2))
            : 'انجام شد (بدون خروجی).')
          : `خطا: ${updatedToolCall.error || 'نامشخص'}`;

      const feedbackContent =
        `خروجی ابزار (${toolCall.tool}):\n${out}\n\n` +
        'اگر اطلاعات کافی است پاسخ نهایی فارسی بده، در غیر این صورت ابزارهای بعدی را با ```json ارسال کن.';

      const feedbackMessage: Message = {
        id: generateId(),
        sender: 'system',
        content: feedbackContent,
        timestamp: nowStr()
      };

      setIsProcessing(true);
      try {
        const finalWorking = await new Promise<Message[]>((resolve) => {
          setConfig((prev) => {
            const updatedChats = prev.chats.map((chat) =>
              chat.id !== prev.activeChatId
                ? chat
                : { ...chat, messages: [...chat.messages, feedbackMessage], updatedAt: new Date().toISOString() }
            );
            const thisChat = updatedChats.find((c) => c.id === prev.activeChatId)!;
            resolve(thisChat.messages);
            return { ...prev, chats: updatedChats };
          });
        });
        await runAgentLoop(finalWorking, 6);
      } catch (err: any) {
        addMessage('system', `خطا در ادامه حلقه ایجنت: ${err.message}`);
      } finally {
        setIsProcessing(false);
        setAgentStatus('idle');
      }
    }

    return updatedToolCall;
  };

  const runAgentLoop = useCallback(async (
    workingMessages: Message[],
    maxIterations: number = 8
  ) => {
    const currentProvider = config.providers[config.activeProvider];
    let iter = 0;
    let lastMessages = [...workingMessages];

    while (iter < maxIterations) {
      iter++;
      setAgentStatus('thinking');

      const stepResult = await runAgentStep(
        currentProvider,
        lastMessages,
        config.workspacePath,
        config.systemPrompt
      );

      const agentMsgId = generateId();
      const agentMessage: Message = {
        id: agentMsgId,
        sender: 'agent',
        content: stepResult.text,
        timestamp: nowStr(),
        toolCalls: stepResult.toolCalls
      };

      setConfig((prev) => ({
        ...prev,
        chats: prev.chats.map((chat) => chat.id !== prev.activeChatId ? chat : {
          ...chat,
          updatedAt: new Date().toISOString(),
          messages: [...chat.messages, agentMessage]
        })
      }));
      lastMessages = [...lastMessages, agentMessage];

      if (!stepResult.toolCalls || stepResult.toolCalls.length === 0) {
        return;
      }

      if (!config.autoApproveTools) {
        return;
      }

      setAgentStatus('executing');
      const toolResults: string[] = [];
      for (const tc of stepResult.toolCalls) {
        const executed = await handleExecuteTool(tc);
        const out =
          executed.status === 'completed'
            ? (executed.result !== undefined
              ? (typeof executed.result === 'string' ? executed.result : JSON.stringify(executed.result, null, 2))
              : 'انجام شد (بدون خروجی).')
            : `خطا: ${executed.error || 'نامشخص'}`;
        toolResults.push(`نتیجه ابزار (${tc.tool}#${tc.id}):\n${out}`);
      }

      const feedbackContent =
        'خروجی ابزارهای اجراشده:\n\n' + toolResults.join('\n---\n') +
        '\n\nاگر اطلاعات کافی است، پاسخ نهایی را به زبان فارسی به کاربر بده. در غیر این صورت ابزارهای بعدی را در همان پاسخ (با ```json) ارسال کن.';

      const feedbackMessage: Message = {
        id: generateId(),
        sender: 'system',
        content: feedbackContent,
        timestamp: nowStr()
      };
      setConfig((prev) => ({
        ...prev,
        chats: prev.chats.map((chat) => chat.id !== prev.activeChatId ? chat : {
          ...chat,
          updatedAt: new Date().toISOString(),
          messages: [...chat.messages, feedbackMessage]
        })
      }));
      lastMessages = [...lastMessages, feedbackMessage];
    }

    const limitMsg: Message = {
      id: generateId(),
      sender: 'system',
      content: 'حداکثر تعداد مراحل اجرای ابزار به پایان رسید. برای ادامه دستور جدیدی وارد کنید.',
      timestamp: nowStr()
    };
    setConfig((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) => chat.id !== prev.activeChatId ? chat : {
        ...chat,
        messages: [...chat.messages, limitMsg]
      })
    }));
  }, [config.activeProvider, config.providers, config.workspacePath, config.systemPrompt, config.autoApproveTools]);

  const handleSendMessage = async (text: string) => {
    if (isProcessing) return;

    const userMsgId = generateId();
    const userMessage: Message = {
      id: userMsgId,
      sender: 'user',
      content: text,
      timestamp: nowStr()
    };

    setConfig((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) => chat.id !== prev.activeChatId ? chat : {
        ...chat,
        title: chat.messages.length === 0 ? text.trim().slice(0, 42) || 'گفتگوی جدید' : chat.title,
        messages: [...chat.messages, userMessage]
      })
    }));

    setIsProcessing(true);
    setAgentStatus('thinking');

    try {
      const workingMessages: Message[] = [...messages, userMessage];
      await runAgentLoop(workingMessages);
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

  const handleDeleteChat = (chatId: string) => {
    setConfig((prev) => {
      const newChats = prev.chats.filter((c) => c.id !== chatId);
      const nextChatId = newChats.length > 0 ? newChats[0].id : prev.activeChatId;
      return {
        ...prev,
        chats: newChats,
        activeChatId: chatId === prev.activeChatId ? nextChatId : prev.activeChatId
      };
    });
  };

  const handleEditChatTitle = (chatId: string, newTitle: string) => {
    setConfig((prev) => ({
      ...prev,
      chats: prev.chats.map((c) => c.id === chatId ? { ...c, title: newTitle } : c)
    }));
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

  const handleChangeProviderModel = (providerId: ProviderId, modelId: string) => {
    setConfig((prev) => {
      const isActiveProvider = prev.activeProvider === providerId;
      return {
        ...prev,
        activeModel: isActiveProvider ? modelId : prev.activeModel,
        providers: {
          ...prev.providers,
          [providerId]: {
            ...prev.providers[providerId],
            selectedModel: modelId
          }
        }
      };
    });
  };

  const handleReorderProviders = (fromIdx: number, toIdx: number) => {
    setConfig((prev) => {
      const order = [...prev.providerOrder];
      const [moved] = order.splice(fromIdx, 1);
      order.splice(toIdx, 0, moved);
      return { ...prev, providerOrder: order };
    });
  };

  const handleReorderModels = (providerId: ProviderId, fromIdx: number, toIdx: number) => {
    setConfig((prev) => {
      const current = prev.modelOrder[providerId] || prev.providers[providerId]?.models.map((m) => m.id) || [];
      const order = [...current];
      const [moved] = order.splice(fromIdx, 1);
      order.splice(toIdx, 0, moved);
      return {
        ...prev,
        modelOrder: { ...prev.modelOrder, [providerId]: order }
      };
    });
  };

  const handleCycleTheme = () => {
    setConfig((prev) => {
      const order: AppConfig['theme'][] = ['dark', 'light', 'glass'];
      const cur = order.indexOf(prev.theme);
      return { ...prev, theme: order[(cur + 1) % order.length] };
    });
  };

  const handleToggleAutoApprove = () => {
    setConfig((prev) => ({ ...prev, autoApproveTools: !prev.autoApproveTools }));
  };

  return (
    <div className="flex flex-col h-screen theme-bg-root theme-text overflow-hidden">
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
        theme={config.theme}
        onCycleTheme={handleCycleTheme}
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
          onDeleteChat={handleDeleteChat}
          onEditChatTitle={handleEditChatTitle}
          onChangeProvider={handleChangeProvider}
          onChangeModel={handleChangeProviderModel}
          onReorderProviders={handleReorderProviders}
          onReorderModels={handleReorderModels}
          providerOrder={config.providerOrder}
          modelOrder={config.modelOrder}
          onOpenSettings={() => setIsSettingsOpen(true)}
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
            fontSize={config.fontSize}
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
        theme={config.theme}
        fontSize={config.fontSize}
        onUpdateConfig={(updates) => setConfig((prev) => ({ ...prev, ...updates }))}
      />
    </div>
  );
}

export default App;
