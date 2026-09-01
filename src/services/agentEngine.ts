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

Capabilities & Tools:
You can request tool actions using JSON blocks in your response:
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

Directives:
- Respond politely in Persian (فارسی) for explanations.
- Keep code, file paths, and terminal commands in their original English/Standard syntax.
- When generating files, ALWAYS use the write_file tool so the user can apply changes.
- If you need information from the codebase to answer, use search_workspace or list_directory first.`;

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
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(formatProviderError(provider, response.status, response.text));
    }

    const data = JSON.parse(response.text);
    const rawContent = data.choices?.[0]?.message?.content || 'پاسخی دریافت نشد.';

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
      } catch (e) {}
    }

    return { text: rawContent, toolCalls };
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
