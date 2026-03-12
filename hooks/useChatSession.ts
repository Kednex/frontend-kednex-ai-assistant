import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { RootState } from '@/lib/store/store'
import { setSessionId, setRooms, setCategory } from '@/lib/store/chatSlice'
import type { ChatSession } from '@/lib/types'
import { generateUUID } from '@/lib/utils/uuid'
import { normalizeRooms } from '@/lib/utils/storage'
import attachmentsStore from './attachmentsStore'

const STORAGE_KEYS = {
    CHAT_ACTIVE_SESSION: 'imersian:chat_active_session',
    CHAT_SESSION_INDEX: 'imersian:chat_session_index'
} as const

export function useChatSession() {
    const dispatch = useAppDispatch()
    const { sessionId, category, rooms, intent } = useAppSelector(
        (state: RootState) => state.chat
    )

    const hasHydratedRef = useRef(false)
    const isNewChatFromIntro = useRef(false)
    const [hydrated, setHydrated] = useState(false)

    // track the last response ID from the AI backend so we can continue
    const previousResponseId = useRef<string | null>(null);

    // products returned by the backend MCP tool call — attached to the message in onFinish
    const pendingProducts = useRef<any[] | null>(null);

    // ref so onFinish (defined before chatApi) can call setMessages
    const setMessagesRef = useRef<((updater: any) => void) | null>(null);

    // Hydrate once
    useEffect(() => {
        if (hasHydratedRef.current) return
        hasHydratedRef.current = true

        try {
            let session: ChatSession | null = null
            let shouldAutoIntro = false

            if (intent?.sessionId) {
                session = intent
                if (intent.messages.length === 0) {
                    shouldAutoIntro = true
                }
            } else {
                // TODO [BACKEND]: Fetch active session from backend if user is authenticated
                // const backendSession = await api.getLatestSession();
                // if (backendSession) session = backendSession;

                const raw = localStorage.getItem(STORAGE_KEYS.CHAT_ACTIVE_SESSION)
                if (raw) {
                    session = JSON.parse(raw) as ChatSession
                }
            }

            if (!session) {
                session = {
                    sessionId: generateUUID(),
                    category: '',
                    contextUploads: [],
                    messages: [],
                    previousResponseId: null,
                    timestamp: Date.now()
                }
            }

            // restore previousResponseId from the session if present
            if (session.previousResponseId) {
                previousResponseId.current = session.previousResponseId;
            }

            dispatch(setSessionId(session.sessionId))
            dispatch(setCategory(session.category || ''))
            dispatch(setRooms(normalizeRooms(session.contextUploads || [])))

            if (shouldAutoIntro) {
                isNewChatFromIntro.current = true
            }

            setHydrated(true)
        } catch (e) {
            console.error('[useChatSession] Hydration error:', e)
            setHydrated(true)
        }
    }, [dispatch, intent])

    // Memoise body so it updates when category/rooms change
    const baseChatBody = useMemo(() => {
        return {
            sessionId,
            category,
            rooms: rooms.map(r => r.imageUrl)
        }
    }, [sessionId, category, rooms])

    // create transport once but inject previousResponseId on each message
    const transport = useMemo(() => {
        return new DefaultChatTransport({
            api: '/api/chat',
            body: baseChatBody,
            prepareSendMessagesRequest(request) {
                // Read attachments from the module-level store (immune to closure staleness).
                // Clear immediately after reading so stale attachments never leak into
                // a subsequent text-only message.
                const attachments = attachmentsStore.current;
                attachmentsStore.current = [];

                const payload: any = {
                    ...request.body,
                    messages: request.messages,
                    previousResponseId: previousResponseId.current,
                    attachments,
                };
                console.log('Preparing send request payload', payload);
                return { body: payload };
            },
        })
    }, [baseChatBody])

    const chatApi = useChat({
        transport,
        id: sessionId || undefined,
        onError: (error) => {
            console.error('Chat error:', error)
        },
        onData: (dataPart: any) => {
            // 🔍 Log everything so we can see what the AI SDK delivers
            console.log('📨 onData TYPE:', dataPart.type, '| data:', JSON.stringify(dataPart.data));

            if (dataPart.data && typeof dataPart.data === 'object') {
                if ('responseId' in dataPart.data) {
                    const responseId = (dataPart.data as any).responseId;
                    if (responseId) {
                        console.log('✅ Captured responseId from onData:', responseId);
                        previousResponseId.current = responseId;
                    }
                }

                if ('products' in dataPart.data && Array.isArray((dataPart.data as any).products)) {
                    pendingProducts.current = (dataPart.data as any).products;
                    console.log('✅ Captured products from onData:', pendingProducts.current?.length);
                }
            }
        },
        onFinish: (message: any) => {
            console.log('🏁 onFinish called | message.id:', message?.id, '| pendingProducts:', pendingProducts.current?.length ?? 0);
            // Attach any products the backend returned to the finished assistant message.
            // Use last-assistant-message matching (more robust than ID matching)
            if (pendingProducts.current?.length) {
                const products = pendingProducts.current;
                pendingProducts.current = null;
                setMessagesRef.current?.((prev: any[]) => {
                    const lastAssistantIdx = prev.map(m => m.role).lastIndexOf('assistant');
                    if (lastAssistantIdx === -1) return prev;
                    return prev.map((m, i) =>
                        i === lastAssistantIdx
                            ? { ...m, searchPayload: { products } }
                            : m
                    );
                });
                console.log('✅ Attached products to last assistant message');
            }
        },
    })

    const { messages, setMessages, sendMessage: sdkSendMessage, status } = chatApi

    // keep the ref in sync so onFinish can always reach the current setMessages
    setMessagesRef.current = setMessages;
    const isLoading = status === 'submitted' || status === 'streaming'

    // Restore previous messages AFTER hydration + chat initialised
    useEffect(() => {
        if (!hydrated) return
        if (!sessionId) return

        const raw = localStorage.getItem(STORAGE_KEYS.CHAT_ACTIVE_SESSION)
        if (!raw) return

        const session = JSON.parse(raw) as ChatSession
        if (session.messages?.length) {
            setMessages(session.messages)
        }
        // also restore response id if available (already done in hydration block, but safe here too)
        if (session.previousResponseId) {
            previousResponseId.current = session.previousResponseId
        }
    }, [hydrated, sessionId, setMessages])

    // Autosave
    useEffect(() => {
        if (!sessionId) return

        const timeout = setTimeout(() => {
            const session: ChatSession = {
                sessionId,
                category,
                messages,
                contextUploads: rooms,
                timestamp: Date.now(),
                previousResponseId: previousResponseId.current
            }

            try {
                // TODO [BACKEND]: Sync session state with backend
                // await api.syncSession(session);

                localStorage.setItem(
                    STORAGE_KEYS.CHAT_ACTIVE_SESSION,
                    JSON.stringify(session)
                )

                const indexRaw = localStorage.getItem(
                    STORAGE_KEYS.CHAT_SESSION_INDEX
                )
                const index: ChatSession[] = indexRaw
                    ? JSON.parse(indexRaw)
                    : []

                const existing = index.findIndex(
                    s => s.sessionId === session.sessionId
                )

                if (existing >= 0) {
                    index[existing] = session
                } else {
                    index.unshift(session)
                }

                localStorage.setItem(
                    STORAGE_KEYS.CHAT_SESSION_INDEX,
                    JSON.stringify(index.slice(0, 10))
                )
            } catch (e) {
                console.error('Failed to save session', e)
            }
        }, 800)

        return () => clearTimeout(timeout)
    }, [sessionId, messages, category, rooms])

    // Auto intro
    useEffect(() => {
        if (
            !isNewChatFromIntro.current ||
            messages.length > 0 ||
            !category ||
            rooms.length === 0
        )
            return

        isNewChatFromIntro.current = false

        const introText = `Here is my room. Please recommend ${category.toLowerCase()} that would suit this interior.`

        sdkSendMessage({ text: introText })
    }, [messages.length, category, rooms.length, sdkSendMessage])

    const getChatSession = useCallback((): ChatSession => {
        return {
            sessionId: sessionId || '',
            category,
            messages: messages as any[],
            contextUploads: rooms,
            timestamp: Date.now(),
            previousResponseId: previousResponseId.current,
        };
    }, [sessionId, category, messages, rooms, previousResponseId]);

    // if the messages reset (e.g. new chat), clear the stored response id
    useEffect(() => {
        if (messages.length === 0) {
            previousResponseId.current = null
        }
    }, [messages.length])

    // Expose an adapted sendMessage that matches what UI expects
    const sendMessage = useCallback(
        async (content: string, attachments?: string[]) => {
            if (!content.trim() && (!attachments || attachments.length === 0)) return
            if (isLoading) return

            // Write to the module-level store synchronously before the SDK call.
            // prepareSendMessagesRequest reads from the same store.
            attachmentsStore.current = attachments ?? []
            console.log('[sendMessage] wrote attachments to store:', attachmentsStore.current)

            await sdkSendMessage({ text: content })
        },
        [sdkSendMessage, isLoading]
    )

    return {
        ...chatApi,
        sendMessage,
        category,
        rooms,
        sessionId,
        hydrated,
        isLoading,
        getChatSession
    }
}
