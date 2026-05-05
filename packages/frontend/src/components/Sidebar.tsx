import { useState, useEffect, useRef } from 'react';
import { fetchLists, createList, renameList, deleteList, type List } from '../api/lists';
import { logger } from '../logger';

interface Props {
  selectedListId: string | null;
  onSelect: (id: string | null) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ selectedListId, onSelect, mobileOpen = false, onMobileClose }: Props) {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const newInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    fetchLists()
      .then(setLists)
      .catch((error) => logger.error('Failed to load lists', { error }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onMobileClose?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, onMobileClose]);

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
      if (selectedListId === id) onSelect(null);
    } catch (e) {
      logger.error('Failed to delete list', { error: e, listId: id });
    }
  }

  function startEdit(list: List) {
    setEditingId(list.id);
    setEditName(list.name);
  }

  const panel = (
    <aside
      className={`flex h-full w-72 max-w-[85vw] shrink-0 flex-col bg-white shadow-[20px_0_48px_-42px_rgba(15,23,42,0.6)] transition-transform dark:bg-[linear-gradient(180deg,#071023_0%,#020617_70%)] dark:shadow-[24px_0_56px_-42px_rgba(99,102,241,0.5)] md:w-64 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
      aria-label="Lists"
    >
      <div className="flex items-center justify-between bg-gradient-to-b from-slate-50/90 to-white/30 px-4 py-3 dark:from-slate-900/55 dark:to-slate-950/10">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Lists</span>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 md:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label="Close lists menu"
          onClick={onMobileClose}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {loading && (
          <div className="space-y-2 px-2 py-2" aria-label="Loading lists">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/80" />
            ))}
          </div>
        )}

        {!loading && lists.length === 0 && !creating && (
          <p className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
            No lists yet — create one to get started.
          </p>
        )}

        {!loading && (
          <div className="space-y-1">
            {lists.map((list) => (
              <div
                role="button"
                tabIndex={0}
                key={list.id}
                className={`group relative flex w-full items-center gap-1 rounded-lg px-3 py-2 text-left transition-colors before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-full before:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  list.id === selectedListId
                    ? 'bg-indigo-50 text-indigo-700 before:bg-indigo-500 shadow-sm dark:bg-indigo-500/15 dark:text-indigo-100 dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-indigo-400/25 dark:before:bg-indigo-300'
                    : 'text-slate-700 before:bg-transparent hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white'
                }`}
                onClick={() => editingId !== list.id && onSelect(list.id)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && editingId !== list.id) {
                    e.preventDefault();
                    onSelect(list.id);
                  }
                }}
              >
                {editingId === list.id ? (
                  <input
                    ref={editInputRef}
                    className="min-w-0 flex-1 rounded border border-indigo-300 bg-white px-1.5 py-0.5 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-indigo-500/70 dark:bg-slate-950 dark:text-slate-100"
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
                    className="min-w-0 flex-1 truncate text-sm"
                    onDoubleClick={(e) => { e.stopPropagation(); startEdit(list); }}
                  >
                    {list.name}
                  </span>
                )}

                {editingId !== list.id && (
                  <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <button
                      type="button"
                      className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      title="Rename"
                      onClick={(e) => { e.stopPropagation(); startEdit(list); }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
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
          </div>
        )}

        {creating && (
          <div className="mx-1 px-3 py-2">
            <input
              ref={newInputRef}
              className="w-full rounded-lg border border-indigo-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 dark:border-indigo-500/70 dark:bg-slate-950 dark:text-slate-100"
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

      <div className="bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent p-3 pt-5 shadow-[0_-18px_28px_-30px_rgba(15,23,42,0.65)] dark:from-slate-950 dark:via-slate-950/85 dark:shadow-[0_-22px_34px_-32px_rgba(99,102,241,0.45)]">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-200 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-50"
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

  return (
    <>
      <div className="hidden md:block">{panel}</div>
      <div
        className={`fixed inset-0 z-40 md:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          aria-label="Close lists menu backdrop"
          className={`absolute inset-0 bg-slate-950/45 transition-opacity ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onMobileClose}
          tabIndex={mobileOpen ? 0 : -1}
        />
        <div className="relative h-full">{panel}</div>
      </div>
    </>
  );
}
