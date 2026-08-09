const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  sendNotification: (message) => ipcRenderer.send('notification', message),
  onNotification: (callback) => {
    ipcRenderer.on('notification', (_, message) => callback(message));
  },
});