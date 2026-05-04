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

export type TaskFilters = {
  search?: string;
  status?: Task['status'][];
  priority?: Task['priority'][];
  due_category?: 'overdue' | 'today' | 'next7days';
};

export async function fetchTasks(listId: string, filters?: TaskFilters): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.search)            params.set('search', filters.search);
  filters?.status?.forEach(v =>   params.append('status', v));
  filters?.priority?.forEach(v => params.append('priority', v));
  if (filters?.due_category)      params.set('due_category', filters.due_category);
  const qs = params.toString();
  const res = await fetch(`/api/lists/${listId}/tasks${qs ? `?${qs}` : ''}`);
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
