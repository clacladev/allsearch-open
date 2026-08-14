import { app, BrowserWindow, dialog, nativeImage, shell } from 'electron';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AllSearchRuntime } from '../cli/runtime';

app.setName('AllSearch');

let mainWindow: BrowserWindow | undefined;
let runtime: AllSearchRuntime | undefined;
let quitting = false;

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const runtimeRoot = app.isPackaged ? process.resourcesPath : packageRoot;
const serverEntry = app.isPackaged
  ? join(process.resourcesPath, 'standalone', 'server.js')
  : join(packageRoot, '.next', 'standalone', 'server.js');
const runnerEntry = app.isPackaged
  ? join(process.resourcesPath, 'serverRunner.cjs')
  : join(packageRoot, 'dist', 'desktop', 'serverRunner.cjs');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(start).catch(failStartup);
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', (event) => {
    if (quitting) return;
    event.preventDefault();
    void shutdownAndQuit();
  });
  process.on('SIGINT', () => void shutdownAndQuit());
  process.on('SIGTERM', () => void shutdownAndQuit());
}

async function start(): Promise<void> {
  if (!app.isPackaged && process.platform === 'darwin') {
    app.dock?.setIcon(nativeImage.createFromPath(join(packageRoot, 'resources', 'logo-1024.png')));
  }
  runtime = new AllSearchRuntime({ packageRoot: runtimeRoot, runnerEntry, serverEntry });
  const server = await runtime.start();
  createWindow(server.url);
}

function createWindow(url: string): void {
  const allowedOrigin = new URL(url).origin;
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    if (new URL(navigationUrl).origin !== allowedOrigin) event.preventDefault();
  });
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (new URL(targetUrl).origin !== allowedOrigin) void shell.openExternal(targetUrl);
    return { action: 'deny' };
  });
  void mainWindow.loadURL(url);
}

async function shutdownAndQuit(): Promise<void> {
  if (quitting) return;
  quitting = true;
  await runtime?.stop();
  app.quit();
}

function failStartup(error: unknown): void {
  console.error(error);
  void dialog.showErrorBox('AllSearch could not start', error instanceof Error ? error.message : String(error));
  void shutdownAndQuit();
}
