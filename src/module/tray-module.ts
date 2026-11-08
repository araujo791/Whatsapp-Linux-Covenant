import { BrowserWindow, Menu, MenuItem, NativeImage, Tray } from "electron";
import { findIcon, getUnreadMessages } from "../util";
import WhatsApp from "../whatsapp";
import Module from "./module";

export default class TrayModule extends Module {

    private tray: Tray | null = null;
    private icon: NativeImage | null = null;
    private iconUnread: NativeImage | null = null;

    constructor(
        private readonly whatsApp: WhatsApp,
        private readonly window: BrowserWindow
    ) {
        super();
    }

    public override onLoad() {
        this.icon = findIcon("io.github.covenant.WhatsAppDesktop.png");
        this.iconUnread = findIcon("io.github.covenant.WhatsAppDesktop-unread.png");
        this.tray = new Tray(this.icon);

        this.tray.on("click", () => this.onClickFirstItem());

        this.updateMenu();
        this.registerListeners();
    }

    private updateMenu(unread: number = getUnreadMessages(this.window.title)) {
        if (!this.tray) return;

        const menu = Menu.buildFromTemplate([
            {
                label: this.window.isVisible() ? "Minimize to tray" : "Show WhatsApp",
                click: () => this.onClickFirstItem()
            },
            {
                label: "Quit WhatsApp",
                click: () => this.whatsApp.quit()
            }
        ]);

        let tooltip = "WhatsApp Desktop";

        if (unread != 0) {
            menu.insert(0, new MenuItem({
                label: unread + " unread chats",
                enabled: false
            }));

            menu.insert(1, new MenuItem({ type: "separator" }));

            tooltip = tooltip + " - " + unread + " unread chats";
        }

        this.tray.setContextMenu(menu);
        this.tray.setToolTip(tooltip);
    }

    private onClickFirstItem() {
        if (this.window.isVisible()) {
            this.window.hide();
        } else {
            this.window.show();
            this.window.focus();
        }

        this.updateMenu();
    }

    private registerListeners() {
        this.window.on("show", () => this.updateMenu());
        this.window.on("hide", () => this.updateMenu());

        this.window.on("close", event => {
            if (this.whatsApp.quitting) return;

            event.preventDefault();
            this.window.hide();
        });

        this.window.webContents.on("page-title-updated", (_event, title, explicitSet) => {
            if (!explicitSet || !this.tray) return;

            let unread = getUnreadMessages(title);

            this.updateMenu(unread);
            if (this.icon && this.iconUnread) {
                this.tray.setImage(unread == 0 ? this.icon : this.iconUnread);
            }
        });
    }
};
