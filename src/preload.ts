import { ipcRenderer } from "electron";

function overrideNotification() {
    try {
        const NativeNotification = window.Notification;
        // @ts-ignore
        window.Notification = class extends NativeNotification {
            constructor(title: string, options?: NotificationOptions) {
                super(title, options);
                this.onclick = (_event: Event) => {
                    ipcRenderer.send("notification-click");
                };
            }
        };
    } catch (e) {
        console.error("Failed to override Notification", e);
    }
}

function handleChromeVersionBug() {
    window.addEventListener("DOMContentLoaded", () => {
        if (document.getElementsByClassName("landing-title version-title").length !== 0) {
            ipcRenderer.send("chrome-version-bug");
        }
    });
}

overrideNotification();
handleChromeVersionBug();
