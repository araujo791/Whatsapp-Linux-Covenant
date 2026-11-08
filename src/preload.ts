import { ipcRenderer, shell } from "electron";
import { COVENANT_LOGO_B64, COVENANT_SYMBOL_B64 } from "./assets";
import { getThemeCss } from "./theme-styles";

// -------------------------------------------------------------
// NOTIFICATION & CHROME VERSION FIXES
// -------------------------------------------------------------
function overrideNotification() {
    const win = window as any;
    win.oldNotification = Notification;

    // @ts-ignore
    Notification = function (title: string, options: any) {
        const notification = new win.oldNotification(title, options);
        notification.addEventListener("click", () => {
            ipcRenderer.send("notification-click");
        });
        return notification;
    };

    Notification.requestPermission = win.oldNotification.requestPermission.bind(win.oldNotification);
    Object.defineProperty(Notification, "permission", {
        get: () => win.oldNotification.permission
    });
}

function handleChromeVersionBug() {
    window.addEventListener("DOMContentLoaded", () => {
        const title = document.querySelector(".landing-title");
        if (!title || !title.textContent || !title.textContent.includes("Google Chrome 60+")) return;

        const wrapper = title.parentElement;
        if (!wrapper) return;

        const updateChrome = wrapper.querySelector<HTMLElement>('a[href*="chrome"]');
        if (updateChrome) updateChrome.style.display = "none";

        const text = wrapper.querySelector<HTMLElement>(".landing-text");
        if (text) {
            text.textContent = "WhatsApp Desktop client seems to be outdated, press Ctrl+R to reload the page. If the problem persists, report an issue.";
        }
    });
}

// -------------------------------------------------------------
// COVENANT EXCLUSIVE FEATURES (THEMES, PRIVACY, SIDEBAR RESIZER, MODAL)
// -------------------------------------------------------------

let currentSettings: any = {
    sidebar_width: null,
    always_on_top: false,
    privacy_enabled: false,
    privacy_blur_photos: false,
    privacy_blur_names: false,
    privacy_blur_messages: false,
    privacy_blur_on_window_blur: false,
    theme: "default"
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

// 1. Live Instant Theme Engine
function applyTheme(themeName: string) {
    const style = getOrCreateStyle("covenant-theme-style");
    if (!themeName || themeName === "default") {
        style.textContent = "";
        document.body.classList.remove("covenant-themed");
        const nativeTheme = localStorage.getItem("theme");
        if (nativeTheme !== "dark") {
            document.body.classList.remove("dark");
        }
        return;
    }

    const css = getThemeCss(themeName);
    style.textContent = css || "";
    document.body.classList.add("dark");
    document.body.classList.add("covenant-themed");
}

// 2. Anti-Spy Privacy Engine
function applyPrivacy(settings: any) {
    const style = getOrCreateStyle("covenant-privacy-style");
    if (!settings.privacy_enabled) {
        style.textContent = "";
        return;
    }

    let css = "";

    if (settings.privacy_blur_photos) {
        css += `
            img[src*="profile"], img[src*="user"], div[style*="background-image"]:has(img),
            div[data-testid="chat-avatar"], div[data-testid="avatar"], span[data-testid="default-user"] {
                filter: blur(9px) !important;
                transition: filter 0.2s ease !important;
            }
            img[src*="profile"]:hover, img[src*="user"]:hover,
            div[data-testid="chat-avatar"]:hover, div[data-testid="avatar"]:hover, span[data-testid="default-user"]:hover {
                filter: none !important;
            }
        `;
    }

    if (settings.privacy_blur_names) {
        css += `
            div[data-testid="cell-frame-title"], header span[dir="auto"], span[title], div[data-testid="conversation-info-header"] {
                filter: blur(6px) !important;
                transition: filter 0.2s ease !important;
            }
            div[data-testid="cell-frame-title"]:hover, header span[dir="auto"]:hover, span[title]:hover, div[data-testid="conversation-info-header"]:hover {
                filter: none !important;
            }
        `;
    }

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

    if (settings.privacy_blur_on_window_blur) {
        css += `
            body.covenant-window-blurred #app {
                filter: blur(14px) !important;
                transition: filter 0.25s ease !important;
            }
        `;
    }

    style.textContent = css;
}

// 3. Natural Sidebar Resizer (hover & drag directly on the border)
let isDraggingSidebar = false;
let startX = 0;
let startWidth = 0;

function applySidebarWidth(width?: number | null) {
    const style = getOrCreateStyle("covenant-sidebar-style");
    if (!width || width === 400) {
        style.textContent = "";
        return;
    }
    style.textContent = `
        #side, div[data-testid="chat-list"] {
            width: ${width}px !important;
            min-width: 240px !important;
            max-width: 850px !important;
            flex: 0 0 ${width}px !important;
        }
    `;
}

function setupDraggableSplitter() {
    const side = document.querySelector("#side") as HTMLElement;
    if (!side) return;

    if (document.getElementById("covenant-splitter")) return;

    const splitter = document.createElement("div");
    splitter.id = "covenant-splitter";
    splitter.title = "Arrastar para ajustar largura da barra";
    splitter.style.cssText = `
        position: absolute;
        top: 0;
        right: 0;
        width: 8px;
        height: 100%;
        cursor: col-resize;
        z-index: 9999;
        background: transparent;
        transition: background 0.15s ease;
    `;

    splitter.addEventListener("mouseenter", () => {
        splitter.style.background = "rgba(0, 168, 132, 0.6)";
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
        e.stopPropagation();
    });

    if (getComputedStyle(side).position === "static") {
        side.style.position = "relative";
    }
    side.appendChild(splitter);
}

window.addEventListener("mousemove", (e) => {
    if (!isDraggingSidebar) return;
    const side = document.querySelector("#side") as HTMLElement;
    if (!side) return;

    const delta = e.clientX - startX;
    let newWidth = Math.max(260, Math.min(850, Math.round(startWidth + delta)));
    currentSettings.sidebar_width = newWidth;
    applySidebarWidth(newWidth);
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

// 4. In-Dock Covenant Gear Button (positioned at bottom of left rail, above native settings)
function injectCovenantDockButton() {
    if (document.getElementById("covenant-dock-btn")) return;

    // Remove legacy header button if present
    const legacy = document.getElementById("covenant-header-btn");
    if (legacy) legacy.remove();

    // Look for native WhatsApp settings button or gear icon
    const settingsBtn = document.querySelector<HTMLElement>(
        'button[aria-label*="Configuraç"], button[title*="Configuraç"], ' +
        'button[aria-label*="Setting"], button[title*="Setting"], ' +
        'div[aria-label*="Configuraç"], div[title*="Configuraç"], ' +
        'span[data-icon="settings"], span[data-icon="settings-outline"]'
    );

    let targetParent: HTMLElement | null = null;
    let referenceNode: HTMLElement | null = null;

    if (settingsBtn) {
        const btn = (settingsBtn.closest("button, div[role='button']") as HTMLElement) || settingsBtn;
        targetParent = btn.parentElement;
        referenceNode = btn;
    } else {
        const avatar = document.querySelector<HTMLElement>(
            '#app > div > div > div:first-child img[src*="user"], ' +
            '#app > div > div > div:first-child img[src*="profile"]'
        );
        if (avatar) {
            const btn = (avatar.closest("button, div[role='button']") as HTMLElement) || avatar;
            targetParent = btn.parentElement;
            referenceNode = btn;
        }
    }

    if (!targetParent) {
        const leftRail = document.querySelector<HTMLElement>("#app > div > div > div:first-child");
        if (leftRail) {
            targetParent = leftRail;
            referenceNode = null;
        }
    }

    if (!targetParent) return;

    const btn = document.createElement("button");
    btn.id = "covenant-dock-btn";
    btn.title = "Configurações Covenant (Ctrl+,)";
    btn.setAttribute("aria-label", "Configurações Covenant");
    btn.style.cssText = `
        width: 40px;
        height: 40px;
        margin: 4px auto;
        border-radius: 50%;
        border: none;
        background: transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px;
        transition: background 0.2s, transform 0.2s;
        box-sizing: border-box;
    `;

    btn.innerHTML = `
        <img src="data:image/png;base64,${COVENANT_SYMBOL_B64}" 
             style="width: 26px; height: 26px; object-fit: contain; pointer-events: none; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));"
             alt="Covenant">
    `;

    btn.addEventListener("mouseenter", () => {
        btn.style.background = "rgba(0, 168, 132, 0.22)";
        btn.style.transform = "scale(1.1)";
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.background = "transparent";
        btn.style.transform = "scale(1)";
    });
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCovenantModal();
    });

    if (referenceNode && referenceNode.parentElement === targetParent) {
        targetParent.insertBefore(btn, referenceNode);
    } else {
        targetParent.appendChild(btn);
    }
}

// 5. In-Page Covenant Settings Modal (No extra OS windows, opens seamlessly inside WhatsApp)
let isModalOpen = false;

function createCovenantModal() {
    if (document.getElementById("covenant-modal-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "covenant-modal-overlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.72);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 9999999;
        display: none;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    `;

    overlay.innerHTML = `
        <div id="covenant-modal-card" style="
            width: 720px;
            max-width: 92vw;
            max-height: 86vh;
            background: #11141c;
            color: #e6edf3;
            border: 1px solid #232d40;
            border-radius: 16px;
            box-shadow: 0 24px 64px rgba(0,0,0,0.85);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: covFadeIn 0.2s ease;
        ">
            <!-- Header -->
            <div style="background: linear-gradient(180deg, #18202f 0%, #11141c 100%); padding: 22px 24px 14px 24px; border-bottom: 1px solid #232d40; position: relative; text-align: center;">
                <button id="cov-btn-close-x" style="position: absolute; top: 16px; right: 18px; background: none; border: none; color: #8b949e; font-size: 20px; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: color 0.2s;">✕</button>
                <div style="display: flex; justify-content: center; margin-bottom: 6px;">
                    <img src="data:image/png;base64,${COVENANT_LOGO_B64}" style="max-width: 250px; height: auto; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.6));" alt="Covenant">
                </div>
                <div style="font-size: 13px; color: #8b949e; letter-spacing: 0.5px;">
                    Painel Exclusivo de Recursos Covenant <span style="background: linear-gradient(90deg, #b8860b, #ffd700); color: #000; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 10px; text-transform: uppercase; margin-left: 6px;">Exclusivo</span>
                </div>
            </div>

            <!-- Tabs Nav -->
            <div style="display: flex; background: #0c0e14; border-bottom: 1px solid #232d40; padding: 0 16px;">
                <button class="cov-tab-btn active" data-tab="tab-privacy" style="background: none; border: none; color: #00a884; border-bottom: 2px solid #00a884; padding: 12px 16px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;">🛡️ Modo Privacidade</button>
                <button class="cov-tab-btn" data-tab="tab-themes" style="background: none; border: none; color: #8b949e; border-bottom: 2px solid transparent; padding: 12px 16px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;">🎨 Temas Exclusivos</button>
                <button class="cov-tab-btn" data-tab="tab-accounts" style="background: none; border: none; color: #8b949e; border-bottom: 2px solid transparent; padding: 12px 16px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;">👥 Segunda Conta</button>
                <button class="cov-tab-btn" data-tab="tab-about" style="background: none; border: none; color: #8b949e; border-bottom: 2px solid transparent; padding: 12px 16px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;">ℹ️ Sobre</button>
            </div>

            <!-- Content Area -->
            <div style="flex: 1; overflow-y: auto; padding: 22px 24px; min-height: 280px; max-height: 55vh;">
                <!-- Tab: Privacy -->
                <div id="tab-privacy" class="cov-tab-content">
                    <div style="background: #171d29; border: 1px solid #242f44; border-radius: 10px; padding: 16px 18px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; font-size: 15px; color: #e6edf3;">🛡️ Ativar Modo Privacidade (Anti-Espião)</div>
                            <div style="font-size: 12px; color: #8b949e; margin-top: 2px;">Atalho global: <kbd style="background: #232d40; padding: 2px 6px; border-radius: 4px; color: #00a884; font-family: monospace;">Ctrl+Shift+P</kbd></div>
                        </div>
                        <input type="checkbox" id="cov-opt-privacy_enabled" style="width: 20px; height: 20px; accent-color: #00a884; cursor: pointer;">
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <label style="background: #141924; border: 1px solid #20293b; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                            <div>
                                <div style="font-size: 14px; font-weight: 500;">Ocultar / Desfocar Fotos de Perfil</div>
                                <div style="font-size: 12px; color: #8b949e;">Desfoca os avatares. Passe o mouse sobre a foto para visualizá-la.</div>
                            </div>
                            <input type="checkbox" id="cov-opt-privacy_blur_photos" style="width: 18px; height: 18px; accent-color: #00a884; cursor: pointer;">
                        </label>

                        <label style="background: #141924; border: 1px solid #20293b; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                            <div>
                                <div style="font-size: 14px; font-weight: 500;">Ocultar / Desfocar Nomes e Contatos</div>
                                <div style="font-size: 12px; color: #8b949e;">Desfoca os nomes das pessoas. Passe o mouse para revelar temporariamente.</div>
                            </div>
                            <input type="checkbox" id="cov-opt-privacy_blur_names" style="width: 18px; height: 18px; accent-color: #00a884; cursor: pointer;">
                        </label>

                        <label style="background: #141924; border: 1px solid #20293b; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                            <div>
                                <div style="font-size: 14px; font-weight: 500;">Ocultar / Desfocar Mensagens e Prévias</div>
                                <div style="font-size: 12px; color: #8b949e;">Desfoca o texto das mensagens. Passe o cursor para ler.</div>
                            </div>
                            <input type="checkbox" id="cov-opt-privacy_blur_messages" style="width: 18px; height: 18px; accent-color: #00a884; cursor: pointer;">
                        </label>

                        <label style="background: #141924; border: 1px solid #20293b; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                            <div>
                                <div style="font-size: 14px; font-weight: 500;">Auto-Desfoque Total ao Sair da Janela</div>
                                <div style="font-size: 12px; color: #8b949e;">Desfoca a tela inteira automaticamente quando você clica em outro programa.</div>
                            </div>
                            <input type="checkbox" id="cov-opt-privacy_blur_on_window_blur" style="width: 18px; height: 18px; accent-color: #00a884; cursor: pointer;">
                        </label>
                    </div>
                </div>

                <!-- Tab: Themes (Instant Real-time Apply) -->
                <div id="tab-themes" class="cov-tab-content" style="display: none;">
                    <div style="font-size: 13px; color: #8b949e; margin-bottom: 14px;">
                        Clique em qualquer tema para aplicar instantaneamente ao WhatsApp:
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px;">
                        <!-- Default Theme -->
                        <div class="cov-theme-card" data-theme="default" style="background: #141924; border: 2px solid #20293b; border-radius: 10px; padding: 14px; cursor: pointer; transition: all 0.2s;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="font-weight: 600; font-size: 14px;">Padrão WhatsApp</span>
                                <span class="cov-theme-check" style="color: #00a884; font-weight: bold; display: none;">✓</span>
                            </div>
                            <div style="display: flex; gap: 6px; height: 26px; border-radius: 6px; overflow: hidden;">
                                <div style="flex: 1; background: #00a884;"></div>
                                <div style="flex: 1; background: #f0f2f5;"></div>
                                <div style="flex: 1; background: #111b21;"></div>
                            </div>
                        </div>

                        <!-- OLED -->
                        <div class="cov-theme-card" data-theme="oled" style="background: #141924; border: 2px solid #20293b; border-radius: 10px; padding: 14px; cursor: pointer; transition: all 0.2s;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="font-weight: 600; font-size: 14px;">OLED True Black</span>
                                <span class="cov-theme-check" style="color: #00a884; font-weight: bold; display: none;">✓</span>
                            </div>
                            <div style="display: flex; gap: 6px; height: 26px; border-radius: 6px; overflow: hidden;">
                                <div style="flex: 1; background: #000000; border: 1px solid #333;"></div>
                                <div style="flex: 1; background: #003d32;"></div>
                                <div style="flex: 1; background: #00a884;"></div>
                            </div>
                        </div>

                        <!-- Dracula -->
                        <div class="cov-theme-card" data-theme="dracula" style="background: #141924; border: 2px solid #20293b; border-radius: 10px; padding: 14px; cursor: pointer; transition: all 0.2s;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="font-weight: 600; font-size: 14px;">Dracula</span>
                                <span class="cov-theme-check" style="color: #00a884; font-weight: bold; display: none;">✓</span>
                            </div>
                            <div style="display: flex; gap: 6px; height: 26px; border-radius: 6px; overflow: hidden;">
                                <div style="flex: 1; background: #282a36;"></div>
                                <div style="flex: 1; background: #bd93f9;"></div>
                                <div style="flex: 1; background: #50fa7b;"></div>
                            </div>
                        </div>

                        <!-- Catppuccin -->
                        <div class="cov-theme-card" data-theme="catppuccin" style="background: #141924; border: 2px solid #20293b; border-radius: 10px; padding: 14px; cursor: pointer; transition: all 0.2s;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="font-weight: 600; font-size: 14px;">Catppuccin Mocha</span>
                                <span class="cov-theme-check" style="color: #00a884; font-weight: bold; display: none;">✓</span>
                            </div>
                            <div style="display: flex; gap: 6px; height: 26px; border-radius: 6px; overflow: hidden;">
                                <div style="flex: 1; background: #1e1e2e;"></div>
                                <div style="flex: 1; background: #cba6f7;"></div>
                                <div style="flex: 1; background: #89b4fa;"></div>
                            </div>
                        </div>

                        <!-- Nord -->
                        <div class="cov-theme-card" data-theme="nord" style="background: #141924; border: 2px solid #20293b; border-radius: 10px; padding: 14px; cursor: pointer; transition: all 0.2s;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="font-weight: 600; font-size: 14px;">Nord Arctic</span>
                                <span class="cov-theme-check" style="color: #00a884; font-weight: bold; display: none;">✓</span>
                            </div>
                            <div style="display: flex; gap: 6px; height: 26px; border-radius: 6px; overflow: hidden;">
                                <div style="flex: 1; background: #2e3440;"></div>
                                <div style="flex: 1; background: #88c0d0;"></div>
                                <div style="flex: 1; background: #81a1c1;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab: Multi-Accounts -->
                <div id="tab-accounts" class="cov-tab-content" style="display: none;">
                    <div style="background: #171d29; border: 1px solid #242f44; border-radius: 10px; padding: 20px; text-align: center;">
                        <div style="font-size: 38px; margin-bottom: 10px;">👥</div>
                        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Segunda Conta Isolada</div>
                        <p style="font-size: 13px; color: #8b949e; line-height: 1.6; max-width: 480px; margin: 0 auto 20px auto;">
                            Permite conectar um segundo WhatsApp (por exemplo, pessoal e corporativo) simultaneamente. A sessão é 100% isolada com cookies e armazenamento independentes.
                        </p>
                        <button id="cov-btn-open-account2" style="background: #00a884; color: #fff; border: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; cursor: pointer; transition: background 0.2s;">
                            Abrir Segunda Conta Agora
                        </button>
                    </div>
                </div>

                <!-- Tab: About -->
                <div id="tab-about" class="cov-tab-content" style="display: none; text-align: center;">
                    <img src="data:image/png;base64,${COVENANT_LOGO_B64}" style="max-width: 220px; margin: 8px auto 14px auto; display: block;" alt="Covenant">
                    <div style="font-size: 15px; font-weight: 600; margin-bottom: 4px;">WhatsApp Desktop Linux - Covenant Edition</div>
                    <div style="font-size: 12px; color: #8b949e; margin-bottom: 18px;">Versão 1.4.1 (Electron 33+ Modern Suite)</div>

                    <div style="background: #141924; border: 1px solid #20293b; border-radius: 10px; padding: 14px; max-width: 460px; margin: 0 auto 20px auto; text-align: left; font-size: 13px;">
                        <div style="font-weight: 600; margin-bottom: 8px; color: #00a884;">⌨️ Atalhos Rápidos de Teclado:</div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <span>Abrir / Fechar Painel Covenant:</span>
                            <kbd style="background: #232d40; padding: 2px 6px; border-radius: 4px;">Ctrl + ,</kbd>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <span>Alternar Modo Privacidade:</span>
                            <kbd style="background: #232d40; padding: 2px 6px; border-radius: 4px;">Ctrl + Shift + P</kbd>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <span>Janela no Topo (Always on Top):</span>
                            <kbd style="background: #232d40; padding: 2px 6px; border-radius: 4px;">Ctrl + Shift + M</kbd>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Fechar este painel:</span>
                            <kbd style="background: #232d40; padding: 2px 6px; border-radius: 4px;">Esc</kbd>
                        </div>
                    </div>

                    <button id="cov-btn-github" style="background: #232d40; color: #e6edf3; border: 1px solid #34425e; font-size: 13px; font-weight: 500; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                        Ver Código no GitHub
                    </button>
                </div>
            </div>

            <!-- Footer -->
            <div style="background: #0d1017; border-top: 1px solid #232d40; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center;">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
                    <input type="checkbox" id="cov-opt-always_on_top" style="width: 16px; height: 16px; accent-color: #00a884; cursor: pointer;">
                    <span>📌 Janela no Topo (Always on Top)</span>
                </label>
                <div style="display: flex; gap: 10px;">
                    <button id="cov-btn-reset" style="background: #1c212c; color: #f85149; border: 1px solid #332128; font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 6px; cursor: pointer;">
                        Restaurar Padrão
                    </button>
                    <button id="cov-btn-done" style="background: #00a884; color: #fff; border: none; font-size: 13px; font-weight: 600; padding: 8px 18px; border-radius: 6px; cursor: pointer;">
                        Concluído
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Close listeners
    document.getElementById("cov-btn-close-x")?.addEventListener("click", closeCovenantModal);
    document.getElementById("cov-btn-done")?.addEventListener("click", closeCovenantModal);
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeCovenantModal();
    });

    // Tab switcher
    document.querySelectorAll(".cov-tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-tab");
            document.querySelectorAll(".cov-tab-btn").forEach(b => {
                const htmlB = b as HTMLElement;
                htmlB.style.color = "#8b949e";
                htmlB.style.borderBottomColor = "transparent";
            });
            const activeBtn = btn as HTMLElement;
            activeBtn.style.color = "#00a884";
            activeBtn.style.borderBottomColor = "#00a884";

            document.querySelectorAll(".cov-tab-content").forEach(content => {
                (content as HTMLElement).style.display = "none";
            });
            const targetContent = document.getElementById(target || "");
            if (targetContent) targetContent.style.display = "block";
        });
    });

    // Privacy toggles
    const privacyKeys = [
        "privacy_enabled", "privacy_blur_photos",
        "privacy_blur_names", "privacy_blur_messages",
        "privacy_blur_on_window_blur"
    ];

    privacyKeys.forEach(k => {
        const el = document.getElementById(`cov-opt-${k}`) as HTMLInputElement;
        if (el) {
            el.addEventListener("change", () => {
                currentSettings[k] = el.checked;
                applyPrivacy(currentSettings);
                ipcRenderer.send("save-covenant-settings", currentSettings);
            });
        }
    });

    // Always on top
    const aot = document.getElementById("cov-opt-always_on_top") as HTMLInputElement;
    if (aot) {
        aot.addEventListener("change", () => {
            currentSettings.always_on_top = aot.checked;
            ipcRenderer.send("save-covenant-settings", currentSettings);
        });
    }

    // Theme cards (Instant Real-Time Apply)
    document.querySelectorAll(".cov-theme-card").forEach(card => {
        card.addEventListener("click", () => {
            const themeKey = card.getAttribute("data-theme") || "default";
            currentSettings.theme = themeKey;
            applyTheme(themeKey);
            ipcRenderer.send("save-covenant-settings", currentSettings);
            syncModalUI();
        });
    });

    // Open second account button
    document.getElementById("cov-btn-open-account2")?.addEventListener("click", () => {
        ipcRenderer.send("open-second-account");
        closeCovenantModal();
    });

    // Github link
    document.getElementById("cov-btn-github")?.addEventListener("click", () => {
        shell.openExternal("https://github.com/araujo791/Whatsapp-Linux-Covenant");
    });

    // Reset button
    document.getElementById("cov-btn-reset")?.addEventListener("click", () => {
        currentSettings = {
            sidebar_width: null,
            always_on_top: false,
            privacy_enabled: false,
            privacy_blur_photos: false,
            privacy_blur_names: false,
            privacy_blur_messages: false,
            privacy_blur_on_window_blur: false,
            theme: "default"
        };
        applyTheme("default");
        applyPrivacy(currentSettings);
        applySidebarWidth(null);
        ipcRenderer.send("save-covenant-settings", currentSettings);
        syncModalUI();
        showToast("Configurações restauradas para o padrão");
    });
}

function syncModalUI() {
    const keys = [
        "privacy_enabled", "privacy_blur_photos",
        "privacy_blur_names", "privacy_blur_messages",
        "privacy_blur_on_window_blur", "always_on_top"
    ];

    keys.forEach(k => {
        const el = document.getElementById(`cov-opt-${k}`) as HTMLInputElement;
        if (el) el.checked = !!currentSettings[k];
    });

    // Sync theme cards
    document.querySelectorAll(".cov-theme-card").forEach(card => {
        const el = card as HTMLElement;
        const check = card.querySelector(".cov-theme-check") as HTMLElement;
        const theme = card.getAttribute("data-theme");
        if (theme === currentSettings.theme) {
            el.style.borderColor = "#00a884";
            el.style.background = "#1b2533";
            if (check) check.style.display = "inline";
        } else {
            el.style.borderColor = "#20293b";
            el.style.background = "#141924";
            if (check) check.style.display = "none";
        }
    });
}

function openCovenantModal() {
    createCovenantModal();
    syncModalUI();
    const overlay = document.getElementById("covenant-modal-overlay");
    if (overlay) {
        overlay.style.display = "flex";
        isModalOpen = true;
    }
}

function closeCovenantModal() {
    const overlay = document.getElementById("covenant-modal-overlay");
    if (overlay) {
        overlay.style.display = "none";
        isModalOpen = false;
    }
}

function toggleCovenantModal() {
    if (isModalOpen) closeCovenantModal();
    else openCovenantModal();
}

// Window blur listener for privacy auto-blur
window.addEventListener("blur", () => {
    if (currentSettings.privacy_enabled && currentSettings.privacy_blur_on_window_blur) {
        document.body.classList.add("covenant-window-blurred");
    }
});

window.addEventListener("focus", () => {
    document.body.classList.remove("covenant-window-blurred");
});

// Toast notification
function showToast(message: string) {
    let toast = document.getElementById("covenant-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "covenant-toast";
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #11141c;
            color: #00a884;
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid #232d40;
            box-shadow: 0 8px 24px rgba(0,0,0,0.6);
            font-size: 14px;
            font-weight: 600;
            z-index: 99999999;
            transition: opacity 0.3s;
            pointer-events: none;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = "1";
    setTimeout(() => {
        if (toast) toast.style.opacity = "0";
    }, 2200);
}

// Keyboard shortcuts
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isModalOpen) {
        closeCovenantModal();
        e.preventDefault();
        return;
    }
    if (e.ctrlKey && e.key === ",") {
        toggleCovenantModal();
        e.preventDefault();
        return;
    }
    if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === "P") {
        currentSettings.privacy_enabled = !currentSettings.privacy_enabled;
        applyPrivacy(currentSettings);
        ipcRenderer.send("save-covenant-settings", currentSettings);
        syncModalUI();
        showToast(currentSettings.privacy_enabled ? "🛡️ Modo Privacidade: Ativado" : "🛡️ Modo Privacidade: Desativado");
        e.preventDefault();
        return;
    }
    if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === "M") {
        ipcRenderer.send("toggle-always-on-top");
        e.preventDefault();
        return;
    }
});

// Periodic setup
setInterval(() => {
    injectCovenantDockButton();
    setupDraggableSplitter();
}, 1500);

// Initialize settings from main process
async function initCovenant() {
    try {
        const loaded = await ipcRenderer.invoke("get-covenant-settings");
        if (loaded) {
            currentSettings = { ...currentSettings, ...loaded };
        }
        applyTheme(currentSettings.theme);
        applyPrivacy(currentSettings);
        if (currentSettings.sidebar_width) {
            applySidebarWidth(currentSettings.sidebar_width);
        }
    } catch (e) {
        console.error("Init covenant failed", e);
    }
}

ipcRenderer.on("covenant-settings-updated", (_event, settings) => {
    currentSettings = { ...currentSettings, ...settings };
    applyTheme(currentSettings.theme);
    applyPrivacy(currentSettings);
    if (currentSettings.sidebar_width) {
        applySidebarWidth(currentSettings.sidebar_width);
    }
    syncModalUI();
});

ipcRenderer.on("open-covenant-modal", () => {
    openCovenantModal();
});

ipcRenderer.on("toggle-privacy-mode", () => {
    currentSettings.privacy_enabled = !currentSettings.privacy_enabled;
    applyPrivacy(currentSettings);
    ipcRenderer.send("save-covenant-settings", currentSettings);
    syncModalUI();
    showToast(currentSettings.privacy_enabled ? "🛡️ Modo Privacidade: Ativado" : "🛡️ Modo Privacidade: Desativado");
});

window.addEventListener("DOMContentLoaded", () => {
    initCovenant();
    injectCovenantDockButton();
    setupDraggableSplitter();
});

overrideNotification();
handleChromeVersionBug();
