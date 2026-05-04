export type List = {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};

export async function fetchLists(): Promise<List[]> {
  const res = await fetch('/api/lists');
  if (!res.ok) throw new Error('Failed to fetch lists');
  return res.json();
}

export async function createList(name: string): Promise<List> {
  const res = await fetch('/api/lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create list');
  return res.json();
}

export async function renameList(id: string, name: string): Promise<List> {
  const res = await fetch(`/api/lists/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to rename list');
  return res.json();
}

export async function deleteList(id: string): Promise<void> {
  const res = await fetch(`/api/lists/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete list');
}
