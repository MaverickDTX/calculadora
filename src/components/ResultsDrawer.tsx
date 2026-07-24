import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { X } from 'lucide-react';
import type { BetResult, Config } from '../types';
import { useDialog } from '../hooks/useDialog';
import { ResultView } from './ResultView';
import { VizSection } from './VizSection';

interface Props {
  result: BetResult | { err: string } | null;
  config: Config;
  isLoading?: boolean;
  onClose: () => void;
}

const TITLE_ID = 'results-drawer-title';
const DISMISS_THRESHOLD = 0.35;

export function ResultsDrawer({ result, config, isLoading, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const dragStartTime = useRef<number | null>(null);
  const prefersReducedMotion = useRef(false);
  const sheetHeight = useRef(0);

  const { ref: dialogRef, dialogProps } = useDialog<HTMLDivElement>({
    open: true,
    onClose,
    enabled: true,
    labelId: TITLE_ID,
  });

  const setRefs = useCallback((node: HTMLDivElement | null) => {
    (sheetRef as unknown as MutableRefObject<HTMLDivElement | null>).current = node;
    (dialogRef as unknown as MutableRefObject<HTMLDivElement | null>).current = node;
  }, [dialogRef]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mq.matches;
    const handler = () => { prefersReducedMotion.current = mq.matches; };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useLayoutEffect(() => {
    const update = () => {
      if (sheetRef.current) {
        sheetHeight.current = sheetRef.current.getBoundingClientRect().height;
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const dismissSheet = () => {
    if (prefersReducedMotion.current) { onClose(); return; }
    setDragY(sheetHeight.current || 300);
    setIsDragging(false);
    setTimeout(onClose, 250);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (prefersReducedMotion.current) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('details')) return;
    dragStartY.current = e.clientY;
    dragStartTime.current = performance.now();
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const dy = e.clientY - dragStartY.current;
    const damped = dy > 0 ? dy + (dy * dy) / (sheetHeight.current * 3 || 100) : dy / 4;
    setDragY(Math.max(0, damped));
  };

  const onPointerUp = () => {
    if (dragStartY.current === null) { setIsDragging(false); return; }
    const elapsed = performance.now() - (dragStartTime.current || performance.now());
    const velocity = dragY / (elapsed || 1);
    const dist = dragY / (sheetHeight.current || 300);

    if (dist > DISMISS_THRESHOLD || velocity > 0.4) {
      dismissSheet();
    } else if (dragY > 0) {
      setDragY(0);
    }
    setIsDragging(false);
    dragStartY.current = null;
    dragStartTime.current = null;
  };

  return (
    <>
      <div
        ref={backdropRef}
        className="fixed inset-0 z-40 bg-black/50 animate-fade-in pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
        style={{
          opacity: isDragging ? Math.max(0, 1 - dragY / (sheetHeight.current || 300)) : 1,
          transition: isDragging ? 'none' : 'opacity 220ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      />
      <div
        {...dialogProps}
        ref={setRefs}
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-lg border border-border pointer-events-auto"
        style={{
          height: 'auto',
          maxHeight: '85dvh',
          background: 'var(--color-surface-elevated)',
          transform: mounted ? `translateY(${dragY}px)` : 'translateY(100%)',
          transition: isDragging ? 'none' : mounted ? 'transform 220ms cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
        }}
      >
        <div
          className="flex flex-col"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ touchAction: 'none' as const }}
        >
          <div className="pt-3 pb-1 flex justify-center">
            <div className="w-10 h-1 rounded bg-[#4B5563]" />
          </div>
          <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0"
            style={{ background: 'var(--color-surface-hover)' }}
          >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded bg-accent animate-pulse-soft" />
            <span id={TITLE_ID} className="text-sm font-semibold text-text-primary">Resultado</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar resultado" className="icon-btn text-text-muted hover:text-text-primary transition-colors">
            <X size={18} aria-hidden="true" />
          </button>
          </div>
        </div>

        <ResultView result={result} config={config} isLoading={isLoading}>
          <VizSection result={result} />
        </ResultView>
      </div>
    </>
  );
}