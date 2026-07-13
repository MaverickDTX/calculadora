import { useEffect, useRef } from 'react';
import { RotateCcw, X } from 'lucide-react';

interface Props {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  /** Duração em ms até auto-fechar. Padrão 5000. */
  duration?: number;
}

/**
 * Toast não-bloqueante com ação opcional (ex.: "Desfazer").
 * Auto-fecha após `duration`. Acessível: role="status" + aria-live.
 */
export function Toast({ message, actionLabel, onAction, onDismiss, duration = 5000 }: Props) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const t = setTimeout(() => onDismissRef.current(), duration);
    return () => clearTimeout(t);
  }, [duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-[calc(50%+7.5rem)] z-[300] pointer-events-none"
    >
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-xl border border-border text-text-primary text-sm shadow-float animate-slide-up pointer-events-auto"
        style={{ background: 'var(--color-surface-elevated)' }}
      >
        <span>{message}</span>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={() => { onAction(); onDismiss(); }}
            className="btn-primary text-xs px-3 py-1 flex items-center gap-1.5"
          >
            <RotateCcw size={13} aria-hidden="true" /> {actionLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar aviso"
          className="icon-btn text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
