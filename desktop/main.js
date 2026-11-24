// KERNEL HACKER '91 — desktop shell (Electron)
const { app, BrowserWindow, ipcMain, screen, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const STATE = path.join(app.getPath('userData'), 'window.json');
let win, normalBounds = null, stripOn = false;

function loadState() { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (_) { return {}; } }
function saveState() {
  try { if (win && !stripOn) fs.writeFileSync(STATE, JSON.stringify({ bounds: win.getBounds(), max: win.isMaximized() })); } catch (_) {}
}

function create() {
  const st = loadState();
  win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 360, minHeight: 60,
    ...(st.bounds || {}),
    backgroundColor: '#000000',
    title: "KERNEL HACKER '91",
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
  });
  if (st.max) win.maximize();
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'game', 'index.html'));
  win.on('close', saveState);
  // external links open in the browser
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (input.key === 'F9') { win.webContents.send('kh91:toggle-strip'); e.preventDefault(); }
    if (input.key === 'F12' && input.shift) win.webContents.toggleDevTools();
  });
}

// strip mode: shrink the window to a thin bar on top of the others
ipcMain.handle('kh91:strip', (_e, on) => {
  if (!win || on === stripOn) return stripOn;
  stripOn = !!on;
  if (stripOn) {
    if (win.isFullScreen()) win.setFullScreen(false);
    if (win.isMaximized()) win.unmaximize();
    normalBounds = win.getBounds();
    const wa = screen.getDisplayMatching(normalBounds).workArea;
    const w = Math.min(1180, wa.width), h = 96;
    win.setAlwaysOnTop(true, 'floating');
    win.setBounds({ x: wa.x + Math.round((wa.width - w) / 2), y: wa.y + wa.height - h, width: w, height: h });
  } else {
    win.setAlwaysOnTop(false);
    if (normalBounds) win.setBounds(normalBounds);
  }
  return stripOn;
});
ipcMain.handle('kh91:quit', () => app.quit());

app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
