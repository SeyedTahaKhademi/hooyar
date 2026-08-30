import { ProviderConfig, ProviderId } from '../types';

export const DEFAULT_PROVIDERS: Record<ProviderId, ProviderConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    nameFa: 'گوگل جمینای',
    description: 'سرویس هوش مصنوعی گوگل با پشتیبانی از مدل‌های جدید 3.7 و 3.1 و قابلیت پردازش متن/تصویر',
    website: 'https://aistudio.google.com',
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    isFreeTierAvailable: true,
    requiresKey: true,
    selectedModel: 'gemini-3.7-flash',
    models: [
      { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', description: 'سریع‌ترین مدل ۲۰۲۶ برای کدنویسی', isFree: true, contextWindow: '2M' },
      { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', description: 'نسخه پیشرفته برای استدلال پیچیده و پروژه‌های بزرگ', isFree: true, contextWindow: '2M' },
      { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', description: 'نسخه پایدار کدنویسی', isFree: true, contextWindow: '1M' }
    ]
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    nameFa: 'اوپن‌ ای‌آی',
    description: 'دسترسی به آخرین مدل‌های سری 5.6 و مدل‌های استدلال‌گر پیشرفته',
    website: 'https://platform.openai.com',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    isFreeTierAvailable: false,
    requiresKey: true,
    selectedModel: 'gpt-5.6-luna',
    models: [
      { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', description: 'قدرتمندترین مدل استدلال و کدنویسی', contextWindow: '200K' },
      { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', description: 'متعادل‌ترین مدل برای کارهای روزمره', contextWindow: '200K' },
      { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', description: 'سریع و ارزان برای کدنویسی سریع', contextWindow: '200K' },
      { id: 'gpt-4o', name: 'GPT-4o', description: 'نسخه قبلی پایدار', contextWindow: '128K' },
      { id: 'o3-mini', name: 'o3-mini', description: 'استدلالگر کوچک و تخصصی برنامه‌نویسی', contextWindow: '200K' }
    ]
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    nameFa: 'آنتروپیک کلود',
    description: 'مدل‌های قدرتمند کلود ۵ و ۳.۵ برای برنامه‌نویسی',
    website: 'https://console.anthropic.com',
    apiKey: '',
    baseUrl: 'https://api.anthropic.com/v1',
    isFreeTierAvailable: false,
    requiresKey: true,
    selectedModel: 'claude-5-opus-202608',
    models: [
      { id: 'claude-5-opus-202608', name: 'Claude 5 Opus', description: 'برترین مدل آنتروپیک برای استدلال و معماری نرم‌افزار', contextWindow: '200K' },
      { id: 'claude-5-fable-202608', name: 'Claude 5 Fable', description: 'نسخه متعادل، پرسرعت و خلاق کلود ۵', contextWindow: '200K' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'مدل تخصصی برنامه‌نویسی پیشین', contextWindow: '200K' }
    ]
  },
  xai: {
    id: 'xai',
    name: 'xAI (Grok)',
    nameFa: 'ایکس ای‌آی (گراک)',
    description: 'مدل‌های فوق‌العاده سریع گراک نسخه 4.0 و بالاتر',
    website: 'https://console.x.ai',
    apiKey: '',
    baseUrl: 'https://api.x.ai/v1',
    isFreeTierAvailable: false,
    requiresKey: true,
    selectedModel: 'grok-4.0',
    models: [
      { id: 'grok-4.0', name: 'Grok 4.0', description: 'مدل استدلال‌گر بزرگ گراک با کانتکست عظیم', contextWindow: '128K' },
      { id: 'grok-3', name: 'Grok 3', description: 'نسخه پایدار قبلی', contextWindow: '128K' }
    ]
  },
  alibaba: {
    id: 'alibaba',
    name: 'Alibaba (Tongyi)',
    nameFa: 'علی‌بابا (Qwen)',
    description: 'مدل‌های متن‌باز قدرتمند سری Qwen 3.8',
    website: 'https://dashscope.aliyuncs.com',
    apiKey: '',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    isFreeTierAvailable: false,
    requiresKey: true,
    selectedModel: 'qwen-3.8-max',
    models: [
      { id: 'qwen-3.8-max', name: 'Qwen 3.8 Max', description: 'قدرتمندترین مدل متن‌باز علی‌بابا', contextWindow: '128K' },
      { id: 'qwen-3.8-coder', name: 'Qwen 3.8 Coder', description: 'مدل متن‌باز تخصصی کدنویسی', contextWindow: '128K' },
      { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder', description: 'نسخه پایدار سبک‌تر', contextWindow: '32K' }
    ]
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    nameFa: 'گراک',
    description: 'پردازش فوق‌العاده سریع با مدل‌های Llama 3.3 و DeepSeek R1',
    website: 'https://console.groq.com',
    apiKey: '',
    baseUrl: 'https://api.groq.com/openai/v1',
    isFreeTierAvailable: true,
    requiresKey: true,
    selectedModel: 'llama-3.3-70b-versatile',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'مدل متای هوش مصنوعی با پردازش پرسرعت', isFree: true, contextWindow: '128K' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Llama 70B', description: 'استدلال پیشرفته DeepSeek R1 با سرعت گراک', isFree: true, contextWindow: '128K' }
    ]
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek AI',
    nameFa: 'دیپ‌سیک',
    description: 'سرویس کدنویسی و استدلال پیشرفته دیپ‌سیک',
    website: 'https://platform.deepseek.com',
    apiKey: '',
    baseUrl: 'https://api.deepseek.com',
    isFreeTierAvailable: false,
    requiresKey: true,
    selectedModel: 'deepseek-chat',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3', description: 'مدل کدنویسی قدرتمند نسل ۳ دیپ‌سیک', contextWindow: '64K' },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1', description: 'مدل استدلال‌گر گام‌به‌گام برای مسائل تخصصی', contextWindow: '64K' }
    ]
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    nameFa: 'اوپن‌روتر',
    description: 'دسترسی یکپارچه به ۲۰۰+ مدل هوش مصنوعی در جهان',
    website: 'https://openrouter.ai',
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
    isFreeTierAvailable: true,
    requiresKey: true,
    selectedModel: 'google/gemini-3.7-flash:free',
    models: [
      { id: 'google/gemini-3.7-flash:free', name: 'Gemini 3.7 Flash (Free)', description: 'دسترسی رایگان گوگل', isFree: true, contextWindow: '2M' },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', description: 'مدل رایگان لاما ۳.۳', isFree: true, contextWindow: '128K' },
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', description: 'دسترسی به دیپ‌سیک R1 رایگان', isFree: true, contextWindow: '64K' }
    ]
  },
  bluesminds: {
    id: 'bluesminds',
    name: 'BluesMinds API',
    nameFa: 'بلوزمایندز',
    description: 'دسترسی یکپارچه به مدل‌های متعدد با API سازگار با OpenAI؛ پس از تست، مدل‌های فعال حساب شما دریافت می‌شوند.',
    website: 'https://api.bluesminds.com/console',
    apiKey: '',
    baseUrl: 'https://api.bluesminds.com/v1',
    isFreeTierAvailable: true,
    requiresKey: true,
    selectedModel: 'gpt-4o',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: 'مدل پیش‌فرض نمونه؛ پس از تست اتصال، فهرست مدل‌های حساب شما بارگذاری می‌شود.', contextWindow: 'متغیر' }
    ]
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama Local',
    nameFa: 'اولاما (محلی)',
    description: 'اجرای بدون اینترنت مدل‌های هوش مصنوعی روی سیستم کاربر',
    website: 'https://ollama.com',
    apiKey: 'ollama-local',
    baseUrl: 'http://localhost:11434/v1',
    isFreeTierAvailable: true,
    requiresKey: false,
    selectedModel: 'qwen3.8-coder',
    models: [
      { id: 'qwen3.8-coder', name: 'Qwen 3.8 Coder', description: 'نسخه کدنویسی ۳.۸ اولاما', isFree: true, contextWindow: '32K' },
      { id: 'deepseek-r1', name: 'DeepSeek R1 Local', description: 'مدل استدلال دیپ‌سیک محلی', isFree: true, contextWindow: '32K' }
    ]
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    nameFa: 'میسترال',
    description: 'مدل تخصصی Codestral و مدل‌های میسترال',
    website: 'https://console.mistral.ai',
    apiKey: '',
    baseUrl: 'https://api.mistral.ai/v1',
    isFreeTierAvailable: true,
    requiresKey: true,
    selectedModel: 'codestral-latest',
    models: [
      { id: 'codestral-latest', name: 'Codestral', description: 'مدل تخصصی کدنویسی شرکت میسترال', contextWindow: '32K' },
      { id: 'mistral-large-latest', name: 'Mistral Large', description: 'مدل جامع میسترال', contextWindow: '128K' }
    ]
  },
  together: {
    id: 'together',
    name: 'Together AI',
    nameFa: 'توگذر ای‌آی',
    description: 'اینفرنس پرسرعت برای اجرا و فراخوانی مدل‌های اپن‌سورس',
    website: 'https://www.together.ai',
    apiKey: '',
    baseUrl: 'https://api.together.xyz/v1',
    isFreeTierAvailable: true,
    requiresKey: true,
    selectedModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', description: 'نسخه توربو لاما ۳.۳', contextWindow: '128K' }
    ]
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity AI',
    nameFa: 'پرپلکسی',
    description: 'مدل‌های برپایه جستجوی آنلاین زنده در وب',
    website: 'https://www.perplexity.ai',
    apiKey: '',
    baseUrl: 'https://api.perplexity.ai',
    isFreeTierAvailable: false,
    requiresKey: true,
    selectedModel: 'sonar-pro',
    models: [
      { id: 'sonar-pro', name: 'Sonar Pro', description: 'مدل پیشرفته جستجوی اینترنتی و برنامه‌نویسی', contextWindow: '200K' }
    ]
  },
  sambanova: {
    id: 'sambanova',
    name: 'SambaNova Cloud',
    nameFa: 'سامبانوا',
    description: 'پردازش پرسرعت چیپ‌های SN40L برای مدل‌های کدنویسی',
    website: 'https://cloud.sambanova.ai',
    apiKey: '',
    baseUrl: 'https://api.sambanova.ai/v1',
    isFreeTierAvailable: true,
    requiresKey: true,
    selectedModel: 'Meta-Llama-3.3-70B-Instruct',
    models: [
      { id: 'Meta-Llama-3.3-70B-Instruct', name: 'SambaNova Llama 3.3 70B', description: 'اجرای رایگان و پرسرعت لاما', isFree: true, contextWindow: '128K' }
    ]
  },
  cerebras: {
    id: 'cerebras',
    name: 'Cerebras',
    nameFa: 'سربراس',
    description: 'تولید کدهای بسیار سریع با پردازش سخت‌افزاری بالا',
    website: 'https://cloud.cerebras.ai',
    apiKey: '',
    baseUrl: 'https://api.cerebras.ai/v1',
    isFreeTierAvailable: true,
    requiresKey: true,
    selectedModel: 'llama-3.3-70b',
    models: [
      { id: 'llama-3.3-70b', name: 'Cerebras Llama 3.3 70B', description: 'سرعت خروجی بالای توکن در ثانیه', isFree: true, contextWindow: '128K' }
    ]
  },
  siliconflow: {
    id: 'siliconflow',
    name: 'SiliconFlow',
    nameFa: 'سیلیکون‌فلو',
    description: 'پشتیبانی پایدار از مدل‌های DeepSeek و Qwen',
    website: 'https://siliconflow.cn',
    apiKey: '',
    baseUrl: 'https://api.siliconflow.cn/v1',
    isFreeTierAvailable: true,
    requiresKey: true,
    selectedModel: 'deepseek-ai/DeepSeek-V3',
    models: [
      { id: 'deepseek-ai/DeepSeek-V3', name: 'SiliconFlow DeepSeek V3', description: 'پاسخ‌دهی پایداری بالا', isFree: true, contextWindow: '64K' }
    ]
  },
  novita: {
    id: 'novita',
    name: 'Novita AI',
    nameFa: 'نوویتا ای‌آی',
    description: 'زیرساخت ابری هوش مصنوعی برای توسعه‌دهندگان',
    website: 'https://novita.ai',
    apiKey: '',
    baseUrl: 'https://api.novita.ai/v3/openai',
    isFreeTierAvailable: true,
    requiresKey: true,
    selectedModel: 'deepseek/deepseek-r1',
    models: [
      { id: 'deepseek/deepseek-r1', name: 'Novita DeepSeek R1', description: 'مدل R1 دیپ‌سیک', contextWindow: '64K' }
    ]
  },
  huggingface: {
    id: 'huggingface',
    name: 'HuggingFace',
    nameFa: 'هاگینگ‌فیس',
    description: 'دسترسی مستقیم به مدل‌های آزاد در هاگینگ‌فیس',
    website: 'https://huggingface.co',
    apiKey: '',
    baseUrl: 'https://api-inference.huggingface.co/v1',
    isFreeTierAvailable: true,
    requiresKey: true,
    selectedModel: 'Qwen/Qwen3.8-Coder-32B-Instruct',
    models: [
      { id: 'Qwen/Qwen3.8-Coder-32B-Instruct', name: 'Qwen 3.8 Coder', description: 'جدیدترین مدل کدنویسی کیون', isFree: true, contextWindow: '32K' }
    ]
  },
  custom: {
    id: 'custom',
    name: 'Custom Endpoint',
    nameFa: 'سرویس اختصاصی',
    description: 'اتصال به LM Studio، vLLM، سرورهای شخصی یا ریورس پروکسی',
    website: 'http://localhost:1234',
    apiKey: 'custom-key',
    baseUrl: 'http://localhost:1234/v1',
    isFreeTierAvailable: true,
    requiresKey: false,
    selectedModel: 'local-model',
    models: [
      { id: 'local-model', name: 'Custom Model', description: 'مدل در حال اجرا در سرور اختصاصی', isFree: true, contextWindow: '128K' }
    ]
  }
};

export interface ApiVerificationResult {
  success: boolean;
  message: string;
  models?: ProviderConfig['models'];
}

function extractModels(payload: unknown): ProviderConfig['models'] {
  const data = payload as { data?: unknown; models?: unknown };
  const entries = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.models)
      ? data.models
      : [];

  return entries
    .map((entry: any) => {
      const id = typeof entry === 'string' ? entry : entry?.id || entry?.name;
      if (!id || typeof id !== 'string') return null;
      return {
        id,
        name: entry?.name || id,
        description: entry?.description || 'مدل دریافت‌شده از ارائه‌دهنده',
        contextWindow: entry?.context_length ? String(entry.context_length) : undefined
      };
    })
    .filter((model): model is NonNullable<typeof model> => model !== null);
}

export async function verifyApiKey(config: ProviderConfig): Promise<ApiVerificationResult> {
  try {
    if (config.requiresKey && !config.apiKey.trim()) {
      return { success: false, message: 'لطفاً کلید API را وارد کنید.' };
    }

    const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    const testUrl = baseUrl.endsWith('/') ? `${baseUrl}models` : `${baseUrl}/models`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (config.id === 'anthropic') {
      headers['x-api-key'] = config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(testUrl, {
      method: 'GET',
      headers,
      signal: controller.signal
    }).catch(async () => {
      const compUrl = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
      return await fetch(compUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.selectedModel,
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1
        })
      });
    });

    clearTimeout(timeoutId);

    if (response?.ok) {
      let models: ProviderConfig['models'] | undefined;
      try {
        models = extractModels(await response.clone().json());
      } catch {
        // Some compatible providers return no model list. The connection is still valid.
      }

      return {
        success: true,
        message: models?.length
          ? `اتصال با موفقیت بررسی شد؛ ${models.length} مدل از حساب شما دریافت شد.`
          : 'اتصال با موفقیت بررسی شد.',
        models: models?.length ? models : undefined
      };
    }

    if (response) {
      const text = await response.text();
      return { success: false, message: `خطا در پاسخ سرویس (${response.status}): ${text.substring(0, 100)}` };
    }

    return { success: false, message: 'پاسخی از سرور دریافت نشد.' };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, message: 'زمان پاسخ‌دهی سرور به پایان رسید (Timeout).' };
    }
    return { success: false, message: `خطای ارتباطی: ${error.message || 'مشکل در شبکه'}` };
  }
}
