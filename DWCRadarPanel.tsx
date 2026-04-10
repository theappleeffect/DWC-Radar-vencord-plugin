import { Settings } from "@api/Settings";
import { Button } from "@components/Button";
import { Heading } from "@components/Heading";
import { copyToClipboard } from "@utils/clipboard";
import { classNameFactory } from "@utils/css";
import { classes } from "@utils/misc";
import { ModalCloseButton, ModalContent, ModalHeader, ModalProps, ModalRoot, ModalSize } from "@utils/modal";
import { Avatar, IconUtils, showToast, Toasts, UserStore, useMemo, useState } from "@webpack/common";

import { clearAllEntries, parseKeywords, removeEntry, scanCurrentGuild, toggleHandled, useIsScanning, useStaffEntries } from "./store";
import type { StaffEntry } from "./store";

const cl = classNameFactory("vc-dwcradar-");

function UserAvatar({ userId }: { userId: string; }) {
    const user = UserStore.getUser(userId);
    if (!user) {
        return <div className={cl("avatar-fallback")}>?</div>;
    }
    return (
        <Avatar
            src={IconUtils.getUserAvatarURL(user, true, 32)}
            size="SIZE_24"
            className={cl("avatar")}
        />
    );
}

function StaffEntryRow({ entry }: { entry: StaffEntry; }) {
    const copyId = () => {
        copyToClipboard(entry.userId);
        showToast(`Copied ${entry.userId}`, Toasts.Type.SUCCESS);
    };

    const user = UserStore.getUser(entry.userId);
    const displayName = entry.username || user?.username || "Unknown";

    return (
        <div className={classes(cl("entry"), entry.handled && cl("entry-handled"))}>
            <div className={cl("entry-left")}>
                <input
                    type="checkbox"
                    className={cl("checkbox")}
                    checked={!!entry.handled}
                    onChange={() => toggleHandled(entry.userId, entry.guildId)}
                    title={entry.handled ? "Mark as unhandled" : "Mark as handled"}
                />
                <UserAvatar userId={entry.userId} />
                <div className={cl("entry-info")}>
                    <span className={cl("entry-name")}>{displayName}</span>
                    {entry.roles && entry.roles.length > 0 && (
                        <span className={cl("entry-roles")}>{entry.roles.join(", ")}</span>
                    )}
                    <code className={cl("entry-id")}>{entry.userId}</code>
                </div>
            </div>
            <div className={cl("entry-actions")}>
                <Button variant="secondary" size="xs" onClick={copyId}>Copy</Button>
                <Button variant="dangerSecondary" size="xs" onClick={() => removeEntry(entry.userId, entry.guildId)}>
                    <svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z" /></svg>
                </Button>
            </div>
        </div>
    );
}

function ScanSection() {
    const isScanning = useIsScanning();
    const pluginSettings = Settings.plugins.DWCRadar;

    const scan = () => {
        const keywords = parseKeywords(pluginSettings.keywords);
        const count = scanCurrentGuild(keywords);
        if (count > 0) {
            showToast(`Found ${count} new staff members`, Toasts.Type.SUCCESS);
        } else {
            showToast("No new staff members found", Toasts.Type.MESSAGE);
        }
    };

    return (
        <div className={cl("scan")}>
            <div className={cl("scan-top")}>
                <Heading tag="h5" className={cl("scan-label")}>
                    {isScanning ? "Scanning..." : "Scan Server"}
                </Heading>
                <div className={cl("scan-actions")}>
                    <Button variant="secondary" size="small" onClick={scan} disabled={isScanning}>
                        {isScanning ? "Scanning..." : "Scan Current Server"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function DWCRadarModal({ rootProps }: { rootProps: ModalProps; }) {
    const entries = useStaffEntries();
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search.trim()) return entries;
        const q = search.toLowerCase();
        return entries.filter(e =>
            e.userId.includes(q) ||
            e.username?.toLowerCase().includes(q) ||
            e.guildName?.toLowerCase().includes(q) ||
            e.roles?.some(r => r.toLowerCase().includes(q))
        );
    }, [entries, search]);

    const unhandledCount = entries.filter(e => !e.handled).length;

    const copyDWC = () => {
        if (!filtered.length) return;
        const ids = filtered.map(e => e.userId);
        const text = ids.length === 1
            ? `?dwc add ${ids[0]}`
            : `?dwc add ${ids[0]}\n${ids.slice(1).join("\n")}`;
        copyToClipboard(text);
        showToast(`Copied ${ids.length} IDs in DWC format`, Toasts.Type.SUCCESS);
    };

    const copyAllIds = () => {
        if (!filtered.length) return;
        copyToClipboard(filtered.map(e => e.userId).join("\n"));
        showToast(`Copied ${filtered.length} IDs`, Toasts.Type.SUCCESS);
    };

    return (
        <ModalRoot {...rootProps} size={ModalSize.MEDIUM}>
            <ModalHeader className={cl("header")}>
                <Heading tag="h2" className={cl("title")}>
                    DWC Radar
                    <span className={cl("count")}>{unhandledCount}</span>
                </Heading>
                <div className={cl("header-actions")}>
                    <Button variant="primary" size="small" onClick={copyDWC} disabled={!filtered.length}>
                        Copy DWC
                    </Button>
                    <Button variant="secondary" size="small" onClick={copyAllIds} disabled={!filtered.length}>
                        Copy IDs
                    </Button>
                    <Button variant="dangerPrimary" size="small" onClick={clearAllEntries} disabled={!entries.length}>
                        Clear
                    </Button>
                </div>
                <ModalCloseButton onClick={rootProps.onClose} />
            </ModalHeader>
            <ModalContent className={cl("content")}>
                <ScanSection />

                {entries.length > 0 && (
                    <div className={cl("search")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" className={cl("search-icon")}>
                            <path fill="currentColor" d="M21.707 20.293l-4.823-4.823A7.454 7.454 0 0 0 18.5 10.5a7.5 7.5 0 1 0-7.5 7.5 7.454 7.454 0 0 0 4.97-1.616l4.823 4.823a1 1 0 0 0 1.414-1.414zM10.5 16a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" />
                        </svg>
                        <input
                            type="text"
                            className={cl("search-input")}
                            placeholder="Search IDs, usernames, servers, or roles..."
                            value={search}
                            onChange={e => setSearch(e.currentTarget.value)}
                        />
                        {search && (
                            <span className={cl("search-count")}>
                                {filtered.length}/{entries.length}
                            </span>
                        )}
                    </div>
                )}

                {entries.length === 0 ? (
                    <div className={cl("empty")}>
                        <svg width="48" height="48" viewBox="0 0 24 24" className={cl("empty-icon")}>
                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm1-12.5L9.04 9.46 7.6 8.04l-1.42 1.42 1.44 1.44L5.64 12.88l1.42 1.42 1.98-1.98 1.44 1.44 1.42-1.42-1.46-1.46 1.98-1.98L11 8.48l1.42-1.42L11 5.64 12.88 3.66 14.32 5.1l-1.98 1.98L13 7.5z" />
                        </svg>
                        <p>No staff entries detected yet.</p>
                        <p className={cl("empty-hint")}>Join a server or click "Scan Current Server" to detect staff members.</p>
                    </div>
                ) : (
                    <div className={cl("list")}>
                        {filtered.map(entry => (
                            <StaffEntryRow key={`${entry.userId}-${entry.guildId}`} entry={entry} />
                        ))}
                        {filtered.length === 0 && search && (
                            <div className={cl("empty")}>
                                <p>No entries match "{search}"</p>
                            </div>
                        )}
                    </div>
                )}
            </ModalContent>
        </ModalRoot>
    );
}
