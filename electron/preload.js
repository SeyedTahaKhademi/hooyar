const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hooyarNative', {
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  saveTextFile: (options) => ipcRenderer.invoke('dialog:saveTextFile', options),
  readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', { filePath, content }),
  deleteFile: (filePath) => ipcRenderer.invoke('fs:deleteFile', filePath),
  executeTerminal: (command, cwd) => ipcRenderer.invoke('terminal:execute', { command, cwd }),
  aiRequest: (options) => ipcRenderer.invoke('ai:request', options),
  searchWorkspace: (query, targetPath) => ipcRenderer.invoke('fs:search', { query, targetPath }),
  setWorkspace: (workspacePath) => ipcRenderer.invoke('workspace:set', workspacePath),
  trustWorkspace: (workspacePath) => ipcRenderer.invoke('workspace:trust', workspacePath),
  isWorkspaceTrusted: (workspacePath) => ipcRenderer.invoke('workspace:isTrusted', workspacePath),
  showTrustDialog: () => ipcRenderer.invoke('workspace:showTrustDialog'),
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (data) => ipcRenderer.invoke('config:save', data),
  windowMinimize: () => ipcRenderer.send('window:minimize'),
  windowMaximize: () => ipcRenderer.send('window:maximize'),
  windowClose: () => ipcRenderer.send('window:close')
});
