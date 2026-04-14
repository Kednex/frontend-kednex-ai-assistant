/**
 * Stable module-level store for per-message attachment URLs.
 *
 * This intentionally lives in its own file so that Hot Module Replacement
 * (HMR / React Fast Refresh) never re-evaluates it. Webpack only re-evaluates
 * modules whose source has changed, so editing useChatSession.ts or ChatInput.tsx
 * will NOT recreate this object – every version of every closure always
 * imports the exact same reference.
 *
 * Writing:  attachmentsStore.current = ['url1', ...]  (in sendMessage)
 * Reading:  attachmentsStore.current                   (in prepareSendMessagesRequest)
 */
const attachmentsStore: { current: string[] } = { current: [] };




export default attachmentsStore;
