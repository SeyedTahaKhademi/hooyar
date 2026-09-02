import React, { useState } from 'react';
import { ChatSession, FileNode, ProviderConfig, ProviderId } from '../types';
import {
  Folder,
  FileCode,
  FileText,
  FileJson,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  FolderPlus,
  Bug,
  ShieldCheck,
  Cpu,
  Layers,
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X as CloseIcon,
  ArrowUp,
  ArrowDown,
  Settings,
  ChevronUp,
  Zap,
  GripVertical,
  Key
} from 'lucide-react';

interface SidebarProps {
  workspacePath: string | null;
  fileTree: FileNode[];
  onRefreshFileTree: () => void;
  onSelectFile: (filePath: string) => void;
  onQuickPrompt: (prompt: string) => void;
  providers: Record<ProviderId, ProviderConfig>;
  activeProviderId: ProviderId;
  chats: ChatSession[];
  activeChatId: string;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onEditChatTitle: (chatId: string, newTitle: string) => void;
  onChangeProvider: (id: ProviderId) => void;
  onChangeModel: (providerId: ProviderId, modelId: string) => void;
  onReorderProviders: (fromIdx: number, toIdx: number) => void;
  onReorderModels: (providerId: ProviderId, fromIdx: number, toIdx: number) => void;
  providerOrder: ProviderId[];
  modelOrder: Record<ProviderId, string[]>;
  onOpenSettings: () => void;
}

const FileItem: React.FC<{ node: FileNode; onSelectFile: (path: string) => void }> = ({ node, onSelectFile }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) {
      return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
    }
    if (fileName.endsWith('.json')) {
      return <FileJson className="w-4 h-4 text-slate-400 shrink-0" />;
    }
    if (fileName.endsWith('.py')) {
      return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-slate-500 shrink-0" />;
  };

  if (node.isDirectory) {
    return (
      <div className="select-none">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-850 rounded text-slate-300 text-xs font-medium cursor-pointer transition-colors"
        >
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          )}
          <Folder className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="truncate dir-ltr text-right">{node.name}</span>
        </div>
        {isOpen && node.children && (
          <div className="pr-3 border-r border-slate-800 mr-2 space-y-0.5 mt-0.5">
            {node.children.map((child) => (
              <FileItem key={child.path} node={child} onSelectFile={onSelectFile} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelectFile(node.path)}
      className="flex items-center gap-2 px-2 py-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 text-xs cursor-pointer transition-colors group"
    >
      {getFileIcon(node.name)}
      <span className="truncate dir-ltr text-right group-hover:text-sky-300">{node.name}</span>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  workspacePath,
  fileTree,
  onRefreshFileTree,
  onSelectFile,
  onQuickPrompt,
  providers,
  activeProviderId,
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onEditChatTitle,
  onChangeProvider,
  onChangeModel,
  onReorderProviders,
  onReorderModels,
  providerOrder,
  modelOrder,
  onOpenSettings
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'prompts' | 'chats' | 'providers'>('files');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [expandedProvider, setExpandedProvider] = useState<ProviderId | null>(null);

  const startEditing = (chat: ChatSession) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const saveTitle = (chatId: string) => {
    if (editTitle.trim()) {
      onEditChatTitle(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const moveProvider = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= providerOrder.length) return;
    onReorderProviders(idx, newIdx);
  };

  const moveModel = (providerId: ProviderId, idx: number, direction: -1 | 1) => {
    const ordered = modelOrder[providerId] || providers[providerId]?.models.map((m) => m.id) || [];
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= ordered.length) return;
    onReorderModels(providerId, idx, newIdx);
  };

  const getOrderedModels = (providerId: ProviderId) => {
    const p = providers[providerId];
    if (!p) return [];
    const order = modelOrder[providerId];
    if (!order || order.length === 0) return p.models;
    const ordered: typeof p.models = [];
    for (const id of order) {
      const m = p.models.find((x) => x.id === id);
      if (m) ordered.push(m);
    }
    for (const m of p.models) {
      if (!ordered.some((x) => x.id === m.id)) ordered.push(m);
    }
    return ordered;
  };

  const quickPrompts = [
    {
      title: 'ایجاد اسکلت پروژه',
      prompt: 'یک ساختار کامل پروژه استاندارد با فایل‌های اصلی و تنظیمات اولیه در پوشه فعلی بساز.',
      icon: FolderPlus
    },
    {
      title: 'دیباگ و رفع خطا',
      prompt: 'فایل‌های اصلی پروژه را بررسی کن و هرگونه خطای احتمالی یا باگ منطقی را پیدا و اصلاح کن.',
      icon: Bug
    },
    {
      title: 'بهینه‌سازی کد',
      prompt: 'کدهای پوشه پروژه را تحلیل کرده و پیشنهاداتی برای بهینه‌سازی سرعت و خوانایی ارائه بده.',
      icon: Layers
    },
    {
      title: 'بررسی تست‌ها',
      prompt: 'ساختار کدهای موجود را جهت بررسی امنیت و ساختار تست‌های واحد تحلیل کن.',
      icon: ShieldCheck
    }
  ];

  return (
    <aside className="w-60 border-l theme-border-divider glass-panel flex flex-col h-[calc(100vh-2.5rem)] select-none">
      {/* Sidebar Header Tabs */}
      <div className="flex border-b theme-border-divider p-1 gap-0.5 theme-bg-inner flex-wrap">
        {([
          { id: 'files', label: 'فایل‌ها' },
          { id: 'prompts', label: 'دستورات' },
          { id: 'chats', label: 'گفتگوها' },
          { id: 'providers', label: 'ارائه‌دهنده‌ها' }
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 min-w-[4.5rem] py-1 rounded text-[10.5px] font-semibold transition-all ${activeTab === t.id
              ? 'theme-bg-hover theme-text-accent theme-border'
              : 'theme-text-muted theme-hover-text'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'files' ? (
        <div className="flex-1 overflow-y-auto p-2 flex flex-col">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-semibold text-slate-400">ساختار پروژه</span>
            <button
              onClick={onRefreshFileTree}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-sky-400 transition-colors"
              title="به‌روزرسانی"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {workspacePath ? (
            fileTree.length > 0 ? (
              <div className="space-y-0.5 overflow-y-auto flex-1">
                {fileTree.map((node) => (
                  <FileItem key={node.path} node={node} onSelectFile={onSelectFile} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                پوشه اسکن شد اما خالی است.
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-slate-500 text-xs gap-2">
              <Folder className="w-7 h-7 text-slate-600 stroke-[1.5]" />
              <p>پوشه پروژه هنوز انتخاب نشده است.</p>
            </div>
          )}
        </div>
      ) : activeTab === 'prompts' ? (
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1 px-1">دستورات ایجنت</span>
          {quickPrompts.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => onQuickPrompt(item.prompt)}
                className="w-full text-right p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-sky-300">{item.title}</span>
                </div>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">{item.prompt}</p>
              </button>
            );
          })}
        </div>
      ) : activeTab === 'chats' ? (
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg hover:opacity-90 text-white text-xs font-semibold transition-all"
            style={{ backgroundColor: 'var(--text-accent)' }}
          >
            <Plus className="w-3.5 h-3.5" /> گفتگوی جدید
          </button>
          <div className="pt-1 space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group w-full text-right p-2 rounded-lg border transition-all cursor-pointer relative ${activeChatId === chat.id
                    ? 'theme-text-accent theme-border'
                    : 'theme-bg-card-solid theme-border theme-text-muted theme-hover-bg theme-hover-text'
                  }`}
                style={activeChatId === chat.id ? {
                  background: 'color-mix(in srgb, var(--text-accent) 10%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--text-accent) 30%, transparent)'
                } : {}}
              >
                {editingChatId === chat.id ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveTitle(chat.id)}
                      className="flex-1 bg-slate-950 border border-sky-500/50 rounded px-1 py-0.5 text-xs text-slate-200 focus:outline-none"
                    />
                    <button onClick={() => saveTitle(chat.id)} className="p-0.5 hover:text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingChatId(null)} className="p-0.5 hover:text-rose-400">
                      <CloseIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-1.5 text-xs font-medium">
                      <div className="flex items-center gap-1.5 truncate">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                        <span className="truncate">{chat.title}</span>
                      </div>

                      <div className="hidden group-hover:flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditing(chat); }}
                          className="p-1 hover:text-sky-400 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                          className="p-1 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] mt-1 text-slate-500">{chat.messages.length} پیام</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Providers Tab — Reorderable + Model selection */
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              مدیریت ارائه‌دهنده‌ها
            </span>
            <button
              onClick={onOpenSettings}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-sky-400 transition-colors"
              title="تنظیمات کلید API"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[10px] text-slate-500 px-1 mb-2 leading-relaxed">
            برای جابه‌جایی از فلش‌ها استفاده کنید. روی نام ارائه‌دهنده کلیک تا لیست مدل‌هایش باز شود.
          </div>

          <div className="space-y-1">
            {providerOrder.map((pid, idx) => {
              const provider = providers[pid];
              if (!provider) return null;
              const isActive = activeProviderId === pid;
              const isExpanded = expandedProvider === pid;
              const orderedModels = getOrderedModels(pid);

              return (
                <div
                  key={pid}
                  className={`rounded-lg border transition-all ${isActive
                    ? 'bg-sky-950/40 border-sky-600/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                >
                  {/* Provider Row */}
                  <div className="flex items-center gap-1 p-1.5">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => moveProvider(idx, -1)}
                        disabled={idx === 0}
                        className="p-0.5 rounded text-slate-500 hover:text-sky-400 hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        title="انتقال به بالا"
                      >
                        <ArrowUp className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => moveProvider(idx, 1)}
                        disabled={idx === providerOrder.length - 1}
                        className="p-0.5 rounded text-slate-500 hover:text-sky-400 hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        title="انتقال به پایین"
                      >
                        <ArrowDown className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <GripVertical className="w-3 h-3 text-slate-600 shrink-0" />

                    {/* Status Dot */}
                    <button
                      onClick={() => onChangeProvider(pid)}
                      className="w-2 h-2 rounded-full shrink-0 transition-all hover:scale-125"
                      title="انتخاب به عنوان ارائه‌دهنده فعال"
                      style={{
                        background: isActive
                          ? '#10b981'
                          : provider.isVerified
                            ? '#38bdf8'
                            : provider.apiKey
                              ? '#f59e0b'
                              : '#475569'
                      }}
                    />

                    {/* Provider Name + Expand */}
                    <button
                      onClick={() => setExpandedProvider(isExpanded ? null : pid)}
                      className="flex-1 text-right min-w-0 flex items-center justify-between gap-1 px-1 py-0.5 rounded hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="text-right min-w-0">
                        <div className={`text-[11px] font-semibold truncate ${isActive ? 'text-sky-200' : 'text-slate-200'
                          }`}>
                          {provider.nameFa}
                        </div>
                        <div className="text-[9.5px] text-slate-500 truncate dir-ltr">
                          {provider.models[0]?.name || provider.name}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {/* Key Status Badge */}
                    {provider.requiresKey && !provider.apiKey && (
                      <span className="shrink-0" title="کلید API تنظیم نشده">
                        <Key className="w-3 h-3 text-amber-500/70" />
                      </span>
                    )}
                  </div>

                  {/* Expanded — Model List with Reorder */}
                  {isExpanded && (
                    <div className="px-1 pb-1.5 border-t border-slate-800/70 pt-1.5 mt-1 space-y-0.5">
                      <div className="text-[10px] text-slate-400 px-1 mb-1 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-sky-400 shrink-0" />
                        مدل‌های موجود
                      </div>

                      {orderedModels.map((model, mIdx) => {
                        const isSelectedModel = provider.selectedModel === model.id;
                        return (
                          <div
                            key={model.id}
                            className={`flex items-center gap-1 px-1 py-1 rounded transition-colors group ${isSelectedModel && isActive
                              ? 'bg-sky-900/40'
                              : 'hover:bg-slate-800/60'
                              }`}
                          >
                            {/* Model Reorder */}
                            <div className="flex flex-col gap-0.5 shrink-0 opacity-60 group-hover:opacity-100">
                              <button
                                onClick={() => moveModel(pid, mIdx, -1)}
                                disabled={mIdx === 0}
                                className="p-0.5 rounded text-slate-500 hover:text-sky-400 disabled:opacity-20 transition-colors"
                                title="جابجایی مدل به بالا"
                              >
                                <ArrowUp className="w-2 h-2" />
                              </button>
                              <button
                                onClick={() => moveModel(pid, mIdx, 1)}
                                disabled={mIdx === orderedModels.length - 1}
                                className="p-0.5 rounded text-slate-500 hover:text-sky-400 disabled:opacity-20 transition-colors"
                                title="جابجایی مدل به پایین"
                              >
                                <ArrowDown className="w-2 h-2" />
                              </button>
                            </div>

                            {/* Select Radio */}
                            <button
                              onClick={() => onChangeModel(pid, model.id)}
                              className={`w-2 h-2 rounded-full shrink-0 border transition-all ${isSelectedModel && isActive
                                ? 'bg-emerald-400 border-emerald-400'
                                : 'border-slate-500 hover:border-sky-400'
                                }`}
                              title="انتخاب مدل"
                            />

                            {/* Model Info */}
                            <button
                              onClick={() => onChangeModel(pid, model.id)}
                              className="flex-1 text-right min-w-0"
                            >
                              <div className={`text-[10.5px] font-medium truncate dir-ltr ${isSelectedModel && isActive ? 'text-emerald-300' : 'text-slate-300'
                                }`}>
                                {model.name}
                              </div>
                              <div className="flex items-center justify-between gap-1 mt-0.5">
                                <span className="text-[9px] text-slate-500 truncate">
                                  {model.contextWindow || '—'}
                                </span>
                                {model.isFree && (
                                  <span className="text-[8.5px] text-sky-400 bg-sky-950/60 px-1 rounded font-semibold shrink-0">
                                    رایگان
                                  </span>
                                )}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Provider Footer Badge */}
      <div className="p-2 border-t theme-border-divider theme-bg-inner flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0">
            <Cpu className="w-3.5 h-3.5 theme-text-accent" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 border theme-bg-inner" style={{ borderColor: 'var(--bg-inner)' }}></div>
          </div>
          <div className="min-w-0">
            <div className="text-[10.5px] font-semibold theme-text truncate">
              {providers[activeProviderId]?.nameFa}
            </div>
            <div className="text-[9.5px] theme-text-muted truncate dir-ltr">
              {providers[activeProviderId]?.models.find(
                (m) => m.id === providers[activeProviderId]?.selectedModel
              )?.name || '—'}
            </div>
          </div>
        </div>
        <span className="text-[9px] text-emerald-400 font-semibold px-1.5 py-0.5 rounded shrink-0" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
          فعال
        </span>
      </div>
    </aside>
  );
};
