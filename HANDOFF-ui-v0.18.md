# Handoff — Correções de integridade e layout (v0.18)

> Planejamento 2026-07-24 · Base: commit `09635fb` (v0.17.4) · `tsc --noEmit` limpo nessa base
> Origem: revisão do sheet mobile (ver `HANDOFF-mobile-sheet.md`) + auditoria da tela desktop ultrawide
> **Este arquivo é a ordem de execução.** Nada foi editado na sessão de planejamento.

Duas frentes: **A. integridade** (a UI está exibindo dado que não corresponde ao cálculo) e **B. pendências da rodada anterior** (regressão de acessibilidade introduzida no `09635fb`). A frente A tem prioridade sobre qualquer polimento visual.

---

## A1 · P0 — O painel "Decomposição & Distribuição" exibe dado fabricado

**Onde:** `src/components/tabs/NResultsTab.tsx:189-209`

```tsx
<div className="h-3 bg-accent rounded" style={{ width: '38%' }} title="Casa (38%)"></div>
<div className="h-3 bg-warn   rounded" style={{ width: '28%' }} title="Empate (28%)"></div>
<div className="h-3 bg-danger rounded" style={{ width: '34%' }} title="Fora (34%)"></div>
```

Larguras e rótulos são literais, renderizados sempre que `hasOddsFilled`, **independentes do mercado e do cálculo**. Com o mercado em Over/Under 1.95 / 1.95 (duas vias, 50/50) o painel afirma Casa 38% / Empate 28% / Fora 34%.

Três agravantes que tornam isso pior que um gráfico ausente:

1. O `<VizSection>` renderiza, na mesma tela e logo abaixo, a distribuição **correta** a partir de `result.fairProbabilities`. As duas se contradizem.
2. O painel falso tem mais peso visual — largura total, três cores, legenda.
3. O cabeçalho `Consenso: Automático` (`:194-196`) vem de `config.method`, dado real. A moldura é verdadeira e o conteúdo não, então não há como o usuário suspeitar.

### Restrição de arquitetura

`NResultsTab` **não recebe `result`** — o `App.tsx:206` passa apenas `{...common} config={config}`, e `common` não inclui o resultado do cálculo. Não existe fonte de verdade dentro desse componente para preencher a barra. Ligar o painel exigiria propagar `result` para a aba, o que duplicaria uma visualização que o `VizSection` já faz melhor.

### Correção — deletar o painel

Apagar `NResultsTab.tsx:189-209` inteiro. Junto: remover o `config` das props se ele ficar sem uso (conferir — `config.method` é usado só ali), e limpar o import correspondente no `App.tsx:206`.

O `VizSection` já cobre a função. O que ele precisa é dos rótulos reais — ver A2.

**Não** substituir por um placeholder "em breve". Painel vazio é honesto; painel com número inventado não.

## A2 · P1 — O painel verdadeiro usa rótulos genéricos

**Onde:** `src/components/VizSection.tsx:63`

```ts
const label = result.label === 'Props Sim/Não'
  ? (index === 0 ? 'Lado apostado' : 'Lado contrário')
  : index === 0 ? 'Resultado avaliado' : `Resultado ${index + 1}`;
```

Deriva o rótulo do índice. Num Over/Under aparece "Resultado avaliado" / "Resultado 2" quando os nomes corretos — `Over` / `Under` — já existem em `NResultsTab.tsx:22-29` (`outcomeLabels`), mas presos ao componente de entrada.

**Correção:** levar os rótulos para dentro do resultado.

1. `src/types.ts` — `BetResult` ganha `outcomeLabels?: string[]`.
2. `src/lib/calc.ts` — `calcNres` preenche `outcomeLabels` a partir de `inputs['nres-type']`, usando o mesmo mapa. **Mover o mapa `outcomeLabels` de `NResultsTab.tsx:22-29` para `src/lib/` e importar nos dois lados**, para não criar duas cópias que divergem.
3. `VizSection.tsx:63` — `result.outcomeLabels?.[index] ?? <fallback atual>`.

Mantém o fallback: as outras abas (`props`, `proxy`, `aub`, …) não populam o campo e continuam funcionando.

## A3 · P1 — `vv0.17.4` no cabeçalho

**Onde:** `src/version.ts` exporta `'v0.17.4'`; `src/components/Topbar.tsx:38` renderiza `v{APP_VERSION}`.

Correção: tirar o `v` da constante (`export const APP_VERSION = '0.18'`) e manter o prefixo no ponto de renderização. Esse lado é melhor porque a constante também serve a contextos onde o prefixo atrapalha.

`src/components/Sidebar.tsx:40` tem o mesmo `v{APP_VERSION}` — mas **`Sidebar.tsx` não é importado por ninguém** (`grep` não acha nenhum `<Sidebar`). É código morto desde o overhaul do Topbar/SideRail. Apagar o arquivo em vez de corrigir.

## A4 · P1 — `AlertTriangle` em mensagens positivas

**Onde:** `src/components/tabs/NResultsTab.tsx:157`

O ícone é fixo nos quatro estados do alerta de overround, mas a cor já é condicional (`:150-155`). Resultado: "Mercado Saudável — parâmetros normais de de-vig" e "Margem Negativa / Arbitragem" (que é notícia ótima) aparecem com triângulo de perigo.

**Correção:** ícone condicional na mesma régua da cor —

| `sumProb` | estado | ícone |
|---|---|---|
| `> 1.20` | erro de linha | `AlertTriangle` |
| `> 1.10` | margem salgada | `AlertTriangle` |
| `< 1.00` | arbitragem | `Sparkles` ou `TrendingUp` |
| resto | saudável | `CheckCircle2` |

## A5 · P1 — A barra do Teto Kelly fica vermelha quando o sistema acerta

**Onde:** `src/components/ResultView.tsx:86-95`

```tsx
(gs.pct / config.cap) * 100 >= 90 ? 'bg-danger' :
(gs.pct / config.cap) * 100 >= 60 ? 'bg-warn'   : 'bg-accent'
```

Bater 100% do teto significa **stake máxima liberada** — o teto é o mecanismo de proteção, e encostar nele é o sistema operando como projetado. A escala atual foi importada de uma régua onde "barra cheia = risco", que não se aplica. Na tela do print convivem o selo verde "Aprovada" e uma barra vermelha a 100%, dois sinais de cor opostos sobre o mesmo fato.

**Correção:** a barra representa *aproveitamento do teto*, não risco — usar `bg-accent` em toda a faixa. Se quiser marcar o limite, um tique fino na posição 100% (`border-r`) comunica "encostou no teto" sem semântica de perigo.

Se houver desacordo sobre isso, é decisão de produto e não minha — mas as duas cores não podem coexistir contando histórias diferentes.

---

## B · Pendências do `09635fb` (rodada anterior)

### B1 · P0 — ESC e focus trap estão desligados

**Onde:** `src/components/ResultsDrawer.tsx:107-109`

```tsx
<div {...dialogProps} ref={sheetRef} …>
```

`dialogProps` **contém `ref`** (`useDialog.ts:83-89`). Como `ref={sheetRef}` vem depois do spread, sobrescreve o do hook; `ref.current` fica `null` e os dois efeitos do `useDialog` abortam no `if (!el) return`. O listener de `keydown` nunca é anexado.

Efeito: **o sheet não fecha mais com ESC e o foco não fica preso dentro dele**, enquanto anuncia `role="dialog" aria-modal="true"`. Passa no typecheck porque é type-válido; só falha em uso.

```tsx
const { ref: dialogRef, dialogProps } = useDialog<HTMLDivElement>({ … });
const setRefs = useCallback((node: HTMLDivElement | null) => {
  sheetRef.current = node;
  (dialogRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
}, [dialogRef]);
// …
<div {...dialogProps} ref={setRefs} …>
```

**Teste manual obrigatório:** abrir o sheet, apertar ESC (deve fechar), e dar Tab até o fim (o foco deve voltar para o primeiro elemento do sheet, não escapar para a página).

### B2 · P1 — A zona de arrasto tem ~22 px

**Onde:** `src/components/ResultsDrawer.tsx:118-127`

Os handlers estão só no wrapper do grabber: `pt-2 pb-1` sobre uma alça de 4 px ≈ 22 px de altura — metade do mínimo de toque de 44 px. Funcionou no mouse (relatado), mas o mouse mira com precisão de 1 px; o polegar não.

O próprio código mostra a intenção original: o guard `target.closest('button')` no `onPointerDown` (`:65`) só faz sentido se o **header** estivesse arrastável — é ele que contém o X. Hoje o guard é código morto.

**Correção:** envolver grabber + header num só wrapper e mover os quatro handlers (`onPointerDown/Move/Up/Cancel` + `touchAction: 'none'`) para ele. O guard passa a fazer o trabalho dele e a área vai para ~75 px.

### B3 · P1 — Safe area da `BottomNav` está pela metade

**Onde:** `src/components/BottomNav.tsx:12`

A altura cresceu (`h-[calc(3.5rem+env(safe-area-inset-bottom))]`) mas não entrou `padding-bottom`. Com `items-stretch`, os botões esticam para os ~90 px inteiros e o conteúdo, que é `justify-center`, **desce ~17 px**: o rótulo de 9 px termina a ~29 px do fundo, dentro da faixa de 34 px do home indicator — na área de gesto do sistema.

**Correção:** adicionar `pb-[env(safe-area-inset-bottom)]` à `<nav>`. A linha de flex volta a ter 3,5 rem reais e o conteúdo sobe para fora da faixa. (`viewport-fit=cover` já está no `index.html:9`. ✔)

### B4 · P2 — `min(70dvh, 85dvh)` é tautologia

**Onde:** `src/components/ResultsDrawer.tsx:112` — `min(70dvh, 85dvh)` ≡ `70dvh`.

Trocar por `height: auto; maxHeight: 85dvh`. Com o scroll unificado (feito em `09635fb`) isso passa a valer a pena: um estado de erro ou um resultado curto deixa de ocupar 70% da tela à força. **Se fizer isso, medir a altura real no `pointerDown`** — o limiar de dispensa de 35% já usa `getBoundingClientRect`, então continua correto, mas confirme no teste com um resultado curto e um longo.

### B5 · P2 — O backdrop dá salto ao soltar

**Onde:** `src/components/ResultsDrawer.tsx:103` — `opacity: isDragging ? … : undefined`.

Ao soltar, o estilo inline some e a opacidade pula para 1 instantaneamente, ignorando a `transition` declarada logo abaixo. Acontece tanto no snap-back quanto na saída. Guardar o último valor em estado até o `onClose` (ou manter `opacity` sempre controlado, com `1` como valor de repouso).

### B6 · P2 — Leitura de layout a cada `pointermove`

**Onde:** `src/components/ResultsDrawer.tsx:49-53` — `useEffect` sem array de dependências chamando `getBoundingClientRect()`.

Roda depois de **todo** render; durante o arrasto, cada `pointermove` dispara `setDragY` → render → leitura forçada de layout. Risco de jank em Android modesto (invisível no desktop, que é onde foi testado).

**Correção:** `useLayoutEffect` com `[]` + listener de `resize`. A altura não muda durante o gesto — `translateY` não altera `height`.

### B7 · P2 — `pb-20` fantasma dentro do sheet

**Onde:** `src/components/ResultView.tsx:22` — `md:pb-5 pb-20`.

Os 80 px existem para liberar a `BottomNav`, mas dentro do sheet a nav está coberta pelo backdrop `z-40` — viram vazio no fim do scroll. E entre 768 e 1023 px o `md:pb-5` derruba para 20 px, embora o sheet seja usado nos dois casos. O que o sheet precisa ali é `env(safe-area-inset-bottom)`, não altura de nav: `pb-[calc(1.25rem+env(safe-area-inset-bottom))]`.

Atenção: `ResultView` é compartilhado com o `<aside>` desktop (`App.tsx:257`), que entra em `lg`. Conferir os dois usos.

---

## C · P2 — Calibragem do layout ultrawide

Nenhum destes é bug; são decisões que foram tomadas para uma coluna de 400 px e invertem de sinal em 2600 px. Fazer só depois de A e B.

1. **Cards famintos.** "Mercado" tem um único select e ~120 px de vazio; "Odd da sua aposta" idem. Numa grade de altura igual, a coluna mais pobre define o buraco. Os dois cabem numa coluna, ou os campos podem subir para um cabeçalho de mercado em linha única.
2. **Accordions fechados por padrão.** Quatro somam ~240 px de cromo mostrando nada, num layout com sobra vertical. A regra `defaultOpen={false}` (`ResultView.tsx:121-150`) foi decidida para a coluna estreita. Abrir "Decomposição" e "Fluxo do ajuste" a partir de `xl`.
3. **Célula órfã** na segunda linha das métricas — 5 cards em `grid-cols-2 sm:grid-cols-3` (`ResultView.tsx:112`). Ou `xl:grid-cols-5` numa linha só, ou promover uma sexta métrica.
4. **Legenda com `justify-between`** — se A1 for executado o painel some e isso deixa de existir. Registrado caso o painel volte com dado real: em 1450 px o `justify-between` joga os itens para cantos opostos e quebra a associação legenda↔segmento. Legenda colada ao gráfico, ou rótulo dentro do segmento.

---

## Ordem de execução

1. **A1** (deletar painel falso) — maior ganho, menor risco.
2. **B1** (ref/ESC) — regressão de acessibilidade em produção.
3. **A3** (`vv` + apagar `Sidebar.tsx` morto), **A4** (ícone), **A5** (cor da barra) — os três são de poucas linhas.
4. **B2**, **B3** — mobile real; exigem teste em aparelho ou emulação de toque, não mouse.
5. **A2** (rótulos reais no `VizSection`) — toca `types.ts` + `calc.ts`, fazer isolado.
6. **B4**–**B7**, depois **C**.

## Verificação antes de commitar

- `npm run typecheck` e `npm run build` limpos.
- **Preview em 375 px, 820 px, 1440 px e 2560 px, nos dois temas** (Ink e Ivory) — a faixa 820 px foi a que quebrou na rodada passada.
- **Toque emulado, não mouse** para B2: DevTools em modo dispositivo, com `touch` ativo.
- ESC fecha o sheet; Tab circula preso dentro dele (B1).
- Trocar o tipo de mercado (1X2 → Over/Under → Ambas marcam) e conferir que os rótulos do `VizSection` acompanham (A2) e que nenhuma barra sobrevive com número fixo (A1).
- Bump de `APP_VERSION` para `0.18` (um bump por entrega) e commit **no Windows** — nunca `git add/commit` pelo sandbox neste repo.
