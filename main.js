const { app, BrowserWindow, Tray, Menu, ipcMain, screen, globalShortcut, nativeImage, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

const store = new Store({
  defaults: {
    crosshairMode: 'generator',
    shape: 'cross',
    color: '#ff6600',
    size: 30,
    thickness: 3,
    gap: 6,
    opacity: 0.8,
    offsetX: 0,
    offsetY: 0,
    customImagePath: '',
    monitorIndex: 0,
    visible: true,
    autoStart: false,
    outlineEnabled: false,
    outlineThickness: 1,
    outlineColor: '#000000',
    imageSize: 60,
    hotkey: 'Control+Shift+H',
    activeProfile: 'Default',
    profiles: {
      Default: {
        crosshairMode: 'generator',
        shape: 'cross',
        color: '#ff6600',
        size: 30,
        thickness: 3,
        gap: 6,
        opacity: 0.8,
        offsetX: 0,
        offsetY: 0,
        customImagePath: '',
        outlineEnabled: false,
        outlineThickness: 1,
        outlineColor: '#000000',
        imageSize: 60
      }
    }
  }
});

let controlPanel = null;
let overlay = null;
let tray = null;
let overlayVisible = store.get('visible');

function createControlPanel() {
  controlPanel = new BrowserWindow({
    width: 860,
    height: 680,
    resizable: true,
    frame: true,
    icon: path.join(__dirname, 'assets', 'icons', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  controlPanel.loadFile('dashboard.html');

  controlPanel.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      controlPanel.hide();
    }
  });

  controlPanel.on('closed', () => {
    controlPanel = null;
  });
}

function createOverlay() {
  const displays = screen.getAllDisplays();
  const targetIndex = store.get('monitorIndex');
  const targetDisplay = displays[targetIndex] || displays[0];
  const { x, y, width, height } = targetDisplay.bounds;
  const centerX = x + Math.floor(width / 2);
  const centerY = y + Math.floor(height / 2);

  overlay = new BrowserWindow({
    x: centerX - 200,
    y: centerY - 200,
    width: 400,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  overlay.loadFile('overlay.html');
  overlay.setIgnoreMouseEvents(true, { forward: true });

  if (!overlayVisible) {
    overlay.hide();
  }
}

function createTray() {
  const trayIconPath = path.join(__dirname, 'assets', 'icons', 'icon.ico');
  let trayIcon = nativeImage.createFromPath(trayIconPath);
  if (trayIcon.isEmpty()) {
    trayIcon = nativeImage.createEmpty();
  }
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Control Panel',
      click: () => {
        if (controlPanel) {
          controlPanel.show();
          controlPanel.focus();
        }
      }
    },
    {
      label: 'Toggle Crosshair',
      click: () => {
        toggleOverlay();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Crosshair Way');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (controlPanel) {
      controlPanel.show();
      controlPanel.focus();
    }
  });
}

function toggleOverlay() {
  overlayVisible = !overlayVisible;
  store.set('visible', overlayVisible);
  if (overlay) {
    if (overlayVisible) {
      overlay.show();
    } else {
      overlay.hide();
    }
  }
}

function registerHotkey(key) {
  globalShortcut.unregisterAll();
  if (!key || typeof key !== 'string') return;
  try {
    globalShortcut.register(key, () => {
      toggleOverlay();
    });
  } catch (e) {
    console.error('Failed to register hotkey:', e);
  }
}

function updateOverlayPosition() {
  if (!overlay) return;
  const displays = screen.getAllDisplays();
  const targetIndex = store.get('monitorIndex');
  const targetDisplay = displays[targetIndex] || displays[0];
  const { x, y, width, height } = targetDisplay.bounds;
  const centerX = x + Math.floor(width / 2);
  const centerY = y + Math.floor(height / 2);
  const offsetX = store.get('offsetX') || 0;
  const offsetY = store.get('offsetY') || 0;
  overlay.setPosition(centerX - 200 + offsetX, centerY - 200 + offsetY);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createControlPanel();
  createOverlay();
  createTray();

  registerHotkey(store.get('hotkey'));

  app.setLoginItemSettings({
    openAtLogin: store.get('autoStart')
  });
});

app.on('window-all-closed', (event) => {
  event.preventDefault();
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

ipcMain.handle('get-settings', () => {
  return store.store;
});

ipcMain.handle('update-setting', (event, key, value) => {
  store.set(key, value);
  if (key === 'monitorIndex' || key === 'offsetX' || key === 'offsetY') {
    updateOverlayPosition();
  }
  if (key === 'crosshairMode' || key === 'shape' || key === 'color' || key === 'size' || key === 'thickness' || key === 'gap' || key === 'opacity' || key === 'customImagePath' || key === 'outlineEnabled' || key === 'outlineThickness' || key === 'outlineColor' || key === 'imageSize') {
    if (overlay) {
      overlay.webContents.send('update-crosshair', store.store);
    }
  }
  if (key === 'autoStart') {
    app.setLoginItemSettings({ openAtLogin: value });
  }
  return true;
});

ipcMain.handle('toggle-overlay', () => {
  toggleOverlay();
  return overlayVisible;
});

ipcMain.handle('get-overlay-visibility', () => {
  return overlayVisible;
});

ipcMain.handle('get-monitors', () => {
  const displays = screen.getAllDisplays();
  return displays.map((d, i) => ({
    index: i,
    name: `Display ${i + 1}`,
    bounds: d.bounds
  }));
});

ipcMain.handle('pick-image', async () => {
  if (!controlPanel) return null;
  const result = await dialog.showOpenDialog(controlPanel, {
    properties: ['openFile'],
    filters: [{ name: 'PNG Images', extensions: ['png'] }]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-crosshair-state', () => {
  return store.store;
});

ipcMain.handle('get-hotkey', () => {
  return store.get('hotkey');
});

ipcMain.handle('set-hotkey', (event, key) => {
  store.set('hotkey', key);
  registerHotkey(key);
  return true;
});

ipcMain.handle('validate-hotkey', (event, key) => {
  if (!key || typeof key !== 'string') return false;
  const parts = key.split('+');
  if (parts.length < 2) return false;
  const mods = ['Command', 'Control', 'CommandOrControl', 'Alt', 'Shift', 'Super'];
  const hasMod = parts.slice(0, -1).some(p => mods.includes(p));
  return hasMod;
});

ipcMain.handle('open-external', (event, url) => {
  if (url && typeof url === 'string') {
    shell.openExternal(url);
  }
  return true;
});

ipcMain.handle('force-overlay-sync', () => {
  if (overlay) {
    overlay.webContents.send('update-crosshair', store.store);
  }
  return true;
});

ipcMain.handle('get-profiles', () => {
  return {
    profiles: store.get('profiles'),
    activeProfile: store.get('activeProfile')
  };
});

ipcMain.handle('save-profile', (event, name, profileData) => {
  const profiles = store.get('profiles');
  profiles[name] = profileData;
  store.set('profiles', profiles);
  store.set('activeProfile', name);
  return true;
});

ipcMain.handle('load-profile', (event, name) => {
  const profiles = store.get('profiles');
  const profile = profiles[name];
  if (!profile) return false;
  store.set('activeProfile', name);
  Object.keys(profile).forEach(key => {
    store.set(key, profile[key]);
  });
  updateOverlayPosition();
  if (overlay) {
    overlay.webContents.send('update-crosshair', store.store);
  }
  return true;
});

ipcMain.handle('delete-profile', (event, name) => {
  if (name === 'Default') return false;
  const profiles = store.get('profiles');
  delete profiles[name];
  store.set('profiles', profiles);
  store.set('activeProfile', 'Default');
  return true;
});

ipcMain.on('update-overlay-crosshair', (event, data) => {
  if (overlay) {
    overlay.webContents.send('update-crosshair', data);
  }
});
