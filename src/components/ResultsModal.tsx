import { TrendingUp, X } from 'lucide-react';
import type { BetResult, Config } from '../types';
import { useDialog } from '../hooks/useDialog';
import { ResultView } from './ResultView';

interface Props {
  result: BetResult | { err: string } | null;
  config: Config;
  onClose: () => void;
}

const TITLE_ID = 'results-modal-title';

export function ResultsModal({ result, config, onClose }: Props) {
  const { dialogProps } = useDialog<HTMLDivElement>({
    open: true,
    onClose,
    labelId: TITLE_ID,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:pl-60 bg-black/50 backdrop-blur-md animate-fade-in" style={{ overscrollBehavior: 'contain' }} onClick={onClose}>
      <div {...dialogProps}
        className="border border-border rounded-2xl shadow-float w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-slide-up"
        style={{ background: 'rgba(17, 24, 39, 0.85)', backdropFilter: 'blur(32px) saturate(150%)', WebkitBackdropFilter: 'blur(32px) saturate(150%)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center">
              <TrendingUp size={16} className="text-accent" aria-hidden="true" />
            </div>
            <div>
              <h2 id={TITLE_ID} className="text-sm font-semibold text-text-primary">Resultado</h2>
              <p className="text-xs text-text-muted">Stake recomendado e decomposição</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar resultado" className="icon-btn text-text-muted hover:text-text-primary transition-colors">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <ResultView result={result} config={config} />
      </div>
    </div>
  );
}