"use client";

import { useState, useRef, useEffect, useId } from "react";
import { cn } from "@/lib/utils";

interface ComboboxInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function ComboboxInput({
  value,
  onChange,
  options,
  placeholder,
  id,
  className,
  disabled,
}: ComboboxInputProps) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const filtered = value.trim()
    ? options.filter((o) => o.toLowerCase().includes(value.toLowerCase()))
    : options;

  useEffect(() => {
    setActiveIdx(-1);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { setOpen(true); e.preventDefault(); }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      onChange(filtered[activeIdx]);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const inputBase = cn(
    "w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground",
    "placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400",
    "transition-all duration-150 border-input",
    className
  );

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
        className={inputBase}
        aria-autocomplete="list"
        aria-controls={open ? listId : undefined}
        aria-activedescendant={activeIdx >= 0 ? `${listId}-${activeIdx}` : undefined}
        aria-expanded={open}
      />

      {open && filtered.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            "absolute z-50 mt-1 w-full max-h-52 overflow-y-auto",
            "rounded-xl border border-border/60 bg-card shadow-xl",
            "dark:border-white/10 dark:shadow-black/40",
            "py-1"
          )}
        >
          {filtered.map((opt, i) => (
            <li
              key={opt}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt);
                setOpen(false);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={cn(
                "px-3.5 py-2 text-sm cursor-pointer select-none",
                i === activeIdx
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                  : "text-foreground hover:bg-muted/60 dark:hover:bg-white/5"
              )}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
