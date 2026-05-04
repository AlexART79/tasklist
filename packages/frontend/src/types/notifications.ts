export type NotificationItem = {
  taskId: string;
  title: string;
  type: 'overdue' | 'due_soon';
  dueDate: string;
};
