import { BrowserWindow, screen } from 'electron';
import Settings from '../settings';
import WhatsApp from '../whatsapp';
import Module from './module';

const settings = new Settings("window");

export default class WindowSettingsModule extends Module {

    constructor(
        private readonly whatsApp: WhatsApp,
        private readonly window: BrowserWindow
    ) {
        super();
    }

    public override beforeLoad() {
        const defaults = this.window.getBounds(); // The window is constructed with the defaults.
        const savedBounds = settings.get("bounds", defaults);

        // Ensure saved bounds are inside a visible monitor area
        if (savedBounds) {
            try {
                const display = screen.getDisplayMatching(savedBounds);
                if (display && display.bounds) {
                    this.window.setBounds(savedBounds);
                }
            } catch {
                this.window.setBounds(defaults);
            }
        }

        if (settings.get("maximized", false)) {
            this.window.maximize();
        }
    }

    public override onQuit() {
        settings.set("maximized", this.window.isMaximized());

        if (!this.window.isMaximized()) {
            settings.set("bounds", this.window.getBounds());
        }
    }
};
