const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('crosshairAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSetting: (key, value) => ipcRenderer.invoke('update-setting', key, value),
  toggleOverlay: () => ipcRenderer.invoke('toggle-overlay'),
  getOverlayVisibility: () => ipcRenderer.invoke('get-overlay-visibility'),
  getMonitors: () => ipcRenderer.invoke('get-monitors'),
  pickImage: () => ipcRenderer.invoke('pick-image'),
  getCrosshairState: () => ipcRenderer.invoke('get-crosshair-state'),
  getHotkey: () => ipcRenderer.invoke('get-hotkey'),
  setHotkey: (key) => ipcRenderer.invoke('set-hotkey', key),
  validateHotkey: (key) => ipcRenderer.invoke('validate-hotkey', key),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  forceOverlaySync: () => ipcRenderer.invoke('force-overlay-sync'),
  onUpdateCrosshair: (callback) => {
    ipcRenderer.on('update-crosshair', (event, data) => callback(data));
  }
});
