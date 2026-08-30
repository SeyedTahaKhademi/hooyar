import { Message, ProviderConfig, ToolCall } from '../types';

declare global {
  interface Window {
    hooyarNative?: {
      selectFolder: () => Promise<string | null>;
      readDir: (dirPath: string) => Promise<{ success: boolean; tree?: any[]; error?: string }>;
      readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
      writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
      deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      executeTerminal: (command: string, cwd?: string) => Promise<{ success: boolean; stdout: string; stderr: string; error?: string }>;
      loadConfig: () => Promise<any>;
      saveConfig: (data: any) => Promise<boolean>;
    };
  }
}

export const SYSTEM_PROMPT_DEFAULT = `You are Hooyar (هویار), an elite autonomous AI Coding Agent running directly on the user's desktop computer.
You assist developers in writing code, creating projects, debugging errors, managing workspace files, and executing terminal commands.

Capabilities & Tools:
You can request tool actions using JSON format in your response block:
\`\`\`json
{
  "tool": "read_file" | "write_file" | "list_directory" | "execute_terminal_command" | "search_workspace",
  "args": {
    "path": "path/to/file",
    "content": "file contents",
    "command": "terminal command line"
  }
}
\`\`\`

Tool details:
1. read_file: Reads content of a target file.
2. write_file: Creates a new file or updates existing file content.
3. list_directory: Lists directory contents.
4. execute_terminal_command: Runs shell/powershell commands (npm install, python script.py, etc.) in the active workspace.
5. search_workspace: Finds files or text matching a query.

Directives:
- Respond politely in Persian (فونت وزیر) for explanations, while keeping code, file paths, and terminal commands accurately formatted in standard syntax.
- Always provide clean, efficient, production-ready code.
- When generating files, use the write_file tool JSON blocks so the user can apply them directly to their machine.`;

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
    ...messages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.content
    }))
  ];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: provider.selectedModel,
        messages: apiMessages,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(formatProviderError(provider, response.status, errText));
    }

    const data = await response.json();
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
            id: 'tool-' + Math.random().toString(36).substr(2, 9),
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
