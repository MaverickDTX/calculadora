# Handoff — Régua de Kelly (Kelly Stake Pro)

> Última atualização: 2026-07-12 (4ª sessão) · Versão em produção: **v0.7**
> ✅ **typecheck e build limpos** — `tsc --noEmit -p tsconfig.app.json` sem erros; `vite build` gera artefatos (JS ~335 kB / 101 kB gzip). `typecheck-errors-v0.5.txt` está **obsoleto** (apagar).
> Memória detalhada do projeto: `memory/project_kelly.md` (índice em `memory/MEMORY.md`)
> Handoff do coletor de dados: `HANDOFF-coletor-shots-time.md` (fora do git, em `C:\Projetos\calculadora\`)

## TL;DR
Sessão fechada com **v0.7 em produção**. Tudo commitado e pushado — `main` em
sincronia com `origin/main`. Entregues nesta sessão: correção do parsing de pernas de tênis
(`setScoreA`/`setScoreB` nos índices corretos), `React.memo` no `BetBuilderTab` para
eliminar input lag na "odd final", exemplos rápidos de tênis na aba Bet Builder
(Djokovic/Alcaraz + Over 22.5, e Vencedor + Over + 1º set).

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
   (não por commit). Próxima entrega = **0.8**.
2. **Decimal = ponto** (formato das casas): a entrada força vírgula→ponto em todo
   campo de odd/linha (central em `handleInputChange` do `App.tsx`, exceto
   `RAW_LIST_FIELDS`). Manter esse padrão em campos novos.
3. **Fluxo:** `npm run typecheck` + `npm run build` limpos e **verificar no preview**
   (dev server) antes de commitar.
4. Apagar `vite.config.ts.timestamp-*.mjs` antes de commitar (já no `.gitignore`).

## O que foi feito (commits desta sessão, todos pushados)
| Hash | Entrega |
|---|---|
| `d301840` | **chore:** bump version to 0.6 |
| `f0dfd8f` | **fix(tennis):** corrige parsing `setScoreA`/`setScoreB` (índices 17/18) + memo `BetBuilderTab` |
| `56905fc` | **fix(tennis):** corrige parsing `setScoreA`/`setScoreB` + memo `BetBuilderTab` + exemplos tênis |
| `75549de` | **fix(tennis):** adiciona botões "Exemplos rápidos" na aba Bet Builder (tênis) |
| (implícito) | **v0.7:** version bump + typecheck/build limpos |

## Pendências (numeração de `project_kelly.md`)

### Abertas — acionáveis
- **#11 Novas pernas Bet Builder (resto)** — "Ambas marcam: Não" feito. **Pipeline de
  dados construído** (script Python `coletar_shots_time_sofasport.py`, fora do git):
  coleta shots/SOT + cartões por time via SofaScore RapidAPI (provider atual:
  **sportapi7 / RapidSportAPI**). Cache: 376 eventos com stats + 13 times com
  metadados (de 156 times). Coleta completa **travada na quota free** (500 req/mês
  esgotados em ~130 chamadas Fase 1). **Decisão de calibração ainda pendente**
  (escada de odds / linha O-U / base rate).
- **#13 Mercado de cartões** (O/U partida/time + 1X2) — dados de cartão já incluídos
  no pipeline acima (`yellowCards` confirmado, `redCards` condicional). Mesma decisão
  de calibração pendente.
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
**#11/#13 — pipeline de dados construído** (coletor SofaScore Python):
  `coletar_shots_time_sofasport.py` com extração de shots/SOT/cartões,
  resolução automática de ligas, cache incremental. Falta só rodar a
  coleta completa (quota API) e a decisão de calibração.

## Próximo passo recomendado (v0.7+ — tênis / basquete)

1. **Validar tênis em produção**: testar exemplos rápidos no app
   (`https://calculadora-gray-one.vercel.app` → aba **Bet Builder** → Esporte: **Tênis** →
   "Djokovic @1.33 / Alcaraz @3.50 + Over 22.5") para confirmar que o cálculo
   funciona end-to-end.

2. **Basquete (Fase 2)**: modelo Normal Bivariada + Monte Carlo em
   `src/lib/sgp/basketball.ts` — usar `SGP_REGISTRY` pattern igual a futebol/tênis.

3. Se houver demanda: **pipeline de dados cartões/SOT** — resolver quota API
   (provider pago ou cache local estendido) + decisão de calibração (base rate por
   liga/time, escada de odds).

## Diagnóstico: jointProb=0 no tênis (reanálise 3ª sessão — a causa-raiz anterior estava errada)

**A explicação registrada na 2ª sessão não se sustenta na aritmética.** O cenário
citado (A @1.226 / B @4.20, O/U 37.5 @1.819/2.060, Melhor de 5) foi rodado com o
próprio motor (`calibrateTennis` + `sampleTennis` + `tennisModel.jointProb`):

| N_SIM | jointProb (A vence ∧ Over 37.5) | P(A vence) | P(Over 37.5) |
|---|---|---|---|
| 20 000 | **0,4124** | 0,843 | 0,535 |
| 100 000 | **0,4137** | 0,841 | 0,539 |

Calibração: `pA_serve≈0,67`, `pB_serve≈0,61`, `fitError≈0,0026`. A conjunta é ~41%,
**não** <5% — e um evento de 41% não zera nem com 20 000 sims (erro-padrão ≈0,0035).
As duas pernas são prováveis e positivamente correlacionadas (favorito que estende
a partida faz mais games), então a interseção é alta, não rara.

**O que de fato produz `jointProb=0`:** combinações *logicamente quase-impossíveis*,
não meramente raras. Testado no motor:

- `A vence 3-0 ∧ Over 40,5 games` → **0,000000** com 20k **e** com 100k
- `B vence 3-2 ∧ Under 30,5 games` → **0,000000** com 20k **e** com 100k

Vencer 3-0 em Bo5 são ≤3 sets; passar de 40,5 games em 3 sets exigiria média de
13,5 games/set — a interseção é estruturalmente nula. **Aumentar N_SIM não cria
hits quando P≈0.** O bump 20k→100k só teria efeito numa faixa estreita de P
(~0,003%–0,02%), onde o EV já seria rejeitado pelo `edgemin` de qualquer forma —
número sem valor decisório, a custo de 5× simulações por recálculo no browser.

**Decisão desta sessão:**
1. `src/lib/sgp/monte-carlo.ts` — `DEFAULT_N_SIM` **revertido a 20000** (o bump não
   resolvia o caso real e só encarecia o cálculo).
2. `src/lib/sgp/tennis.ts` — `N_CAL` 2000 → **10000** **mantido** (é independente do
   jointProb; reduz ruído na estimativa de `pA_serve`/`pB_serve` no grid search).
3. `src/hooks/useCalculator.ts` — `console.warn` diagnóstico + **mensagem de fallback**
   explicativa quando `p===0` **mantidos**. Esta é a mitigação correta e suficiente:
   comunica ao usuário que a combinação é improvável demais para o modelo medir,
   em vez de fingir precisão que não existe.

## Correções desta sessão (4ª)

### 1. Parsing de pernas de tênis (`src/hooks/useCalculator.ts:470-471`)
O `setScoreA`/`setScoreB` estavam sendo lidos dos índices 3 e 4 do split `|`, mas a
serialização no `BetBuilderTab` coloca esses campos nos índices 17 e 18. Corrigido
para ler dos índices corretos.

### 2. Input lag na "Sua odd final" (`src/components/tabs/BetBuilderTab.tsx`)
O componente era grande e re-renderizava a cada keystroke via `handleInputChange` do
`App.tsx`. Envolvido em `React.memo` — agora o input responde instantaneamente.

### 3. Exemplos rápidos de tênis (`src/App.tsx`)
Adicionados ao `EXAMPLE_MAP` e `EXAMPLE_TAB`:
- `poi-tennis`: Djokovic @1.33 / Alcaraz @3.50, O/U 22.5 jogos @1.85/1.95, pernas
  `matchWinner` (A) + `totalGamesOver` 22.5
- `poi-tennis-prop`: mesmo jogo + `firstSetWinner` (A) — 3 pernas

### 4. Botões "Exemplos rápidos" para tênis (`src/components/tabs/BetBuilderTab.tsx`)
Bloco condicional `sport === 'tennis'` com os dois botões acima, espelhando o
padrão do futebol.

## Handoff v0.7 — SGP multi-esporte (arquivos novos/modificados desta sessão)
**Modificados:**
- `src/hooks/useCalculator.ts` — correção índices `setScoreA`/`setScoreB` (linhas 470-471)
- `src/components/tabs/BetBuilderTab.tsx` — `React.memo` + botões exemplos tênis
- `src/App.tsx` — `EXAMPLE_MAP` + `EXAMPLE_TAB` com `poi-tennis` e `poi-tennis-prop`
- `src/version.ts` — `0.6` → `0.7`

**Novos (v0.5, já commitados):**
- `src/lib/sgp/types.ts` — interfaces `SportModel`, `Outcome`, `Leg`, `SportInputs`, `ModelParams`
- `src/lib/sgp/football.ts` — modelo futebol extraído de `calcPoi` (interface `SportModel`)
- `src/lib/sgp/tennis.ts` — modelo tênis: Markov ponto→game→set→partida + MC + calibração
- `src/lib/sgp/monte-carlo.ts` — utilidades: `makeRng`, `gauss`, `jointProbMC`, `naiveProbMC`
- `src/lib/sgp/index.ts` — registry `SGP_REGISTRY`

## Arquivos-chave (atualizado)
- `src/lib/sgp/types.ts` — interfaces do sistema SGP multi-esporte
- `src/lib/sgp/tennis.ts` — modelo Markov tênis (pernas: matchWinner, totalGamesOver/Under, totalSetsOver/Under, setScore, firstSetWinner, tiebreakInMatch)
- `src/lib/sgp/football.ts` — modelo futebol (Poisson/Dixon-Coles, 20 pernas)
- `src/hooks/useCalculator.ts` — `calcPoi` (dispatcher) + `calcTennis` + `calcCombo` + etc
- `src/components/tabs/BetBuilderTab.tsx` — UI seletor esporte + pernas dinâmicas + `React.memo`
- `src/App.tsx` — `handleInputChange` (força ponto), `loadExample`, `resetTab`,
  `EXAMPLE_MAP`, `RAW_LIST_FIELDS`. `DEFAULT_INPUTS` contém só selects/flags (sem odds).
- `src/version.ts` — `APP_VERSION` (**0.7**).
- `src/hooks/useConfig.ts` — `DEFAULTS` (cap=0.05, floor=0.0025, edgemin=0.005);
  `migratePercent` converte localStorage legado (valores >1 → ÷100).
- `src/components/ConfigModal.tsx` — `fmtPct`/`parsePct` convertem cap/floor/edgemin
  entre decimal (armazenado) e pontos percentuais (exibido).
- `src/components/Sidebar.tsx` — desktop: `hidden md:flex` aside; mobile: bottom nav `md:hidden`.
- `src/components/ResultsDrawer.tsx` — mobile: `fixed inset-0 z-50`; desktop: `md:relative md:w-[400px]`.
- `src/components/VizSection.tsx` — só Monte Carlo em texto (gráficos removidos).