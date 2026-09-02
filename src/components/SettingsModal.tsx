import React, { useState } from 'react';
import { ProviderConfig, ProviderId } from '../types';
import { verifyApiKey } from '../services/aiProviders';
import {
  X,
  Key,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Globe,
  Zap,
  Edit3,
  Sliders,
  Terminal,
  ShieldCheck,
  HelpCircle,
  Palette,
  Type,
  Sun,
  Moon,
  Wind
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: Record<ProviderId, ProviderConfig>;
  onUpdateProvider: (providerId: ProviderId, updates: Partial<ProviderConfig>) => void;
  systemPrompt: string;
  onUpdateSystemPrompt: (prompt: string) => void;
  autoApproveTools: boolean;
  onToggleAutoApprove: () => void;
  theme: 'dark' | 'light' | 'glass';
  fontSize: number;
  onUpdateConfig: (updates: Partial<{ theme: 'dark' | 'light' | 'glass'; fontSize: number }>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  providers,
  onUpdateProvider,
  systemPrompt,
  onUpdateSystemPrompt,
  autoApproveTools,
  onToggleAutoApprove,
  theme,
  fontSize,
  onUpdateConfig
}) => {
  const [activeTab, setActiveTab] = useState<'providers' | 'appearance' | 'agent' | 'system' | 'guide'>('providers');
  const [expandedProvider, setExpandedProvider] = useState<ProviderId | null>('gemini');
  const [verifyingId, setVerifyingId] = useState<ProviderId | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editingSystemPrompt, setEditingSystemPrompt] = useState(false);
  const [tempSystemPrompt, setTempSystemPrompt] = useState(systemPrompt);

  if (!isOpen) return null;

  const handleVerify = async (provider: ProviderConfig) => {
    setVerifyingId(provider.id);
    const result = await verifyApiKey(provider);
    setVerifyResults((prev) => ({ ...prev, [provider.id]: result }));
    if (result.success) {
      const selectedModel = result.models?.some((model) => model.id === provider.selectedModel)
        ? provider.selectedModel
        : result.models?.[0]?.id;
      onUpdateProvider(provider.id, {
        isVerified: true,
        ...(result.models ? { models: result.models, selectedModel } : {})
      });
    }
    setVerifyingId(null);
  };

  const freeProviders = Object.values(providers).filter((p) => p.isFreeTierAvailable);
  const paidProviders = Object.values(providers).filter((p) => !p.isFreeTierAvailable);

  const ProviderCard = ({ provider }: { provider: ProviderConfig }) => {
    const isExpanded = expandedProvider === provider.id;
    const verifyResult = verifyResults[provider.id];
    const isVerifying = verifyingId === provider.id;
    const showKey = showKeys[provider.id];

    return (
      <div
        className={`rounded-lg border transition-all mb-2 ${isExpanded
          ? 'bg-slate-900 border-sky-500/40 shadow-sm'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-750'
          }`}
      >
        <button
          onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}
          className="w-full flex items-center justify-between p-3 text-right"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${provider.isVerified
                ? 'bg-emerald-500'
                : provider.apiKey
                  ? 'bg-sky-400'
                  : 'bg-slate-600'
                }`}
            />
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200">{provider.nameFa} ({provider.name})</span>
                {provider.isFreeTierAvailable && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-sky-950 text-sky-400 border border-sky-800/40 rounded font-medium">
                    رایگان
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-normal">{provider.description}</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {isExpanded && (
          <div className="px-3.5 pb-3.5 space-y-3 border-t border-slate-800 pt-3">
            {/* API Key Field */}
            {provider.requiresKey && (
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  <Key className="w-3 h-3 inline ml-1 text-sky-400" />
                  کلید API
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={provider.apiKey}
                    onChange={(e) => onUpdateProvider(provider.id, { apiKey: e.target.value })}
                    placeholder={`کلید API سرویس ${provider.name}`}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-2 pr-3 rounded focus:outline-none focus:border-sky-500/60 dir-ltr placeholder-slate-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys((prev) => ({ ...prev, [provider.id]: !showKey }))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Custom Base URL */}
            {(provider.id === 'custom' || provider.id === 'ollama') && (
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  <Globe className="w-3 h-3 inline ml-1 text-sky-400" />
                  آدرس سرویس (Base URL)
                </label>
                <input
                  type="text"
                  value={provider.baseUrl || ''}
                  onChange={(e) => onUpdateProvider(provider.id, { baseUrl: e.target.value })}
                  placeholder="http://localhost:11434/v1"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-2 pr-3 rounded focus:outline-none focus:border-sky-500/60 dir-ltr placeholder-slate-600 font-mono"
                />
              </div>
            )}

            {/* Model Selection */}
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                <Zap className="w-3 h-3 inline ml-1 text-sky-400" />
                مدل هوش مصنوعی
              </label>
              <select
                value={provider.selectedModel}
                onChange={(e) => onUpdateProvider(provider.id, { selectedModel: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-2 rounded focus:outline-none focus:border-sky-500/60 dir-ltr"
              >
                {provider.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.contextWindow || 'N/A'} tokens)
                  </option>
                ))}
              </select>
            </div>

            {/* Actions: Verify + Website */}
            <div className="flex items-center justify-between pt-1">
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                دریافت API Key از {provider.name}
              </a>

              <button
                onClick={() => handleVerify(provider)}
                disabled={isVerifying}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-[11px] font-semibold transition-all"
              >
                {isVerifying ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3 h-3" />
                )}
                <span>{isVerifying ? 'در حال تست...' : 'تست اتصال'}</span>
              </button>
            </div>

            {/* Verification Result */}
            {verifyResult && (
              <div
                className={`flex items-center gap-2 p-2 rounded text-[11px] font-medium border ${verifyResult.success
                  ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
                  : 'bg-rose-950/40 border-rose-800/40 text-rose-400'
                  }`}
              >
                {verifyResult.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{verifyResult.message}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
    >
      <div className="w-full max-w-xl max-h-[85vh] glass-panel rounded-xl theme-border shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b theme-border-divider">
          <div>
            <h2 className="text-sm font-bold theme-text">تنظیمات سرویس‌ها و ایجنت</h2>
            <p className="text-[11px] theme-text-secondary mt-0.5">مدیریت کلیدهای API و مدل‌های هوش مصنوعی</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 theme-hover-bg rounded theme-text-muted theme-hover-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-2 border-b theme-border-divider theme-bg-inner overflow-x-auto shrink-0">
          {(['providers', 'appearance', 'agent', 'system', 'guide'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${activeTab === tab
                ? 'text-white shadow-sm'
                : 'theme-text-muted theme-hover-text theme-hover-bg'
                }`}
              style={activeTab === tab ? { backgroundColor: 'var(--text-accent)' } : {}}
            >
              {tab === 'providers' && (
                <>
                  <Key className="w-3.5 h-3.5" />
                  <span>کلیدهای API</span>
                </>
              )}
              {tab === 'appearance' && (
                <>
                  <Palette className="w-3.5 h-3.5" />
                  <span>ظاهر و فونت</span>
                </>
              )}
              {tab === 'agent' && (
                <>
                  <Sliders className="w-3.5 h-3.5" />
                  <span>تنظیمات ایجنت</span>
                </>
              )}
              {tab === 'system' && (
                <>
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">پرامپت سیستم</span>
                </>
              )}
              {tab === 'guide' && (
                <>
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">راهنمای API</span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3.5">
          {activeTab === 'providers' && (
            <div>
              {/* Free Providers */}
              <div className="mb-4">
                <span className="text-[11px] font-bold text-sky-400 block mb-2 px-1 uppercase tracking-wider">
                  ارائه‌دهندگان دارای پلن رایگان
                </span>
                {freeProviders.map((p) => (
                  <ProviderCard key={p.id} provider={p} />
                ))}
              </div>

              {/* Paid Providers */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-2 px-1 uppercase tracking-wider border-t border-slate-800 pt-3">
                  ارائه‌دهندگان تجاری
                </span>
                {paidProviders.map((p) => (
                  <ProviderCard key={p.id} provider={p} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-sky-400" /> انتخاب تم نرم‌افزار
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'dark', name: 'تاریک', icon: Moon },
                    { id: 'light', name: 'روشن', icon: Sun },
                    { id: 'glass', name: 'شیشه‌ای', icon: Wind },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onUpdateConfig({ theme: t.id as any })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${theme === t.id
                        ? 'bg-sky-600 border-sky-400 text-white shadow-lg shadow-sky-900/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                    >
                      <t.icon className="w-5 h-5" />
                      <span className="text-[11px] font-bold">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Type className="w-3.5 h-3.5 text-sky-400" /> اندازه فونت گفتگو
                </h3>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">اندازه: {fontSize}px</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onUpdateConfig({ fontSize: Math.max(10, fontSize - 1) })}
                        className="w-8 h-8 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                      >-</button>
                      <button
                        onClick={() => onUpdateConfig({ fontSize: Math.min(24, fontSize + 1) })}
                        className="w-8 h-8 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                      >+</button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={fontSize}
                    onChange={(e) => onUpdateConfig({ fontSize: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-center text-slate-300" style={{ fontSize: `${fontSize}px` }}>
                    پیش‌نمایش متن پیام هویار
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'agent' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <h3 className="text-xs font-semibold text-slate-200">رفتار اجرای ابزارها</h3>
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div>
                    <div className="text-xs font-medium text-slate-200">تایید خودکار ابزارها</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      اجرای مستقیم ابزارها بدون درخواست تایید در هر مرحله.
                    </div>
                  </div>
                  <button
                    onClick={onToggleAutoApprove}
                    className={`relative w-10 h-5 rounded-full transition-all shrink-0 border ${autoApproveTools
                      ? 'bg-sky-600 border-sky-500'
                      : 'bg-slate-800 border-slate-700'
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${autoApproveTools ? 'left-5' : 'left-0.5'
                        }`}
                    />
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <h3 className="text-xs font-semibold text-slate-200 mb-2">ابزارهای ایجنت هویار</h3>
                <div className="space-y-1.5">
                  {[
                    { title: 'read_file', desc: 'خواندن کدهای پروژه' },
                    { title: 'write_file', desc: 'ایجاد یا ویرایش فایل در دیسک' },
                    { title: 'list_directory', desc: 'اسکن پوشه‌های پروژه' },
                    { title: 'execute_terminal_command', desc: 'اجرای فرامین PowerShell' },
                  ].map((tool) => (
                    <div key={tool.title} className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-xs">
                      <code className="text-sky-400 font-mono text-[11px] font-semibold">{tool.title}</code>
                      <span className="text-[11px] text-slate-400">{tool.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-200">پرامپت سیستم ایجنت</h3>
                <button
                  onClick={() => {
                    if (editingSystemPrompt) {
                      onUpdateSystemPrompt(tempSystemPrompt);
                    }
                    setEditingSystemPrompt(!editingSystemPrompt);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold transition-all"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{editingSystemPrompt ? 'ذخیره' : 'ویرایش'}</span>
                </button>
              </div>
              <textarea
                value={editingSystemPrompt ? tempSystemPrompt : systemPrompt}
                onChange={(e) => editingSystemPrompt && setTempSystemPrompt(e.target.value)}
                readOnly={!editingSystemPrompt}
                rows={16}
                className={`w-full bg-slate-950 border rounded-lg p-2.5 text-xs text-slate-300 dir-ltr font-mono leading-relaxed focus:outline-none resize-none transition-all ${editingSystemPrompt
                  ? 'border-sky-500/50'
                  : 'border-slate-800 opacity-80 cursor-default'
                  }`}
              />
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-slate-300 text-xs leading-relaxed dir-rtl">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <h3 className="text-sky-400 font-bold mb-2 flex items-center gap-1.5"><HelpCircle className="w-4 h-4" /> راهنمای دریافت کلید API</h3>
                <p className="mb-2 text-[11px] text-slate-400">
                  برای استفاده از مدل‌های هوش مصنوعی مختلف، شما نیاز به دریافت کلید ارتباطی (API Key) دارید. مراحل دریافت برای مهمترین سرویس‌ها در زیر توضیح داده شده است:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 border border-slate-800 rounded bg-slate-950">
                  <div className="font-semibold text-slate-200 mb-1">۱. گوگل جمینای (Google Gemini) - رایگان</div>
                  <ul className="list-disc pr-4 text-[11px] text-slate-400 space-y-1">
                    <li>وارد سایت <a href="https://aistudio.google.com" target="_blank" className="text-sky-400 hover:underline">Google AI Studio</a> شوید.</li>
                    <li>با اکانت گوگل خود وارد شوید.</li>
                    <li>از منوی سمت چپ روی "Get API key" کلیک کنید.</li>
                    <li>روی دکمه آبی رنگ "Create API key" کلیک کرده و کلید ایجاد شده را کپی کنید.</li>
                  </ul>
                </div>

                <div className="p-3 border border-slate-800 rounded bg-slate-950">
                  <div className="font-semibold text-slate-200 mb-1">۲. گراک (Groq) - رایگان و بسیار سریع</div>
                  <ul className="list-disc pr-4 text-[11px] text-slate-400 space-y-1">
                    <li>وارد سایت <a href="https://console.groq.com" target="_blank" className="text-sky-400 hover:underline">Groq Console</a> شوید.</li>
                    <li>پس از ورود، به بخش "API Keys" در منوی سمت چپ بروید.</li>
                    <li>روی "Create API Key" کلیک کنید و نامی برای آن انتخاب کنید.</li>
                  </ul>
                </div>

                <div className="p-3 border border-slate-800 rounded bg-slate-950">
                  <div className="font-semibold text-slate-200 mb-1">۳. اوپن روتر (OpenRouter) - دسترسی به صدها مدل</div>
                  <ul className="list-disc pr-4 text-[11px] text-slate-400 space-y-1">
                    <li>وارد سایت <a href="https://openrouter.ai" target="_blank" className="text-sky-400 hover:underline">OpenRouter.ai</a> شوید.</li>
                    <li>با اکانت گوگل یا گیت‌هاب لاگین کنید.</li>
                    <li>به بخش "Keys" رفته و روی "Create Key" کلیک کنید.</li>
                    <li>بسیاری از مدل‌های قوی در OpenRouter برچسب <code>free</code> دارند و رایگان هستند.</li>
                  </ul>
                </div>

                <div className="p-3 border border-slate-800 rounded bg-slate-950">
                  <div className="font-semibold text-slate-200 mb-1">۴. بلوزمایندز (BluesMinds) - API سازگار با OpenAI</div>
                  <ul className="list-disc pr-4 text-[11px] text-slate-400 space-y-1">
                    <li>وارد <a href="https://api.bluesminds.com/console" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">BluesMinds Console</a> شوید.</li>
                    <li>از بخش <code>Tokens</code> یک کلید API با پیشوند <code>sk-</code> بسازید.</li>
                    <li>در بخش «کلیدهای API» هویار، «بلوزمایندز» را باز کنید، کلید را وارد و «تست اتصال» را بزنید.</li>
                    <li>پس از تأیید، فهرست مدل‌های در دسترس حساب شما خودکار بارگذاری می‌شود؛ مدل را انتخاب کنید و از نوار بالای برنامه فعالش کنید.</li>
                  </ul>
                </div>

                <div className="p-3 border border-slate-800 rounded bg-slate-950">
                  <div className="font-semibold text-slate-200 mb-1">۵. اجرای محلی بدون اینترنت (Ollama)</div>
                  <ul className="list-disc pr-4 text-[11px] text-slate-400 space-y-1">
                    <li>نرم‌افزار <a href="https://ollama.com" target="_blank" className="text-sky-400 hover:underline">Ollama</a> را دانلود و روی کامپیوتر خود نصب کنید.</li>
                    <li>در ترمینال سیستم دستور <code>ollama run qwen2.5-coder</code> را اجرا کنید تا مدل دانلود شود.</li>
                    <li>سپس در هویار، ارائه‌دهنده را روی "Ollama Local" تنظیم کنید (بدون نیاز به API Key).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t theme-border-divider theme-bg-inner flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg hover:opacity-90 text-white text-xs font-semibold shadow-sm transition-all"
            style={{ backgroundColor: 'var(--text-accent)' }}
          >
            ذخیره و بستن
          </button>
        </div>
      </div>
    </div>
  );
};
