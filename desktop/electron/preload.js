const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    isElectron: true,

    onAuthTokenReceived: (callback) => {
        ipcRenderer.on('auth-token-received', (event, tokens) => callback(tokens));
    },

    openExternalBuffer: (url) => ipcRenderer.send('open-external', url),

    // Window controls
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close')
});
