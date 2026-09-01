const { app, BrowserWindow, ipcMain, dialog, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

let mainWindow = null;
let currentWorkspace = null;

const configPath = path.join(app.getPath('userData'), 'hooyar_config.json');

/* ------------------------------------------------------------------ */
/* Path Sandbox — every fs operation is restricted to the active      */
/* workspace folder selected by the user.                              */
/* ------------------------------------------------------------------ */

function normalizePath(p) {
  const resolved = path.resolve(String(p));
  // Windows filesystems are case-insensitive
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function isPathAllowed(targetPath) {
  if (!currentWorkspace) return false;
  if (typeof targetPath !== 'string' || !targetPath.trim()) return false;
  const root = normalizePath(currentWorkspace);
  const target = normalizePath(targetPath);
  if (target === root) return true;
  const rel = path.relative(root, target);
  return !rel.startsWith('..') && !path.isAbsolute(rel);
}

function deniedResult() {
  return {
    success: false,
    error: 'دسترسی به این مسیر مجاز نیست. فقط فایل‌ها و پوشه‌های داخل پوشه کاری انتخاب‌شده قابل دسترسی هستند.'
  };
}

/* ------------------------------------------------------------------ */
/* Config storage — encrypted at rest with safeStorage (DPAPI on      */
/* Windows) when available; falls back to plain JSON otherwise.        */
/* ------------------------------------------------------------------ */

function loadConfig() {
  try {
    if (!fs.existsSync(configPath)) return {};
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);

    if (parsed && parsed.__encrypted && parsed.payload) {
      if (safeStorage.isEncryptionAvailable()) {
        const decrypted = safeStorage.decryptString(Buffer.from(parsed.payload, 'base64'));
        return JSON.parse(decrypted);
      }
      console.error('Config is encrypted but safeStorage is unavailable in this session.');
      return {};
    }

    // Legacy plaintext config (migrates to encrypted on next save)
    return parsed;
  } catch (err) {
    console.error('Error loading config:', err);
    return {};
  }
}

function saveConfig(data) {
  try {
    let output;
    if (safeStorage.isEncryptionAvailable()) {
      output = JSON.stringify({
        __encrypted: true,
        v: 1,
        payload: safeStorage.encryptString(JSON.stringify(data)).toString('base64')
      });
    } else {
      output = JSON.stringify(data, null, 2);
    }
    fs.writeFileSync(configPath, output, 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving config:', err);
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Window                                                              */
/* ------------------------------------------------------------------ */

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 1000,
    minHeight: 650,
    title: 'هویار | Hooyar AI Coding Agent',
    icon: path.join(__dirname, '../assets/hooyar.ico'),
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false
    },
    backgroundColor: '#0b0f19'
  });

  // Harden: the renderer must never navigate away or open new windows
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadURL('http://localhost:5173');
    }
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* ------------------------------------------------------------------ */
/* IPC — dialogs & workspace                                           */
/* ------------------------------------------------------------------ */

ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  const selected = result.filePaths[0];
  currentWorkspace = path.resolve(selected);
  return selected;
});

ipcMain.handle('workspace:set', (_, workspacePath) => {
  currentWorkspace =
    typeof workspacePath === 'string' && workspacePath.trim()
      ? path.resolve(workspacePath)
      : null;
  return true;
});

ipcMain.handle('dialog:saveTextFile', async (_, { defaultName, content }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: typeof defaultName === 'string' && defaultName ? defaultName : 'hooyar-export.md'
    });
    if (result.canceled || !result.filePath) return null;
    fs.writeFileSync(result.filePath, String(content ?? ''), 'utf8');
    return result.filePath;
  } catch (error) {
    return { error: error.message };
  }
});

/* ------------------------------------------------------------------ */
/* IPC — file system (sandboxed to the workspace)                      */
/* ------------------------------------------------------------------ */

const IGNORE_LIST = ['node_modules', '.git', '.dist', 'build', 'dist', '.vite', '.vscode', '__pycache__', '.idea'];
const MAX_SCAN_DEPTH = 12;
const MAX_READ_FILE_BYTES = 2 * 1024 * 1024; // 2 MB

ipcMain.handle('fs:readDir', async (_, dirPath) => {
  try {
    if (!isPathAllowed(dirPath)) return deniedResult();

    function scan(dir, depth = 0) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      const results = [];

      for (const item of items) {
        if (IGNORE_LIST.includes(item.name)) continue;
        const fullPath = path.join(dir, item.name);
        const isDir = item.isDirectory();

        results.push({
          name: item.name,
          path: fullPath,
          isDirectory: isDir,
          children: isDir ? (depth < MAX_SCAN_DEPTH ? scan(fullPath, depth + 1) : []) : undefined
        });
      }

      return results.sort(
        (a, b) => (b.isDirectory ? 1 : 0) - (a.isDirectory ? 1 : 0) || a.name.localeCompare(b.name)
      );
    }

    return { success: true, tree: scan(dirPath) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:readFile', async (_, filePath) => {
  try {
    if (!isPathAllowed(filePath)) return deniedResult();
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_READ_FILE_BYTES) {
      return { success: false, error: `حجم فایل بیش از حد مجاز است (${Math.round(stat.size / 1024)} کیلوبایت؛ سقف: ۲ مگابایت).` };
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:writeFile', async (_, { filePath, content }) => {
  try {
    if (!isPathAllowed(filePath)) return deniedResult();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:deleteFile', async (_, filePath) => {
  try {
    if (!isPathAllowed(filePath)) return deniedResult();
    if (normalizePath(filePath) === normalizePath(currentWorkspace)) {
      return { success: false, error: 'حذف ریشه پوشه کاری مجاز نیست.' };
    }
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/* ------------------------------------------------------------------ */
/* IPC — terminal (sandboxed cwd + hard timeout)                       */
/* ------------------------------------------------------------------ */

const TERMINAL_TIMEOUT_MS = 120 * 1000;

ipcMain.handle('terminal:execute', async (_, { command, cwd }) => {
  if (typeof command !== 'string' || !command.trim()) {
    return { success: false, stdout: '', stderr: 'دستور خالی است.', error: null };
  }

  let workdir = currentWorkspace || os.homedir();
  if (cwd && isPathAllowed(cwd)) workdir = cwd;

  return new Promise((resolve) => {
    const options = {
      cwd: workdir,
      shell: 'powershell.exe',
      maxBuffer: 10 * 1024 * 1024,
      timeout: TERMINAL_TIMEOUT_MS,
      windowsHide: true
    };
    exec(command, options, (error, stdout, stderr) => {
      let errorMessage = error ? error.message : null;
      if (error && error.killed) {
        errorMessage = `اجرای دستور بیش از ${TERMINAL_TIMEOUT_MS / 1000} ثانیه طول کشید و متوقف شد.`;
      }
      resolve({
        success: !error,
        stdout: stdout ? stdout.toString() : '',
        stderr: stderr ? stderr.toString() : '',
        error: errorMessage
      });
    });
  });
});

/* ------------------------------------------------------------------ */
/* IPC — AI network proxy                                              */
/* keeps API keys and CORS handling out of the renderer and allows     */
/* webSecurity to stay enabled.                                        */
/* ------------------------------------------------------------------ */

ipcMain.handle('ai:request', async (_, { url, method = 'GET', headers = {}, body, timeoutMs = 300000 }) => {
  try {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return { ok: false, status: 0, text: 'آدرس سرویس نامعتبر است.' };
    }

    const host = parsed.hostname.toLowerCase();
    const isLocal =
      host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]' || host.endsWith('.localhost');

    // Only HTTPS remotes are allowed; plain HTTP is restricted to local
    // inference servers (Ollama / LM Studio / vLLM).
    if (parsed.protocol !== 'https:' && !(isLocal && parsed.protocol === 'http:')) {
      return { ok: false, status: 0, text: 'فقط درخواست‌های HTTPS (و HTTP برای سرویس‌های محلی) مجاز هستند.' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Number(timeoutMs) || 300000);

    try {
      const response = await fetch(parsed.toString(), {
        method: method || 'GET',
        headers,
        body: body ?? undefined,
        signal: controller.signal
      });
      const text = await response.text();
      return { ok: response.ok, status: response.status, text };
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    if (err && err.name === 'AbortError') {
      return { ok: false, status: 0, text: 'زمان پاسخ‌دهی سرور به پایان رسید (Timeout).' };
    }
    return { ok: false, status: 0, text: (err && err.message) || 'خطای شبکه' };
  }
});

/* ------------------------------------------------------------------ */
/* IPC — workspace search (sandboxed)                                  */
/* ------------------------------------------------------------------ */

const TEXT_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.css', '.scss', '.html',
  '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.go', '.rs', '.rb', '.php',
  '.yml', '.yaml', '.xml', '.sh', '.ps1', '.sql', '.ini', '.cfg', '.toml', '.svg',
  '.vue', '.svelte', '.swift', '.kt', '.dart'
]);
const MAX_SEARCH_RESULTS = 60;
const MAX_SEARCH_FILE_BYTES = 1024 * 1024; // 1 MB
const MAX_SEARCH_DEPTH = 10;

ipcMain.handle('fs:search', async (_, { query, targetPath }) => {
  try {
    if (!currentWorkspace) {
      return { success: false, error: 'ابتدا پوشه کاری پروژه را انتخاب کنید.' };
    }
    const root = targetPath && isPathAllowed(targetPath) ? path.resolve(targetPath) : currentWorkspace;
    const q = String(query || '').toLowerCase();
    if (!q.trim()) {
      return { success: false, error: 'عبارت جستجو خالی است.' };
    }

    const results = [];

    function walk(dir, depth) {
      if (depth > MAX_SEARCH_DEPTH || results.length >= MAX_SEARCH_RESULTS) return;
      let items;
      try {
        items = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return; // unreadable folder — skip silently
      }

      for (const item of items) {
        if (results.length >= MAX_SEARCH_RESULTS) return;
        if (IGNORE_LIST.includes(item.name)) continue;

        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          walk(fullPath, depth + 1);
          continue;
        }

        // 1) filename match
        if (item.name.toLowerCase().includes(q)) {
          results.push({ type: 'filename', path: fullPath, snippet: '' });
          continue;
        }

        // 2) content match (text files only)
        const ext = path.extname(item.name).toLowerCase();
        if (!TEXT_EXTENSIONS.has(ext)) continue;
        try {
          const stat = fs.statSync(fullPath);
          if (stat.size > MAX_SEARCH_FILE_BYTES) continue;
          const content = fs.readFileSync(fullPath, 'utf8');
          const lower = content.toLowerCase();
          const idx = lower.indexOf(q);
          if (idx !== -1) {
            const start = Math.max(0, idx - 80);
            const snippet = content
              .slice(start, idx + q.length + 120)
              .replace(/\s+/g, ' ')
              .trim();
            results.push({ type: 'content', path: fullPath, snippet });
          }
        } catch {
          // binary or unreadable file — skip
        }
      }
    }

    walk(root, 0);
    return { success: true, results };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/* ------------------------------------------------------------------ */
/* IPC — config                                                        */
/* ------------------------------------------------------------------ */

ipcMain.handle('config:load', async () => {
  return loadConfig();
});

ipcMain.handle('config:save', async (_, data) => {
  return saveConfig(data);
});
