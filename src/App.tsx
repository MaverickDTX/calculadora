import { useState, useCallback, useMemo } from 'react';
import type { TabId } from './types';
import { useConfig } from './hooks/useConfig';
import { useCalculator } from './hooks/useCalculator';
import { Sidebar } from './components/Sidebar';
import { ResultsDrawer } from './components/ResultsDrawer';
import { ConfigModal } from './components/ConfigModal';
import { HistoryModal } from './components/HistoryModal';
import { VizSection } from './components/VizSection';
import { NResultsTab } from './components/tabs/NResultsTab';
import { PropsTab } from './components/tabs/PropsTab';
import { ProxyTab } from './components/tabs/ProxyTab';
import { AubTab } from './components/tabs/AubTab';
import { ComboTab } from './components/tabs/ComboTab';
import { BetBuilderTab } from './components/tabs/BetBuilderTab';
import { AsianTab } from './components/tabs/AsianTab';

const DEFAULT_INPUTS: Record<string, string> = {
  'nres-type': '1X2 / Moneyline',
  'nres-name': '1X2 / Moneyline',
  'nres-eval': '2,50',
  'nres-your': '2,65',
  'nres-others': '3,30,2,80',
  'prop-type': 'simnao',
  'prop-family': 'prop_gols',
  'prop-ref-yes': '2,10',
  'prop-ref-no': '1,80',
  'prop-your': '2,30',
  'prop-margin': '5,0',
  'prop-margin-on': 'true',
  'prop-side-no': 'false',
  'proxy-mode': 'single',
  'proxy-family': 'ou_gols_ft',
  'proxy-ref': '1,70',
  'proxy-margin': '5,0',
  'proxy-your': '2,20',
  'proxy-cons-odds': '1,95,2,00,2,10',
  'proxy-cons-excl': 'false,false,true',
  'proxy-cons-margin': '5,0',
  'proxy-cons-your': '2,20',
  'aub-odds': '2,62,2,50',
  'aub-discount': '8',
  'aub-your': '1,85',
  'combo-your': '7,03',
  'combo-corr': 'false',
  'combo-legs': '3|0|1,598,4,470,5,310;3|2|5,260,3,650,1,746;3|0|1,097,10,780,20,200;3|0|2,100,3,420,3,760',
  'poi-h': '1,80',
  'poi-d': '3,60',
  'poi-a': '4,50',
  'poi-ouline': '2,5',
  'poi-over': '1,95',
  'poi-under': '1,95',
  'poi-your': '3,15',
  'poi-rho': '-0,05',
  'poi-c-line': '9,5',
  'poi-c-over': '1,90',
  'poi-c-under': '1,90',
  'poi-legs': 'over|2,5|||home;homewin',
  'asia-mode': 'total',
  'asia-your': '1,95',
  'asia-cal-line': '2,5',
  'asia-over-ref': '1,95',
  'asia-under-ref': '1,95',
  'asia-side': 'over',
  'asia-line': '2,25',
  'asiah-h': '1,80',
  'asiah-d': '3,60',
  'asiah-a': '4,50',
  'asiah-ouline': '2,5',
  'asiah-over': '1,95',
  'asiah-under': '1,95',
  'asiah-rho': '-0,05',
  'asiah-side': 'home',
  'asiah-line': '-0,5',
  'asia-pwin': '45',
  'asia-phwin': '0',
  'asia-ppush': '8',
  'asia-phloss': '0',
  'asia-ploss': '47',
};

const EXAMPLE_MAP: Record<string, Partial<Record<string, string>>> = {
  'nres-1x2': {
    'nres-type': '1X2 / Moneyline', 'nres-name': '1X2 / Moneyline', 'nres-eval': '2,50', 'nres-your': '2,65', 'nres-others': '3,30,2,80',
  },
  'nres-ou': {
    'nres-type': 'Over/Under', 'nres-name': 'Over/Under', 'nres-eval': '1,95', 'nres-your': '2,05', 'nres-others': '1,95',
  },
  'prop-anytime': {
    'prop-type': 'simnao', 'prop-family': 'prop_gols', 'prop-ref-yes': '2,10', 'prop-ref-no': '1,80', 'prop-your': '2,30', 'prop-margin-on': 'true', 'prop-side-no': 'false',
  },
  'proxy-single': {
    'proxy-mode': 'single', 'proxy-family': 'ou_gols_ft', 'proxy-ref': '1,70', 'proxy-margin': '5,0', 'proxy-your': '2,20',
  },
  'aub-basic': {
    'aub-odds': '2,62,2,50', 'aub-discount': '8', 'aub-your': '1,85',
  },
  'combo-boost': {
    'combo-your': '7,03', 'combo-corr': 'false',
    'combo-legs': '3|0|1,598,4,470,5,310;3|2|5,260,3,650,1,746;3|0|1,097,10,780,20,200;3|0|2,100,3,420,3,760',
  },
  'poi-builder': {
    'poi-h': '1,80', 'poi-d': '3,60', 'poi-a': '4,50', 'poi-ouline': '2,5', 'poi-over': '1,95', 'poi-under': '1,95', 'poi-your': '3,15', 'poi-rho': '-0,05',
    'poi-legs': 'over|2,5|||home;homewin',
  },
  'poi-playerprop': {
    'poi-h': '1,83', 'poi-d': '3,70', 'poi-a': '4,20', 'poi-ouline': '2,5', 'poi-over': '1,80', 'poi-under': '2,00', 'poi-your': '3,00', 'poi-rho': '-0,13',
    'poi-legs': 'homewin|||||||||||||||;playerprop||||||||1,31|2,41|6,60|14,00|40,00|home|0,20|',
  },
  'asia-total': {
    'asia-mode': 'total', 'asia-cal-line': '2,5', 'asia-over-ref': '1,95', 'asia-under-ref': '1,95', 'asia-side': 'over', 'asia-line': '2,25', 'asia-your': '1,95',
  },
};

const TAB_LABELS: Record<TabId, string> = {
  nres: 'N Resultados',
  props: 'Props',
  proxy: 'Proxy',
  aub: 'A ou B',
  combo: 'Combinada',
  poi: 'Bet Builder',
  asia: 'Asiáticos',
};

function App() {
  const { config, setConfig } = useConfig();
  const [activeTab, setActiveTab] = useState<TabId>('nres');
  const [inputs, setInputs] = useState<Record<string, string>>(DEFAULT_INPUTS);
  const [showConfig, setShowConfig] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showResults, setShowResults] = useState(true);

  const handleInputChange = useCallback((id: string, value: string) => {
    setInputs(prev => ({ ...prev, [id]: value }));
  }, []);

  const { result } = useCalculator(inputs, config, activeTab);

  const loadExample = useCallback((key: string) => {
    const example = EXAMPLE_MAP[key];
    if (!example) return;
    const tab = key.split('-')[0] as TabId;
    setActiveTab(tab);
    setInputs((prev: Record<string, string>) => {
      const next: Record<string, string> = { ...prev };
      Object.entries(example).forEach(([k, v]) => { if (v !== undefined) next[k] = v; });
      return next;
    });
  }, []);

  const resetTab = useCallback(() => {
    const map: Record<TabId, string> = {
      nres: 'nres-1x2', props: 'prop-anytime', proxy: 'proxy-single',
      aub: 'aub-basic', combo: 'combo-boost', poi: 'poi-playerprop', asia: 'asia-total',
    };
    loadExample(map[activeTab]);
  }, [activeTab, loadExample]);

  const tabContent = useMemo(() => {
    const common = { values: inputs, onChange: handleInputChange, onLoadExample: loadExample, onReset: resetTab };
    switch (activeTab) {
      case 'nres': return <NResultsTab {...common} />;
      case 'props': return <PropsTab {...common} />;
      case 'proxy': return <ProxyTab {...common} />;
      case 'aub': return <AubTab {...common} />;
      case 'combo': return <ComboTab {...common} />;
      case 'poi': return <BetBuilderTab {...common} />;
      case 'asia': return <AsianTab {...common} />;
    }
  }, [activeTab, inputs, handleInputChange, loadExample, resetTab]);

  return (
    <div className="min-h-screen flex">
      <Sidebar activeTab={activeTab} onChange={setActiveTab} onConfig={() => setShowConfig(true)} onHistory={() => setShowHistory(true)} />

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-text-primary">{TAB_LABELS[activeTab]}</h1>
            <p className="text-xs text-text-muted mt-0.5">Kelly Stake Pro — quanto apostar, não em que apostar</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowResults(v => !v)}
              className={`btn-ghost text-xs ${showResults ? 'border-accent text-accent' : ''}`}
            >
              {showResults ? 'Ocultar resultado' : 'Mostrar resultado'}
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
            <div className="max-w-2xl mx-auto animate-fade-in">
              {tabContent}
            </div>
            <div className="max-w-2xl mx-auto mt-6">
              <VizSection result={result} config={config} />
            </div>
            <div className="h-8" />
          </div>

          {showResults && (
            <ResultsDrawer result={result} config={config} onClose={() => setShowResults(false)} />
          )}
        </div>
      </main>

      {showConfig && <ConfigModal config={config} onChange={setConfig} onClose={() => setShowConfig(false)} />}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
    </div>
  );
}

export default App;
