import { ipcRenderer } from "electron";

// -------------------------------------------------------------
// NOTIFICATION & CHROME VERSION FIXES
// -------------------------------------------------------------
function overrideNotification() {
    try {
        const win = window as any;
        const NativeNotification = win.Notification;
        win.Notification = class extends NativeNotification {
            constructor(title: string, options?: NotificationOptions) {
                super(title, options);
                this.onclick = () => {
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
// BACKGROUND OPTIMIZATIONS (ZERO CONFIGURATION REQUIRED)
// -------------------------------------------------------------

// 1. WebRTC Privacy Shield (Prevents local network/IP candidate leakage)
function installWebRTCShield() {
    try {
        const win = window as any;
        const originalRTCPeerConnection = win.RTCPeerConnection || win.webkitRTCPeerConnection;
        if (!originalRTCPeerConnection) return;

        const patchedRTCPeerConnection = function(...args: any[]) {
            const pc = new originalRTCPeerConnection(...args);
            const originalAddIceCandidate = pc.addIceCandidate;
            pc.addIceCandidate = function(candidate: any, successCallback: any, failureCallback: any) {
                if (candidate && candidate.candidate) {
                    if (candidate.candidate.includes("typ host") || candidate.candidate.includes("typ srflx")) {
                        candidate.candidate = candidate.candidate.replace(/([0-9]{1,3}\.){3}[0-9]{1,3}/g, "0.0.0.0");
                        candidate.candidate = candidate.candidate.replace(/[0-9a-fA-F]{1,4}(:[0-9a-fA-F]{0,4}){2,7}/g, "::");
                    }
                }
                if (arguments.length > 1) {
                    return originalAddIceCandidate.apply(this, arguments);
                } else {
                    return originalAddIceCandidate.call(this, candidate)
                        .then(successCallback)
                        .catch(failureCallback);
                }
            };
            return pc;
        };

        patchedRTCPeerConnection.prototype = originalRTCPeerConnection.prototype;
        try { win.RTCPeerConnection = patchedRTCPeerConnection; } catch(e) {}
        try { win.webkitRTCPeerConnection = patchedRTCPeerConnection; } catch(e) {}
        console.log("[Covenant] WebRTC Privacy Shield active.");
    } catch (err) {
        console.warn("[Covenant] Could not install WebRTC shield", err);
    }
}

// 2. Ctrl+Arrow Word Navigation Fix for WhatsApp Web Message Input
function installCtrlArrowVisualNavigationFix() {
    document.addEventListener("keydown", function(e) {
        if (!e.ctrlKey || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const el = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? (sel.anchorNode as Element) : sel.anchorNode.parentElement);
        if (!el || !el.closest('[contenteditable="true"]')) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        const direction = e.key === "ArrowLeft" ? "left" : "right";
        const alter = e.shiftKey ? "extend" : "move";
        (sel as any).modify(alter, direction, "word");
    }, true);
    console.log("[Covenant] Ctrl+Arrow visual navigation fix active.");
}

// 3. Direct PDF & Document Click Controller (Routes downloads cleanly without trapped preview)
function installPdfClickController() {
    const PDF = /\.pdf(?:\b|$)/i;
    const DOWNLOAD = /(?:download|baixar|descargar|télécharger|herunterladen)/i;
    const isDownloadButton = (node: any) => {
        if (!node || !node.getAttribute) return false;
        if (node.matches && node.matches("a[download]")) return true;
        const fields = [
            node.getAttribute("aria-label") || "",
            node.getAttribute("title") || "",
            node.getAttribute("data-testid") || "",
            node.getAttribute("data-icon") || ""
        ].join(" ");
        return DOWNLOAD.test(fields) || !!node.querySelector('[data-icon*="download"], [data-testid*="download"]');
    };

    const findPdfCard = (target: any) => {
        if (!target || !target.closest) return null;
        const message = target.closest("[data-id], [data-testid='msg-container']");
        const documentCard = target.closest('[data-testid*="document"], [data-testid*="file"]');
        const root = documentCard || message;
        if (!root) return null;
        const marksDocument = !!documentCard || !!root.querySelector('[data-testid*="document"], [data-icon*="document"]');
        if (!marksDocument) return null;
        const label = ((documentCard && documentCard.innerText) || (message && message.innerText) || "").slice(0, 500);
        return PDF.test(label) ? (documentCard || message) : null;
    };

    document.addEventListener("click", (event) => {
        if (!event.isTrusted || !(event.target instanceof Element)) return;
        if (event.target.closest("button, [role='button'], a[download]") &&
            isDownloadButton(event.target.closest("button, [role='button'], a[download]"))) {
            return;
        }
        const card = findPdfCard(event.target);
        if (!card) return;
        const root = event.target.closest("[data-id], [data-testid='msg-container']") || card;
        const direct = Array.from(root.querySelectorAll("button, [role='button'], a[download]")).find(isDownloadButton) as HTMLElement;
        if (direct && !direct.contains(event.target)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            direct.click();
        }
    }, true);
    console.log("[Covenant] PDF click download controller active.");
}

// -------------------------------------------------------------
// INITIALIZATION
// -------------------------------------------------------------
function initOptimizations() {
    installWebRTCShield();
    installCtrlArrowVisualNavigationFix();
    installPdfClickController();
}

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initOptimizations);
} else {
    initOptimizations();
}

overrideNotification();
handleChromeVersionBug();
