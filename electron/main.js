const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');

let mainWindow;
const configPath = path.join(app.getPath('userData'), 'hooyar_config.json');

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading config:', err);
  }
  return {};
}

function saveConfig(data) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving config:', err);
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 1000,
    minHeight: 650,
    title: 'هویار | Hooyar AI Coding Agent',
    icon: path.join(__dirname, '../assets/hooyar.png'),
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
    backgroundColor: '#0b0f19'
  });

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

// IPC Handlers
ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('fs:readDir', async (_, dirPath) => {
  try {
    const ignoreList = ['node_modules', '.git', '.dist', 'build', 'dist', '.vite', '.vscode', '__pycache__', '.idea'];
    
    function scan(dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      const results = [];
      
      for (const item of items) {
        if (ignoreList.includes(item.name)) continue;
        const fullPath = path.join(dir, item.name);
        const isDir = item.isDirectory();
        
        results.push({
          name: item.name,
          path: fullPath,
          isDirectory: isDir,
          children: isDir ? scan(fullPath) : undefined
        });
      }
      
      return results.sort((a, b) => (b.isDirectory ? 1 : 0) - (a.isDirectory ? 1 : 0) || a.name.localeCompare(b.name));
    }

    return { success: true, tree: scan(dirPath) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:readFile', async (_, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:writeFile', async (_, { filePath, content }) => {
  try {
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

ipcMain.handle('terminal:execute', async (_, { command, cwd }) => {
  return new Promise((resolve) => {
    const options = { cwd: cwd || process.cwd(), shell: 'powershell.exe', maxBuffer: 10 * 1024 * 1024 };
    exec(command, options, (error, stdout, stderr) => {
      resolve({
        success: !error,
        stdout: stdout ? stdout.toString() : '',
        stderr: stderr ? stderr.toString() : '',
        error: error ? error.message : null
      });
    });
  });
});

ipcMain.handle('config:load', async () => {
  return loadConfig();
});

ipcMain.handle('config:save', async (_, data) => {
  return saveConfig(data);
});
