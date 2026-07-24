import { useState, useCallback, useMemo, useEffect } from 'react';
import type { TabId } from './types';
import { useConfig } from './hooks/useConfig';
import { useCalculator } from './hooks/useCalculator';
import { useMediaQuery } from './hooks/useDialog';
import { Topbar } from './components/Topbar';
import { SideRail } from './components/SideRail';
import { BottomNav } from './components/BottomNav';
import { AlertTriangle } from 'lucide-react';
import { ConfigModal } from './components/ConfigModal';
import { VizSection } from './components/VizSection';
import { Toast } from './components/Toast';
import { ResultView } from './components/ResultView';
import { ResultsDrawer } from './components/ResultsDrawer';
import { NResultsTab } from './components/tabs/NResultsTab';
import { PropsTab } from './components/tabs/PropsTab';
import { ProxyTab } from './components/tabs/ProxyTab';
import { AubTab } from './components/tabs/AubTab';
import { ComboTab } from './components/tabs/ComboTab';
import { BetBuilderTab } from './components/tabs/BetBuilderTab';
import { AsianTab } from './components/tabs/AsianTab';

// Apenas selects e flags que afetam roteamento do cálculo — campos numéricos (odds,
// linhas, margens) começam vazios para não confundir o usuário.
const DEFAULT_INPUTS: Record<string, string> = {
  'nres-type': '1X2 / Moneyline',
  'nres-name': '1X2 / Moneyline',
  'prop-type': 'simnao',
  'prop-family': 'prop_gols',
  'prop-margin-on': 'true',
  'prop-side-no': 'false',
  'proxy-mode': 'single',
  'proxy-family': 'ou_gols_ft',
  'proxy-cons-excl': 'false,false,true',
  'combo-corr': 'false',
  'asia-mode': 'total',
  'asia-side': 'over',
  'asiah-side': 'home',
};

const EXAMPLE_TAB: Record<string, TabId> = {
  'nres-1x2': 'nres', 'nres-ou': 'nres',
  'prop-anytime': 'props',
  'proxy-single': 'proxy',
  'aub-basic': 'aub',
  'combo-boost': 'combo',
  'poi-builder': 'poi', 'poi-playerprop': 'poi', 'poi-tennis': 'poi', 'poi-tennis-prop': 'poi',
  'asia-total': 'asia',
};

const EXAMPLE_MAP: Record<string, Partial<Record<string, string>>> = {
  'nres-1x2': {
    'nres-type': '1X2 / Moneyline', 'nres-name': '1X2 / Moneyline', 'nres-eval': '2,50', 'nres-your': '2,65', 'nres-others': '3.30,2.80',
  },
  'nres-ou': {
    'nres-type': 'Over/Under', 'nres-name': 'Over/Under', 'nres-eval': '1,95', 'nres-your': '2,05', 'nres-others': '1.95',
  },
  'prop-anytime': {
    'prop-type': 'simnao', 'prop-family': 'prop_gols', 'prop-ref-yes': '2,10', 'prop-ref-no': '1,80', 'prop-your': '2,30', 'prop-margin-on': 'true', 'prop-side-no': 'false',
  },
  'proxy-single': {
    'proxy-mode': 'single', 'proxy-family': 'ou_gols_ft', 'proxy-ref': '1,70', 'proxy-margin': '5,0', 'proxy-your': '2,20',
  },
  'aub-basic': {
    'aub-odds': '2.62,2.50', 'aub-discount': '8', 'aub-your': '1,85',
  },
  'combo-boost': {
    'combo-your': '7,03', 'combo-corr': 'false',
    'combo-legs': '3|0|1.598,4.470,5.310;3|2|5.260,3.650,1.746;3|0|1.097,10.780,20.200;3|0|2.100,3.420,3.760',
  },
  'poi-builder': {
    'poi-h': '1,80', 'poi-d': '3,60', 'poi-a': '4,50', 'poi-ouline': '2,5', 'poi-over': '1,95', 'poi-under': '1,95', 'poi-your': '3,15', 'poi-rho': '-0,05',
    'poi-legs': 'over|2,5|||home;homewin',
  },
  'poi-playerprop': {
    'poi-h': '1,83', 'poi-d': '3,70', 'poi-a': '4,20', 'poi-ouline': '2,5', 'poi-over': '1,80', 'poi-under': '2,00', 'poi-your': '3,00', 'poi-rho': '-0,13',
    'poi-legs': 'homewin|||||||||||||||;playerprop||||||||1,31|2,41|6,60|14,00|40,00|home|0,54|',
  },
  'poi-tennis': {
    'poi-sport': 'tennis', 'poi-mlA': '1,33', 'poi-mlB': '3,50', 'poi-gamesLine': '22,5', 'poi-gamesOver': '1,85', 'poi-gamesUnder': '1,95', 'poi-your': '2,10', 'poi-bestOf': '3',
    'poi-legs': 'matchWinner||A|||||||||||||||;totalGamesOver|22,5|||||||||||||||',
  },
  'poi-tennis-prop': {
    'poi-sport': 'tennis', 'poi-mlA': '1,50', 'poi-mlB': '2,60', 'poi-gamesLine': '20,5', 'poi-gamesOver': '1,90', 'poi-gamesUnder': '1,90', 'poi-your': '2,50', 'poi-bestOf': '3',
    'poi-legs': 'matchWinner||A|||||||||||||||;totalGamesOver|20,5|||||||||||||||;firstSetWinner||A|||||||||||||||',
  },
  'asia-total': {
    'asia-mode': 'total', 'asia-cal-line': '2,5', 'asia-over-ref': '1,95', 'asia-under-ref': '1,95', 'asia-side': 'over', 'asia-line': '2,25', 'asia-your': '1,95',
  },
};

const TAB_LABELS: Record<TabId, { title: string; sub: string }> = {
  nres:  { title: 'N Resultados', sub: 'Mercados de 2+ resultados (1X2, Over/Under, etc.)' },
  props: { title: 'Props', sub: 'Mercados Sim/Não e props de jogadores' },
  proxy: { title: 'Proxy', sub: 'Estimativa via mercado proxy eficiente' },
  aub:   { title: 'A ou B', sub: 'Qual dos dois lados tem valor?' },
  combo: { title: 'Combinada', sub: 'Avalie apostas combinadas (parlays)' },
  poi:   { title: 'Bet Builder', sub: 'Combine seleções com correlação implícita' },
  asia:  { title: 'Asiáticos', sub: 'Handicap asiático e quarter-lines' },
};

// Campos serializados (listas com ',' como delimitador estrutural) — NÃO forçar ponto neles;
// as odds individuais já são normalizadas a ponto nos handlers das abas.
const RAW_LIST_FIELDS = new Set(['poi-legs', 'combo-legs', 'aub-odds', 'nres-others', 'proxy-cons-odds', 'proxy-cons-excl']);

// Abas que usam cálculo lazy (sob demanda via botão "Calcular") — abas pesadas.
const LAZY_TABS: Set<TabId> = new Set(['combo', 'poi', 'asia']);

const TAB_PREFIXES: Record<TabId, string[]> = {
  nres: ['nres-'], props: ['prop-'], proxy: ['proxy-'], aub: ['aub-'],
  combo: ['combo-'], poi: ['poi-'], asia: ['asia-', 'asiah-'],
};

// Verdadeiro quando a aba ativa tem algum campo preenchido pelo usuário.
// Exclui chaves de DEFAULT_INPUTS (selects/flags de roteamento, nunca conteúdo numérico) para evitar erro falso no load.
function tabHasContent(inputs: Record<string, string>, tab: TabId): boolean {
  const pfx = TAB_PREFIXES[tab];
  return Object.keys(inputs).some(k => pfx.some(p => k.startsWith(p)) && !(k in DEFAULT_INPUTS) && inputs[k] !== '');
}

type Theme = 'ink' | 'ivory';

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('ks-theme');
      return saved === 'ivory' ? 'ivory' : 'ink';
    } catch {
      return 'ink';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'ivory') root.setAttribute('data-theme', 'ivory');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem('ks-theme', theme); } catch {}
  }, [theme]);

  const toggle = useCallback(() => setTheme(t => (t === 'ink' ? 'ivory' : 'ink')), []);
  return [theme, toggle];
}

function App() {
  const { config, setConfig } = useConfig();
  const [theme, toggleTheme] = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('nres');
  const [inputs, setInputs] = useState<Record<string, string>>(DEFAULT_INPUTS);
  const [showConfig, setShowConfig] = useState(false);
  const [calcTrigger, setCalcTrigger] = useState(0);
  const [mobileResultOpen, setMobileResultOpen] = useState(false);
  const [undoSnapshot, setUndoSnapshot] = useState<Record<string, string> | null>(null);

  const isMobile = useMediaQuery('(max-width: 1023px)');

  const handleInputChange = useCallback((id: string, value: string) => {
    const v = RAW_LIST_FIELDS.has(id) ? value : value.replace(/,/g, '.');
    setInputs(prev => ({ ...prev, [id]: v }));
  }, []);

  const isLazyTab = LAZY_TABS.has(activeTab);
  const { result, isLoading } = useCalculator(inputs, config, activeTab, isLazyTab ? calcTrigger : undefined);

  const loadExample = useCallback((key: string) => {
    const example = EXAMPLE_MAP[key];
    if (!example) return;
    const tab = EXAMPLE_TAB[key];
    if (!tab) return;
    setActiveTab(tab);
    setInputs(prev => {
      const next = { ...prev };
      Object.entries(example).forEach(([k, v]) => { if (v !== undefined) next[k] = RAW_LIST_FIELDS.has(k) ? v : v.replace(/,/g, '.'); });
      return next;
    });
  }, []);

  const resetTab = useCallback(() => {
    const prefixes: Record<TabId, string[]> = {
      nres: ['nres-'], props: ['prop-'], proxy: ['proxy-'], aub: ['aub-'],
      combo: ['combo-'], poi: ['poi-'], asia: ['asia-', 'asiah-'],
    };
    const pfx = prefixes[activeTab];
    setInputs(prev => {
      const hadContent = Object.keys(prev).some(k => pfx.some(p => k.startsWith(p)) && !(k in DEFAULT_INPUTS) && prev[k] !== '');
      if (hadContent) setUndoSnapshot(prev);
      const next = { ...prev };
      for (const k of Object.keys(next)) if (pfx.some(p => k.startsWith(p))) next[k] = '';
      return next;
    });
  }, [activeTab]);

  const undoReset = useCallback(() => {
    if (undoSnapshot) setInputs(undoSnapshot);
    setUndoSnapshot(null);
  }, [undoSnapshot]);

  const handleCalculate = useCallback(() => {
    setCalcTrigger(t => t + 1);
    if (isMobile) setMobileResultOpen(true);
  }, [isMobile]);

  const tabContent = useMemo(() => {
    const hideCalc = !isMobile && !isLazyTab;
    const common = { values: inputs, onChange: handleInputChange, onLoadExample: loadExample, onReset: resetTab, onCalculate: handleCalculate, isLoading, hideCalcButton: hideCalc };
    switch (activeTab) {
      case 'nres': return <NResultsTab {...common} config={config} />;
      case 'props': return <PropsTab {...common} />;
      case 'proxy': return <ProxyTab {...common} />;
      case 'aub': return <AubTab {...common} />;
      case 'combo': return <ComboTab {...common} />;
      case 'poi': return <BetBuilderTab {...common} />;
      case 'asia': return <AsianTab {...common} />;
    }
  }, [activeTab, inputs, handleInputChange, loadExample, resetTab, handleCalculate, isLoading, isMobile, isLazyTab, config]);

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar
        activeTab={activeTab}
        onChange={setActiveTab}
        onConfig={() => setShowConfig(true)}
        config={config}
      />

      <div className="flex flex-1 overflow-hidden">
        <SideRail activeTab={activeTab} onChange={setActiveTab} />
        <main className="flex-1 overflow-y-auto p-6 xl:p-8 pb-20 md:pb-6 max-w-[2200px] mx-auto w-full">
          <div className="mb-5">
            <h1 className="t-headline text-text-primary">{TAB_LABELS[activeTab].title}</h1>
            <p className="t-body-sm text-text-muted mt-1">{TAB_LABELS[activeTab].sub}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="min-w-0 animate-fade-in space-y-4">
              {tabContent}
              {result && !('err' in result) && <VizSection result={result} />}
            </div>
            <aside className="hidden lg:block">
              <div className="sticky top-[calc(3.5rem+24px)] pr-1 space-y-4">
                {/* 1. Resumo da banca — aparece exceto quando há resultado válido */}
                {(!result || (result && 'err' in result)) && (
                  <div className="panel">
                    <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">Resumo da banca</div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <BankRow label="Banca" value={`R$ ${config.bank.toLocaleString('pt-BR')}`} />
                      <BankRow label="Unidade" value={`R$ ${config.unit.toLocaleString('pt-BR')}`} />
                      <BankRow label="Fração Kelly" value={`${config.frac}×`} />
                      <BankRow label="Teto" value={`${(config.cap * 100).toFixed(1)}%`} />
                      <BankRow label="Piso" value={`${(config.floor * 100).toFixed(2)}%`} />
                      <BankRow label="Edge mín." value={`${(config.edgemin * 100).toFixed(1)}%`} />
                    </dl>
                  </div>
                )}

                {/* 2. Resultado — só após calcular com resultado válido */}
                {result && !('err' in result) && (
                  <ResultView result={result} config={config} isLoading={isLoading} />
                )}

                {/* 3. Placeholder — só se sem resultado e sem conteúdo na aba */}
                {!result && !isLoading && !tabHasContent(inputs, activeTab) && (
                  <div className="rounded-lg border border-dashed border-hairline-strong p-8 text-center">
                    <p className="t-body-sm text-text-muted">Preencha e calcule</p>
                    <p className="text-xs text-text-tertiary mt-1">O resultado aparece aqui</p>
                  </div>
                )}

                {/* 4. Erro — só se usuário preencheu algo E houve erro real */}
                {result && 'err' in result && tabHasContent(inputs, activeTab) && (
                  <div className="panel border-danger/30" style={{ background: 'rgba(239, 68, 68, 0.06)' }}>
                    <div className="flex items-center gap-2 text-danger mb-2">
                      <AlertTriangle size={16} aria-hidden="true" />
                      <span className="text-sm font-semibold">Erro no cálculo</span>
                    </div>
                    <p className="text-sm text-text-secondary">{result.err}</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>

      {isMobile && mobileResultOpen && (
        <ResultsDrawer
          result={result}
          config={config}
          isLoading={isLoading}
          onClose={() => setMobileResultOpen(false)}
        />
      )}

      {showConfig && (
        <ConfigModal
          config={config}
          onChange={setConfig}
          onClose={() => setShowConfig(false)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {undoSnapshot && (
        <Toast
          message="Campos limpos."
          actionLabel="Desfazer"
          onAction={undoReset}
          onDismiss={() => setUndoSnapshot(null)}
        />
      )}

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default App;

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">{label}</dt>
      <dd className="font-mono text-xs font-medium text-text-primary mt-0.5">{value}</dd>
    </div>
  );
}
