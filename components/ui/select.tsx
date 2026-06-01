"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SelectOption = {
  value: string;
  label: string;
  description?: string | null;
};

type SelectProps = {
  name: string;
  options: SelectOption[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  className?: string;
};

export function Select({
  name,
  options,
  defaultValue = "",
  value: controlledValue,
  onValueChange,
  placeholder = "Select an option",
  disabled,
  required,
  invalid,
  className
}: SelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const selectedOption = options.find((option) => option.value === value) ?? null;

  useEffect(() => {
    if (controlledValue === undefined) {
      setInternalValue(defaultValue);
    }
  }, [controlledValue, defaultValue]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <input name={name} value={value} required={required} readOnly hidden />
      <button
        type="button"
        aria-controls={open ? id : undefined}
        aria-expanded={open}
        aria-invalid={invalid}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-lg border bg-white px-3 text-left text-sm font-medium text-harlo-ink outline-none transition",
          "focus:border-harlo-teal focus:ring-2 focus:ring-harlo-teal/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-harlo-muted",
          invalid ? "border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-100" : "border-harlo-line"
        )}
      >
        <span className="min-w-0 truncate">
          {selectedOption ? selectedOption.label : <span className="text-harlo-muted">{placeholder}</span>}
        </span>
        <ChevronDown size={16} className={cn("shrink-0 text-harlo-muted transition", open && "rotate-180")} />
      </button>
      {open && !disabled ? (
        <div
          id={id}
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-harlo-line bg-white p-1 shadow-xl shadow-slate-900/10"
        >
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setInternalValue(option.value);
                  onValueChange?.(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition",
                  selected ? "bg-harlo-mist text-harlo-teal" : "text-harlo-ink hover:bg-slate-50"
                )}
              >
                <span className="grid h-4 w-4 shrink-0 place-items-center">
                  {selected ? <Check size={14} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{option.label}</span>
                  {option.description ? <span className="mt-0.5 block truncate text-xs font-medium text-harlo-muted">{option.description}</span> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
