const { app, BrowserWindow, shell, session, ipcMain } = require('electron');
const { fork } = require('child_process');
const path = require('path');
const isDev = !app.isPackaged;

let mainWindow;
let serverProcess;

function startServer() {
    if (isDev) return;

    const serverPath = path.join(process.resourcesPath, 'app/server/server.js');
    console.log('Starting server from:', serverPath);

    serverProcess = fork(serverPath, [], {
        env: { ...process.env, PORT: 9003, HOSTNAME: 'localhost' }
    });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    // ... [existing protocol handling code] ...
    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient('nextup', process.execPath, [path.resolve(process.argv[1])]);
        }
    } else {
        app.setAsDefaultProtocolClient('nextup');
    }

    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
            const url = commandLine.find(arg => arg.startsWith('nextup://'));
            if (url) handleDeepLink(url);
        }
    });

    app.on('open-url', (event, url) => {
        event.preventDefault();
        if (mainWindow) {
            handleDeepLink(url);
        }
    });

    ipcMain.on('open-external', (event, url) => {
        shell.openExternal(url);
    });

    // Custom Window Controls
    ipcMain.on('window-minimize', () => mainWindow?.minimize());
    ipcMain.on('window-maximize', () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow?.maximize();
        }
    });
    ipcMain.on('window-close', () => mainWindow?.close());
}

function handleDeepLink(url) {
    try {
        const urlObj = new URL(url);
        const idToken = urlObj.searchParams.get('idToken');
        if (idToken && mainWindow) {
            mainWindow.webContents.send('auth-token-received', { idToken });
        }
    } catch (err) {
        console.error('Deep link error:', err);
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        frame: false, // Frameless window for custom titlebar
        titleBarStyle: 'hidden', // Hide default titlebar
        title: 'NextUp',
        icon: path.join(__dirname, '../resources/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        backgroundColor: '#000000',
        show: false,
    });

    const startUrl = isDev
        ? 'http://localhost:9002/login'
        : 'http://localhost:9003/login';

    // In production, wait a moment for server to start or retry
    if (!isDev) {
        setTimeout(() => {
            mainWindow.loadURL(startUrl).catch(e => {
                console.log('Retrying loadURL...', e);
                setTimeout(() => mainWindow.loadURL(startUrl), 1000);
            });
        }, 1000);
    } else {
        mainWindow.loadURL(startUrl);
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        // ... [existing window open handler] ...
        // Check if it's a Google OAuth URL
        if (url.includes('accounts.google.com') ||
            url.includes('firebase') ||
            url.includes('googleapis.com') ||
            url.includes('google.com/o/oauth')) {

            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    width: 500,
                    height: 700,
                    parent: mainWindow,
                    modal: false,
                    autoHideMenuBar: true,
                    webPreferences: {
                        nodeIntegration: false,
                        contextIsolation: true,
                        partition: 'persist:oauth',
                    }
                }
            };
        }

        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
}

app.whenReady().then(() => {
    startServer();
    createWindow();
});

app.on('will-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
