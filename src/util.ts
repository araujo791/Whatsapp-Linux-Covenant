import { app, nativeImage, NativeImage } from "electron";
import fs from "fs";
import path from "path";

export function findIcon(name: string, size = 32): NativeImage {
    const relativeSubpaths = [
        `icons/hicolor/${size}x${size}/apps/${name}`,
        `icons/hicolor/32x32/apps/${name}`,
        `icons/hicolor/24x24/apps/${name}`,
        `icons/hicolor/48x48/apps/${name}`,
        `icons/hicolor/512x512/apps/${name}`,
        `icons/hicolor/scalable/apps/${name.replace(/\.png$/, '.svg')}`,
        `pixmaps/${name}`
    ];

    // 1. Check system XDG data dirs (/usr/share, /usr/local/share, etc.)
    for (const sub of relativeSubpaths) {
        const found = fromDataDirs(sub);
        if (found) {
            const img = nativeImage.createFromPath(found);
            if (!img.isEmpty()) return img;
        }
    }

    // 2. Check application resources and local directories
    const searchRoots: string[] = [];
    if (typeof process !== "undefined" && process.resourcesPath) {
        searchRoots.push(path.join(process.resourcesPath, "data"));
        searchRoots.push(process.resourcesPath);
    }
    if (typeof app !== "undefined" && app.getAppPath) {
        searchRoots.push(path.join(app.getAppPath(), "data"));
        searchRoots.push(path.join(app.getAppPath(), "../data"));
    }
    searchRoots.push(path.join(__dirname, "../data"));
    searchRoots.push(path.join(__dirname, "../../data"));

    for (const root of searchRoots) {
        for (const sub of relativeSubpaths) {
            const fullPath = path.join(root, sub);
            if (fs.existsSync(fullPath)) {
                const img = nativeImage.createFromPath(fullPath);
                if (!img.isEmpty()) return img;
            }
        }
    }

    console.warn(`[findIcon] Warning: Icon ${name} could not be located.`);
    return nativeImage.createEmpty();
}

export function getUnreadMessages(title: string) {
    const matches = title.match(/\((\d+)\)/);
    return matches == null ? 0 : Number.parseInt(matches[1], 10);
}

function fromDataDirs(iconPath: string) {
    const rawDirs = process.env.XDG_DATA_DIRS || "/usr/local/share:/usr/share";
    for (let dataDir of rawDirs.split(":")) {
        if (!dataDir) continue;
        let fullPath = path.join(dataDir, iconPath);
        if (fs.existsSync(fullPath))
            return fullPath;
    }
    return null;
}
