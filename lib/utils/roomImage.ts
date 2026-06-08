const CDN_BASE = "https://cdn.imersian.com/original-background";

/**
 * The hosted original room photo for a session.
 *
 * The backend stores the uploaded room under a deterministic path keyed by
 * designId + designId, so we can rebuild the durable URL on restore instead of
 * relying on the ephemeral `blob:` preview URL (which dies on reload).
 *
 * Pattern: original-background/{designId}/0/{designId}.png
 */
export function buildRoomBackgroundUrl(
    designId?: string | null,
): string | null {
    if (!designId) return null;
    return `${CDN_BASE}/${designId}/0/${designId}.png`;
}

/**
 * Replace dead `blob:` attachment URLs on restored user messages with the
 * durable hosted room URL. Live (same-session) blob URLs are left untouched
 * because there is nothing to restore.
 */
export function rehydrateRoomAttachments<
    T extends { role?: string; attachments?: string[] },
>(messages: T[], backgroundUrl: string | null): T[] {
    if (!backgroundUrl) return messages;
    return messages.map((m) => {
        if (m.role !== "user" || !m.attachments?.length) return m;
        const attachments = m.attachments.map((u) =>
            typeof u === "string" && u.startsWith("blob:") ? backgroundUrl : u,
        );
        return { ...m, attachments };
    });
}
