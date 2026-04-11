import { DataStore } from "@api/index";
import { Logger } from "@utils/Logger";
import { GuildMemberStore, GuildRoleStore, GuildStore, React, SelectedGuildStore, UserStore } from "@webpack/common";

export interface StaffEntry {
    userId: string;
    username?: string;
    guildId: string;
    guildName?: string;
    roles?: string[];
    handled?: boolean;
}

const logger = new Logger("DWCRadar");
const STORE_KEY = "DWCRadar_entries";

const EXCLUDED_TERMS = [
    "retired", "retirado", "retraité", "pensioniert", "ritirato", "gepensioneerd", "emekli",
    "announcement", "anuncio", "annonce", "ankündigung", "annuncio", "aankondiging", "duyuru",
    "tester", "probador", "testeur", "testador", "provatore", "penguji",
    "bot",
    "former", "ex-", "antiguo", "ancien", "ehemalig", "voormalig", "eski",
    "ping",
];

let entries: StaffEntry[] = [];
const listeners = new Set<() => void>();

function notify() {
    listeners.forEach(fn => fn());
}

export async function loadStoredEntries() {
    const stored = await DataStore.get<StaffEntry[]>(STORE_KEY);
    if (stored) {
        entries = stored;
        notify();
    }
}

export function addStaffEntry(entry: StaffEntry): boolean {
    if (entries.some(e => e.userId === entry.userId && e.guildId === entry.guildId)) return false;

    entries = [...entries, entry];
    notify();
    DataStore.set(STORE_KEY, entries);
    return true;
}

export function toggleHandled(userId: string, guildId: string) {
    entries = entries.map(e =>
        e.userId === userId && e.guildId === guildId ? { ...e, handled: !e.handled } : e
    );
    notify();
    DataStore.set(STORE_KEY, entries);
}

export function removeEntry(userId: string, guildId: string) {
    entries = entries.filter(e => !(e.userId === userId && e.guildId === guildId));
    notify();
    DataStore.set(STORE_KEY, entries);
}

export function clearAllEntries() {
    entries = [];
    notify();
    DataStore.set(STORE_KEY, entries);
}

export function getEntries(): StaffEntry[] {
    return entries;
}

let scanning = false;
const scanListeners = new Set<() => void>();

export function useIsScanning(): boolean {
    const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

    React.useEffect(() => {
        scanListeners.add(forceUpdate);
        return () => { scanListeners.delete(forceUpdate); };
    }, []);

    return scanning;
}

function setScanning(val: boolean) {
    scanning = val;
    scanListeners.forEach(fn => fn());
}

export function parseKeywords(keywordSetting: string): string[] {
    return keywordSetting
        .split(",")
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);
}

function matchesKeyword(text: string, keywords: string[]): boolean {
    const lower = text.toLowerCase();
    return keywords.some(kw => lower.includes(kw));
}

function checkMember(
    member: { user?: any; roles?: string[]; nick?: string; },
    guildId: string,
    guildName: string,
    staffRoleIds: Set<string>,
    roleIdToName: Map<string, string>,
): boolean {
    const userId = member.user?.id;
    if (!userId) return false;

    const matchedRoles: string[] = [];
    let matched = false;

    const memberRoles = member.roles ?? [];
    for (const roleId of memberRoles) {
        if (staffRoleIds.has(roleId)) {
            matchedRoles.push(roleIdToName.get(roleId) ?? "Unknown Role");
            matched = true;
        }
    }

    if (matched) {
        const nickname = member.nick;
        const username = member.user?.username;
        return addStaffEntry({
            userId,
            username: nickname || username || undefined,
            guildId,
            guildName,
            roles: matchedRoles,
        });
    }

    return false;
}

export function scanGuild(guildId: string, guildName: string, keywords: string[]): number {
    if (scanning) return 0;
    setScanning(true);

    let newCount = 0;

    try {
        const guild = GuildStore.getGuild(guildId);
        if (!guild) {
            logger.warn("Guild not found:", guildId);
            return 0;
        }

        const staffRoleIds = new Set<string>();
        const roleIdToName = new Map<string, string>();

        const allRoles = GuildRoleStore.getSortedRoles(guildId);
        for (const role of allRoles) {
            const lower = role?.name?.toLowerCase() ?? "";
            if (role && role.name && matchesKeyword(role.name, keywords)
                && !EXCLUDED_TERMS.some(t => lower.includes(t))) {
                staffRoleIds.add(role.id);
                roleIdToName.set(role.id, role.name);
            }
        }

        logger.info(`Found ${staffRoleIds.size} matching roles in ${guildName}:`,
            Array.from(roleIdToName.values()).join(", "));

        const memberIds: string[] = GuildMemberStore.getMemberIds(guildId) ?? [];
        logger.info(`Checking ${memberIds.length} cached members in ${guildName}`);

        for (const userId of memberIds) {
            const cachedMember = GuildMemberStore.getMember(guildId, userId);
            if (!cachedMember) continue;

            const user = UserStore.getUser(userId);
            const member = {
                user: user ?? { id: userId, username: undefined },
                roles: cachedMember.roles,
                nick: cachedMember.nick,
            };

            if (checkMember(member, guildId, guildName, staffRoleIds, roleIdToName)) {
                newCount++;
            }
        }

        logger.info(`Scan complete: ${newCount} new staff entries in ${guildName}`);
    } finally {
        setScanning(false);
    }

    return newCount;
}

export function scanCurrentGuild(keywords: string[]): number {
    const guildId = SelectedGuildStore.getGuildId();
    if (!guildId) return 0;

    const guild = GuildStore.getGuild(guildId);
    const guildName = guild?.name ?? "Unknown Server";

    return scanGuild(guildId, guildName, keywords);
}

export function useStaffEntries(): StaffEntry[] {
    const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

    React.useEffect(() => {
        listeners.add(forceUpdate);
        return () => { listeners.delete(forceUpdate); };
    }, []);

    return entries;
}
