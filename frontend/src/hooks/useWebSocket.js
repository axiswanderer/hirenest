import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export function useWebSocket(token) {
    const wsRef = useRef(null);
    const [lastMessage, setLastMessage] = useState(null);
    const [wsStatus, setWsStatus] = useState('disconnected');

    useEffect(() => {
        if (!token) return;

        const ws = new WebSocket(`${WS_URL}/ws?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => setWsStatus('connected');
        ws.onclose = () => setWsStatus('disconnected');
        ws.onerror = () => setWsStatus('error');
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setLastMessage(data);
            } catch {
                // ignore malformed frames
            }
        };

        return () => ws.close();
    }, [token]);

    const sendMessage = useCallback((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        }
    }, []);

    return { sendMessage, lastMessage, wsStatus };
}
