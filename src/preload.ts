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

// -------------------------------------------------------------
// COVENANT EXCLUSIVE FEATURES (THEMES, PRIVACY, SIDEBAR RESIZER)
// -------------------------------------------------------------

let currentSettings: any = {
    sidebar_resizable: false,
    sidebar_width: 400,
    privacy_enabled: false,
    privacy_blur_photos: false,
    privacy_blur_names: false,
    privacy_blur_messages: false,
    privacy_blur_on_window_blur: false,
    theme: 'default'
};

function getOrCreateStyle(id: string): HTMLStyleElement {
    let style = document.getElementById(id) as HTMLStyleElement;
    if (!style) {
        style = document.createElement("style");
        style.id = id;
        document.head.appendChild(style);
    }
    return style;
}

// 1. Theme Ingestion
async function applyTheme(themeName: string) {
    const style = getOrCreateStyle("covenant-theme-style");
    if (!themeName || themeName === "default") {
        style.textContent = "";
        return;
    }

    try {
        const css = await ipcRenderer.invoke("get-theme-css", themeName);
        style.textContent = css || "";
    } catch (e) {
        console.error("Failed to apply theme", e);
    }
}

// 2. Privacy Mode (Anti-Espião)
function applyPrivacy(settings: any) {
    const style = getOrCreateStyle("covenant-privacy-style");
    if (!settings.privacy_enabled) {
        style.textContent = "";
        return;
    }

    let css = "";

    // Blur profile photos
    if (settings.privacy_blur_photos) {
        css += `
            img[src*="profile"], img[src*="user"], div[style*="background-image"]:has(img),
            div[data-testid="chat-avatar"], div[data-testid="avatar"] {
                filter: blur(8px) !important;
                transition: filter 0.2s ease !important;
            }
            img[src*="profile"]:hover, img[src*="user"]:hover,
            div[data-testid="chat-avatar"]:hover, div[data-testid="avatar"]:hover {
                filter: none !important;
            }
        `;
    }

    // Blur names and titles
    if (settings.privacy_blur_names) {
        css += `
            div[data-testid="cell-frame-title"], header span[dir="auto"], span[title] {
                filter: blur(6px) !important;
                transition: filter 0.2s ease !important;
            }
            div[data-testid="cell-frame-title"]:hover, header span[dir="auto"]:hover, span[title]:hover {
                filter: none !important;
            }
        `;
    }

    // Blur message previews and active chat content
    if (settings.privacy_blur_messages) {
        css += `
            div[data-testid="cell-frame-secondary"], div.message-in, div.message-out, div[data-testid="msg-container"] {
                filter: blur(7px) !important;
                transition: filter 0.2s ease !important;
            }
            div[data-testid="cell-frame-secondary"]:hover, div.message-in:hover, div.message-out:hover, div[data-testid="msg-container"]:hover {
                filter: none !important;
            }
        `;
    }

    // Auto blur entire window on blur
    if (settings.privacy_blur_on_window_blur) {
        css += `
            body.covenant-window-blurred #app {
                filter: blur(12px) !important;
                transition: filter 0.3s ease !important;
            }
        `;
    }

    style.textContent = css;
}

// 3. Dynamic Sidebar Resizer (indicated by user screenshot)
let isDraggingSidebar = false;
let startX = 0;
let startWidth = 400;

function applySidebarWidth(settings: any) {
    const style = getOrCreateStyle("covenant-sidebar-style");
    if (!settings.sidebar_resizable && (!settings.sidebar_width || settings.sidebar_width === 400)) {
        // Default behavior: don't force width
        style.textContent = "";
        return;
    }

    const width = settings.sidebar_width || 400;
    style.textContent = `
        #side, div[data-testid="chat-list"], div#app > div > div > div:first-child {
            width: ${width}px !important;
            min-width: ${width}px !important;
            max-width: ${width}px !important;
            flex: 0 0 ${width}px !important;
        }
    `;
}

function setupDraggableSplitter() {
    const existing = document.getElementById("covenant-splitter");
    if (!currentSettings.sidebar_resizable) {
        if (existing) existing.remove();
        return;
    }

    if (existing) return;

    const side = document.querySelector("#side") || document.querySelector('div[data-testid="chat-list"]');
    if (!side) return;

    const splitter = document.createElement("div");
    splitter.id = "covenant-splitter";
    splitter.style.cssText = `
        position: absolute;
        top: 0;
        right: -3px;
        width: 6px;
        height: 100%;
        cursor: col-resize;
        z-index: 99999;
        background: transparent;
        transition: background 0.2s;
    `;

    splitter.addEventListener("mouseenter", () => {
        splitter.style.background = "rgba(0, 168, 132, 0.7)";
    });
    splitter.addEventListener("mouseleave", () => {
        if (!isDraggingSidebar) splitter.style.background = "transparent";
    });

    splitter.addEventListener("mousedown", (e) => {
        isDraggingSidebar = true;
        startX = e.clientX;
        startWidth = side.getBoundingClientRect().width;
        splitter.style.background = "#00a884";
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        e.preventDefault();
    });

    side.parentElement?.style.setProperty("position", "relative");
    side.appendChild(splitter);
}

window.addEventListener("mousemove", (e) => {
    if (!isDraggingSidebar) return;
    const delta = e.clientX - startX;
    let newWidth = Math.max(260, Math.min(800, Math.round(startWidth + delta)));
    currentSettings.sidebar_width = newWidth;
    applySidebarWidth(currentSettings);
});

window.addEventListener("mouseup", () => {
    if (!isDraggingSidebar) return;
    isDraggingSidebar = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    const splitter = document.getElementById("covenant-splitter");
    if (splitter) splitter.style.background = "transparent";
    ipcRenderer.send("save-covenant-settings", currentSettings);
});

// 4. Inject Covenant Button in WhatsApp Web Header
function injectCovenantButton() {
    if (document.getElementById("covenant-header-btn")) return;

    const header = document.querySelector("header") || document.querySelector('div[data-testid="chatlist-header"]');
    if (!header) return;

    // Look for right-side action buttons container in header
    const actionContainer = header.querySelector("div:last-child") || header;

    const btn = document.createElement("button");
    btn.id = "covenant-header-btn";
    btn.title = "Configurações Covenant (v1.4.0)";
    btn.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #00a884;">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
    `;
    btn.style.cssText = `
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 6px;
        margin-right: 4px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    `;

    btn.addEventListener("mouseenter", () => {
        btn.style.background = "rgba(0, 168, 132, 0.2)";
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.background = "transparent";
    });
    btn.addEventListener("click", () => {
        ipcRenderer.send("open-covenant-settings");
    });

    actionContainer.prepend(btn);
}

// Window blur listener for anti-spy auto-blur
window.addEventListener("blur", () => {
    if (currentSettings.privacy_enabled && currentSettings.privacy_blur_on_window_blur) {
        document.body.classList.add("covenant-window-blurred");
    }
});

window.addEventListener("focus", () => {
    document.body.classList.remove("covenant-window-blurred");
});

// Toast notification in page
function showToast(message: string) {
    let toast = document.getElementById("covenant-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "covenant-toast";
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #161b26;
            color: #00a884;
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid #242c3d;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
            font-size: 14px;
            font-weight: 600;
            z-index: 999999;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = "1";
    setTimeout(() => {
        if (toast) toast.style.opacity = "0";
    }, 2500);
}

// Keyboard shortcuts
window.addEventListener("keydown", (e) => {
    // Ctrl + , -> Open Covenant settings
    if (e.ctrlKey && e.key === ",") {
        ipcRenderer.send("open-covenant-settings");
        e.preventDefault();
    }
    // Ctrl + Shift + P -> Toggle Privacy
    if (e.ctrlKey && e.shiftKey && (e.key.toUpperCase() === "P")) {
        currentSettings.privacy_enabled = !currentSettings.privacy_enabled;
        applyPrivacy(currentSettings);
        ipcRenderer.send("save-covenant-settings", currentSettings);
        showToast(currentSettings.privacy_enabled ? "🛡️ Modo Privacidade: Ativado" : "🛡️ Modo Privacidade: Desativado");
        e.preventDefault();
    }
    // Ctrl + Shift + M -> Toggle Always on top
    if (e.ctrlKey && e.shiftKey && (e.key.toUpperCase() === "M")) {
        ipcRenderer.send("toggle-always-on-top");
        e.preventDefault();
    }
});

// Periodic check for header injection and splitter setup
setInterval(() => {
    injectCovenantButton();
    setupDraggableSplitter();
}, 2000);

// Initialize settings from main process
async function initCovenant() {
    try {
        const loaded = await ipcRenderer.invoke("get-covenant-settings");
        if (loaded) {
            currentSettings = { ...currentSettings, ...loaded };
        }
        applyTheme(currentSettings.theme);
        applyPrivacy(currentSettings);
        applySidebarWidth(currentSettings);
    } catch (e) {
        console.error("Init covenant failed", e);
    }
}

ipcRenderer.on("covenant-settings-updated", (_event, settings) => {
    currentSettings = { ...currentSettings, ...settings };
    applyTheme(currentSettings.theme);
    applyPrivacy(currentSettings);
    applySidebarWidth(currentSettings);
    setupDraggableSplitter();
});

ipcRenderer.on("toggle-privacy-mode", () => {
    currentSettings.privacy_enabled = !currentSettings.privacy_enabled;
    applyPrivacy(currentSettings);
    ipcRenderer.send("save-covenant-settings", currentSettings);
    showToast(currentSettings.privacy_enabled ? "🛡️ Modo Privacidade: Ativado" : "🛡️ Modo Privacidade: Desativado");
});

window.addEventListener("DOMContentLoaded", () => {
    initCovenant();
});

overrideNotification();
handleChromeVersionBug();
