import React, { useState } from 'react';
import { 
  FolderOpen, 
  Settings, 
  Bot, 
  AlertCircle, 
  ChevronDown, 
  Terminal, 
  Cpu, 
  Plus,
  Minus,
  Square,
  X,
  Menu as MenuIcon
} from 'lucide-react';
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
  const native = (window as any).hooyarNative;

  const handleMinimize = () => native?.windowMinimize();
  const handleMaximize = () => native?.windowMaximize();
  const handleClose = () => native?.windowClose();

  const menuItems = [
    { label: 'فایل', action: () => {} },
    { label: 'ویرایش', action: () => {} },
    { label: 'نما', action: () => {} },
    { label: 'ترمینال', action: onToggleTerminal },
    { label: 'تنظیمات', action: onOpenSettings },
    { label: 'کمک', action: () => {} },
  ];

  return (
    <header className="h-10 border-b border-slate-800/90 bg-[#0d1117] flex items-center justify-between select-none z-50 relative custom-titlebar">
      {/* Draggable Area & Menu */}
      <div className="flex items-center h-full flex-1 min-w-0 pr-2">
        {/* App Logo */}
        <div className="flex items-center gap-2 px-3 h-full hover:bg-slate-800/50 transition-colors cursor-default">
          <Bot className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-slate-300">هویار</span>
        </div>

        {/* VS Code Style Menus */}
        <div className="flex items-center h-full">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={item.action}
              className="px-3 h-full text-[11px] text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors focus:outline-none"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Workspace Indicator (Middle-ish) */}
        <div className="flex-1 flex justify-center items-center px-4 min-w-0 drag-region h-full">
          <div 
            onClick={onSelectWorkspace}
            className="flex items-center gap-2 px-4 py-0.5 rounded border border-slate-800 bg-slate-900/50 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer max-w-md truncate no-drag"
          >
            <FolderOpen className="w-3 h-3 text-sky-500 shrink-0" />
            <span className="truncate dir-ltr">
              {workspacePath ? `Hooyar - ${workspacePath.split(/[\\/]/).pop()}` : 'Hooyar AI Agent'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Section: Status & Window Controls */}
      <div className="flex items-center h-full">
        {/* Agent Status Indicator */}
        <div className="flex items-center gap-3 px-3 h-full border-r border-slate-800/50">
           {agentStatus === 'thinking' && (
             <Cpu className="w-3.5 h-3.5 text-sky-400 animate-spin" />
           )}
           {agentStatus === 'executing' && (
             <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
           )}
           {agentStatus === 'error' && (
             <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
           )}
           <div className={`w-2 h-2 rounded-full ${agentStatus === 'idle' ? 'bg-emerald-500' : 'bg-sky-500 animate-pulse'}`}></div>
        </div>

        {/* Window Control Buttons */}
        <div className="flex items-center h-full no-drag">
          <button 
            onClick={handleMinimize}
            className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={handleMaximize}
            className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <Square className="w-3 h-3" />
          </button>
          <button 
            onClick={handleClose}
            className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-rose-600 hover:text-white transition-colors focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-titlebar {
          -webkit-app-region: drag;
        }
        .no-drag {
          -webkit-app-region: no-drag;
        }
        .drag-region {
          -webkit-app-region: drag;
        }
      `}} />
    </header>
  );
};
