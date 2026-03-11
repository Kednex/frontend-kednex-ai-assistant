import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { RootState } from '@/lib/store/store'
import { setSessionId, setRooms, setCategory } from '@/lib/store/chatSlice'
import type { ChatSession } from '@/lib/types'
import { generateUUID } from '@/lib/utils/uuid'
import { normalizeRooms } from '@/lib/utils/storage'

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

    // Read userUuid from URL query params
    const userUuid = useMemo(() => {
        if (typeof window === 'undefined') return ''
        return new URLSearchParams(window.location.search).get('userUuid') || ''
    }, [])

    // Memoise body so it updates when category/rooms change
    const baseChatBody = useMemo(() => {
        return {
            sessionId,
            category,
            rooms: rooms.map(r => r.imageUrl),
            userUuid
        }
    }, [sessionId, category, rooms, userUuid])

    // ref to hold pending attachments for the next message
    const pendingAttachmentsRef = useRef<string[]>([]);

    // create transport once but inject previousResponseId on each message
    const transport = useMemo(() => {
        return new DefaultChatTransport({
            api: '/api/chat',
            body: baseChatBody,
            prepareSendMessagesRequest(request) {
                const payload: any = {
                    ...request.body,
                    messages: request.messages,
                    previousResponseId: previousResponseId.current,
                    attachments: pendingAttachmentsRef.current
                };
                // clear after sending
                pendingAttachmentsRef.current = [];
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
            // Debug: log all data parts to understand structure
            console.log('📨 onData received:', {
                type: dataPart.type,
                hasData: !!dataPart.data,
                dataKeys: dataPart.data ? Object.keys(dataPart.data) : [],
                fullDataPart: dataPart
            });

            // look for a responseId coming back from the stream
            // Check multiple possible locations where responseId might be
            let responseId: string | null = null;
            
            if (dataPart.data && typeof dataPart.data === 'object') {
                if ('responseId' in dataPart.data) {
                    responseId = (dataPart.data as any).responseId;
                }
            }
            
            if (responseId) {
                console.log('✅ Captured responseId from onData:', responseId);
                previousResponseId.current = responseId;
            }
        },
        onFinish: (message: any) => {
            // Fallback: try to extract responseId from the message metadata
            if (message && typeof message === 'object') {
                // Check in message properties
                if ('data' in message && message.data && 'responseId' in message.data) {
                    const responseId = (message.data as any).responseId;
                    if (responseId) {
                        console.log('✅ Captured responseId from onFinish:', responseId);
                        previousResponseId.current = responseId;
                    }
                }
            }
        },
    })

    const { messages, setMessages, sendMessage: sdkSendMessage, status } = chatApi
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

            pendingAttachmentsRef.current = attachments || [];
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