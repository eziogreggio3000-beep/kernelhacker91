const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('kh91Desktop', {
  strip: on => ipcRenderer.invoke('kh91:strip', !!on),
  quit: () => ipcRenderer.invoke('kh91:quit'),
  onToggleStrip: fn => ipcRenderer.on('kh91:toggle-strip', () => fn())
});
