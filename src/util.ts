import { app, nativeImage } from "electron";
import fs from "fs";
import path from "path";

export function findIcon(name: string) {
    let iconPath = fromDataDirs("icons/hicolor/512x512/apps/" + name);

    if (iconPath === null) {
        const appDir = typeof app !== "undefined" && app.getAppPath ? app.getAppPath() : path.join(__dirname, "..");
        const candidate = path.join(appDir, "data/icons/hicolor/512x512/apps/", name);
        if (fs.existsSync(candidate)) {
            iconPath = candidate;
        } else {
            iconPath = path.join(__dirname, "../data/icons/hicolor/512x512/apps/", name);
        }
    }

    return nativeImage.createFromPath(iconPath);
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
