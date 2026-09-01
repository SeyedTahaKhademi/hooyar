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
  Terminal, 
  FolderPlus, 
  Bug, 
  ShieldCheck, 
  Cpu,
  Layers,
  MessageSquare,
  Plus,
  Download
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
  onExportChat: () => void;
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
  onExportChat
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'prompts' | 'chats'>('files');

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
    <aside className="w-60 border-l border-slate-800/90 glass-panel flex flex-col h-[calc(100vh-3.5rem)] select-none">
      {/* Sidebar Header Tabs */}
      <div className="flex border-b border-slate-800 p-1.5 gap-1 bg-slate-950">
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-1 rounded text-xs font-semibold transition-all ${
            activeTab === 'files'
              ? 'bg-slate-850 text-sky-400 border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          فایل‌های پروژه
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex-1 py-1 rounded text-xs font-semibold transition-all ${
            activeTab === 'prompts'
              ? 'bg-slate-850 text-sky-400 border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          دستورات آماده
        </button>
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-1 rounded text-xs font-semibold transition-all ${
            activeTab === 'chats'
              ? 'bg-slate-850 text-sky-400 border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          گفتگوها
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'files' ? (
        <div className="flex-1 overflow-y-auto p-2.5 flex flex-col">
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
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 px-1">دستورات ایجنت</span>
          {quickPrompts.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => onQuickPrompt(item.prompt)}
                className="w-full text-right p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-sky-300">{item.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.prompt}</p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          <div className="flex gap-1.5">
            <button
              onClick={onNewChat}
              className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> گفتگوی جدید
            </button>
            <button
              onClick={onExportChat}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-slate-400 hover:text-sky-400 transition-all"
              title="خروجی گرفتن گفتگوی فعال (Markdown)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="pt-1 space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full text-right p-2 rounded-lg border transition-all ${
                  activeChatId === chat.id
                    ? 'bg-sky-950/50 border-sky-500/40 text-sky-200'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-medium truncate">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                  <span className="truncate">{chat.title}</span>
                </div>
                <div className="text-[10px] mt-1 text-slate-500">{chat.messages.length} پیام</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Provider Footer Badge */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-300 text-[11px] font-medium">{providers[activeProviderId]?.nameFa}</span>
        </div>
        <span className="text-[10px] text-sky-400 font-semibold px-2 py-0.5 rounded bg-sky-950 border border-sky-800/40">
          فعال
        </span>
      </div>
    </aside>
  );
};
