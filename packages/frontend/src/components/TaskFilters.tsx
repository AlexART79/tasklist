import { useState } from 'react';
import type { Task } from '../api/tasks';
import type { FilterState } from '../hooks/useTaskFilters';
import FilterSelect from './FilterSelect';

type Props = {
  filterState: FilterState;
  hasActiveFilters: boolean;
  onSearchChange: (v: string) => void;
  onStatusToggle: (v: Task['status']) => void;
  onPriorityToggle: (v: Task['priority']) => void;
  onDueCategoryChange: (v: FilterState['due_category']) => void;
  onClear: () => void;
};

const STATUS_OPTIONS = [
  { value: 'todo' as const,        label: 'To do' },
  { value: 'in_progress' as const, label: 'In progress' },
  { value: 'done' as const,        label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: 'low' as const,    label: 'Low' },
  { value: 'medium' as const, label: 'Medium' },
  { value: 'high' as const,   label: 'High' },
];

const selectBase =
  'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 ' +
  'outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer ' +
  'hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';

export default function TaskFilters({
  filterState,
  hasActiveFilters,
  onSearchChange,
  onStatusToggle,
  onPriorityToggle,
  onDueCategoryChange,
  onClear,
}: Props) {
  const [openStatus, setOpenStatus] = useState(false);
  const [openPriority, setOpenPriority] = useState(false);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 px-3 pb-3 sm:px-6">
      <div className="relative min-w-0 flex-[1_1_14rem]">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
        </svg>
        <input
          type="text"
          value={filterState.search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks…"
          className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm
                     text-slate-700 outline-none transition-colors placeholder:text-slate-400
                     hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500 dark:border-slate-700
                     dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500 dark:hover:bg-slate-800"
        />
      </div>

      <FilterSelect
        label="Status"
        options={STATUS_OPTIONS}
        selected={filterState.status}
        open={openStatus}
        onToggleOpen={() => { setOpenPriority(false); setOpenStatus(v => !v); }}
        onToggle={onStatusToggle}
      />

      <FilterSelect
        label="Priority"
        options={PRIORITY_OPTIONS}
        selected={filterState.priority}
        open={openPriority}
        onToggleOpen={() => { setOpenStatus(false); setOpenPriority(v => !v); }}
        onToggle={onPriorityToggle}
      />

      <select
        value={filterState.due_category}
        onChange={(e) => onDueCategoryChange(e.target.value as FilterState['due_category'])}
        className={selectBase}
      >
        <option value="">Any due date</option>
        <option value="overdue">Overdue</option>
        <option value="today">Due today</option>
        <option value="next7days">Next 7 days</option>
      </select>

      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium
                     text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                     dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear filters
        </button>
      )}
    </div>
  );
}
