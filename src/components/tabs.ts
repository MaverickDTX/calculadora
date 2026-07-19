import type { TabId } from '../types';
import {
  Hash, ToggleLeft, Radio, GitBranch, Layers, Puzzle, TrendingUp,
} from 'lucide-react';

export const TABS: { id: TabId; label: string; short: string; icon: React.ElementType }[] = [
  { id: 'nres', label: 'N Resultados', short: 'N Res.', icon: Hash },
  { id: 'props', label: 'Props', short: 'Props', icon: ToggleLeft },
  { id: 'proxy', label: 'Proxy', short: 'Proxy', icon: Radio },
  { id: 'aub', label: 'A ou B', short: 'A/B', icon: GitBranch },
  { id: 'combo', label: 'Combinada', short: 'Combo', icon: Layers },
  { id: 'poi', label: 'Bet Builder', short: 'Builder', icon: Puzzle },
  { id: 'asia', label: 'Asiáticos', short: 'Asiát.', icon: TrendingUp },
];
