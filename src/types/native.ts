/**
 * Typed contract of the Electron preload bridge (window.hooyarNative).
 * Declared once here so every renderer module shares the same types.
 */
export interface NativeBridge {
  selectFolder: () => Promise<string | null>;
  setWorkspace: (workspacePath: string | null) => Promise<boolean>;
  readDir: (dirPath: string) => Promise<{ success: boolean; tree?: any[]; error?: string }>;
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  executeTerminal: (
    command: string,
    cwd?: string
  ) => Promise<{ success: boolean; stdout: string; stderr: string; error?: string }>;
  searchWorkspace: (
    query: string,
    targetPath?: string | null
  ) => Promise<{
    success: boolean;
    results?: Array<{ type: 'filename' | 'content'; path: string; snippet: string }>;
    error?: string;
  }>;
  aiRequest: (payload: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeoutMs?: number;
  }) => Promise<{ ok: boolean; status: number; text: string }>;
  saveTextFile: (defaultName: string, content: string) => Promise<string | null | { error: string }>;
  loadConfig: () => Promise<any>;
  saveConfig: (data: any) => Promise<boolean>;
}

declare global {
  interface Window {
    hooyarNative?: NativeBridge;
  }
}

export {};
