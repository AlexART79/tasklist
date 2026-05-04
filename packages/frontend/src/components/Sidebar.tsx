import { useState, useEffect, useRef } from 'react';
import { fetchLists, createList, renameList, deleteList, type List } from '../api/lists';

interface Props {
  selectedListId: string | null;
  onSelect: (id: string) => void;
}

export default function Sidebar({ selectedListId, onSelect }: Props) {
  const [lists, setLists] = useState<List[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const newInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLists().then(setLists).catch(console.error);
  }, []);

  useEffect(() => {
    if (creating) newInputRef.current?.focus();
  }, [creating]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) {
      setCreating(false);
      setNewName('');
      return;
    }
    try {
      const list = await createList(name);
      setLists((prev) => [...prev, list]);
      onSelect(list.id);
    } catch (e) {
      console.error(e);
    }
    setCreating(false);
    setNewName('');
  }

  async function handleRename(id: string) {
    const name = editName.trim();
    if (name) {
      try {
        const updated = await renameList(id, name);
        setLists((prev) => prev.map((l) => (l.id === id ? updated : l)));
      } catch (e) {
        console.error(e);
      }
    }
    setEditingId(null);
    setEditName('');
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this list?')) return;
    try {
      await deleteList(id);
      setLists((prev) => prev.filter((l) => l.id !== id));
      if (selectedListId === id) onSelect('');
    } catch (e) {
      console.error(e);
    }
  }

  function startEdit(list: List) {
    setEditingId(list.id);
    setEditName(list.name);
  }

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lists</span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {lists.length === 0 && !creating && (
          <p className="px-4 py-6 text-sm text-slate-400 text-center">
            No lists yet — create one to get started.
          </p>
        )}

        {lists.map((list) => (
          <div
            key={list.id}
            className={`group flex items-center gap-1 px-3 py-2 mx-1 rounded-lg cursor-pointer transition-colors ${
              list.id === selectedListId
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => editingId !== list.id && onSelect(list.id)}
          >
            {editingId === list.id ? (
              <input
                ref={editInputRef}
                className="flex-1 min-w-0 text-sm bg-white border border-indigo-300 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(list.id);
                  if (e.key === 'Escape') { setEditingId(null); setEditName(''); }
                }}
                onBlur={() => handleRename(list.id)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="flex-1 min-w-0 text-sm truncate"
                onDoubleClick={(e) => { e.stopPropagation(); startEdit(list); }}
              >
                {list.name}
              </span>
            )}

            {editingId !== list.id && (
              <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                <button
                  className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
                  title="Rename"
                  onClick={(e) => { e.stopPropagation(); startEdit(list); }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  className="p-1 rounded text-slate-400 hover:text-red-600 transition-colors"
                  title="Delete"
                  onClick={(e) => { e.stopPropagation(); handleDelete(list.id); }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}

        {creating && (
          <div className="mx-1 px-3 py-2">
            <input
              ref={newInputRef}
              className="w-full text-sm bg-white border border-indigo-300 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="List name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') { setCreating(false); setNewName(''); }
              }}
              onBlur={handleCreate}
            />
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-200">
        <button
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
          onClick={() => setCreating(true)}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New list
        </button>
      </div>
    </aside>
  );
}
