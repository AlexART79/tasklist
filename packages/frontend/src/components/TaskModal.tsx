import { useState, useEffect, useRef } from 'react';
import type { Task, CreateTaskData } from '../api/tasks';
import { createTask, updateTask } from '../api/tasks';

type Props = {
  listId: string;
  task?: Task;
  onClose: () => void;
  onSaved: (task: Task) => void;
};

export default function TaskModal({ listId, task, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<Task['status']>(task?.status ?? 'todo');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [priority, setPriority] = useState<Task['priority']>(task?.priority ?? 'medium');
  const [titleError, setTitleError] = useState('');
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError('Title is required');
      titleRef.current?.focus();
      return;
    }
    if (trimmed.length > 500) {
      setTitleError('Title must be 500 characters or fewer');
      return;
    }
    setTitleError('');
    setSaving(true);
    try {
      const data: CreateTaskData = {
        title: trimmed,
        description: description.trim() || null,
        status,
        dueDate: dueDate || null,
        priority,
      };
      const saved = task
        ? await updateTask(task.id, data)
        : await createTask(listId, data);
      onSaved(saved);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'rounded-lg border px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors dark:placeholder:text-slate-500';

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-lg overflow-y-auto max-h-[95dvh] sm:max-h-[90vh]">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-5">
          {task ? 'Edit task' : 'New task'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Title *</label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError(''); }}
              className={`${inputClass} ${titleError ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
              placeholder="Task title"
            />
            {titleError && <p className="text-xs text-red-500">{titleError}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputClass} border-slate-200 dark:border-slate-700 resize-none`}
              placeholder="Optional description"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['status'])}
                className={`${inputClass} border-slate-200 dark:border-slate-700`}
              >
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className={`${inputClass} border-slate-200 dark:border-slate-700`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`${inputClass} border-slate-200 dark:border-slate-700`}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              {saving && (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              {task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
