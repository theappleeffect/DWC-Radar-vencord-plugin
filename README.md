# DWCRadar

Vencord plugin that scans servers for staff-role members and collects their IDs for DWC bulk actions.

## How it works

When you join a new Discord server, the plugin automatically scans the server's roles and members after a short delay. It matches all server roles against a configurable list of keywords (e.g. Mod, Admin, Staff, Owner) and checks each cached member for:

- **Role matches** — members who have roles with names containing any of the keywords.
- **Display name matches** — members whose username or server nickname contains any of the keywords.

Detected staff members are saved to a persistent list that survives Discord restarts. A toast notification appears showing how many staff members were found — clicking it opens the DWC Radar modal.

You can also manually scan the current server at any time using the "Scan Current Server" button in the modal.

> **Note:** The plugin can only scan members that Discord has loaded into memory (cached). Discord lazy-loads members, so scrolling through the member sidebar before scanning will yield more complete results. Auto-scan on join may find fewer members than a manual scan after browsing the server.

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

1. Make sure you have the DWCRadar plugin enabled under Vencord plugins.

2. Join a new server — the plugin will automatically scan and notify you if staff members are detected.

3. To manually scan, click the DWC Radar icon in the chat bar or run `/dwcradar`, then click **Scan Current Server**.

4. The modal displays all detected staff members with their avatar, username, matched roles, and user ID.

5. Use the header buttons to copy IDs:
   - **Copy DWC** — copies IDs in the `?dwc add` command format:
     ```
     ?dwc add 1234567890123456789
     9876543210987654321
     1122334455667788990
     ```
   - **Copy IDs** — copies all IDs as a plain newline-separated list.

6. Mark entries as handled using the checkbox, delete individual entries with the X button, or use **Clear** to remove all entries.

## Settings

### Keywords

Comma-separated list of keywords to match against role names and display names. Matching is case-insensitive and uses substring matching (e.g. "Mod" will match "Moderator").

Default: `Mod,Moderation,Admin,Administrator,Manager,Owner,Helper,Jr. Staff,Staff,Head Staff,Sr. Staff,Senior Staff`
