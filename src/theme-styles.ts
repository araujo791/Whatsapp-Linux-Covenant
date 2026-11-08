export function getThemeCss(theme: string): string {
    switch (theme) {
        case "oled":
            return `
                :root, html, body, body.dark, [data-theme="dark"], #app {
                    --app-background: #000000 !important;
                    --background-default: #000000 !important;
                    --background-default-hover: #0c0c0c !important;
                    --background-default-active: #141414 !important;
                    --conversation-panel-background: #000000 !important;
                    --conversation-panel-border: #141414 !important;
                    --panel-header-background: #000000 !important;
                    --panel-header-icon: #8696a0 !important;
                    --search-input-background: #0c0c0c !important;
                    --incoming-background: #111111 !important;
                    --incoming-background-deeper: #0c0c0c !important;
                    --outgoing-background: #003d32 !important;
                    --outgoing-background-deeper: #002d24 !important;
                    --border-default: #181818 !important;
                    --border-strong: #222222 !important;
                    --border-list: #141414 !important;
                    --primary: #00a884 !important;
                    --primary-strong: #00a884 !important;
                    --primary-title: #e9edef !important;
                    --secondary: #8696a0 !important;
                    --message-primary: #e9edef !important;
                    --message-secondary: #8696a0 !important;
                    --compose-input-background: #0a0a0a !important;
                    --compose-input-border: #181818 !important;
                    --modal-background: #080808 !important;
                    --dropdown-background: #0a0a0a !important;
                    --system-message-background: #101010 !important;
                }
                #app, #app > div, #app > div > div,
                #side, #side header, #side [data-testid="chat-list"], #pane-side,
                div[role="navigation"],
                #main, #main header, #main footer,
                div[data-testid="conversation-panel-wrapper"],
                div[data-testid="conversation-panel-body"],
                div[data-testid="chatlist-header"] {
                    background-color: #000000 !important;
                    color: #e9edef !important;
                    border-color: #181818 !important;
                }
                #app > div > div > div:first-child {
                    background-color: #000000 !important;
                    border-right: 1px solid #181818 !important;
                }
                div.message-in > div, div[data-testid="msg-container"] .message-in > div {
                    background-color: #111111 !important;
                    color: #e9edef !important;
                    box-shadow: 0 1px 0.5px rgba(0,0,0,0.4) !important;
                }
                div.message-out > div, div[data-testid="msg-container"] .message-out > div {
                    background-color: #003d32 !important;
                    color: #e9edef !important;
                    box-shadow: 0 1px 0.5px rgba(0,0,0,0.4) !important;
                }
                span[dir="auto"], div[data-testid="cell-frame-title"], header span {
                    color: #e9edef !important;
                }
                div[data-testid="cell-frame-secondary"], span[data-testid="status-time"] {
                    color: #8696a0 !important;
                }
                div[contenteditable="true"], input[type="text"] {
                    background-color: #0c0c0c !important;
                    color: #e9edef !important;
                }
                button svg, span[data-testid*="icon"] svg {
                    color: #8696a0 !important;
                    fill: currentColor !important;
                }
            `;

        case "dracula":
            return `
                :root, html, body, body.dark, [data-theme="dark"], #app {
                    --app-background: #282a36 !important;
                    --background-default: #282a36 !important;
                    --background-default-hover: #343746 !important;
                    --background-default-active: #44475a !important;
                    --conversation-panel-background: #21222c !important;
                    --conversation-panel-border: #44475a !important;
                    --panel-header-background: #1e1f29 !important;
                    --panel-header-icon: #6272a4 !important;
                    --search-input-background: #21222c !important;
                    --incoming-background: #44475a !important;
                    --outgoing-background: #285340 !important;
                    --border-default: #44475a !important;
                    --border-strong: #6272a4 !important;
                    --border-list: #343746 !important;
                    --primary: #bd93f9 !important;
                    --primary-strong: #ff79c6 !important;
                    --primary-title: #f8f8f2 !important;
                    --secondary: #6272a4 !important;
                    --message-primary: #f8f8f2 !important;
                    --message-secondary: #6272a4 !important;
                    --compose-input-background: #1e1f29 !important;
                    --compose-input-border: #44475a !important;
                    --modal-background: #21222c !important;
                    --dropdown-background: #282a36 !important;
                }
                #app, #app > div, #app > div > div,
                #side, #side header, #side [data-testid="chat-list"], #pane-side,
                div[role="navigation"],
                #main, #main header, #main footer,
                div[data-testid="conversation-panel-wrapper"],
                div[data-testid="conversation-panel-body"],
                div[data-testid="chatlist-header"] {
                    background-color: #282a36 !important;
                    color: #f8f8f2 !important;
                    border-color: #44475a !important;
                }
                #app > div > div > div:first-child {
                    background-color: #1e1f29 !important;
                    border-right: 1px solid #44475a !important;
                }
                #main, div[data-testid="conversation-panel-wrapper"] {
                    background-color: #21222c !important;
                }
                div.message-in > div, div[data-testid="msg-container"] .message-in > div {
                    background-color: #44475a !important;
                    color: #f8f8f2 !important;
                }
                div.message-out > div, div[data-testid="msg-container"] .message-out > div {
                    background-color: #285340 !important;
                    color: #f8f8f2 !important;
                }
                span[dir="auto"], div[data-testid="cell-frame-title"], header span {
                    color: #f8f8f2 !important;
                }
                div[data-testid="cell-frame-secondary"], span[data-testid="status-time"] {
                    color: #6272a4 !important;
                }
                div[contenteditable="true"], input[type="text"] {
                    background-color: #1e1f29 !important;
                    color: #f8f8f2 !important;
                }
                button svg, span[data-testid*="icon"] svg {
                    color: #bd93f9 !important;
                    fill: currentColor !important;
                }
            `;

        case "catppuccin":
            return `
                :root, html, body, body.dark, [data-theme="dark"], #app {
                    --app-background: #1e1e2e !important;
                    --background-default: #1e1e2e !important;
                    --background-default-hover: #252538 !important;
                    --background-default-active: #313244 !important;
                    --conversation-panel-background: #181825 !important;
                    --conversation-panel-border: #313244 !important;
                    --panel-header-background: #181825 !important;
                    --panel-header-icon: #7f849c !important;
                    --search-input-background: #181825 !important;
                    --incoming-background: #313244 !important;
                    --outgoing-background: #2b473e !important;
                    --border-default: #313244 !important;
                    --border-strong: #45475a !important;
                    --border-list: #252538 !important;
                    --primary: #cba6f7 !important;
                    --primary-strong: #a6e3a1 !important;
                    --primary-title: #cdd6f4 !important;
                    --secondary: #7f849c !important;
                    --message-primary: #cdd6f4 !important;
                    --message-secondary: #7f849c !important;
                    --compose-input-background: #181825 !important;
                    --compose-input-border: #313244 !important;
                    --modal-background: #181825 !important;
                    --dropdown-background: #1e1e2e !important;
                }
                #app, #app > div, #app > div > div,
                #side, #side header, #side [data-testid="chat-list"], #pane-side,
                div[role="navigation"],
                #main, #main header, #main footer,
                div[data-testid="conversation-panel-wrapper"],
                div[data-testid="conversation-panel-body"],
                div[data-testid="chatlist-header"] {
                    background-color: #1e1e2e !important;
                    color: #cdd6f4 !important;
                    border-color: #313244 !important;
                }
                #app > div > div > div:first-child {
                    background-color: #11111b !important;
                    border-right: 1px solid #313244 !important;
                }
                #main, div[data-testid="conversation-panel-wrapper"] {
                    background-color: #181825 !important;
                }
                div.message-in > div, div[data-testid="msg-container"] .message-in > div {
                    background-color: #313244 !important;
                    color: #cdd6f4 !important;
                }
                div.message-out > div, div[data-testid="msg-container"] .message-out > div {
                    background-color: #2b473e !important;
                    color: #cdd6f4 !important;
                }
                span[dir="auto"], div[data-testid="cell-frame-title"], header span {
                    color: #cdd6f4 !important;
                }
                div[data-testid="cell-frame-secondary"], span[data-testid="status-time"] {
                    color: #7f849c !important;
                }
                div[contenteditable="true"], input[type="text"] {
                    background-color: #181825 !important;
                    color: #cdd6f4 !important;
                }
                button svg, span[data-testid*="icon"] svg {
                    color: #cba6f7 !important;
                    fill: currentColor !important;
                }
            `;

        case "nord":
            return `
                :root, html, body, body.dark, [data-theme="dark"], #app {
                    --app-background: #2e3440 !important;
                    --background-default: #2e3440 !important;
                    --background-default-hover: #3b4252 !important;
                    --background-default-active: #434c5e !important;
                    --conversation-panel-background: #242933 !important;
                    --conversation-panel-border: #3b4252 !important;
                    --panel-header-background: #242933 !important;
                    --panel-header-icon: #81a1c1 !important;
                    --search-input-background: #242933 !important;
                    --incoming-background: #3b4252 !important;
                    --outgoing-background: #28443e !important;
                    --border-default: #3b4252 !important;
                    --border-strong: #4c566a !important;
                    --border-list: #3b4252 !important;
                    --primary: #88c0d0 !important;
                    --primary-strong: #81a1c1 !important;
                    --primary-title: #eceff4 !important;
                    --secondary: #81a1c1 !important;
                    --message-primary: #eceff4 !important;
                    --message-secondary: #81a1c1 !important;
                    --compose-input-background: #242933 !important;
                    --compose-input-border: #3b4252 !important;
                    --modal-background: #242933 !important;
                    --dropdown-background: #2e3440 !important;
                }
                #app, #app > div, #app > div > div,
                #side, #side header, #side [data-testid="chat-list"], #pane-side,
                div[role="navigation"],
                #main, #main header, #main footer,
                div[data-testid="conversation-panel-wrapper"],
                div[data-testid="conversation-panel-body"],
                div[data-testid="chatlist-header"] {
                    background-color: #2e3440 !important;
                    color: #eceff4 !important;
                    border-color: #3b4252 !important;
                }
                #app > div > div > div:first-child {
                    background-color: #242933 !important;
                    border-right: 1px solid #3b4252 !important;
                }
                #main, div[data-testid="conversation-panel-wrapper"] {
                    background-color: #242933 !important;
                }
                div.message-in > div, div[data-testid="msg-container"] .message-in > div {
                    background-color: #3b4252 !important;
                    color: #eceff4 !important;
                }
                div.message-out > div, div[data-testid="msg-container"] .message-out > div {
                    background-color: #28443e !important;
                    color: #eceff4 !important;
                }
                span[dir="auto"], div[data-testid="cell-frame-title"], header span {
                    color: #eceff4 !important;
                }
                div[data-testid="cell-frame-secondary"], span[data-testid="status-time"] {
                    color: #81a1c1 !important;
                }
                div[contenteditable="true"], input[type="text"] {
                    background-color: #242933 !important;
                    color: #eceff4 !important;
                }
                button svg, span[data-testid*="icon"] svg {
                    color: #88c0d0 !important;
                    fill: currentColor !important;
                }
            `;

        default:
            return "";
    }
}
