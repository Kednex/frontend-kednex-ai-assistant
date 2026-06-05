import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { RootState } from '@/lib/store/store'
import { setSessionId, setRooms, setCategory } from '@/lib/store/chatSlice'
import { setDesignId } from '@/lib/store/visualiserSlice'
import type { ChatSession, Message } from '@/lib/types'
import { generateUUID } from '@/lib/utils/uuid'
import { normalizeRooms } from '@/lib/utils/storage'

const STORAGE_KEYS = {
    CHAT_ACTIVE_SESSION: 'imersian:chat_active_session',
    CHAT_SESSION_INDEX: 'imersian:chat_session_index',
    CHAT_FIRST_IMAGE_PREFIX: 'imersian:chat_first_image:'
} as const

export function useChatSession() {
    const dispatch = useAppDispatch()
    const { sessionId, category, rooms, intent } = useAppSelector(
        (state: RootState) => state.chat
    )

    const hasHydratedRef = useRef(false)
    const isNewChatFromIntro = useRef(false)
    const [hydrated, setHydrated] = useState(false)
    const [hasFirstImage, setHasFirstImage] = useState(false) // track first image

    // track the last response ID from the AI backend so we can continue
    const previousResponseId = useRef<string | null>(null);

    // track the current Algolia search page so "show more" fetches the next page
    const searchPage = useRef<number>(0);

    // products returned by the backend MCP tool call — attached to the message in onFinish
    const pendingProducts = useRef<any[] | null>(null);

    // ref so onFinish (defined before chatApi) can call setMessages
    const setMessagesRef = useRef<((updater: any) => void) | null>(null);

    // room analysis status driven by ___ANALYSING_ROOM___ / ___DETECTED_ROOM_LAYOUT___ tokens
    const [roomAnalysisStatus, setRoomAnalysisStatus] = useState<'idle' | 'analysing' | 'detected'>('idle');

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

            // session-level first-image flag
            const fromRooms = (session.contextUploads?.length || 0) > 0
            if (fromRooms) {
                setHasFirstImage(true)
            } else {
                const stored = localStorage.getItem(
                    `${STORAGE_KEYS.CHAT_FIRST_IMAGE_PREFIX}${session.sessionId}`
                )
                setHasFirstImage(stored === '1')
            }

            if (shouldAutoIntro) {
                isNewChatFromIntro.current = true
            }

            setHydrated(true)
        } catch (e) {
            console.error('[useChatSession] Hydration error:', e)
            setHydrated(true)
        }
    }, [dispatch, intent])

    // Reload first-image state when session changes (new chat => reset)
    useEffect(() => {
        if (!sessionId) return
        try {
            const stored = localStorage.getItem(
                `${STORAGE_KEYS.CHAT_FIRST_IMAGE_PREFIX}${sessionId}`
            )
            setHasFirstImage(stored === '1' || rooms.length > 0)
        } catch {
            setHasFirstImage(rooms.length > 0)
        }
    }, [sessionId, rooms.length])

    // Persist first-image state per session
    useEffect(() => {
        if (!sessionId) return
        try {
            localStorage.setItem(
                `${STORAGE_KEYS.CHAT_FIRST_IMAGE_PREFIX}${sessionId}`,
                hasFirstImage ? '1' : '0'
            )
        } catch (e) {
            console.error('Failed to save first image flag', e)
        }
    }, [sessionId, hasFirstImage])

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

    // ref to hold pending base64 attachments for the next API request
    const pendingAttachmentsRef = useRef<string[]>([]);

    // ref to hold pending blob preview URLs for thumbnail display in the chat thread
    const pendingPreviewUrlsRef = useRef<string[]>([]);

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
                    attachments: pendingAttachmentsRef.current,
                    searchPage: searchPage.current,
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
            // 🔍 Log everything so we can see what the AI SDK delivers
            console.log('📨 onData TYPE:', dataPart.type, '| data:', JSON.stringify(dataPart.data));

            if (dataPart.type === 'data-roomAnalysis' && dataPart.data?.status) {
                setRoomAnalysisStatus(dataPart.data.status as 'analysing' | 'detected');
            }

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

                if ('searchPage' in dataPart.data && typeof (dataPart.data as any).searchPage === 'number') {
                    searchPage.current = (dataPart.data as any).searchPage + 1;
                    console.log('✅ Next searchPage set to:', searchPage.current);
                }

                if ('designId' in dataPart.data && (dataPart.data as any).designId) {
                    dispatch(setDesignId((dataPart.data as any).designId));
                    console.log('✅ Captured designId from onData:', (dataPart.data as any).designId);
                }
            }
        },
        onFinish: (message: any) => {
            console.log('🏁 onFinish called | message.id:', message?.id, '| pendingProducts:', pendingProducts.current?.length ?? 0);
            setRoomAnalysisStatus('idle');
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

    // if the messages reset (e.g. new chat), clear the stored response id and search page
    useEffect(() => {
        if (messages.length === 0) {
            previousResponseId.current = null
            searchPage.current = 0
        }
    }, [messages.length])

    // After a user message is added by the SDK, patch it with the pending preview URLs
    // so thumbnail images appear above the text bubble in the conversation.
    useEffect(() => {
        if (pendingPreviewUrlsRef.current.length === 0) return;
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        if (!lastUserMsg) return;
        if ((lastUserMsg as Message).attachments?.length) return; // already patched
        const urls = [...pendingPreviewUrlsRef.current];
        pendingPreviewUrlsRef.current = [];
        setMessages(prev =>
            prev.map(m => m.id === lastUserMsg.id ? { ...m, attachments: urls } : m)
        );
    }, [messages, setMessages])

    // Expose an adapted sendMessage that matches what UI expects
    const sendMessage = useCallback(
        async (content: string, base64Images?: string[], previewUrls?: string[]) => {
            if (!content.trim() && (!base64Images || base64Images.length === 0)) return
            if (isLoading) return

            setRoomAnalysisStatus('idle');
            pendingAttachmentsRef.current = base64Images || [];
            pendingPreviewUrlsRef.current = previewUrls || [];
            if (base64Images && base64Images.length > 0) {
                setHasFirstImage(true);
            }
            await sdkSendMessage({ text: content })
        },
        [sdkSendMessage, isLoading, setHasFirstImage]
    )

    return {
        ...chatApi,
        sendMessage,
        category,
        rooms,
        sessionId,
        hydrated,
        isLoading,
        getChatSession,
        roomAnalysisStatus,
        hasFirstImage,
        setHasFirstImage,
    }
}
