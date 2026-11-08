import { app } from 'electron';
import WhatsApp from './whatsapp';

// Enable native Wayland support on Linux with seamless fallback to X11
if (process.platform === 'linux') {
    app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
}

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit();
}

app.whenReady().then(() => new WhatsApp().init());
