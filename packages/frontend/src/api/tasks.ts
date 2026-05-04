export type Task = {
  id: string;
  listId: string;
  userId: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  updatedAt: number;
};

export type CreateTaskData = {
  title: string;
  description?: string | null;
  status?: Task['status'];
  dueDate?: string | null;
  priority?: Task['priority'];
};

export type UpdateTaskData = Partial<CreateTaskData>;

export async function fetchTasks(listId: string): Promise<Task[]> {
  const res = await fetch(`/api/lists/${listId}/tasks`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask(listId: string, data: CreateTaskData): Promise<Task> {
  const res = await fetch(`/api/lists/${listId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function updateTask(id: string, data: UpdateTaskData): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete task');
}
