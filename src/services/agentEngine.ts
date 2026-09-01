import { Message, ProviderConfig, ToolCall } from '../types';
import { apiFetch } from './apiClient';

export const SYSTEM_PROMPT_DEFAULT = `You are Hooyar (هویار), an elite autonomous AI Coding Agent running directly on the user's Windows desktop.
You assist developers in writing code, creating projects, debugging errors, managing workspace files, and executing terminal commands.

Capabilities & Tools:
You can request ONE batch of tool actions per turn using JSON blocks in your response:
\`\`\`json
{
  "tool": "read_file" | "write_file" | "list_directory" | "execute_terminal_command" | "search_workspace",
  "args": {
    "path": "relative/or/absolute/path",
    "content": "full file contents for write_file",
    "command": "terminal command line",
    "query": "search keyword for search_workspace"
  }
}
\`\`\`

Tool details:
1. read_file: Reads the content of a file ({"path": "..."}).
2. write_file: Creates or updates a file ({"path": "...", "content": "..."}). Always write the COMPLETE final file content.
3. list_directory: Lists the workspace or a subfolder ({"path": "..."} — optional).
4. execute_terminal_command: Runs a PowerShell command in the active workspace (npm install, python script.py, etc.).
5. search_workspace: Searches file names AND file contents for a keyword ({"query": "...", "path": "..."} — path optional).

Execution protocol (very important):
- After you emit tool JSON blocks, STOP and wait. The Hooyar runtime executes them and sends you a
  "[TOOL RESULTS]" message with the real outputs. Never invent or assume tool results.
- Then continue: either emit more tool calls or deliver the final answer to the user.
- All file paths must stay inside the active workspace folder. The sandbox blocks anything outside it.
- Terminal commands run with a 120 second timeout; avoid interactive commands.

Directives:
- Respond politely in Persian for explanations, while keeping code, file paths, and terminal commands accurately formatted in standard syntax.
- Always provide clean, efficient, production-ready code.
- When generating files, use the write_file tool JSON blocks so the file is actually created on the user's machine.
- If a task needs several steps, work through them gradually instead of guessing.`;

/**
 * Builds the runtime message that feeds real tool outputs back to the
 * model so it can continue the task (the autonomous agent loop).
 */
export function buildToolResultsPrompt(results: ToolCall[]): string {
  const formatResult = (value: unknown): string => {
    if (value === undefined || value === null) return '';
    const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    return text.length > 8000 ? `${text.slice(0, 8000)}\n... [truncated]` : text;
  };

  const blocks = results.map((r, index) => {
    const lines = [
      `${index + 1}) tool: ${r.tool}`,
      `   status: ${r.status}`,
      r.error ? `   error: ${r.error}` : '',
      `   result:`,
      formatResult(r.result) || '   (empty)'
    ].filter(Boolean);
    return lines.join('\n');
  });

  return [
    '[TOOL RESULTS] — automated runtime message from Hooyar (not from the human user).',
    'These are the real outputs of the tools you requested:',
    '',
    ...blocks,
    '',
    'Continue the task using these results: emit new tool JSON blocks if you still need information, or present the final answer in Persian.'
  ].join('\n');
}

const MAX_CONTEXT_CHARS = 120000;

/**
 * Keeps the most recent messages that fit into the character budget so
 * long conversations do not overflow the model context window.
 */
function trimForContext(messages: Array<{ role: string; content: string }>): Array<{ role: string; content: string }> {
  const kept: Array<{ role: string; content: string }> = [];
  let total = 0;

  for (let i = messages.length - 1; i >= 0; i--) {
    const len = messages[i].content.length;
    if (total + len > MAX_CONTEXT_CHARS && kept.length >= 4) break;
    total += len;
    kept.unshift(messages[i]);
  }

  return kept;
}

function formatProviderError(provider: ProviderConfig, status: number, responseBody: string): string {
  let apiMessage = responseBody;

  try {
    const parsed = JSON.parse(responseBody);
    apiMessage = parsed?.error?.message || parsed?.message || responseBody;
  } catch {
    // Gateways sometimes return an HTML error page. It should not be shown to the user.
  }

  if (/end of life|no longer available|retired|deprecated/i.test(apiMessage)) {
    return `مدل «${provider.selectedModel}» دیگر توسط ${provider.name} در دسترس نیست. از تنظیمات، «تست اتصال» را بزنید تا فهرست مدل‌ها تازه شود و سپس یک مدل دیگر انتخاب کنید.`;
  }

  if (status === 429) {
    return `تعداد درخواست‌ها به سقف مجاز ${provider.name} رسیده است. کمی صبر کنید و دوباره تلاش کنید.`;
  }

  if (status === 502 || status === 503 || status === 504) {
    return `سرور ${provider.name} یا ارائه‌دهندهٔ مدل موقتاً پاسخ‌گو نیست (${status}). لطفاً چند لحظه بعد دوباره تلاش کنید یا مدل دیگری انتخاب کنید.`;
  }

  if (status === 401 || status === 403) {
    return `کلید API برای ${provider.name} معتبر نیست یا اجازهٔ استفاده از این مدل را ندارد. کلید و سطح دسترسی آن را در تنظیمات بررسی کنید.`;
  }

  return `خطای API از ${provider.name} (${status}): ${apiMessage.slice(0, 300)}`;
}

export async function runAgentStep(
  provider: ProviderConfig,
  messages: Message[],
  workspacePath: string | null,
  customSystemPrompt?: string
): Promise<{ text: string; thinking?: string; toolCalls: ToolCall[] }> {
  const baseUrl = provider.baseUrl || 'https://api.openai.com/v1';
  const url = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (provider.id === 'anthropic') {
    headers['x-api-key'] = provider.apiKey;
    headers['anthropic-version'] = '2023-06-01';
  } else {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
  }

  const sysPrompt = customSystemPrompt || SYSTEM_PROMPT_DEFAULT;
  const contextHeader = workspacePath ? `\nActive Workspace Folder: ${workspacePath}` : '';

  const apiMessages = [
    { role: 'system', content: sysPrompt + contextHeader },
    ...trimForContext(
      messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    )
  ];

  try {
    const response = await apiFetch(
      url,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: provider.selectedModel,
          messages: apiMessages,
          temperature: 0.2
        })
      },
      300000
    );

    if (!response.ok) {
      throw new Error(formatProviderError(provider, response.status, response.bodyText));
    }

    let data: any;
    try {
      data = JSON.parse(response.bodyText);
    } catch {
      throw new Error(`پاسخ نامعتبر (غیر JSON) از ${provider.name} دریافت شد.`);
    }

    const rawContent = data.choices?.[0]?.message?.content || 'پاسخی از مدل دریافت نشد.';

    // Extract tool calls if JSON tool blocks are present
    const toolCalls: ToolCall[] = [];
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
    let match;

    while ((match = jsonBlockRegex.exec(rawContent)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.tool && parsed.args) {
          toolCalls.push({
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'tool-' + Math.random().toString(36).slice(2, 11),
            tool: parsed.tool,
            args: parsed.args,
            status: 'pending'
          });
        }
      } catch (e) {
        // Not a tool call JSON
      }
    }

    return {
      text: rawContent,
      toolCalls
    };
  } catch (err: any) {
    return {
      text: `خطا در برقراری ارتباط با مدل ${provider.name}: ${err.message}`,
      toolCalls: []
    };
  }
}

export async function executeTool(toolCall: ToolCall, workspacePath: string | null): Promise<ToolCall> {
  const native = window.hooyarNative;
  const copyTool: ToolCall = { ...toolCall, status: 'running' };

  if (!native) {
    copyTool.status = 'failed';
    copyTool.error = 'محیط نیتیو الکترون در دسترس نیست (تست مرورگر).';
    return copyTool;
  }

  try {
    switch (toolCall.tool) {
      case 'read_file': {
        const filePath = toolCall.args.path || toolCall.args.filePath;
        const res = await native.readFile(filePath);
        if (res.success) {
          copyTool.status = 'completed';
          copyTool.result = res.content;
        } else {
          copyTool.status = 'failed';
          copyTool.error = res.error;
        }
        break;
      }

      case 'write_file': {
        const filePath = toolCall.args.path || toolCall.args.filePath;
        const content = toolCall.args.content || '';
        const res = await native.writeFile(filePath, content);
        if (res.success) {
          copyTool.status = 'completed';
          copyTool.result = `فایل با موفقیت ایجاد/ویرایش شد: ${filePath}`;
        } else {
          copyTool.status = 'failed';
          copyTool.error = res.error;
        }
        break;
      }

      case 'list_directory': {
        const targetPath = toolCall.args.path || workspacePath || '.';
        const res = await native.readDir(targetPath);
        if (res.success) {
          copyTool.status = 'completed';
          copyTool.result = res.tree;
        } else {
          copyTool.status = 'failed';
          copyTool.error = res.error;
        }
        break;
      }

      case 'execute_terminal_command': {
        const cmd = toolCall.args.command || toolCall.args.cmd;
        const res = await native.executeTerminal(cmd, workspacePath || undefined);
        if (res.success) {
          copyTool.status = 'completed';
          copyTool.result = res.stdout || res.stderr || 'دستور با موفقیت اجرا شد.';
        } else {
          copyTool.status = 'failed';
          copyTool.error = res.error || res.stderr || 'خطا در اجرای دستور ترمینال.';
        }
        break;
      }

      case 'search_workspace': {
        const query = toolCall.args.query || toolCall.args.text || toolCall.args.keyword || '';
        const targetPath = toolCall.args.path || workspacePath;
        if (!query || !String(query).trim()) {
          copyTool.status = 'failed';
          copyTool.error = 'عبارت جستجو (query) مشخص نشده است.';
          break;
        }
        const res = await native.searchWorkspace(String(query), targetPath);
        if (res.success) {
          copyTool.status = 'completed';
          const results = res.results || [];
          copyTool.result =
            results.length === 0
              ? 'هیچ نتیجه‌ای برای این عبارت پیدا نشد.'
              : results;
        } else {
          copyTool.status = 'failed';
          copyTool.error = res.error;
        }
        break;
      }

      default:
        copyTool.status = 'failed';
        copyTool.error = 'ابزار شناخته نشد.';
    }
  } catch (err: any) {
    copyTool.status = 'failed';
    copyTool.error = err.message;
  }

  return copyTool;
}
