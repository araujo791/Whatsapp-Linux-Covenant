# WhatsApp Desktop for Linux (Covenant Edition)

[![Release](https://img.shields.io/github/v/release/araujo791/Whatsapp-Linux-Covenant?color=25D366&logo=whatsapp&logoColor=white)](https://github.com/araujo791/Whatsapp-Linux-Covenant/releases)
[![AUR version](https://img.shields.io/aur/version/whatsapp-linux-covenant?color=1793D1&logo=arch-linux&logoColor=white)](https://aur.archlinux.org/packages/whatsapp-linux-covenant)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, high-performance, and privacy-focused WhatsApp Desktop client for Linux built with modern Electron.

As WhatsApp does not compile an official native client for Linux, this project provides a **100% native, untouched WhatsApp Web interface** paired with **zero-configuration background optimizations** and full Linux desktop integration.

---

## 📜 Disclaimer
This application loads `https://web.whatsapp.com/` inside an optimized Electron runtime without modifying or altering the visual integrity of the official webpage.

*This project is an unofficial wrapper and is not affiliated with, endorsed by, or supported by WhatsApp Inc. or Meta.*

---

## ✨ Features & Optimizations

### 🚀 Silent Background Performance Optimizations
- **WebRTC Privacy Shield**: Intercepts and sanitizes WebRTC ICE candidate generation to prevent local network and public IP address leaks.
- **Visual Word Navigation (`Ctrl` + `Left/Right Arrow`)**: Patches cursor word jumping in the WhatsApp Web message composer so word-by-word visual navigation works as expected on Linux.
- **Direct PDF & Document Download Controller**: Optimizes click handling on files and PDF attachments, ensuring direct and clean downloads without getting stuck inside preview modals.
- **System Dark/Light Theme Synchronization**: Uses Electron's native `nativeTheme.themeSource = "system"` to automatically match your Linux desktop theme preferences in real-time.
- **Chromium Version Fix**: Dynamically matches runtime user-agent strings to permanently resolve the *"WhatsApp works with Google Chrome 60+ / Update Google Chrome"* error screen.

### 🐧 Native Linux Desktop Integration
- **System Tray Integration**:
  - Unread message counter badge in tray icon.
  - Left-click tray icon to toggle show/hide window.
  - Clean context menu with minimize and quit options.
  - Background startup support with `--start-hidden`.
- **Audio & Video Support**: Native Linux permission handling for microphones (recording voice notes) and webcams (video calls).
- **Wayland & HiDPI Support**: Native fractional scaling and crisp rendering across Wayland and X11 display servers.
- **Multi-Monitor Window State Memory**: Remembers window position, size, and maximized state across reboots, with boundary checks to prevent off-screen windows.
- **Second Account Capability**: Isolated session partition (`persist:covenant_account2`) support for running multiple accounts simultaneously.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| `Ctrl` + `+` | Zoom In |
| `Ctrl` + `-` | Zoom Out |
| `Ctrl` + `0` | Reset Zoom to 100% |
| `F5` / `Ctrl` + `R` | Reload WhatsApp Web (ignores cache) |
| `Ctrl` + `Left Arrow` | Jump one word to the left in message input |
| `Ctrl` + `Right Arrow` | Jump one word to the right in message input |
| `Ctrl` + `W` | Hide window to system tray |
| `Ctrl` + `Q` | Quit application completely |

---

## 💾 Installation

### 🖱️ Arch Linux / CachyOS / Manjaro (AUR)
Install using your preferred AUR helper:

```bash
# Using paru
paru -S whatsapp-linux-covenant

# Using yay
yay -S whatsapp-linux-covenant
```

Or clone and build manually via `makepkg`:
```bash
git clone https://aur.archlinux.org/whatsapp-linux-covenant.git
cd aur-whatsapp-linux-covenant
makepkg -si
```

### 📦 Binary Releases
Pre-built packages are available on the [GitHub Releases](https://github.com/araujo791/Whatsapp-Linux-Covenant/releases) page:
- `whatsapp-linux-covenant-*.tar.gz` (Universal Linux binary archive)
- `.AppImage` (Self-contained universal executable)
- `.deb` (Debian, Ubuntu, Linux Mint)

---

## 🛠️ Building from Source

### 1. Requirements
- **Node.js** (v20+ recommended)
- **npm**

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/araujo791/Whatsapp-Linux-Covenant.git
cd Whatsapp-Linux-Covenant
npm install
```

### 3. Run in Development
```bash
npm start
```

### 4. Build Packages (Using RAM tmpfs for maximum speed)
```bash
# Build tar.gz package (ideal for Arch / AUR):
export TMPDIR=/tmp
export ELECTRON_BUILDER_CACHE=/tmp/electron-builder-cache
npm run build:tar

# Or build AppImage / Deb:
npm run build:appimage
npm run build:deb
```

---

## 💻 CLI Flags
- `--start-hidden`: Launches WhatsApp minimized directly to the system tray.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
