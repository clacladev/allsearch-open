import { app, BrowserWindow, dialog, nativeImage, shell } from 'electron';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AllSearchRuntime } from '../cli/runtime';

app.setName('AllSearch');

let mainWindow: BrowserWindow | undefined;
let runtime: AllSearchRuntime | undefined;
let quitting = false;

/** How often the window reloads after a failed load before giving up and just showing itself. */
const LOAD_RETRY_ATTEMPTS = 20;
const LOAD_RETRY_DELAY_MS = 3_000;
/** Never leave the user with an invisible window longer than this. */
const FORCE_SHOW_TIMEOUT_MS = 60_000;

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
  let retriesRemaining = LOAD_RETRY_ATTEMPTS;
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
  // `ready-to-show` only fires after a successful first paint. If the first load fails or stalls
  // (slow cold start, transient 404 while routes initialize), the window would otherwise stay
  // hidden forever with no way back — running processes, bouncing Dock icon, no window.
  mainWindow.webContents.on('did-finish-load', () => mainWindow?.show());
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedUrl) => {
    console.error(`AllSearch window failed to load ${validatedUrl}: ${errorDescription} (${errorCode})`);
    if (retriesRemaining > 0) {
      retriesRemaining -= 1;
      setTimeout(() => void mainWindow?.loadURL(url), LOAD_RETRY_DELAY_MS);
    } else {
      mainWindow?.show();
    }
  });
  // Last resort: never leave the user with an invisible window.
  setTimeout(() => mainWindow?.show(), FORCE_SHOW_TIMEOUT_MS);
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    if (new URL(navigationUrl).origin !== allowedOrigin) event.preventDefault();
  });
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (new URL(targetUrl).origin !== allowedOrigin) {
      try {
        const parsed = new URL(targetUrl);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') void shell.openExternal(targetUrl);
      } catch {
        // ignore unparseable URLs
      }
    }
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
