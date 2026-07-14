# Handoff — Régua de Kelly (Kelly Stake Pro)

> Última atualização: 2026-07-14 · Versão em produção: **v0.13**
> ✅ **typecheck e build limpos** — `tsc --noEmit -p tsconfig.app.json` sem erros; `vite build` gera artefatos (JS ~354 kB / 106 kB gzip). `typecheck-errors-v0.5.txt` está **obsoleto** (apagar).
> Memória detalhada do projeto: `memory/project_kelly.md` (índice em `memory/MEMORY.md`)
> Handoff do coletor de dados: `HANDOFF-coletor-shots-time.md` (fora do git, em `C:\Projetos\calculadora\`)

## TL;DR
Sessão fechada com **v0.13 em produção** (deploy Vercel ativo). O branch `feature/ui-redesign` foi mergeado em `main` (`--no-ff`, commit `ab4744b`) e o push em `main` disparou o auto-deploy. Entregues neste ciclo (v0.8→v0.13): redesign completo de UI (design system verde Kelly), refatoração da lógica de cálculo para `src/lib/calc.ts`, e ajustes de foco/bordas de card. **O backlog de código está esgotado** para ação (ver Pendências).

## Ambiente
- **Repo:** `MaverickDTX/calculadora`
- **Deploy:** `calculadora-gray-one.vercel.app` (auto-deploy a cada push em `main`, ~1 min)
- **App React:** `C:\Projetos\calculadora\project\` (raiz do repo). React 18 + TS + Vite + **Tailwind v4** (CSS-based, sem `tailwind.config.js` / `postcss.config.js`). Sem Supabase (integração removida em `f33ed72`).
- **Scripts de análise (Python):** `C:\Projetos\calculadora\` (raiz, **fora do git** — não versionados). Ex.: `estimar_beta_xg.py`.
- **Referência legada:** `regua-kelly-v14.html` (paridade de cálculo).
- Identidade git: MaverickDTX / matteblz@gmail.com

## Convenções do projeto (seguir)
1. **Versionamento** (`memory/feedback_versionamento.md`): fonte única em
   `src/version.ts` → `APP_VERSION`, formato `0.x`. **Um bump por sessão/entrega**
   (não por commit). Próxima entrega = **0.14**.
2. **Decimal = ponto** (formato das casas): a entrada força vírgula→ponto em todo
   campo de odd/linha (central em `handleInputChange` do `App.tsx`, exceto
   `RAW_LIST_FIELDS`). Manter esse padrão em campos novos.
3. **Fluxo:** `npm run typecheck` + `npm run build` limpos e **verificar no preview**
   (dev server) antes de commitar.
4. **Cores de foco/card (decidido em v0.13):** borda e anel de foco dos inputs/Select
   ficam **verde**; a **borda externa dos cards** (`.panel-focus`, `.stake-display`,
   `.quality-good`) fica **cinza** (sem verde persistente fora do foco). Dropdown de
   seleção usa **barra verde à esquerda** (não check) para não deslocar o texto.
5. Apagar `vite.config.ts.timestamp-*.mjs` antes de commitar (já no `.gitignore`).

## O que foi feito (v0.8 → v0.13, todos em `feature/ui-redesign`, mergeado em `main` em `ab4744b`)

### Redesign de UI (v0.12/v0.13)
- Design system "verde Kelly": paleta, glassmorphism residual, badges, tooltips, fonte do Select.
- Labels uppercase em campos; layout reestruturado das abas (BetBuilder, Combo, Asian, AUB, Props, Proxy, N Results).
- Loading states com skeleton nas abas pesadas.
- **Foco:** borda verde no foco do input/Select (Select usa `focus:!border-accent` para vencer o `hover` de mesma especificidade); anel de foco verde.
- **Dropdown (`Select.tsx`, compartilhado):** indicador de seleção = barra verde de 2px à esquerda (substituiu o `<Check>` verde que deslocava o texto; slot reservado em todas as linhas).
- **Cards:** borda externa de `.panel-focus`, `.stake-display` e `.quality-good` em cinza esmaecido (sem verde persistente fora do foco).

### Refatoração de cálculo (v0.8+)
- `src/hooks/useCalculator.ts` virou um **hook fino** (dispatch por `activeTab` + modo reactive/lazy com skeleton) que importa de `src/lib/calc.ts`.
- `src/lib/calc.ts` contém as funções puras por aba: `calcNres`, `calcProps`, `calcProxy`, `calcAub`, `calcCombo`, `calcPoi`, `calcAsia`.

### Correções
- Recuperação de index git corrompido (`.git/index.corrupt` → `git reset` restaurou o index a partir de `HEAD`).

## Pendências (numeradas de `project_kelly.md`)

### Abertas — BLOQUEADAS
- **#11 / #13 Pipeline de dados SOT/cartões** — coletor Python construído
  (`coletar_shots_time_sofasport.py`, fora do git): coleta shots/SOT + cartões via
  APIs de eventos. **Estagnado: cota de TODAS as APIs de odds/eventos estourou**
  (sem chave paga disponível). Falta: resolver quota (provider pago ou cache local
  estendido) **e** a decisão de calibração (base rate por liga/time, escada de odds).
  Sem previsão — não iniciar trabalho de código enquanto a quota não voltar.

### Fechadas / descartadas
- **Refatoração `useCalculator.ts` → `src/lib/calc.ts`** — ✅ **FEITO** no redesign
  (v0.8+). A entrada "antecipável" do HANDOFF v0.7 estava desatualizada.
- **#2 Resumo do ajuste λ/erro (paridade v14)** — ✅ **FEITO**: seção
  "Fluxo do ajuste" em `ResultView.tsx` resume fração/confiança/sensibilidade/
  divergência/pré-travas/piso/teto/edge mínimo. (O cálculo em si já tinha paridade
  com `regua-kelly-v14.html`; o resumo visual é o entregue.)
- **#10 Colapso de linha ao limpar campo do meio (A ou B / N Resultados)** — ⛔
  **decisão de NÃO implementar** (2026-07-14). Diagnosticado: AubTab separa A/B num
  `grid-cols-2` e seleções 3ª+ num bloco empilhado; NResultsTab usa `key={i}` em
  linhas de campo vírgula-join. Sem valor suficiente para justificar a refatoração.
- **#5 Binomial Negativa (cauda SOT)** — 🗑️ **descartado** (2026-07-14).
- **#14 Leitor de prints (bot Telegram / no app)** — 🗑️ **engavetado** por decisão
  do usuário. Reabrir só com gatilho; a refatoração `useCalculator.ts → calc.ts`
  (já feita) era o ganho reutilizável antecipável.

## Próximo passo recomendado
1. **Nenhum item de código acionável restante.** Backlog esgotado: tudo ou foi feito
   no redesign, ou está travado (API) ou descartado/engavetado.
2. Se a cota de API voltar no futuro, retomar **#11/#13** (coleta completa + calibração).
3. (Opcional / limpeza) Resolver o arquivo não rastreado `scripts/test-manual-task2.mjs`
   — versionar ou remover (está fora do último commit de redesign).

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

## Arquivos-chave (atualizado)
- `src/version.ts` — `APP_VERSION` (**0.13**).
- `src/lib/calc.ts` — funções puras de cálculo por aba (`calcNres`/`calcProps`/`calcProxy`/`calcAub`/`calcCombo`/`calcPoi`/`calcAsia`); o dispatcher vive em `useCalculator.ts`.
- `src/hooks/useCalculator.ts` — hook fino: dispatch por `activeTab` (reactive para abas leves, lazy+setTimeout(0) para abas pesadas com skeleton) + loading state.
- `src/components/Select.tsx` — combobox custom (Floating UI); foco `focus:!border-accent`; dropdown com barra verde à esquerda na seleção.
- `src/index.css` — `@import "tailwindcss"` + `@theme` (Tailwind v4); `.panel-focus`/`.stake-display`/`.quality-good` com borda cinza; `.input-dark` foco verde.
- `src/components/tabs/BetBuilderTab.tsx` — seletor esporte + pernas dinâmicas + `React.memo`.
- `src/App.tsx` — `handleInputChange` (força ponto), `loadExample`, `resetTab`, `EXAMPLE_MAP`, `RAW_LIST_FIELDS`. `DEFAULT_INPUTS` contém só selects/flags (sem odds).
- `src/hooks/useConfig.ts` — `DEFAULTS` (cap=0.05, floor=0.0025, edgemin=0.005); `migratePercent` converte localStorage legado (valores >1 → ÷100).
- `src/components/ConfigModal.tsx` — `fmtPct`/`parsePct` convertem cap/floor/edgemin entre decimal (armazenado) e pontos percentuais (exibido).
- `src/components/Sidebar.tsx` — desktop: `hidden md:flex` aside; mobile: bottom nav `md:hidden`.
- `src/components/ResultsDrawer.tsx` — mobile: `fixed inset-0 z-50`; desktop: `md:relative md:w-[400px]`.
- `src/components/VizSection.tsx` — só Monte Carlo em texto (gráficos removidos).
- `src/components/ResultView.tsx` — resultado; seção "Fluxo do ajuste" (resumo λ/erro, #2).
