import React from 'react';
import { FolderOpen, Settings, Bot, AlertCircle, ChevronDown, Terminal, Cpu, Plus } from 'lucide-react';
import { ProviderConfig, ProviderId } from '../types';

interface HeaderProps {
  workspacePath: string | null;
  onSelectWorkspace: () => void;
  providers: Record<ProviderId, ProviderConfig>;
  activeProviderId: ProviderId;
  activeModel: string;
  onChangeProvider: (id: ProviderId) => void;
  onChangeModel: (model: string) => void;
  onOpenSettings: () => void;
  onToggleTerminal: () => void;
  isTerminalOpen: boolean;
  agentStatus: 'idle' | 'thinking' | 'executing' | 'error';
  onNewChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  workspacePath,
  onSelectWorkspace,
  providers,
  activeProviderId,
  activeModel,
  onChangeProvider,
  onChangeModel,
  onOpenSettings,
  onToggleTerminal,
  isTerminalOpen,
  agentStatus,
  onNewChat
}) => {
  const currentProvider = providers[activeProviderId];

  return (
    <header className="h-14 border-b border-slate-800/90 glass-panel px-4 flex items-center justify-between select-none z-20">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-500/40 flex items-center justify-center shadow-sm">
          <Bot className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-100 tracking-tight">هویار</h1>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-500/30">
              Hooyar AI
            </span>
          </div>
        </div>
      </div>

      {/* Center Controls: Workspace Directory & AI Provider selector */}
      <div className="flex items-center gap-2">
        {/* Workspace Selector */}
        <button
          onClick={onSelectWorkspace}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-medium transition-all max-w-xs truncate"
          title={workspacePath || 'انتخاب پوشه پروژه'}
        >
          <FolderOpen className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="truncate dir-ltr text-right">
            {workspacePath ? workspacePath.split(/[\\/]/).pop() || workspacePath : 'انتخاب پوشه پروژه...'}
          </span>
        </button>

        {/* AI Provider & Model Selector Dropdown */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1">
          <div className="relative flex items-center">
            <select
              value={activeProviderId}
              onChange={(e) => onChangeProvider(e.target.value as ProviderId)}
              className="bg-transparent text-slate-300 text-xs font-semibold px-2 py-1 pr-5 rounded appearance-none cursor-pointer focus:outline-none"
            >
              {Object.values(providers).map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.nameFa}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute left-1 pointer-events-none" />
          </div>

          <div className="w-[1px] h-3.5 bg-slate-800 mx-0.5"></div>

          {/* Model Dropdown */}
          <div className="relative flex items-center">
            <select
              value={activeModel}
              onChange={(e) => onChangeModel(e.target.value)}
              className="bg-transparent text-sky-400 text-xs font-medium px-2 py-1 pr-5 rounded appearance-none cursor-pointer focus:outline-none dir-ltr"
            >
              {currentProvider?.models.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200 dir-ltr">
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-sky-500 absolute left-1 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Right Controls: Agent Status & Settings */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-sky-300 text-xs font-semibold transition-all"
          title="گفتگوی جدید"
        >
          <Plus className="w-4 h-4" />
          <span>گفتگوی جدید</span>
        </button>
        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-xs font-medium">
          {agentStatus === 'idle' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-400 text-[11px]">آماده</span>
            </>
          )}
          {agentStatus === 'thinking' && (
            <>
              <Cpu className="w-3.5 h-3.5 text-sky-400 animate-spin" />
              <span className="text-sky-300 text-[11px]">در حال استدلال...</span>
            </>
          )}
          {agentStatus === 'executing' && (
            <>
              <div className="w-2.5 h-2.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sky-300 text-[11px]">در حال اجرای ابزار...</span>
            </>
          )}
          {agentStatus === 'error' && (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-400 text-[11px]">خطای اتصال</span>
            </>
          )}
        </div>

        {/* Terminal Toggle Button */}
        <button
          onClick={onToggleTerminal}
          className={`p-1.5 rounded-lg border transition-all ${
            isTerminalOpen
              ? 'bg-sky-950 border-sky-500/50 text-sky-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="ترمینال سیستم"
        >
          <Terminal className="w-4 h-4" />
        </button>

        {/* Settings Launcher Button */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Settings className="w-4 h-4" />
          <span>تنظیمات API</span>
        </button>
      </div>
    </header>
  );
};
