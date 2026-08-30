import React, { useState, useRef, useEffect } from 'react';
import { Message, ToolCall } from '../types';
import { 
  Send, 
  Bot, 
  User, 
  Terminal, 
  FileCode, 
  Folder, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Play, 
  ShieldCheck, 
  Cpu
} from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onExecuteTool: (toolCall: ToolCall) => void;
  autoApproveTools: boolean;
  onToggleAutoApprove: () => void;
  isProcessing: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onSendMessage,
  onExecuteTool,
  autoApproveTools,
  onToggleAutoApprove,
  isProcessing
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const renderInlineMarkdown = (text: string) => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="px-1 py-0.5 rounded bg-slate-950 text-sky-300 font-mono dir-ltr">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
      return part;
    });
  };

  const renderMarkdown = (content: string) => {
    const sections = content.split(/```([\w+-]*)\n?([\s\S]*?)```/g);
    return sections.map((section, index) => {
      if (index % 3 === 2) {
        const language = sections[index - 1] || 'text';
        return (
          <div key={index} className="my-3 overflow-hidden rounded-lg border border-slate-700 bg-[#0b1220] dir-ltr text-left">
            <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] text-sky-400 font-mono">{language}</div>
            <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed font-mono text-slate-200"><code>{section}</code></pre>
          </div>
        );
      }
      if (index % 3 === 1) return null;
      return (
        <div key={index} className="whitespace-pre-wrap">
          {section.split('\n').map((line, lineIndex) => {
            if (line.startsWith('### ')) return <h3 key={lineIndex} className="mt-3 mb-1 font-bold text-sky-300">{renderInlineMarkdown(line.slice(4))}</h3>;
            if (line.startsWith('## ')) return <h2 key={lineIndex} className="mt-3 mb-1 text-sm font-bold text-sky-200">{renderInlineMarkdown(line.slice(3))}</h2>;
            if (line.startsWith('# ')) return <h1 key={lineIndex} className="mt-3 mb-1 text-base font-bold text-slate-100">{renderInlineMarkdown(line.slice(2))}</h1>;
            if (/^[-*] /.test(line)) return <div key={lineIndex} className="pr-3 before:content-['•'] before:ml-2 before:text-sky-400">{renderInlineMarkdown(line.slice(2))}</div>;
            return <React.Fragment key={lineIndex}>{renderInlineMarkdown(line)}{lineIndex < section.split('\n').length - 1 && <br />}</React.Fragment>;
          })}
        </div>
      );
    });
  };

  const renderToolCallCard = (toolCall: ToolCall) => {
    const isPending = toolCall.status === 'pending';
    const isRunning = toolCall.status === 'running';
    const isCompleted = toolCall.status === 'completed';
    const isFailed = toolCall.status === 'failed';

    return (
      <div
        key={toolCall.id}
        className="my-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex flex-col gap-2 font-mono dir-ltr text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {toolCall.tool === 'execute_terminal_command' && <Terminal className="w-3.5 h-3.5 text-sky-400" />}
            {toolCall.tool === 'write_file' && <FileCode className="w-3.5 h-3.5 text-sky-400" />}
            {toolCall.tool === 'read_file' && <FileCode className="w-3.5 h-3.5 text-sky-400" />}
            {toolCall.tool === 'list_directory' && <Folder className="w-3.5 h-3.5 text-sky-400" />}
            <span className="font-semibold text-slate-200">{toolCall.tool}</span>
          </div>

          <div className="flex items-center gap-2">
            {isPending && (
              <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/40 text-[10px] font-sans">
                منتظر تایید
              </span>
            )}
            {isRunning && (
              <span className="flex items-center gap-1 text-sky-400 text-[10px] font-sans">
                <Loader2 className="w-3 h-3 animate-spin" /> در حال اجرا
              </span>
            )}
            {isCompleted && (
              <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-sans">
                <CheckCircle2 className="w-3 h-3" /> انجام شد
              </span>
            )}
            {isFailed && (
              <span className="flex items-center gap-1 text-rose-400 text-[10px] font-sans">
                <XCircle className="w-3 h-3" /> ناموفق
              </span>
            )}
          </div>
        </div>

        {/* Tool Arguments */}
        <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-300 text-[11px] overflow-x-auto">
          {toolCall.tool === 'execute_terminal_command' && (
            <div>
              <span className="text-slate-500">$ </span>
              <span className="text-sky-300">{toolCall.args.command}</span>
            </div>
          )}
          {toolCall.tool === 'write_file' && (
            <div>
              <div className="text-sky-400 mb-1">مسیر فایل: {toolCall.args.path}</div>
              <pre className="text-slate-300 max-h-28 overflow-y-auto whitespace-pre-wrap">
                {toolCall.args.content?.substring(0, 300)}...
              </pre>
            </div>
          )}
          {toolCall.tool === 'read_file' && <div>مسیر: {toolCall.args.path}</div>}
          {toolCall.tool === 'list_directory' && <div>مسیر: {toolCall.args.path || 'Root'}</div>}
        </div>

        {/* Action Button for Pending Tools */}
        {isPending && !autoApproveTools && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => onExecuteTool(toolCall)}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-sans text-xs font-semibold shadow transition-all"
            >
              <Play className="w-3 h-3" />
              <span>تایید و اجرا</span>
            </button>
          </div>
        )}

        {/* Result view */}
        {isCompleted && toolCall.result && (
          <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-300 text-[11px] max-h-36 overflow-y-auto">
            {typeof toolCall.result === 'string'
              ? toolCall.result
              : JSON.stringify(toolCall.result, null, 2)}
          </div>
        )}
        {isFailed && toolCall.error && (
          <div className="bg-rose-950/40 p-2 rounded border border-rose-900/40 text-rose-300 text-[11px]">
            {toolCall.error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#070a12] relative">
      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-sky-500/30 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-200 mb-1">ایجنت هوشمند برنامه‌نویسی هویار</h2>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                آماده دریافت دستورات کدنویسی، ساخت فایل و اجرای فرامین ترمینال روی کامپیوتر شما.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-4xl ${isUser ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                    isUser
                      ? 'bg-slate-800 border-slate-700 text-slate-200'
                      : 'bg-sky-950 border-sky-500/40 text-sky-400'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Body */}
                <div
                  className={`flex-1 rounded-xl p-3.5 text-xs leading-relaxed border shadow-sm ${
                    isUser
                      ? 'bg-slate-900 border-slate-800 text-slate-200 rounded-tr-none'
                      : 'glass-panel text-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-300 text-[11px]">
                      {isUser ? 'کاربر' : 'هویار (Hooyar AI)'}
                    </span>
                    <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                  </div>

                  {/* Message content */}
                  <div className="font-sans text-slate-200 space-y-2 dir-rtl">
                    {renderMarkdown(msg.content)}
                  </div>

                  {/* Render Tool Calls if present */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800">
                      <div className="text-[11px] font-semibold text-sky-400 mb-1 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" /> فراخوانی ابزار سیستم:
                      </div>
                      {msg.toolCalls.map(renderToolCallCard)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg glass-card text-xs text-sky-300 max-w-xs">
            <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
            <span>در حال استدلال و اجرای کد...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Prompt Bar */}
      <div className="p-3 border-t border-slate-800/90 glass-panel">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {/* Top Bar inside prompt area */}
          <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
            <button
              type="button"
              onClick={onToggleAutoApprove}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all ${
                autoApproveTools
                  ? 'bg-sky-950 border-sky-500/40 text-sky-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>
                تایید خودکار ابزارها: {autoApproveTools ? 'فعال' : 'غیرفعال'}
              </span>
            </button>
            <span className="text-[10px] text-slate-500">ارسال: Enter | سطر جدید: Shift+Enter</span>
          </div>

          {/* Text Area & Submit */}
          <div className="relative flex items-end bg-slate-900 border border-slate-800 focus-within:border-sky-500/60 rounded-lg p-2 transition-all">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="دستور برنامه‌نویسی خود را وارد کنید..."
              rows={2}
              className="w-full bg-transparent text-slate-200 text-xs resize-none focus:outline-none pr-2 pl-10 placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="absolute left-2 bottom-2 p-1.5 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
