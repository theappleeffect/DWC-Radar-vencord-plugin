import { addChatBarButton, ChatBarButton, ChatBarButtonFactory, removeChatBarButton } from "@api/ChatButtons";
import { ApplicationCommandInputType } from "@api/Commands";
import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { Notifications } from "@api/index";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { IconComponent, OptionType } from "@utils/types";
import { openModal } from "@utils/modal";
import { GuildStore, Menu, showToast, Toasts } from "@webpack/common";

import { DWCRadarModal } from "./DWCRadarPanel";
import { loadStoredEntries, parseKeywords, scanGuild } from "./store";

import style from "./style.css?managed";

const settings = definePluginSettings({
    keywords: {
        type: OptionType.STRING,
        description: "Comma-separated keywords to match against role names and display names",
        default: "Mod,Moderator,Moderation,Senior Moderator,Trial Mod,Admin,Administrator,Manager,Owner,Co-Owner,Helper,Staff,Jr. Staff,Sr. Staff,Head Staff,Senior Staff,Supervisor,Trainee,Dueño,Ayudante,Soporte,Personal,Jefe,Dono,Ajudante,Equipe,Suporte,Propriétaire,Aide,Personnel,Gérant,Besitzer,Leitung,Helfer,Personale,Proprietario,Eigenaar,Beheerder,Yönetici,Sahip,Yardımcı",
    },
});

const DWCRadarIcon: IconComponent = ({ height = 20, width = 20, className }) => (
    <svg
        viewBox="0 0 24 24"
        width={width}
        height={height}
        className={className}
    >
        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-14h2v6h-2zm0 8h2v2h-2z" />
    </svg>
);

function openDWCRadarModal() {
    openModal(props => <DWCRadarModal rootProps={props} />);
}

const DWCRadarChatBarBtn: ChatBarButtonFactory = () => (
    <ChatBarButton
        tooltip="DWC Radar - Staff Scanner"
        onClick={openDWCRadarModal}
    >
        <DWCRadarIcon />
    </ChatBarButton>
);

const GuildContextMenuPatch: NavContextMenuPatchCallback = (children, { guild }: { guild: any; }) => {
    if (!guild) return;

    const group = findGroupChildrenByChildId("privacy", children);
    group?.push(
        <Menu.MenuItem
            id="vc-dwcradar-scan"
            label="Scan for Staff"
            action={() => {
                const keywords = parseKeywords(settings.store.keywords);
                scanGuild(guild.id, guild.name, keywords);
                openDWCRadarModal();
            }}
        />
    );
};

export default definePlugin({
    name: "DWCRadar",
    description: "Scans servers for staff-role members and collects their IDs for DWC bulk actions",
    authors: [{ name: "theappleeffect", id: 0n }],

    settings,
    managedStyle: style,

    contextMenus: {
        "guild-context": GuildContextMenuPatch,
        "guild-header-popout": GuildContextMenuPatch,
    },

    commands: [{
        name: "dwcradar",
        description: "Open the DWC Radar panel to view detected staff members",
        inputType: ApplicationCommandInputType.BUILT_IN,
        execute: () => {
            openDWCRadarModal();
        },
    }],

    async start() {
        await loadStoredEntries();
        addChatBarButton("DWCRadar", DWCRadarChatBarBtn, DWCRadarIcon);
    },

    stop() {
        removeChatBarButton("DWCRadar");
    },

    flux: {
        GUILD_CREATE({ guild }: { guild: any; }) {
            const keywords = parseKeywords(settings.store.keywords);
            if (!keywords.length) return;

            const guildId = guild?.id;
            const guildName = guild?.name ?? "Unknown Server";
            if (!guildId) return;

            setTimeout(() => {
                const count = scanGuild(guildId, guildName, keywords);
                if (count > 0) {
                    Notifications.showNotification({
                        title: "DWC Radar",
                        body: `Found ${count} staff member${count > 1 ? "s" : ""} in ${guildName}`,
                        color: "#5865F2",
                        noPersist: true,
                        onClick: openDWCRadarModal,
                    });
                }
            }, 3000);
        },
    },
});
