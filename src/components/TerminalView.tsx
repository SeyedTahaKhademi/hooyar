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
    <div className="h-48 border-t border-slate-800 bg-[#060810] flex flex-col font-mono text-xs">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-950 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-200 font-semibold font-sans text-xs">ترمینال خروجی ایجنت</span>
          <span className="text-[10px] text-slate-500 font-sans">PowerShell</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onClear}
            className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400 transition-colors"
            title="پاک کردن"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Lines */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-0.5 dir-ltr text-left">
        {lines.length === 0 ? (
          <div className="text-slate-600 font-sans text-[11px]">
            # ترمینال آماده است. خروجی فرامین اجرا شده در این بخش نمایش داده می‌شود.
          </div>
        ) : (
          lines.map((line, idx) => (
            <div key={idx} className="flex gap-2 leading-relaxed">
              <span className="text-slate-600 text-[10px] shrink-0 mt-0.5">{line.timestamp}</span>
              <span
                className={`${
                  line.type === 'command'
                    ? 'text-sky-300 font-semibold'
                    : line.type === 'stderr'
                    ? 'text-rose-400'
                    : line.type === 'info'
                    ? 'text-sky-400'
                    : 'text-slate-300'
                } whitespace-pre-wrap break-all`}
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
