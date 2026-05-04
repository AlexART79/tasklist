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
  'outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer';

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
    <div className="flex items-center gap-2 px-6 pb-3 flex-wrap shrink-0">
      <div className="relative flex-1 min-w-48">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
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
          className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-sm
                     text-slate-700 placeholder:text-slate-400 outline-none
                     focus:ring-2 focus:ring-indigo-500 transition-colors"
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
                     text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear filters
        </button>
      )}
    </div>
  );
}
