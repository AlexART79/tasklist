import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Task, TaskFilters } from '../api/tasks';

export type FilterState = {
  search: string;
  status: Task['status'][];
  priority: Task['priority'][];
  due_category: 'overdue' | 'today' | 'next7days' | '';
};

export function useTaskFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filterState, setFilterState] = useState<FilterState>({
    search:       searchParams.get('search') ?? '',
    status:       searchParams.getAll('status') as Task['status'][],
    priority:     searchParams.getAll('priority') as Task['priority'][],
    due_category: (searchParams.get('due_category') as FilterState['due_category']) ?? '',
  });

  const [debouncedSearch, setDebouncedSearch] = useState(filterState.search);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(filterState.search), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [filterState.search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch)            params.set('search', debouncedSearch);
    filterState.status.forEach(v   => params.append('status', v));
    filterState.priority.forEach(v => params.append('priority', v));
    if (filterState.due_category)   params.set('due_category', filterState.due_category);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, filterState.status, filterState.priority, filterState.due_category, setSearchParams]);

  const activeFilters: TaskFilters = {
    search:       debouncedSearch || undefined,
    status:       filterState.status.length > 0 ? filterState.status : undefined,
    priority:     filterState.priority.length > 0 ? filterState.priority : undefined,
    due_category: filterState.due_category || undefined,
  };

  const hasActiveFilters =
    !!debouncedSearch || filterState.status.length > 0 || filterState.priority.length > 0 || !!filterState.due_category;

  const setSearch = useCallback((v: string) =>
    setFilterState(p => ({ ...p, search: v })), []);

  const setStatus = useCallback((v: Task['status']) =>
    setFilterState(p => ({
      ...p,
      status: p.status.includes(v) ? p.status.filter(s => s !== v) : [...p.status, v],
    })), []);

  const setPriority = useCallback((v: Task['priority']) =>
    setFilterState(p => ({
      ...p,
      priority: p.priority.includes(v) ? p.priority.filter(s => s !== v) : [...p.priority, v],
    })), []);

  const setDueCategory = useCallback((v: FilterState['due_category']) =>
    setFilterState(p => ({ ...p, due_category: v })), []);

  const clearFilters = useCallback(() => {
    setFilterState({ search: '', status: [], priority: [], due_category: '' });
    setDebouncedSearch('');
  }, []);

  return { filterState, activeFilters, hasActiveFilters, setSearch, setStatus, setPriority, setDueCategory, clearFilters };
}
