import { useState, useEffect, useCallback } from 'react';
import { X, Trash2, Clock, AlertCircle } from 'lucide-react';
import type { SavedBet } from '../types';
import { getSavedBets, deleteBet } from '../lib/supabase';
import { fnum, fpct } from '../lib/math';

interface Props {
  onClose: () => void;
}

export function HistoryModal({ onClose }: Props) {
  const [bets, setBets] = useState<SavedBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getSavedBets();
    setLoading(false);
    if (error) setError('Erro ao carregar histórico.');
    else setBets(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    const { error } = await deleteBet(id);
    if (!error) setBets(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="border border-border rounded-2xl shadow-float w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-slide-up"
        style={{ background: 'rgba(17, 24, 39, 0.85)', backdropFilter: 'blur(32px) saturate(150%)', WebkitBackdropFilter: 'blur(32px) saturate(150%)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center">
              <Clock size={16} className="text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Histórico de apostas</h2>
              <p className="text-xs text-text-muted">{bets.length} aposta(s) salva(s)</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {loading && <div className="text-center text-text-muted py-12 text-sm">Carregando...</div>}
          {error && (
            <div className="flex items-center gap-2 text-danger bg-danger-soft rounded-lg p-3 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {!loading && !error && bets.length === 0 && (
            <div className="text-center text-text-muted py-12">
              <p className="text-sm">Nenhuma aposta salva ainda.</p>
              <p className="text-xs mt-1 opacity-60">Calcule uma aposta e clique em "Salvar" para aparecer aqui.</p>
            </div>
          )}
          {!loading && bets.length > 0 && (
            <div className="space-y-2.5">
              {bets.map(bet => (
                <div key={bet.id} className="panel hover:border-border-strong transition-colors group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text-primary truncate">{bet.label}</span>
                        <span className={`tag ${bet.confidence === 'high' ? 'tag-value' : bet.confidence === 'mid' ? 'tag-warn' : 'tag-danger'}`}>
                          {bet.confidence === 'high' ? 'Alta' : bet.confidence === 'mid' ? 'Média' : 'Baixa'}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs text-text-muted mt-2">
                        <div>EV: <span className="font-mono text-text-secondary">{fpct(bet.ev)}</span></div>
                        <div>Kelly: <span className="font-mono text-text-secondary">{fpct(bet.kadj)}</span></div>
                        <div>Stake: <span className="font-mono text-text-secondary">{fnum(bet.stake_units, 2)}u</span></div>
                        <div>R$: <span className="font-mono text-text-secondary">R$ {bet.stake_reais.toFixed(2).replace('.', ',')}</span></div>
                      </div>
                      <div className="text-[11px] text-text-muted mt-1.5 truncate opacity-70">{bet.decomp}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => bet.id && handleDelete(bet.id)}
                      className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all p-1.5 rounded-lg hover:bg-danger-soft"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
