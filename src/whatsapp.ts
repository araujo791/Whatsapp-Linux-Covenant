import { app, BrowserWindow, ipcMain, nativeTheme, session, Session, shell } from "electron";
import path from "path";
import ChromeVersionFix from "./fix/chrome-version-fix";
import Electron21Fix from "./fix/electron-21-fix";
import HotkeyModule from "./module/hotkey-module";
import ModuleManager from "./module/module-manager";
import TrayModule from "./module/tray-module";
import WindowSettingsModule from "./module/window-settings-module";

// Dynamically use the running Chromium version to avoid WhatsApp Web version mismatch
const CHROME_VERSION = process.versions.chrome || "130.0.6723.116";
const USER_AGENT = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME_VERSION} Safari/537.36`;

export default class WhatsApp {

    private readonly window: BrowserWindow;
    private readonly moduleManager: ModuleManager;
    private secondAccountWindow: BrowserWindow | null = null;
    public quitting = false;

    constructor() {
        nativeTheme.themeSource = "system";

        this.window = new BrowserWindow({
            title: "WhatsApp",
            width: 1100,
            height: 700,
            minWidth: 650,
            minHeight: 550,
            show: !process.argv.includes("--start-hidden"),
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: false, // native Notification override in preload :(
                spellcheck: true
            }
        });

        this.moduleManager = new ModuleManager([
            new Electron21Fix(),
            new HotkeyModule(this, this.window),
            new TrayModule(this, this.window),
            new WindowSettingsModule(this, this.window),
            new ChromeVersionFix(this)
        ]);
    }

    public init() {
        this.setupPermissions();
        this.makeLinksOpenInBrowser();
        this.registerListeners();

        this.moduleManager.beforeLoad();

        this.window.setMenu(null);
        this.window.webContents.setUserAgent(USER_AGENT);
        this.window.loadURL('https://web.whatsapp.com/', { userAgent: USER_AGENT });

        this.moduleManager.onLoad();
    }

    public reload() {
        this.window.webContents.reloadIgnoringCache();
    }

    public quit() {
        this.quitting = true;
        if (this.secondAccountWindow && !this.secondAccountWindow.isDestroyed()) {
            this.secondAccountWindow.close();
        }
        this.moduleManager.onQuit();
        app.quit();
    }

    public openSecondAccount() {
        if (this.secondAccountWindow && !this.secondAccountWindow.isDestroyed()) {
            this.secondAccountWindow.show();
            this.secondAccountWindow.focus();
            return;
        }

        this.secondAccountWindow = new BrowserWindow({
            title: "WhatsApp (Segunda Conta)",
            width: 1100,
            height: 700,
            minWidth: 650,
            minHeight: 550,
            webPreferences: {
                partition: 'persist:covenant_account2',
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: false,
                spellcheck: true
            }
        });

        this.secondAccountWindow.setMenu(null);
        this.secondAccountWindow.webContents.setUserAgent(USER_AGENT);

        this.secondAccountWindow.webContents.setWindowOpenHandler(details => {
            if (details.url != this.secondAccountWindow?.webContents.getURL()) {
                shell.openExternal(details.url);
                return { action: 'deny' };
            }
            return { action: 'allow' };
        });

        this.secondAccountWindow.loadURL('https://web.whatsapp.com/', { userAgent: USER_AGENT });

        this.secondAccountWindow.on('closed', () => {
            this.secondAccountWindow = null;
        });
    }

    private setupPermissions() {
        const setupSession = (sess: Session) => {
            sess.setPermissionRequestHandler((_webContents, permission, callback) => {
                const allowed = ["notifications", "media", "mediaKeySystem", "fullscreen"];
                callback(allowed.includes(permission));
            });

            sess.setPermissionCheckHandler((_webContents, permission) => {
                const allowed = ["notifications", "media", "mediaKeySystem", "fullscreen"];
                return allowed.includes(permission);
            });
        };

        setupSession(session.defaultSession);
        setupSession(session.fromPartition("persist:covenant_account2"));
    }

    private makeLinksOpenInBrowser() {
        this.window.webContents.setWindowOpenHandler(details => {
            if (details.url != this.window.webContents.getURL()) {
                shell.openExternal(details.url);
                return { action: 'deny' };
            }
            return { action: 'allow' };
        });
    }

    private registerListeners() {
        app.on('second-instance', () => {
            this.window.show();
            this.window.focus();
        });

        ipcMain.on('notification-click', () => this.window.show());

        this.window.webContents.on('preload-error', (_event, preloadPath, error) => {
            console.error('PRELOAD ERROR in', preloadPath, error);
        });

        ipcMain.on('open-external-url', (_event, url: string) => {
            if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
                shell.openExternal(url);
            }
        });

        ipcMain.on('open-second-account', () => this.openSecondAccount());
    }
};
