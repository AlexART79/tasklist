import { useEffect, useRef } from 'react';

type Props<T extends string> = {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  open: boolean;
  onToggleOpen: () => void;
  onToggle: (value: T) => void;
};

export default function FilterSelect<T extends string>({
  label, options, selected, open, onToggleOpen, onToggle,
}: Props<T>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggleOpen();
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open, onToggleOpen]);

  const isActive = selected.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onToggleOpen}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
          ${isActive
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'}`}
      >
        {label}
        {isActive && (
          <span className="rounded-full bg-indigo-600 px-1.5 text-xs font-medium leading-5 text-white dark:bg-indigo-500">
            {selected.length}
          </span>
        )}
        <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24"
             stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 min-w-[160px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {options.map(opt => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => onToggle(opt.value)}
                className="h-3.5 w-3.5 cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-200">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
