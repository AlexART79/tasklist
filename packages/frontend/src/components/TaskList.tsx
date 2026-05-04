import { useState, useEffect } from 'react';
import type { Task } from '../api/tasks';
import { fetchTasks, updateTask, deleteTask } from '../api/tasks';
import TaskModal from './TaskModal';

type Props = { listId: string };

const STATUS_CYCLE: Task['status'][] = ['todo', 'in_progress', 'done'];

const STATUS_LABEL: Record<Task['status'], string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

const STATUS_CLASSES: Record<Task['status'], string> = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-indigo-100 text-indigo-700',
  done: 'bg-green-100 text-green-700',
};

const PRIORITY_CLASSES: Record<Task['priority'], string> = {
  low: 'bg-slate-100 text-slate-500',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-600',
};

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isOverdue(dueDate: string) {
  return dueDate < new Date().toISOString().slice(0, 10);
}

export default function TaskList({ listId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  useEffect(() => {
    setLoading(true);
    fetchTasks(listId)
      .then(setTasks)
      .finally(() => setLoading(false));
  }, [listId]);

  function handleSaved(saved: Task) {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      return idx >= 0
        ? prev.map((t) => (t.id === saved.id ? saved : t))
        : [...prev, saved];
    });
    setModalOpen(false);
    setEditingTask(undefined);
  }

  function openCreate() {
    setEditingTask(undefined);
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  async function cycleStatus(task: Task) {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(task.status) + 1) % STATUS_CYCLE.length];
    const updated = await updateTask(task.id, { status: next });
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function handleDelete(task: Task) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await deleteTask(task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
        <h2 className="text-sm font-semibold text-slate-900">Tasks</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">No tasks in this list — add one to get started.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 px-6 pb-6">
          {tasks.map((task) => (
            <li key={task.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium text-slate-900 ${task.status === 'done' ? 'line-through text-slate-400' : ''}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <button
                    onClick={() => cycleStatus(task)}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${STATUS_CLASSES[task.status]} hover:opacity-80`}
                    title="Click to change status"
                  >
                    {STATUS_LABEL[task.status]}
                  </button>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_CLASSES[task.priority]}`}>
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <span className={`text-xs ${isOverdue(task.dueDate) && task.status !== 'done' ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(task)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Edit"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(task)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <TaskModal
          listId={listId}
          task={editingTask}
          onClose={() => { setModalOpen(false); setEditingTask(undefined); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
