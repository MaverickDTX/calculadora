import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  type KeyboardEvent,
} from 'react';
import * as FloatingUI from '@floating-ui/react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  label?: string;
  name?: string;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  error = false,
  label,
  name,
  className = '',
}: SelectProps) {
  const selectId = useId();
  const triggerId = `${selectId}-trigger`;
  const listboxId = `${selectId}-listbox`;
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listboxRef = useRef<HTMLDivElement | null>(null);
  const optionsRef = useRef<HTMLButtonElement[]>([]);

  const selectedOption = options.find(o => o.value === value);
  const displayValue = selectedOption?.label ?? placeholder ?? '';

  const close = useCallback(() => {
    setOpen(false);
    setHighlightedIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const openListbox = useCallback(() => {
    if (!disabled) {
      setOpen(true);
      const idx = options.findIndex(o => o.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [disabled, value, options]);

  const handleTriggerKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowUp':
          e.preventDefault();
          if (!open) {
            openListbox();
          } else {
            const dir = e.key === 'ArrowDown' ? 1 : -1;
            let next = highlightedIndex + dir;
            while (next >= 0 && next < options.length && options[next].disabled) {
              next += dir;
            }
            if (next >= 0 && next < options.length) setHighlightedIndex(next);
          }
          break;
        case 'Enter':
        case ' ':
          if (!open) {
            e.preventDefault();
            openListbox();
          }
          break;
        case 'Escape':
          if (open) {
            e.preventDefault();
            close();
          }
          break;
        case 'Tab':
          if (open) close();
          break;
        case 'Home':
          if (open) {
            e.preventDefault();
            let next = 0;
            while (next < options.length && options[next].disabled) next++;
            if (next < options.length) setHighlightedIndex(next);
          }
          break;
        case 'End':
          if (open) {
            e.preventDefault();
            let next = options.length - 1;
            while (next >= 0 && options[next].disabled) next--;
            if (next >= 0) setHighlightedIndex(next);
          }
          break;
      }
    },
    [disabled, open, highlightedIndex, options, openListbox, close]
  );

  const handleOptionClick = useCallback(
    (optValue: string) => {
      if (!disabled) {
        onChange(optValue);
        close();
      }
    },
    [disabled, onChange, close]
  );

  const handleOptionKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!options[index].disabled) handleOptionClick(options[index].value);
          break;
        case 'ArrowDown':
          e.preventDefault();
          {
            let next = index + 1;
            while (next < options.length && options[next].disabled) next++;
            if (next < options.length) setHighlightedIndex(next);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          {
            let next = index - 1;
            while (next >= 0 && options[next].disabled) next--;
            if (next >= 0) setHighlightedIndex(next);
          }
          break;
        case 'Escape':
          close();
          break;
        case 'Tab':
          close();
          break;
      }
    },
    [options, handleOptionClick, close]
  );

  const { refs, context, floatingStyles } = FloatingUI.useFloating({
    placement: 'bottom-start',
    open,
    onOpenChange: setOpen,
    middleware: [
      FloatingUI.offset(4),
      FloatingUI.flip(),
      FloatingUI.shift({ padding: 8 }),
      FloatingUI.size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
  });

  const click = FloatingUI.useClick(context, { event: 'mousedown' });
  const dismiss = FloatingUI.useDismiss(context);
  const role = FloatingUI.useRole(context, { role: 'listbox' });
  const listNav = FloatingUI.useListNavigation(context, {
    listRef: optionsRef,
    activeIndex: highlightedIndex,
    nested: false,
    onNavigate: (idx) => setHighlightedIndex(idx ?? -1),
  });

  const { getReferenceProps, getFloatingProps } = FloatingUI.useInteractions([
    click, dismiss, role, listNav,
  ]);

  useEffect(() => {
    if (open && highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [open, highlightedIndex]);

  return (
    <div className={`relative inline-block w-full ${className}`}>
      {label && (
        <label htmlFor={triggerId} className="block text-xs text-text-muted mb-1.5">
          {label}
        </label>
      )}
      <button
        ref={(el) => {
          triggerRef.current = el;
          refs.setReference(el);
        }}
        id={triggerId}
        type="button"
        aria-disabled={disabled}
        aria-invalid={error}
        aria-required={!!label}
        className={[
          'relative w-full h-11 px-4 text-left',
          'flex items-center',
          'rounded-xl border',
          'bg-[#0B0F17]/60 backdrop-blur-xl',
          'text-text-primary placeholder:text-text-muted',
          'font-mono text-sm',
          'transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-danger',
          !error && !disabled && 'border-border hover:border-border-strong',
        ].filter(Boolean).join(' ')}
        disabled={disabled}
        {...getReferenceProps({
          onKeyDown: handleTriggerKeyDown,
        })}
      >
        <span className={`flex-1 truncate ${!selectedOption && placeholder ? 'text-text-muted' : ''}`}>
          {displayValue}
        </span>
        <ChevronDown
          size={18}
          className={[
            'ml-2 flex-shrink-0 text-text-muted transition-transform',
            open && 'rotate-180',
          ].join(' ')}
          aria-hidden="true"
        />
      </button>

      <FloatingUI.FloatingFocusManager
        context={context}
        disabled={!open}
        order={['floating', 'reference']}
        guards={!disabled}
      >
        <FloatingUI.FloatingPortal>
          {open && (
            <div
              ref={(el) => {
                listboxRef.current = el;
                refs.setFloating(el);
              }}
              id={listboxId}
              role="listbox"
              aria-label={label || 'Opções'}
              className={[
                'absolute z-50 max-h-64 overflow-auto rounded-xl border border-border',
                'bg-surface/95 backdrop-blur-xl shadow-float',
                'py-1.5',
                'top-full mt-2',
              ].filter(Boolean).join(' ')}
              style={floatingStyles}
              {...getFloatingProps({
                onKeyDown: (e) => {
                  if (e.key === 'Escape') close();
                },
              })}
            >
              {options.map((opt, index) => (
                <button
                  key={opt.value}
                  ref={(el) => { optionsRef.current[index] = el!; }}
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  aria-disabled={opt.disabled}
                  disabled={opt.disabled}
                  onClick={() => !opt.disabled && handleOptionClick(opt.value)}
                  onKeyDown={(e) => handleOptionKeyDown(e, index)}
                  className={[
                    'w-full px-4 py-2.5 text-left text-sm',
                    'transition-colors',
                    opt.disabled ? 'opacity-40 cursor-not-allowed' : '',
                    index === highlightedIndex
                      ? 'bg-accent/15 text-accent outline-none'
                      : 'hover:bg-accent/10 text-text-primary',
                  ].filter(Boolean).join(' ')}
                >
                  <span className="flex items-center gap-2">
                    {opt.value === value && <Check size={14} className="text-accent flex-shrink-0" aria-hidden="true" />}
                    <span className="truncate">{opt.label}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </FloatingUI.FloatingPortal>
      </FloatingUI.FloatingFocusManager>
      <input
        type="hidden"
        name={name}
        value={value}
        disabled={disabled}
      />
    </div>
  );
}