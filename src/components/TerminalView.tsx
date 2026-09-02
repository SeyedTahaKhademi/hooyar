import React, { useRef, useEffect } from 'react';
import { Terminal, X, Trash2 } from 'lucide-react';

interface TerminalLine {
  type: 'command' | 'stdout' | 'stderr' | 'info';
  text: string;
  timestamp: string;
}

interface TerminalViewProps {
  lines: TerminalLine[];
  isVisible: boolean;
  onClose: () => void;
  onClear: () => void;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ lines, isVisible, onClose, onClear }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="h-48 border-t theme-border-divider theme-bg-inner flex flex-col font-mono text-xs">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b theme-border-divider theme-bg-card-solid shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 theme-text-accent" />
          <span className="theme-text font-semibold font-sans text-xs">ترمینال خروجی ایجنت</span>
          <span className="text-[10px] theme-text-muted font-sans">PowerShell</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onClear}
            className="p-1 theme-hover-bg rounded theme-text-muted hover:text-rose-400 transition-colors"
            title="پاک کردن"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 theme-hover-bg rounded theme-text-muted theme-hover-text transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Lines */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-0.5 dir-ltr text-left">
        {lines.length === 0 ? (
          <div className="theme-text-muted font-sans text-[11px]">
            # ترمینال آماده است. خروجی فرامین اجرا شده در این بخش نمایش داده می‌شود.
          </div>
        ) : (
          lines.map((line, idx) => (
            <div key={idx} className="flex gap-2 leading-relaxed">
              <span className="theme-text-muted text-[10px] shrink-0 mt-0.5">{line.timestamp}</span>
              <span
                className={`${
                  line.type === 'command'
                    ? 'font-semibold'
                    : line.type === 'stderr'
                    ? 'text-rose-400'
                    : line.type === 'info'
                    ? 'theme-text-accent'
                    : 'theme-text-secondary'
                } whitespace-pre-wrap break-all`}
                style={line.type === 'command' ? { color: 'var(--text-accent)' } : {}}
              >
                {line.type === 'command' ? `PS> ${line.text}` : line.text}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};
