import { t } from '@main/services/AppLocale';
import { dbService } from '@main/services/DbService';
import { windowService } from '@main/services/WindowService';
import { isMacOS } from '@main/utils/systeminfo';
import { APP_NAME } from '@shared/config/appinfo';
import { IPC_CHANNEL } from '@shared/config/ipcChannel';
import { WINDOW_NAME } from '@shared/config/window';
import { isNil } from '@shared/modules/validate';
import type { BrowserWindow, MenuItem, MenuItemConstructorOptions } from 'electron';
import { Menu } from 'electron';

class MenuService {
  private static instance: MenuService;
  private contextMenu: Menu | null = null;

  constructor() {}

  public static getInstance(): MenuService {
    if (!MenuService.instance) {
      MenuService.instance = new MenuService();
    }
    return MenuService.instance;
  }

  private createMenu() {
    this.destroyMenu();

    this.updateContextMenu();

    if (!isMacOS) {
      return;
    }

    Menu.setApplicationMenu(this.contextMenu);
  }

  private updateContextMenu() {
    const template = [
      {
        label: APP_NAME,
        role: 'appMenu',
        submenu: [
          { label: t('system.app.about', { name: APP_NAME }), role: 'about', visible: !!isMacOS },
          { type: 'separator' },
          { label: t('system.app.hide'), role: 'hide' },
          { label: t('system.app.hideOthers'), role: 'hideOthers' },
          { label: t('system.app.showAll'), role: 'showAll' },
          { type: 'separator' },
          { label: t('system.app.quit', { name: APP_NAME }), role: 'quit' },
        ],
      },
      {
        label: t('system.file.title'),
        role: 'fileMenu',
        submenu: [{ label: t('system.file.closeWindow'), role: 'close' }],
      },
      {
        label: t('system.edit.title'),
        role: 'editMenu',
        submenu: [
          { label: t('system.edit.undo'), role: 'undo' },
          { label: t('system.edit.redo'), role: 'redo' },
          { type: 'separator' },
          { label: t('system.edit.cut'), role: 'cut' },
          { label: t('system.edit.copy'), role: 'copy' },
          { label: t('system.edit.paste'), role: 'paste' },
          { label: t('system.edit.delete'), role: 'delete' },
          { label: t('system.edit.selectAll'), role: 'selectAll' },
        ],
      },
      {
        label: t('system.view.title'),
        role: 'viewMenu',
        submenu: [
          { label: t('system.view.reload'), role: 'reload' },
          { label: t('system.view.forceReload'), role: 'forceReload' },
          { label: t('system.view.toggleDevTools'), role: 'toggleDevTools' },
          { type: 'separator' },
          {
            label: t('system.view.actualSize'),
            // role: 'resetZoom',
            accelerator: 'CmdOrCtrl+0',
            click: async () => {
              windowService.setZoomWindows(1);
              await dbService.setting.update({ key: 'zoom', value: 1 });

              const mainWindow = windowService.getWindow(WINDOW_NAME.MAIN);
              if (!isNil(mainWindow)) mainWindow.webContents.send(IPC_CHANNEL.ZOOM_UPDATED, 1);
            },
          },
          {
            label: t('system.view.zoomIn'),
            // role: 'zoomIn',
            accelerator: 'CmdOrCtrl+=',
            click: async (_menuItem: MenuItem, window: BrowserWindow) => {
              const currentZoom = window.webContents.getZoomFactor();
              const zoom = currentZoom + 0.2;
              if (zoom < 0.8 || zoom > 1.8) return;

              windowService.setZoomWindows(zoom);
              await dbService.setting.update({ key: 'zoom', value: zoom });

              const mainWindow = windowService.getWindow(WINDOW_NAME.MAIN);
              if (!isNil(mainWindow)) mainWindow.webContents.send(IPC_CHANNEL.ZOOM_UPDATED, zoom);
            },
          },
          {
            label: t('system.view.zoomOut'),
            // role: 'zoomOut',
            accelerator: 'CmdOrCtrl+-',
            click: async (_menuItem: MenuItem, window: BrowserWindow) => {
              const currentZoom = window.webContents.getZoomFactor();
              const zoom = currentZoom - 0.2;
              if (zoom < 0.8 || zoom > 1.8) return;

              windowService.setZoomWindows(zoom);
              await dbService.setting.update({ key: 'zoom', value: zoom });

              const mainWindow = windowService.getWindow(WINDOW_NAME.MAIN);
              if (!isNil(mainWindow)) mainWindow.webContents.send(IPC_CHANNEL.ZOOM_UPDATED, zoom);
            },
          },
          { type: 'separator' },
          { label: t('system.view.toggleFullScreen'), role: 'togglefullscreen' },
        ],
      },
      {
        label: t('system.window.title'),
        role: 'windowMenu',
        submenu: [
          { label: t('system.window.minimize'), role: 'minimize' },
          { label: t('system.window.zoom'), role: 'zoom' },
          // { label: t('system.window.fill'), role: 'front' },
          // { label: t('system.window.center'), role: 'center' },
        ],
      },
    ].filter(Boolean) as MenuItemConstructorOptions[];

    this.contextMenu = Menu.buildFromTemplate(template);
  }

  public updateMenu(showMenu: boolean = false) {
    if (showMenu) {
      this.createMenu();
    } else {
      this.destroyMenu();
    }
  }

  private destroyMenu() {
    if (this.contextMenu) {
      Menu.setApplicationMenu(null);
      this.contextMenu = null;
    }
  }
}

export const menuService = MenuService.getInstance();
