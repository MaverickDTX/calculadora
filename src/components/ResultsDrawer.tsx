import { X } from 'lucide-react';
import type { BetResult, Config } from '../types';
import { useDialog, useMediaQuery } from '../hooks/useDialog';
import { ResultView } from './ResultView';

interface Props {
  result: BetResult | { err: string } | null;
  config: Config;
  isLoading?: boolean;
  onClose: () => void;
}

const TITLE_ID = 'results-drawer-title';

export function ResultsDrawer({ result, config, isLoading, onClose }: Props) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { ref, dialogProps } = useDialog<HTMLDivElement>({
    open: true,
    onClose,
    enabled: isMobile,
    labelId: TITLE_ID,
  });

  const a11yProps = isMobile ? dialogProps : { ref };

  return (
    <>
      {isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div {...a11yProps}
        className="fixed bottom-0 left-0 right-0 z-50 h-[60vh] flex flex-col rounded-t-lg border border-border animate-slide-up md:relative md:inset-auto md:z-auto md:h-auto md:w-[400px] md:shrink-0 md:border-0 md:border-l md:border-border md:rounded-none"
        style={{
          background: 'var(--color-surface-elevated)',
        }}
      >
        <div aria-hidden="true" className="md:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-[#4B5563]" />
        </div>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0"
          style={{ background: 'var(--color-surface-hover)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
            <span id={TITLE_ID} className="text-sm font-semibold text-text-primary">Resultado</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar resultado" className="icon-btn text-text-muted hover:text-text-primary transition-colors">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <ResultView result={result} config={config} isLoading={isLoading} />
      </div>
    </>
  );
}