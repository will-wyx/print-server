/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, Tray, shell, ipcMain, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
// @ts-ignore
import Store from 'electron-store';

import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import koa from './server';
import logger from './logger';

const store = new Store();

/**
 * 设置 store 默认值
 */
(function () {
  if (!store.has('printer')) {
    const printer = 'Chenxin N80B';
    store.set('printer', printer);
    logger.info(`store.printer 设置默认打印机 ${printer}`);
  } else {
    const printer = store.get('printer');
    logger.info(`store.printer 当前打印机 ${printer}`);
  }

  if (!store.has('openAtLogin')) {
    store.set('openAtLogin', true);
    logger.info(`store.openAtLogin 设置开机启动 ${true}`);
    const { openAtLogin } = app.getLoginItemSettings();
    if (!openAtLogin) {
      app.setLoginItemSettings({ openAtLogin: true });
    }
  } else {
    const openAtLogin = store.get('openAtLogin');
    logger.info(`store.openAtLogin 当前开机启动 ${openAtLogin}`);
  }
})();

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.on('changeLoginOpen', (e, openAtLogin) => {
  store.set('openAtLogin', openAtLogin);
  logger.info(`store.openAtLogin 设置开机启动 ${openAtLogin}`);
  app.setLoginItemSettings({ openAtLogin });
});

ipcMain.on('change', (e, printer) => {
  store.set('printer', printer);
  logger.info(`store.printer 设置默认打印机 ${printer}`);
});

ipcMain.handle('refresh', async () => {
  const printer = store.get('printer');
  const openAtLogin = store.get('openAtLogin');
  const printers = await mainWindow?.webContents.getPrintersAsync();
  return {
    printer,
    openAtLogin,
    printers: printers?.map((item: any) => item.name),
  };
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const createWindow = async () => {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 500,
    height: 500,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  const contextMenu: any = Menu.buildFromTemplate([
    {
      label: '退出',
      click: () => {
        app.exit();
      },
    },
  ]);

  const tray = new Tray(getAssetPath('icon.png'));
  tray.setContextMenu(contextMenu);
  tray.setToolTip('print-server');
  // 托盘图标被双击
  tray.on('double-click', () => {
    // 显示窗口
    mainWindow?.show();
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));
  mainWindow.hide();

  mainWindow.on('close', (ev: any) => {
    // 阻止最小化
    ev.preventDefault();
    // 隐藏窗口
    mainWindow?.hide();
  });

  // 窗口最小化
  mainWindow.on('minimize', (ev: any) => {
    // 阻止最小化
    ev.preventDefault();
    // 隐藏窗口
    mainWindow?.hide();
  });

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
  koa.listen(38250);
  logger.info('服务启动');
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
