# WhatsApp Desktop for Linux (unofficial)

WhatsApp Linux client built with modern Electron. As WhatsApp doesn't compile an official native app for Linux, this provides a lightweight, full-featured desktop wrapper around WhatsApp Web.

## 📜 Disclaimer
This loads https://web.whatsapp.com/ with desktop enhancements, without changing the core content of the official webpage (HTML, CSS, or JS).

This wrapper is not verified by, affiliated with, or supported by WhatsApp Inc.

## ✨ Features & Enhancements (v1.3.0)
- **Modern Electron (v33+) & Chromium Core**: Fixes the *"WhatsApp works with Google Chrome 60+ / Update Google Chrome"* error permanently with dynamic user-agent matching.
- **Audio & Video Support**: Native permission handling for microphones (recording voice notes) and webcams (video calls).
- **Wayland Support**: Crisp rendering and native fractional scaling on modern Linux desktops (`ozone-platform-hint=auto`).
- **System Tray Integration**:
  - Unread chats counter badge in tray.
  - Left-click tray icon to show/hide window.
  - Context menu to minimize or quit.
  - Start hidden flag: `--start-hidden`.
- **Desktop Packaging**: Ready for AppImage, DEB, and Pacman (Arch / CachyOS).
- **Window State Memory**: Saves window position and maximized state between sessions, validating screen boundaries across multi-monitor setups.
- **Keyboard Shortcuts**:
  - `Ctrl` + `+` / `Ctrl` + `-` / `Ctrl` + `0`: Zoom controls.
  - `F5` / `Ctrl` + `R`: Reload.
  - `Ctrl` + `W`: Hide to tray.
  - `Ctrl` + `Q`: Quit application.

## 💾 Installation & Building

### 🖱️ Arch Linux / CachyOS (AUR)
```bash
yay -S whatsapp-linux-covenant
# ou
paru -S whatsapp-linux-covenant
```

### 1. Requirements (para compilar da fonte)
- Node.js (v20+ recommended)
- npm

### 2. Install dependencies
```bash
npm install
```

### 3. Run in development
```bash
npm start
```

### 4. Build packages
```bash
# Build default packages (AppImage, deb, pacman)
npm run build

# Or build a specific package:
npm run build:appimage
npm run build:deb
npm run build:pacman
```

## :hammer: CLI arguments
- `--start-hidden`: Starts WhatsApp hidden in the system tray.
