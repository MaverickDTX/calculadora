import { useEffect, useRef, useState, useCallback } from 'react';

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
  'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])',
];

export interface UseDialogOptions {
  open: boolean;
  onClose: () => void;
  /** Quando false, o trap/ESC não são aplicados (ex.: painel lateral no desktop). */
  enabled?: boolean;
  /** Seletor CSS extra (além do padrão) para incluir elementos focáveis. */
  labelId?: string;
}

/**
 * Hook de diálogo acessível sem dependências externas.
 * - Fecha com ESC.
 * - Trapa o foco dentro do container (Tab/Shift+Tab).
 * - Foca o primeiro elemento focável ao abrir.
 * - Devolve o foco ao gatilho ao fechar.
 */
export function useDialog<T extends HTMLElement = HTMLElement>(opts: UseDialogOptions) {
  const { open, onClose, enabled = true, labelId } = opts;
  const ref = useRef<T | null>(null);
  // Guarda o elemento que tinha foco quando o diálogo abriu (o gatilho).
  const triggerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const active = open && enabled;

  const trapFocus = useCallback((e: KeyboardEvent) => {
    const el = ref.current;
    if (!el) return;
    if (e.key !== 'Tab') return;
    const focusables = Array.from(
      el.querySelectorAll<HTMLElement>(FOCUSABLE.join(','))
    ).filter(n => n.offsetParent !== null || n === el);
    if (focusables.length === 0) { e.preventDefault(); return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first || !el.contains(document.activeElement)) {
        e.preventDefault(); last.focus();
      }
    } else {
      if (document.activeElement === last || !el.contains(document.activeElement)) {
        e.preventDefault(); first.focus();
      }
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    if (triggerRef.current === null) {
      triggerRef.current = (document.activeElement as HTMLElement) ?? null;
    }
    const focusFirst = el.querySelector<HTMLElement>(FOCUSABLE.join(','));
    if (focusFirst && focusFirst.offsetParent !== null) focusFirst.focus();
    else el.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCloseRef.current(); return; }
      trapFocus(e);
    };
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('keydown', onKey);
    };
  }, [active, trapFocus]);

  // Devolve foco ao gatilho ao fechar.
  useEffect(() => {
    if (active) return;
    if (triggerRef.current) {
      triggerRef.current.focus?.();
      triggerRef.current = null;
    }
  }, [active]);

  const dialogProps = {
    role: 'dialog' as const,
    'aria-modal': true as const,
    'aria-labelledby': labelId,
    tabIndex: -1,
    ref,
  };

  return { ref, dialogProps };
}

/** Hook utilitário para detectar media query (ex.: mobile). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && 'matchMedia' in window
      ? window.matchMedia(query).matches
      : false
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return;
    const m = window.matchMedia(query);
    const handler = () => setMatches(m.matches);
    handler();
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, [query]);
  return matches;
}
