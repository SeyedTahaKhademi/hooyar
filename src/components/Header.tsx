import React, { useState, useEffect, useRef } from 'react';
import {
  FolderOpen,
  Bot,
  AlertCircle,
  ChevronDown,
  Terminal,
  Cpu,
  Minus,
  Square,
  X,
  FileText,
  FilePlus,
  Search,
  Copy,
  Scissors,
  ClipboardPaste,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Eye,
  BookOpen,
  MessageSquarePlus,
  Download,
  Upload,
  FolderPlus,
  Palette,
  Sliders
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
  onExportChat?: () => void;
  theme?: 'dark' | 'light' | 'glass';
  onCycleTheme?: () => void;
}

interface SubMenuItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface MenuItemDef {
  label: string;
  subItems: SubMenuItem[];
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
  onNewChat,
  onExportChat,
  onCycleTheme
}) => {
  const native = (window as any).hooyarNative;
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleMinimize = () => native?.windowMinimize();
  const handleMaximize = () => native?.windowMaximize();
  const handleClose = () => native?.windowClose();

  const handleSaveTextFile = async () => {
    if (!native?.saveTextFile) {
      alert('این قابلیت در نسخه دسکتاپ هویار فعال است.');
      return;
    }
    const chatText = `گفتگوی هویار - ${new Date().toLocaleString('fa-IR')}\n\n(در نسخه کامل، محتوای گفتگو اینجا ذخیره می‌شود)`;
    await native.saveTextFile({
      defaultName: `hooyar-chat-${Date.now()}.md`,
      content: chatText
    });
  };

  const menuDefinitions: MenuItemDef[] = [
    {
      label: 'فایل',
      subItems: [
        { label: 'گفتگوی جدید', icon: MessageSquarePlus, shortcut: 'Ctrl+N', action: onNewChat },
        { label: 'خروجی گفتگو را ذخیره...', icon: Download, shortcut: 'Ctrl+S', action: handleSaveTextFile },
        { divider: true, label: '', action: () => { } },
        { label: 'باز کردن پوشه کاری...', icon: FolderOpen, shortcut: 'Ctrl+O', action: onSelectWorkspace },
        { label: 'ایجاد پوشه جدید', icon: FolderPlus, action: () => alert('از بخش فایل‌های پروژه در سایدبار، روی پوشه مورد نظر راست کلیک کنید.') },
        { divider: true, label: '', action: () => { } },
        { label: 'وارد کردن فایل...', icon: Upload, action: () => alert('فایل را به پنجره هویار بکشید یا از سایدبار باز کنید.') },
        { label: 'خروجی گرفتن از گفتگو', icon: FileText, action: onExportChat || handleSaveTextFile },
        { divider: true, label: '', action: () => { } },
        { label: 'خروج', icon: X, shortcut: 'Alt+F4', danger: true, action: handleClose }
      ]
    },
    {
      label: 'ویرایش',
      subItems: [
        { label: 'بازگردانی', icon: Undo2, shortcut: 'Ctrl+Z', action: () => document.execCommand('undo') },
        { label: 'انجام دوباره', icon: Redo2, shortcut: 'Ctrl+Y', action: () => document.execCommand('redo') },
        { divider: true, label: '', action: () => { } },
        { label: 'برش', icon: Scissors, shortcut: 'Ctrl+X', action: () => document.execCommand('cut') },
        { label: 'کپی', icon: Copy, shortcut: 'Ctrl+C', action: () => document.execCommand('copy') },
        { label: 'چسباندن', icon: ClipboardPaste, shortcut: 'Ctrl+V', action: () => document.execCommand('paste') },
        { divider: true, label: '', action: () => { } },
        { label: 'جستجو در پروژه', icon: Search, shortcut: 'Ctrl+Shift+F', action: () => alert('از نوار جستجو در بالای سایدبار استفاده کنید.') },
        {
          label: 'یافتن در صفحه', icon: Search, shortcut: 'Ctrl+F', action: () => {
            const w = window as any;
            if (w.find) w.find();
          }
        }
      ]
    },
    {
      label: 'نما',
      subItems: [
        {
          label: 'بزرگ‌نمایی', icon: ZoomIn, shortcut: 'Ctrl++', action: () => {
            document.body.style.zoom = String(parseFloat(getComputedStyle(document.body).zoom || '1') + 0.1);
          }
        },
        {
          label: 'کوچک‌نمایی', icon: ZoomOut, shortcut: 'Ctrl+-', action: () => {
            document.body.style.zoom = String(Math.max(0.5, parseFloat(getComputedStyle(document.body).zoom || '1') - 0.1));
          }
        },
        { label: 'بازنشانی زوم', icon: Maximize2, shortcut: 'Ctrl+0', action: () => { document.body.style.zoom = '1'; } },
        { divider: true, label: '', action: () => { } },
        { label: 'تغییر تم', icon: Palette, action: () => onCycleTheme ? onCycleTheme() : onOpenSettings() },
        {
          label: 'تمام صفحه', icon: Minimize2, shortcut: 'F11', action: () => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen?.();
            } else {
              document.exitFullscreen?.();
            }
          }
        },
        { divider: true, label: '', action: () => { } },
        { label: isTerminalOpen ? 'مخفی کردن ترمینال' : 'نمایش ترمینال', icon: Terminal, shortcut: 'Ctrl+`', action: onToggleTerminal },
        { label: 'بزرگ‌نمایی پنجره', icon: Maximize2, action: handleMaximize },
        { label: 'کوچک کردن پنجره', icon: Minimize2, action: handleMinimize }
      ]
    },
    {
      label: 'ترمینال',
      subItems: [
        { label: isTerminalOpen ? 'مخفی کردن ترمینال' : 'نمایش ترمینال', icon: Terminal, shortcut: 'Ctrl+`', action: onToggleTerminal },
        { divider: true, label: '', action: () => { } },
        {
          label: 'اجرای دستور PowerShell', icon: Terminal, action: () => {
            onToggleTerminal();
            setTimeout(() => alert('دستور مورد نظر را در کادر ترمینال پایین صفحه وارد کنید.'), 300);
          }
        },
        { label: 'پاک کردن خروجی ترمینال', icon: Eye, action: () => alert('از دکمه پاککن (سطل آشغال) بالای ترمینال استفاده کنید.') }
      ]
    },
    {
      label: 'تنظیمات',
      subItems: [
        { label: 'تنظیمات سرویس‌ها و کلیدها', icon: Sliders, shortcut: 'Ctrl+,', action: onOpenSettings },
        { label: 'تنظیمات ظاهری', icon: Palette, action: onOpenSettings }
      ]
    },
    {
      label: 'کمک',
      subItems: [
        { label: 'راهنمای دریافت کلید API', icon: BookOpen, action: onOpenSettings },
        {
          label: 'درباره هویار', icon: Bot, action: () => {
            alert('هویار | Hooyar AI Coding Agent\nنسخه ۱.۰\nیک دستیار کدنویسی هوش مصنوعی فارسی زبان\nپشتیبانی از ۲۰+ ارائه‌دهنده مدل');
          }
        },
        { divider: true, label: '', action: () => { } },
        { label: 'گزارش باگ یا پیشنهاد', icon: AlertCircle, action: () => alert('برای گزارش مشکلات یا پیشنهادات، به مخزن گیت‌هاب پروژه مراجعه کنید.') }
      ]
    }
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'n') { e.preventDefault(); onNewChat(); }
      if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); handleSaveTextFile(); }
      if (e.ctrlKey && e.key.toLowerCase() === 'o') { e.preventDefault(); onSelectWorkspace(); }
      if (e.ctrlKey && e.key === ',') { e.preventDefault(); onOpenSettings(); }
      if (e.ctrlKey && e.key === '`') { e.preventDefault(); onToggleTerminal(); }
      if (e.ctrlKey && (e.key === '=' || e.key === '+')) { e.preventDefault(); document.body.style.zoom = String(parseFloat(getComputedStyle(document.body).zoom || '1') + 0.1); }
      if (e.ctrlKey && e.key === '-') { e.preventDefault(); document.body.style.zoom = String(Math.max(0.5, parseFloat(getComputedStyle(document.body).zoom || '1') - 0.1)); }
      if (e.ctrlKey && e.key === '0') { e.preventDefault(); document.body.style.zoom = '1'; }
      if (e.key === 'F11') { e.preventDefault(); if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.(); }
      if (e.key === 'Escape') setActiveMenu(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onNewChat, onSelectWorkspace, onOpenSettings, onToggleTerminal]);

  const renderSubMenu = (menu: MenuItemDef, menuIdx: number) => {
    if (activeMenu !== menu.label) return null;
    return (
      <div
        className="absolute top-full right-0 mt-0.5 w-64 py-1 rounded-lg shadow-2xl theme-border-strong theme-bg-card-solid backdrop-blur-xl z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
        style={{ minWidth: '240px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {menu.subItems.map((item, idx) => (
          item.divider ? (
            <div key={`div-${idx}`} className="my-1 border-t theme-border-divider" />
          ) : (
            <button
              key={idx}
              onClick={() => {
                try { item.action(); } finally { setActiveMenu(null); }
              }}
              className={`w-full flex items-center justify-between gap-3 px-3 py-1.5 text-right hover:bg-sky-600/90 hover:text-white transition-colors group ${item.danger ? 'hover:bg-rose-600/90 text-rose-300' : 'theme-text'
                }`}
            >
              <div className="flex items-center gap-2">
                {item.icon && <item.icon className="w-3.5 h-3.5 theme-text-muted group-hover:text-white/90 shrink-0" />}
                <span className="text-[11.5px] font-medium">{item.label}</span>
              </div>
              {item.shortcut && (
                <span className="text-[10px] theme-text-muted group-hover:text-white/70 font-mono dir-ltr">
                  {item.shortcut}
                </span>
              )}
            </button>
          )
        ))}
      </div>
    );
  };

  return (
    <header className="h-10 border-b theme-border-divider theme-bg-elevated flex items-center justify-between select-none z-50 relative custom-titlebar">
      {/* Draggable Area & Menu */}
      <div className="flex items-center h-full flex-1 min-w-0 pr-2" ref={menuRef}>
        {/* App Logo */}
        <div
          className="flex items-center gap-2 px-3 h-full theme-hover-bg-soft transition-colors cursor-default no-drag"
          onClick={() => setActiveMenu(null)}
        >
          <Bot className="w-4 h-4 theme-text-accent" />
          <span className="text-xs font-bold theme-text-secondary">هویار</span>
        </div>

        {/* VS Code Style Dropdown Menus */}
        <div className="flex items-center h-full no-drag">
          {menuDefinitions.map((menu, idx) => (
            <div key={idx} className="relative h-full">
              <button
                onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
                onMouseEnter={() => activeMenu !== null && setActiveMenu(menu.label)}
                className={`px-3 h-full text-[11px] transition-colors focus:outline-none ${activeMenu === menu.label
                  ? 'bg-slate-800 text-white theme-bg-hover theme-text'
                  : 'theme-text-muted theme-hover-bg-soft theme-hover-text'
                  }`}
              >
                {menu.label}
              </button>
              {renderSubMenu(menu, idx)}
            </div>
          ))}
        </div>

        {/* Workspace Indicator (Middle-ish) */}
        <div className="flex-1 flex justify-center items-center px-4 min-w-0 drag-region h-full" onClick={() => setActiveMenu(null)}>
          <div
            onClick={(e) => { e.stopPropagation(); onSelectWorkspace(); }}
            className="flex items-center gap-2 px-4 py-0.5 rounded theme-border theme-bg-card-solid text-[11px] theme-text-muted theme-hover-bg theme-hover-text transition-all cursor-pointer max-w-md truncate no-drag"
          >
            <FolderOpen className="w-3 h-3 theme-text-accent shrink-0" />
            <span className="truncate dir-ltr">
              {workspacePath ? `Hooyar - ${workspacePath.split(/[\\/]/).pop()}` : 'Hooyar AI Agent'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Section: Status & Window Controls */}
      <div className="flex items-center h-full">
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          title="گفتگوی جدید (Ctrl+N)"
          className="flex items-center gap-1.5 px-2.5 h-full border-l theme-border-divider text-[11px] theme-text-muted theme-hover-bg-soft theme-hover-accent transition-colors no-drag"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">گفتگوی جدید</span>
        </button>

        {/* Agent Status Indicator */}
        <div className="flex items-center gap-3 px-3 h-full border-l theme-border-divider border-r theme-border-divider">
          {agentStatus === 'thinking' && (
            <Cpu className="w-3.5 h-3.5 theme-text-accent animate-spin" />
          )}
          {agentStatus === 'executing' && (
            <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--text-accent)', borderTopColor: 'transparent' }}></div>
          )}
          {agentStatus === 'error' && (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          )}
          <div className={`w-2 h-2 rounded-full ${agentStatus === 'idle' ? 'bg-emerald-500' : 'animate-pulse'}`} style={{ backgroundColor: agentStatus === 'idle' ? '#10b981' : 'var(--text-accent)' }}></div>
        </div>

        {/* Window Control Buttons */}
        <div className="flex items-center h-full no-drag">
          <button
            onClick={handleMinimize}
            className="w-12 h-full flex items-center justify-center theme-text-muted theme-hover-bg transition-colors focus:outline-none"
            title="کوچک کردن"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-12 h-full flex items-center justify-center theme-text-muted theme-hover-bg transition-colors focus:outline-none"
            title="بزرگ/کوچک کردن"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="w-12 h-full flex items-center justify-center theme-text-muted hover:bg-rose-600 hover:text-white transition-colors focus:outline-none"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-titlebar {
          -webkit-app-region: drag;
        }
        .no-drag {
          -webkit-app-region: no-drag;
        }
        .drag-region {
          -webkit-app-region: drag;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-from-top-1 {
          from { transform: translateY(-4px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-in {
          animation: fade-in 120ms ease-out, slide-in-from-top-1 120ms ease-out;
        }
      `}} />
    </header>
  );
};
