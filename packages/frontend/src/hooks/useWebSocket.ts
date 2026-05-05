import { useEffect, useRef, useState, useCallback } from 'react';
import type { NotificationItem } from '../types/notifications';

export type UseWebSocketReturn = {
  notifications: NotificationItem[];
  unreadCount: number;
  dismiss: (taskId: string) => void;
  markAllRead: () => void;
};

export function useWebSocket(): UseWebSocketReturn {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] connected');
      ws.send(JSON.stringify({ type: 'subscribe', payload: { types: ['overdue', 'due_soon'] } }));
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      const msg = JSON.parse(event.data) as { type: string; payload: NotificationItem[] };
      console.log('[WS] message received:', msg.type, Array.isArray(msg.payload) ? `(${msg.payload.length} items)` : '');
      if (msg.type === 'notifications') {
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.taskId));
          const newItems = msg.payload.filter((n) => !existingIds.has(n.taskId));
          return newItems.length > 0 ? [...prev, ...newItems] : prev;
        });
      }
    };

    ws.onerror = (event) => {
      console.error('[WS] error', event);
    };

    ws.onclose = (event) => {
      console.log('[WS] closed — code:', event.code, 'reason:', event.reason || '(none)', 'clean:', event.wasClean);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  const dismiss = useCallback((taskId: string) => {
    setNotifications((prev) => prev.filter((n) => n.taskId !== taskId));
    wsRef.current?.send(JSON.stringify({ type: 'ack', payload: { taskId } }));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((current) => {
      setReadIds((prev) => {
        const updated = new Set(prev);
        current.forEach((n) => updated.add(n.taskId));
        return updated;
      });
      return current;
    });
  }, []);

  const unreadCount = notifications.filter((n) => !readIds.has(n.taskId)).length;

  return { notifications, unreadCount, dismiss, markAllRead };
}
