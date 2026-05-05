import { useState, useEffect, useRef } from 'react';
import { fetchLists, createList, renameList, deleteList, type List } from '../api/lists';
import { logger } from '../logger';

interface Props {
  selectedListId: string | null;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ selectedListId, onSelect, isOpen, onClose }: Props) {
  const [lists, setLists] = useState<List[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const newInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLists().then(setLists).catch((error) => logger.error('Failed to load lists', { error }));
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
      logger.error('Failed to create list', { error: e });
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
        logger.error('Failed to rename list', { error: e, listId: id });
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
      logger.error('Failed to delete list', { error: e, listId: id });
    }
  }

  function startEdit(list: List) {
    setEditingId(list.id);
    setEditName(list.name);
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 flex flex-col
          bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700
          transition-transform duration-200
          md:static md:z-auto md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lists</span>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {lists.length === 0 && !creating && (
            <p className="px-4 py-6 text-sm text-slate-400 dark:text-slate-500 text-center">
              No lists yet — create one to get started.
            </p>
          )}

          {lists.map((list) => (
            <div
              key={list.id}
              className={`group flex items-center gap-1 px-3 py-2 mx-1 rounded-lg cursor-pointer transition-colors ${
                list.id === selectedListId
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              onClick={() => {
                if (editingId !== list.id) {
                  onSelect(list.id);
                  onClose();
                }
              }}
            >
              {editingId === list.id ? (
                <input
                  ref={editInputRef}
                  className="flex-1 min-w-0 text-sm bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 dark:text-slate-100 rounded px-1.5 py-0.5 outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
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
                    className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                    title="Rename"
                    onClick={(e) => { e.stopPropagation(); startEdit(list); }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
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
                className="w-full text-sm bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 dark:text-slate-100 rounded-lg px-2 py-1 outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
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

        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
          <button
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            onClick={() => setCreating(true)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New list
          </button>
        </div>
      </aside>
    </>
  );
}
