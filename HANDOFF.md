# Handoff — Régua de Kelly (Kelly Stake Pro)

> Última atualização: 2026-07-12 (3ª sessão) · Versão em produção: **v0.5**
> ✅ **typecheck e build limpos** — `tsc --noEmit -p tsconfig.app.json` sem erros; `vite build` gera artefatos (JS ~334 kB / 101 kB gzip). `typecheck-errors-v0.5.txt` está **obsoleto** (apagar).
> Memória detalhada do projeto: `memory/project_kelly.md` (índice em `memory/MEMORY.md`)
> Handoff do coletor de dados: `HANDOFF-coletor-shots-time.md` (fora do git, em `C:\Projetos\calculadora\`)

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
| `52a2da0` | **v0.5:** SGP multi-esporte — tênis (Markov + MC), refatoração calcPoi, seletor de esporte na UI |
| `(não commitado)` | **7 erros de typecheck corrigidos** (assinaturas `SportModel`, `Partial<Record>` no registry, imports não usados) → build limpo |
| `(não commitado)` | **Tênis:** `N_CAL` 2000→10000 (menos ruído no grid search da calibração); mensagem de fallback + `console.warn` quando `jointProb=0`. **N_SIM revertido a 20000** — ver diagnóstico abaixo |

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

## Próximo passo recomendado (v0.5 — tênis)
> **typecheck + build já estão limpos** (3ª sessão). A interface `SportModel` ficou com
> `jointProb(outcomes: Outcome[], legs: Leg[])` — implementações em `football.ts`/`tennis.ts`
> e chamadas em `useCalculator.ts` consistentes com `outcomes`. **Ainda não commitado.**

1. **Commitar** as mudanças não commitadas como **v0.6** (bump um por entrega): correção
   de typecheck/build + reversão N_SIM + diagnóstico. Apagar `typecheck-errors-v0.5.txt` (obsoleto).

2. **Validar futebol existente**: testar exemplos (Over + Casa vence, Prop jogador) no app em
   dev (`npm run dev`) para garantir que a refatoração SGP não quebrou nada.

3. **Terminar tênis**: testar com dado real da bet365 (ex.: Djokovic @1.33 / Alcaraz @3.50,
   O/U 22.5 games @1.85/1.95). **Nota:** combinações de pernas contraditórias (ex.: vencer 3-0
   ∧ Over muitos games) retornam `jointProb=0` por design — a mensagem de fallback cobre isso.

4. **Fase 2 — Basquete** (quando retomar): modelo Normal Bivariada + Monte Carlo em `src/lib/sgp/basketball.ts`.

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

## Handoff v0.5 — SGP multi-esporte (arquivos novos/modificados)
**Novos:**
- `src/lib/sgp/types.ts` — interfaces `SportModel`, `Outcome`, `Leg`, `SportInputs`, `ModelParams`
- `src/lib/sgp/football.ts` — modelo futebol extraído de `calcPoi` (interface `SportModel`)
- `src/lib/sgp/tennis.ts` — modelo tênis: Markov ponto→game→set→partida + MC + calibração
- `src/lib/sgp/monte-carlo.ts` — utilidades: `makeRng`, `gauss`, `jointProbMC`, `naiveProbMC`
- `src/lib/sgp/index.ts` — registry `SGP_REGISTRY`

**Modificados:**
- `src/hooks/useCalculator.ts` — `calcPoi` despacha por esporte; adiciona `calcTennis`; imports SGP
- `src/components/tabs/BetBuilderTab.tsx` — seletor de esporte + inputs/legs futebol/tênis
- `src/version.ts` — `0.4` → `0.5`

## Arquivos-chave (atualizado)
- `src/lib/sgp/types.ts` — interfaces do sistema SGP multi-esporte
- `src/lib/sgp/tennis.ts` — modelo Markov tênis (pernas: matchWinner, totalGamesOver/Under, totalSetsOver/Under, setScore, firstSetWinner, tiebreakInMatch)
- `src/lib/sgp/football.ts` — modelo futebol (Poisson/Dixon-Coles, 20 pernas)
- `src/hooks/useCalculator.ts` — `calcPoi` (dispatcher) + `calcTennis` + `calcCombo` + etc
- `src/components/tabs/BetBuilderTab.tsx` — UI seletor esporte + pernas dinâmicas
- `typecheck-errors-v0.5.txt` — 7 erros de typecheck a corrigir na próxima sessão
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
