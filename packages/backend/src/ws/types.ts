export type SubscribePayload = { types: Array<'overdue' | 'due_soon'> };
export type AckPayload = { taskId: string };

export type ClientMessage =
  | { type: 'subscribe'; payload: SubscribePayload }
  | { type: 'ack'; payload: AckPayload };

export type NotificationItem = {
  taskId: string;
  title: string;
  type: 'overdue' | 'due_soon';
  dueDate: string;
};

export type ServerMessage = { type: 'notifications'; payload: NotificationItem[] };
