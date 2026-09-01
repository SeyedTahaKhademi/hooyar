import { Message, ProviderConfig, ToolCall } from '../types';

declare global {
  interface Window {
    hooyarNative?: {
      selectFolder: () => Promise<string | null>;
      setWorkspace: (path: string | null) => Promise<boolean>;
      readDir: (dirPath: string) => Promise<{ success: boolean; tree?: any[]; error?: string }>;
      readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
      writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
      deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      executeTerminal: (command: string, cwd?: string) => Promise<{ success: boolean; stdout: string; stderr: string; error?: string }>;
      searchWorkspace: (query: string, targetPath?: string) => Promise<{ success: boolean; results?: any[]; error?: string }>;
      aiRequest: (options: { url: string; method: string; headers: any; body: string }) => Promise<{ ok: boolean; status: number; text: string }>;
      loadConfig: () => Promise<any>;
      saveConfig: (data: any) => Promise<boolean>;
    };
  }
}

export const SYSTEM_PROMPT_DEFAULT = `You are Hooyar (هویار), an elite autonomous AI Coding Agent running directly on the user's Windows desktop.
You assist developers in writing code, creating projects, debugging errors, managing workspace files, and executing terminal commands.

--- RESPONSE FORMAT (CRITICAL — READ CAREFULLY) ---
Every response MUST have TWO PARTS, in this exact order:

1. PART A — HUMAN-READABLE EXPLANATION (PERSIAN):
   - Start with a friendly explanation in FLUID Persian (فارسی), describing exactly what you are going to do.
   - Summarize files you will create/edit, commands you will run, or the plan step-by-step.
   - This part is read DIRECTLY BY THE USER — never include raw JSON or tool syntax here.
   - For file creation, give a short Persian summary of the file purpose; NEVER dump the source code here.

2. PART B — TOOL CALLS (if any):
   - ONLY after the Persian explanation, you may append one or more tool blocks.
   - Each tool block MUST be wrapped in a fenced \`\`\`json ... \`\`\` block.
   - Separate multiple tools visually ("---" between them is fine).
   - NEVER explain the JSON itself. The system extracts and runs them automatically.

Tool block format:
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
3. list_directory: Lists the workspace or a subfolder ({"path": "..."}).
4. execute_terminal_command: Runs shell commands (npm install, git, etc.) in the workspace.
5. search_workspace: Finds files or text matching a query ({"query": "..."}).

EXAMPLE OF A GOOD RESPONSE:
«سلام بذار برات یک مدل زبانی بی‌گرام ساده با پایتون درست کنم. اول یک کلاس برای آموزش مدل روی متن، بعد پیش‌بینی کلمه بعدی و تولید جمله اضافه می‌کنم. فایل رو توی مسیر پروژه فعلی می‌سازم.»

\`\`\`json
{
  "tool": "write_file",
  "args": {
    "path": "C:/path/to/simple_language_model.py",
    "content": "import re\\nimport random\\n..."
  }
}
\`\`\`

Directives:
- ALWAYS include the Persian explanation BEFORE any \`\`\`json block.
- NEVER reply with ONLY a \`\`\`json block; the user will see raw JSON and get confused.
- When generating files, ALWAYS use the write_file tool so the file lands on disk.
- Keep code, paths, commands in English/standard syntax; only prose is Persian.
- If you need info from the codebase, use search_workspace or list_directory first.`;

function formatProviderError(provider: ProviderConfig, status: number, responseBody: string): string {
  let apiMessage = responseBody;

  try {
    const parsed = JSON.parse(responseBody);
    apiMessage = parsed?.error?.message || parsed?.message || responseBody;
  } catch {
    // Non-JSON error
  }

  if (status === 429) return `تعداد درخواست‌ها به سقف مجاز ${provider.name} رسیده است.`;
  if (status === 401 || status === 403) return `کلید API برای ${provider.name} معتبر نیست.`;
  
  return `خطای API از ${provider.name} (${status}): ${apiMessage.slice(0, 300)}`;
}

export async function runAgentStep(
  provider: ProviderConfig,
  messages: Message[],
  workspacePath: string | null,
  customSystemPrompt?: string
): Promise<{ text: string; thinking?: string; toolCalls: ToolCall[] }> {
  const native = window.hooyarNative;
  if (!native) {
    throw new Error('محیط نیتیو در دسترس نیست.');
  }

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
    ...messages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.content
    }))
  ];

  try {
    const response = await native.aiRequest({
      url,
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: provider.selectedModel,
        messages: apiMessages,
        temperature: 0.2,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(formatProviderError(provider, response.status, response.text));
    }

    const data = JSON.parse(response.text);
    let rawContent = data.choices?.[0]?.message?.content || '';

    if (typeof rawContent !== 'string' || rawContent.trim().length === 0) {
      rawContent = 'پاسخی از مدل دریافت نشد.';
    }

    const thinking =
      data.choices?.[0]?.message?.reasoning_content ||
      data.choices?.[0]?.message?.thinking ||
      undefined;

    const toolCalls: ToolCall[] = [];
    const pushTool = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      const toolName = obj.tool || obj.type || obj.action;
      const args = obj.args || obj.arguments || obj.params || obj.data || {};
      if (
        typeof toolName === 'string' &&
        [
          'read_file',
          'write_file',
          'list_directory',
          'execute_terminal_command',
          'search_workspace'
        ].includes(toolName)
      ) {
        toolCalls.push({
          id: 'tool-' + Math.random().toString(36).substr(2, 9),
          tool: toolName as any,
          args,
          status: 'pending'
        });
      }
    };

    const fencedJsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
    const strippedRanges: Array<[number, number]> = [];
    let m;
    while ((m = fencedJsonRegex.exec(rawContent)) !== null) {
      const block = m[1].trim();
      if (!block) continue;
      strippedRanges.push([m.index, m.index + m[0].length]);
      try {
        const parsed = JSON.parse(block);
        if (Array.isArray(parsed)) {
          parsed.forEach(pushTool);
        } else {
          pushTool(parsed);
        }
      } catch {
        try {
          const multi = block.split(/\}\s*\{/).map((s, i, arr) => {
            const prefix = i === 0 ? '' : '{';
            const suffix = i === arr.length - 1 ? '' : '}';
            return (prefix + s + suffix).trim();
          });
          for (const piece of multi) {
            try { pushTool(JSON.parse(piece)); } catch {}
          }
        } catch {}
      }
    }

    if (toolCalls.length === 0) {
      const looseRegex = /\[\s*\{[\s\S]*?"tool"\s*:[\s\S]*?\}\s*\]|\{\s*"tool"\s*:[\s\S]*?\}(?=\s*\{|\s*$|,)/g;
      while ((m = looseRegex.exec(rawContent)) !== null) {
        try { pushTool(JSON.parse(m[0])); } catch {}
      }
    }

    let cleanText = rawContent;
    if (strippedRanges.length > 0) {
      strippedRanges.sort((a, b) => b[0] - a[0]);
      for (const [s, e] of strippedRanges) {
        cleanText = cleanText.slice(0, s) + '\n' + cleanText.slice(e);
      }
    }

    cleanText = cleanText
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+$/gm, '')
      .trim();

    if (toolCalls.length > 0) {
      const names = toolCalls
        .map((t) => {
          switch (t.tool) {
            case 'read_file': return 'خواندن فایل';
            case 'write_file': return 'نوشتن فایل';
            case 'list_directory': return 'اسکن پوشه';
            case 'execute_terminal_command': return 'اجرای دستور ترمینال';
            case 'search_workspace': return 'جستجو در پروژه';
            default: return t.tool;
          }
        })
        .join('، ');

      const summaryLine = `\n\n**در حال اجرای ابزارها:** ${names} (${toolCalls.length} مورد)`;
      if (!cleanText.includes('در حال اجرای ابزارها')) {
        cleanText += summaryLine;
      }
    }

    if (!cleanText) {
      if (toolCalls.length > 0) {
        cleanText = 'درخواست شما پردازش شد و ابزارهای زیر برای اجرا آماده‌اند.';
      } else {
        cleanText = rawContent.trim() || 'پاسخ خالی دریافت شد.';
      }
    }

    return { text: cleanText, thinking, toolCalls };
  } catch (err: any) {
    return {
      text: `خطا: ${err.message}`,
      toolCalls: []
    };
  }
}

export async function executeTool(toolCall: ToolCall, workspacePath: string | null): Promise<ToolCall> {
  const native = window.hooyarNative;
  const copyTool: ToolCall = { ...toolCall, status: 'running' };

  if (!native) {
    copyTool.status = 'failed';
    copyTool.error = 'محیط نیتیو در دسترس نیست.';
    return copyTool;
  }

  try {
    switch (toolCall.tool) {
      case 'read_file': {
        const p = toolCall.args.path || toolCall.args.filePath;
        const res = await native.readFile(p);
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
        const p = toolCall.args.path || toolCall.args.filePath;
        const content = toolCall.args.content || '';
        const res = await native.writeFile(p, content);
        if (res.success) {
          copyTool.status = 'completed';
          copyTool.result = `فایل ذخیره شد: ${p}`;
        } else {
          copyTool.status = 'failed';
          copyTool.error = res.error;
        }
        break;
      }
      case 'list_directory': {
        const p = toolCall.args.path || workspacePath || '.';
        const res = await native.readDir(p);
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
          copyTool.result = res.stdout || res.stderr || 'اجرا شد.';
        } else {
          copyTool.status = 'failed';
          copyTool.error = res.error || res.stderr;
        }
        break;
      }
      case 'search_workspace': {
        const q = toolCall.args.query;
        const res = await native.searchWorkspace(q, workspacePath || undefined);
        if (res.success) {
          copyTool.status = 'completed';
          copyTool.result = res.results;
        } else {
          copyTool.status = 'failed';
          copyTool.error = res.error;
        }
        break;
      }
      default:
        copyTool.status = 'failed';
        copyTool.error = 'ابزار نامعتبر.';
    }
  } catch (err: any) {
    copyTool.status = 'failed';
    copyTool.error = err.message;
  }

  return copyTool;
}
