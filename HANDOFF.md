# Handoff — Régua de Kelly (Kelly Stake Pro)

> Última atualização: 2026-06-26 · Versão em produção: **v0.3** (`a7f57f6`)
> Memória detalhada do projeto: `memory/project_kelly.md` (índice em `memory/MEMORY.md`)

## TL;DR
Sessão fechada com **v0.3 em produção**. Tudo commitado e pushado — `main` em
sincronia com `origin/main`. Entregues nesta sessão: mobile responsivo (#9),
gráficos removidos (#6+#7), "Ambas marcam: Não" (#11 parcial), inputs numéricos
iniciam vazios, config exibe cap/floor/edgemin em pontos percentuais com defaults
corretos e migração de localStorage legado.

## Ambiente
- **Repo:** `MaverickDTX/calculadora`
- **Deploy:** `calculadora-gray-one.vercel.app` (auto-deploy a cada push em `main`, ~1 min)
- **App React:** `C:\Projetos\calculadora\project\` (raiz do repo). React 18 + TS + Vite + Tailwind + Supabase.
- **Scripts de análise (Python):** `C:\Projetos\calculadora\` (raiz, **fora do git** — não versionados). Ex.: `estimar_beta_xg.py`.
- **Referência legada:** `regua-kelly-v14.html` (paridade de cálculo).
- Identidade git: MaverickDTX / matteblz@gmail.com

## Convenções do projeto (seguir)
1. **Versionamento** (`memory/feedback_versionamento.md`): fonte única em
   `src/version.ts` → `APP_VERSION`, formato `0.x`. **Um bump por sessão/entrega**
   (não por commit). Próxima entrega = **0.4**.
2. **Decimal = ponto** (formato das casas): a entrada força vírgula→ponto em todo
   campo de odd/linha (central em `handleInputChange` do `App.tsx`, exceto
   `RAW_LIST_FIELDS`). Manter esse padrão em campos novos.
3. **Fluxo:** `npm run typecheck` + `npm run build` limpos e **verificar no preview**
   (dev server) antes de commitar.
4. Apagar `vite.config.ts.timestamp-*.mjs` antes de commitar (já no `.gitignore`).

## O que foi feito (commits desta sessão, todos pushados)
| Hash | Entrega |
|---|---|
| `b99d970` | Seletor de linha SOT + correção do μ no playerprop |
| `4072bdf` | Probabilidade marginal por perna + limpeza de lint |
| `760a1c9` | Default β do prop 0,20 → **0,54** (calibrado: pooled n=543, LR confirma) |
| `e450a70` | Cursor pulando ao digitar (Bet Builder/Combinada) + lado do prop ignorado |
| `4e251d8` | Odds com vírgula nas listas não eram lidas — força ponto |
| `06631d1` | Versionamento (v0.1) |
| `6db968f` | **v0.2:** Bet Builder (jogador/escanteios desalinhados), Poisson asiático (÷g→÷g!), ponto decimal global, Reset limpa |
| `a7f57f6` | **v0.3:** mobile (#9), gráficos removidos (#6+#7), bttsNo (#11p), inputs vazios, config % |

## Pendências (numeração de `project_kelly.md`)

### Abertas — acionáveis
- **#11 Novas pernas Bet Builder (resto)** — "Ambas marcam: Não" feito. SOT/finalizações
  por time/partida precisam de **calibração Poisson própria** — mesma família técnica de
  escanteios. **Decisão pendente de produto:** de onde vem a calibração (escada de odds?
  linha única O/U? base rate?). Alinhar com usuário antes de implementar.
- **#13 Mercado de cartões** (O/U partida/time + 1X2) — mesma família do #11; o 1X2
  reusa `cornerSideProb`. Mesma decisão de produto pendente.
- **#10 Colapso de linha** ao limpar campo do meio (A ou B / N Resultados) — baixa prio.
- **#2 Resumo do ajuste λ/erro** (paridade v14) — opcional, baixo valor.

### Condicionais (só com gatilho)
- **#5 Binomial Negativa** p/ cauda SOT (se o padrão migrar p/ Over 3,5/4,5).
- **Re-arquitetar coupling p/ xG latente** (usar β-xG≈0,85 em vez do β-gols 0,54).

### Engavetadas — decisão registrada (2026-07-09)
- **#14 Leitor de prints (bot Telegram e/ou no app)** — SEGURADO por decisão do usuário.
  Contexto: pedido original era bot Telegram com leitor de prints à la Bankroll Pro
  (backend Vercel no mesmo repo, escopo Proxy + N Resultados). Na análise, o risco
  central é que aqui o print alimenta **decisão de stake** (erro de OCR = aposta mal
  dimensionada; a própria análise de sensibilidade mostra que ±1 tick muda o EV),
  diferente do Bankroll Pro onde o print só registra. Alternativa recomendada quando
  reabrir: **leitor de prints dentro do app** (extração Gemini preenche o formulário,
  usuário revisa antes de calcular) — 80% do valor, sem infra nova; bot depois,
  herdando o módulo de extração já validado. Ordens de execução completas do bot já
  redigidas em `C:\Projetos\calculadora\ORDENS-bot-telegram-kelly.md` (inclui a
  refatoração `useCalculator.ts` → `src/lib/calc.ts`, que tem valor por si só e pode
  ser antecipada em qualquer sessão).

### Feitas
#1, #3, #4 (Supabase confirmado), #6, #7, #8 (já estava OK),
#9, #11 (bttsNo), #12 (ponto decimal global).

## Próximo passo recomendado
1. **#11 + #13** — alinhar com o usuário sobre a fonte de calibração antes de
   implementar SOT/finalizações/cartões.
2. **#10** — papercut de UX rápido se o usuário reportar incômodo.
3. **Manutenção:** limpeza da camada externa de `C:\Projetos\calculadora` (fora do git)
   **executada em 2026-07-09** — 38 arquivos movidos para `old/{html,patches,tests,docs,misc}`,
   2 deletados. Ordens arquivadas em `old\docs\ORDENS-limpeza-legado.md`; mapa de
   reversão em `old\INVENTARIO-pre-limpeza-2026-07-09.txt`.

> Antes de qualquer mercado novo (#11 SOT/finalizações, #13 cartões), **alinhar com
> o usuário de onde vem a calibração** — é a decisão de produto que trava ambos.

## Arquivos-chave
- `src/hooks/useCalculator.ts` — todos os cálculos (`calcPoi` Bet Builder, `calcAsia`
  asiáticos, `calcCombo`, `calcNRes`, `calcProps`, `calcAub`, `calcProxy`).
- `src/components/tabs/BetBuilderTab.tsx` — `serializeLegs`/`parseLegs` (posições:
  `kind0|line1|side2|cSide3|cDir4|c1x2_5|anytime6|anytimeNo7|ppO0..4 8-12|ppSide13|ppBeta14|cBeta15|ppLine16`).
- `src/lib/math.ts` — helpers (`poisPmf`, `fitLambdas`, `cornerLambdaEff`,
  `fitMuFromLadder`, `splitComboOdds`, `confFactor`).
- `src/App.tsx` — `handleInputChange` (força ponto), `loadExample`, `resetTab`,
  `EXAMPLE_MAP`, `RAW_LIST_FIELDS`. `DEFAULT_INPUTS` contém só selects/flags (sem odds).
- `src/version.ts` — `APP_VERSION`.
- `src/hooks/useConfig.ts` — `DEFAULTS` (cap=0.05, floor=0.0025, edgemin=0.005);
  `migratePercent` converte localStorage legado (valores >1 → ÷100).
- `src/components/ConfigModal.tsx` — `fmtPct`/`parsePct` convertem cap/floor/edgemin
  entre decimal (armazenado) e pontos percentuais (exibido).
- `src/components/Sidebar.tsx` — desktop: `hidden md:flex` aside; mobile: bottom nav `md:hidden`.
- `src/components/ResultsDrawer.tsx` — mobile: `fixed inset-0 z-50`; desktop: `md:relative md:w-[400px]`.
- `src/components/VizSection.tsx` — só Monte Carlo em texto (gráficos removidos).
