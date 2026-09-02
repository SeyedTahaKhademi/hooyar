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
  Cpu,
  Copy,
  Check,
  FileJson,
  FileText,
  Hash,
  Globe
} from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onExecuteTool: (toolCall: ToolCall, continueLoop?: boolean) => void;
  autoApproveTools: boolean;
  onToggleAutoApprove: () => void;
  isProcessing: boolean;
  fontSize?: number;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onSendMessage,
  onExecuteTool,
  autoApproveTools,
  onToggleAutoApprove,
  isProcessing,
  fontSize = 13
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getLanguageIcon = (lang: string) => {
    lang = lang.toLowerCase();
    if (['javascript', 'js', 'typescript', 'ts', 'tsx', 'jsx'].includes(lang)) return <FileCode className="w-3.5 h-3.5 text-yellow-400" />;
    if (['json'].includes(lang)) return <FileJson className="w-3.5 h-3.5 text-orange-400" />;
    if (['css', 'scss', 'less', 'tailwind'].includes(lang)) return <Hash className="w-3.5 h-3.5 text-sky-400" />;
    if (['html', 'xml'].includes(lang)) return <Globe className="w-3.5 h-3.5 text-orange-500" />;
    if (['python', 'py'].includes(lang)) return <FileCode className="w-3.5 h-3.5 text-blue-500" />;
    return <FileText className="w-3.5 h-3.5 text-slate-400" />;
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

  const renderMarkdown = (content: string, messageId: string) => {
    const sections = content.split(/```([\w+-]*)\n?([\s\S]*?)```/g);
    return sections.map((section, index) => {
      if (index % 3 === 2) {
        const language = sections[index - 1] || 'text';
        const codeId = `${messageId}-code-${index}`;
        return (
          <div key={index} className="my-3 overflow-hidden rounded-lg theme-border theme-bg-code dir-ltr text-left group/code max-w-full">
            <div className="px-3 py-1.5 border-b theme-border-divider flex items-center justify-between theme-bg-card-solid/70">
              <div className="flex items-center gap-2">
                {getLanguageIcon(language)}
                <span className="text-[10px] theme-text-muted font-mono uppercase">{language}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(section, codeId)}
                className="p-1 theme-hover-bg rounded transition-colors theme-text-muted theme-hover-accent"
                title="کپی کد"
              >
                {copiedId === codeId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-[12px] leading-relaxed font-mono theme-text scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <code className="block w-fit min-w-full">{section}</code>
            </pre>
          </div>
        );
      }
      if (index % 3 === 1) return null;
      return (
        <div key={index} className="whitespace-pre-wrap break-words max-w-full overflow-hidden" style={{ fontSize: `${fontSize}px` }}>
          {section.split('\n').map((line, lineIndex) => {
            if (line.startsWith('### ')) return <h3 key={lineIndex} className="mt-4 mb-2 font-bold theme-text-accent text-lg border-b theme-border-divider pb-1">{renderInlineMarkdown(line.slice(4))}</h3>;
            if (line.startsWith('## ')) return <h2 key={lineIndex} className="mt-4 mb-2 text-xl font-bold theme-text-accent border-b theme-border-divider pb-1">{renderInlineMarkdown(line.slice(3))}</h2>;
            if (line.startsWith('# ')) return <h1 key={lineIndex} className="mt-4 mb-2 text-2xl font-bold theme-text border-b theme-border-divider pb-1">{renderInlineMarkdown(line.slice(2))}</h1>;
            if (/^[-*] /.test(line)) return <div key={lineIndex} className="pr-4 py-0.5 relative"><span className="absolute right-0 top-2.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-accent)' }} />{renderInlineMarkdown(line.slice(2))}</div>;
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
        className="my-2 p-2.5 rounded-lg theme-bg-card-solid theme-border text-xs flex flex-col gap-2 font-mono dir-ltr text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {toolCall.tool === 'execute_terminal_command' && <Terminal className="w-3.5 h-3.5 theme-text-accent" />}
            {toolCall.tool === 'write_file' && <FileCode className="w-3.5 h-3.5 theme-text-accent" />}
            {toolCall.tool === 'read_file' && <FileCode className="w-3.5 h-3.5 theme-text-accent" />}
            {toolCall.tool === 'list_directory' && <Folder className="w-3.5 h-3.5 theme-text-accent" />}
            <span className="font-semibold theme-text">{toolCall.tool}</span>
          </div>

          <div className="flex items-center gap-2">
            {isPending && (
              <span className="px-2 py-0.5 rounded text-amber-400 border text-[10px] font-sans" style={{ background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.35)' }}>
                منتظر تایید
              </span>
            )}
            {isRunning && (
              <span className="flex items-center gap-1 theme-text-accent text-[10px] font-sans">
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
        <div className="theme-bg-inner p-2 rounded theme-border theme-text-secondary text-[11px] overflow-x-auto">
          {toolCall.tool === 'execute_terminal_command' && (
            <div>
              <span className="theme-text-muted">$ </span>
              <span className="theme-text-accent">{toolCall.args.command}</span>
            </div>
          )}
          {toolCall.tool === 'write_file' && (
            <div>
              <div className="theme-text-accent mb-1">مسیر فایل: {toolCall.args.path}</div>
              <pre className="theme-text-secondary max-h-28 overflow-y-auto whitespace-pre-wrap">
                {toolCall.args.content?.substring(0, 300)}...
              </pre>
            </div>
          )}
          {toolCall.tool === 'read_file' && <div>مسیر: {toolCall.args.path}</div>}
          {toolCall.tool === 'list_directory' && <div>مسیر: {toolCall.args.path || 'Root'}</div>}
        </div>

        {/* Action Button for Pending Tools */}
        {isPending && !autoApproveTools && (
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => onExecuteTool(toolCall, false)}
              className="px-2.5 py-1 rounded theme-bg-hover theme-hover-bg-soft theme-text-secondary font-sans text-[11px] font-medium transition-all theme-border font-medium"
              title="فقط این ابزار را اجرا کن، ادامه اتوماتیک نداشته باشه"
            >
              فقط اجرا
            </button>
            <button
              onClick={() => onExecuteTool(toolCall, true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-white font-sans text-xs font-semibold shadow transition-all"
              style={{ backgroundColor: 'var(--text-accent)' }}
              title="اجرا کن و نتیجه را برای ادامه کار به هوش مصنوعی بده"
            >
              <Play className="w-3 h-3" />
              <span>اجرا و ادامه</span>
            </button>
          </div>
        )}

        {/* Result view */}
        {isCompleted && toolCall.result && (
          <div className="theme-bg-inner p-2 rounded theme-border theme-text-secondary text-[11px] max-h-36 overflow-y-auto">
            {typeof toolCall.result === 'string'
              ? toolCall.result
              : JSON.stringify(toolCall.result, null, 2)}
          </div>
        )}
        {isFailed && toolCall.error && (
          <div className="p-2 rounded text-rose-300 text-[11px]" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)' }}>
            {toolCall.error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-2.5rem)] theme-bg-surface relative overflow-hidden">
      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.filter((m) => m.sender !== 'system').length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 theme-text-secondary gap-3">
            <div className="w-12 h-12 rounded-xl theme-bg-card-solid theme-border flex items-center justify-center" style={{ borderColor: 'color-mix(in srgb, var(--text-accent) 30%, transparent)' }}>
              <Cpu className="w-6 h-6 theme-text-accent" />
            </div>
            <div>
              <h2 className="text-base font-bold theme-text mb-1">ایجنت هوشمند برنامه‌نویسی هویار</h2>
              <p className="text-xs theme-text-secondary max-w-md leading-relaxed">
                آماده دریافت دستورات کدنویسی، ساخت فایل و اجرای فرامین ترمینال روی کامپیوتر شما.
              </p>
            </div>
          </div>
        ) : (
          messages.filter((m) => m.sender !== 'system').map((msg) => {
            const isUser = msg.sender === 'user';
            const messageId = msg.id;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-5xl ${isUser ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${isUser
                    ? 'theme-bg-hover theme-border-strong theme-text'
                    : 'theme-text-accent'
                    }`}
                  style={isUser ? {} : { background: 'color-mix(in srgb, var(--text-accent) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--text-accent) 25%, transparent)' }}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Body */}
                <div
                  className={`flex-1 rounded-xl p-3.5 text-xs leading-relaxed border shadow-sm relative group ${isUser
                    ? 'theme-bg-card-solid theme-border-divider theme-text rounded-tr-none'
                    : 'glass-panel theme-text rounded-tl-none'
                    } max-w-full overflow-hidden`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold theme-text-secondary text-[11px]">
                      {isUser ? 'کاربر' : 'هویار (Hooyar AI)'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] theme-text-muted">{msg.timestamp}</span>
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 theme-hover-bg rounded transition-all theme-text-muted theme-hover-accent"
                        title="کپی متن پیام"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Message content */}
                  <div className="font-sans theme-text space-y-2 dir-rtl overflow-hidden">
                    {renderMarkdown(msg.content, messageId)}
                  </div>

                  {/* Render Tool Calls if present */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t theme-border-divider">
                      <div className="text-[11px] font-semibold theme-text-accent mb-1 flex items-center gap-1.5">
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
          <div className="flex items-center gap-2 p-2.5 rounded-lg glass-card text-xs theme-text-accent max-w-xs">
            <Loader2 className="w-4 h-4 animate-spin theme-text-accent" />
            <span>در حال استدلال و اجرای کد...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Prompt Bar */}
      <div className="p-3 border-t theme-border-divider glass-panel">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {/* Top Bar inside prompt area */}
          <div className="flex items-center justify-between text-[11px] px-1 theme-text-secondary">
            <button
              type="button"
              onClick={onToggleAutoApprove}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all ${autoApproveTools
                ? 'theme-text-accent'
                : 'theme-bg-card-solid theme-border theme-text-muted theme-hover-text'
                }`}
              style={autoApproveTools ? { background: 'color-mix(in srgb, var(--text-accent) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--text-accent) 25%, transparent)' } : {}}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>
                تایید خودکار ابزارها: {autoApproveTools ? 'فعال' : 'غیرفعال'}
              </span>
            </button>
            <span className="text-[10px] theme-text-muted">ارسال: Enter | سطر جدید: Shift+Enter</span>
          </div>

          {/* Text Area & Submit */}
          <div className="relative flex items-end theme-bg-input theme-border focus-within:theme-border-strong rounded-lg p-2 transition-all" style={{ transition: 'border-color 200ms' }}>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="دستور برنامه‌نویسی خود را وارد کنید..."
              rows={2}
              className="w-full bg-transparent theme-text text-xs resize-none focus:outline-none pr-2 pl-10 placeholder:theme-text-muted"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="absolute left-2 bottom-2 p-1.5 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-sm transition-all"
              style={{ backgroundColor: 'var(--text-accent)' }}
            >
              <Send className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
