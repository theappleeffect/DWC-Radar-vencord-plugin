# DWCRadar

Vencord plugin that scans servers for staff-role members and collects their IDs for DWC bulk actions.

## Features

- **Auto-scan on join** — automatically detects staff members when you join a new server and sends a notification
- **Manual scan** — scan the current server or all servers at once from the modal
- **Right-click scan** — right-click any server in the sidebar to scan it for staff
- **Invite queue** — paste a list of invite links, then join them one by one with the **Join Next** button or **Alt+A** shortcut
- **Copy DWC format** — copy all detected IDs in `?dwc add` format, ready to paste
- **Deduplication** — if the same user is staff in multiple servers, they show once with a badge indicating how many servers
- **Leave All Servers** — right-click any server to leave every server at once (respects your exclusion list)
- **Multi-language** — detects staff roles in English, Spanish, Portuguese, French, German, Italian, Dutch, and Turkish
- **Smart filtering** — automatically excludes roles containing "retired", "former", "ping", "tester", "bot", "announcement", and more
- **Bot exclusion** — bot accounts are never logged
- **In-modal settings** — all settings are accessible directly in the DWC Radar modal, synced with the plugin settings

## Installation

Because this is not an official Vencord plugin, you must build Vencord with the plugin from source before injecting Discord.

1. Install [Node.js](https://nodejs.org/), [git](https://git-scm.com/), and [pnpm](https://pnpm.io/) if missing.

2. Clone Vencord's GitHub repository:

```
git clone https://github.com/Vendicated/Vencord
cd Vencord
pnpm install --frozen-lockfile
```

3. Navigate to the `src` folder in the cloned Vencord repository, create a new folder called `userplugins` if it doesn't already exist.

4. Download `index.tsx`, `DWCRadarPanel.tsx`, `store.ts`, and `style.css` from this repository and move them to the `userplugins/DWCRadar` folder.

5. Build Vencord and inject Discord:

```
pnpm build
pnpm inject
```

6. If built and injected successfully, follow the remaining prompt(s) and restart Discord to apply changes.

7. In Discord's Vencord plugins menu, enable the **DWCRadar** plugin.

[Official Vencord custom plugin installation guide](https://docs.vencord.dev/installing/custom-plugins/)

## Usage

### Scanning

- **Auto**: Join a new server and the plugin scans automatically after a few seconds.
- **Manual**: Open the modal (chat bar icon, `/dwcradar`, or right-click a server > **Scan for Staff**) and click **Current Server** or **All Servers**.
- **All Servers** loads member data for unvisited servers before scanning.

### Copying IDs

- **Copy DWC** — copies in `?dwc add` format:
  ```
  ?dwc add 1234567890123456789
  9876543210987654321
  1122334455667788990
  ```
- **Copy IDs** — plain newline-separated list.

### Invite Queue

1. Paste invite links into the **Invite Queue** text area (one per line).
2. Click **Join Next** or press **Alt+A** anywhere in Discord.
3. A server preview appears — click **Accept Invite** to join.
4. The invite is removed from the list. Invalid invites are automatically skipped.

### Managing Entries

- Checkbox marks entries as handled (strikethrough).
- X button deletes an entry.
- **Clear** removes all entries.
- If the same user appears in multiple servers, they show once with a numbered badge. Hover the badge to see which servers.

### Leave All Servers

Right-click any server > **Leave All Servers**. Leaves every server except those in your excluded servers list.

## Settings

All settings are editable in the DWC Radar modal (click **Settings** to expand) and in the Vencord plugin settings. Changes sync both ways.

### Keywords

Comma-separated keywords matched against role names. Case-insensitive substring matching.

Default includes English and translated staff terms: Mod, Admin, Staff, Owner, Helper, Manager, Supervisor, Trainee, and equivalents in Spanish, Portuguese, French, German, Italian, Dutch, and Turkish.

### Excluded Servers

Comma-separated server IDs that will never be scanned or left. Right-click a server > **Copy Server ID** to get the ID.

### Excluded Role Keywords

Your own comma-separated keywords to exclude roles (on top of the built-in exclusions). For example: `supporter, veteran, vip`.

### Built-in Exclusions

These role keywords are always excluded automatically:

`retired, retirado, retraite, pensioniert, ritirato, gepensioneerd, emekli, announcement, anuncio, annonce, ankündigung, duyuru, tester, probador, testeur, bot, former, ex-, antiguo, ancien, ehemalig, voormalig, eski, ping`

### Invite List

Invite links to join, one per line. Processed top-to-bottom via **Join Next** or **Alt+A**.
