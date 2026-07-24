# Handoff — Sheet de Resultado mobile (auditoria + drag-to-dismiss)

> Sessão de planejamento 2026-07-24 · Base: commit `3434958` (v0.17.3) + working tree
> Escopo: `src/components/ResultsDrawer.tsx`, `src/components/BottomNav.tsx`, `src/App.tsx`, `src/index.css`
> **Este arquivo é a ordem de execução.** Nenhum código foi alterado nesta sessão.

---

## Parte 1 — Achados da auditoria

Ordenados por severidade. Cada item tem arquivo:linha e a causa mecânica, não impressão visual.

### P0-1 · O `ResultView` é esmagado a ~50 px de altura dentro do sheet

**Onde:** `ResultsDrawer.tsx:36-60`

O container é `h-[60vh] flex flex-col`. Os filhos:

| # | filho | comportamento no flex |
|---|-------|----------------------|
| 1 | grabber (`:42`) | conteúdo (~14 px) |
| 2 | header (`:45`) | `shrink-0` (~53 px) |
| 3 | `<ResultView>` (`:57`) | `flex-1 overflow-y-auto` → é *scroll container*, então `min-height: auto` resolve para **0**: encolhe até sumir |
| 4 | wrapper do `<VizSection>` (`:58`) | `px-5 pb-6`, **sem `shrink-0` e sem `overflow`** → `min-height: auto` vale, **não encolhe abaixo do conteúdo** |

Consequência: o `VizSection` (Consenso entre métodos + Probabilidade justa, ~200–260 px para um 1X2) reserva a altura dele inteira, o header reserva a dele, e **todo o resto do orçamento vai para o `ResultView`, que é o único que cede**. Ele vira uma janelinha rolável.

Isso é exatamente o que o print mostra: o card de stake aparece cortado no meio (a barra "Porcentagem do Teto Kelly" não cabe), há um thumb de scroll interno, e as métricas / Decomposição / Fluxo do ajuste / avisos ficam atrás de um scroll de ~200 px que o usuário não percebe que existe.

**Correção:** o `VizSection` tem que ir **para dentro** da área rolável, não depois dela. Ou seja: o sheet passa a ter *um* scroll só, do header para baixo.

### P0-2 · Entre 768 px e 1023 px o sheet vira uma coluna órfã no fim da página

**Onde:** `App.tsx:154` vs. `ResultsDrawer.tsx:17`

Dois breakpoints diferentes decidem a mesma coisa:

- `App.tsx:154` → `isMobile = useMediaQuery('(max-width: 1023px)')` — decide **se o drawer é montado**.
- `ResultsDrawer.tsx:17` → `isMobile = useMediaQuery('(max-width: 767px)')` — decide **backdrop, focus trap, ESC e grabber**.
- As classes utilitárias do próprio painel (`:37`) usam prefixo `md:` (= 768 px).

Na faixa **768–1023 px** (iPad retrato 768/810/834, iPad Air 820, Surface 912) o drawer é montado *e* cai no ramo desktop: `md:relative md:inset-auto md:z-auto md:h-auto md:w-[400px]`. Como ele é irmão do `<div className="flex flex-1 overflow-hidden">` dentro de um `min-h-screen flex flex-col` (`App.tsx:284`), o resultado é um bloco de 400 px de largura **empilhado abaixo de toda a aplicação**, sem backdrop, sem ESC, sem focus trap, sem grabber — e o `<aside>` da direita continua escondido (`hidden lg:block`, `App.tsx:238`). O único jeito de fechar é o X.

**Correção:** um único breakpoint. Como o `<aside>` desktop entra em `lg` (1024) e o `App` monta o drawer abaixo de 1024, o `ResultsDrawer` deve ser **sheet puro** — apagar todos os `md:*` do `:37` e o `md:hidden` do grabber, e trocar o `useMediaQuery('(max-width: 767px)')` por `true` (ou remover a condicional, já que o componente só é montado em mobile). Alternativa mais conservadora: trocar `767px`→`1023px` e os prefixos `md:`→`lg:`. Prefiro a primeira: o componente hoje carrega uma segunda persona que ninguém mais usa.

### P1-1 · Nada respeita `env(safe-area-inset-bottom)`

**Onde:** `BottomNav.tsx:12` (`fixed bottom-0 h-14`), `ResultsDrawer.tsx:58` (`pb-6`), `index.css` (nenhuma ocorrência de `env(`)

Em iPhone com home indicator (e Android com barra de gestos) os últimos ~34 px da `BottomNav` ficam sob o indicador — os rótulos de 9 px (`BottomNav.tsx:38`) são os primeiros a serem comidos. O mesmo vale para o fim do conteúdo do sheet.

**Correção:** `padding-bottom: env(safe-area-inset-bottom)` na `BottomNav` (com `height: calc(3.5rem + env(safe-area-inset-bottom))`) e somar ao `pb` do conteúdo do sheet. Requer `viewport-fit=cover` no `<meta name="viewport">` do `index.html` — **conferir se já está lá**, o `index.html` está modificado no working tree.

### P1-2 · `60vh` deveria ser `dvh`

**Onde:** `ResultsDrawer.tsx:37`

`vh` no Safari iOS é sempre o *large viewport* (barra de endereço recolhida). Com a barra visível, `60vh` de altura ancorado em `bottom-0` empurra o topo do sheet para fora do que é de fato visível. `dvh` resolve. Também vale abandonar altura fixa: `h-[min(85dvh,var(--sheet-h))]` casa melhor com o drag (Parte 2).

### P2-1 · O indicador da aba ativa na `BottomNav` não tem pai posicionado

**Onde:** `BottomNav.tsx:39-41` — `<span className="absolute top-0 ...">` dentro de um `<button>` **sem `relative`**.

O bloco contentor vira a `<nav>` (`fixed`). O deslocamento horizontal ainda cai perto do botão porque o navegador resolve a *static position*, mas o `top-0` passa a referenciar a `nav`, não o botão. Funciona por acidente e quebra ao primeiro `padding` novo na nav.

**Correção:** adicionar `relative` ao `className` do `<button>` (`:25`).

### P2-2 · A animação de entrada não é de bottom sheet

**Onde:** `index.css:183` — `slideUp` é `translateY(12px)` + fade em 0.4 s.

12 px é micro-movimento de card; um sheet deve entrar de `translateY(100%)`. Como a Parte 2 vai introduzir `transform` controlado por gesto no mesmo elemento, essa animação precisa ser reescrita junto (ver spec) para não brigar com o `style.transform` do drag.

### P2-3 · Dois breakpoints de rolagem no `<main>`

**Onde:** `App.tsx:227` — `pb-20 md:pb-6`, com `BottomNav` em `md:hidden`. Coerente hoje. Só registrando que os dois estão acoplados: se a `BottomNav` mudar de breakpoint, esse `pb` muda junto.

### Não são problemas (verificados)

- **Cobertura de navegação:** `BottomNav` `md:hidden` (<768) → nav do `Topbar` `hidden md:flex xl:hidden` (768–1279) → `SideRail` `hidden xl:flex` (≥1280). Sem buraco.
- **Backdrop vs. Topbar:** `Topbar` é `sticky z-30`, backdrop é `z-40`, sheet `z-50`, `BottomNav` `z-30`. O backdrop cobre topbar e nav corretamente.
- **`prefers-reduced-motion`:** `index.css:257-267` já neutraliza `animate-fade-in` / `animate-slide-up` / `animate-pulse-soft` com `!important`.
- **`overscroll-behavior: contain`** já está no scroller do `ResultView` (`ResultView.tsx:22`) — impede scroll chaining para o body.

---

## Parte 2 — Sheet arrastável: viável, sem dependência nova

**Resposta curta: sim, e sem instalar nada.** Pointer Events + `transform` resolvem. `vaul` / `framer-motion` seriam ~15–40 kB gzip para um gesto de ~60 linhas — não se justifica num bundle que hoje tem 5 dependências de runtime (`package.json`).

### Por que o caso aqui é fácil

O conflito clássico de bottom sheet é *gesto de arrasto vs. scroll interno*: o usuário puxa para baixo com o conteúdo já rolado e o sheet fecha em vez de rolar. Aqui isso não acontece **se a zona de arrasto for só o grabber + o header**, que não rolam. É a decisão de design que elimina a máquina de estados inteira (`isAtScrollTop`, `lockAxis`, etc.).

Só use arrasto no corpo se quiser o comportamento premium (puxar de qualquer lugar quando `scrollTop === 0`). Recomendo **não** na primeira versão.

### Spec de implementação

**Estado** (dentro de `ResultsDrawer`):

```ts
const sheetRef = useRef<HTMLDivElement>(null);   // já existe via useDialog: reaproveitar `ref`
const dragStartY = useRef<number | null>(null);
const [dragY, setDragY] = useState(0);           // px, sempre >= 0
const [isDragging, setIsDragging] = useState(false);
```

**Handlers na zona de arrasto** (o wrapper do grabber, `:42`, estendido para envolver também o header `:45`):

1. `onPointerDown`: `e.currentTarget.setPointerCapture(e.pointerId)`, `dragStartY.current = e.clientY`, `setIsDragging(true)`.
2. `onPointerMove`: se `dragStartY.current === null` → sai. `const dy = e.clientY - dragStartY.current`. Resistência para cima: `setDragY(dy > 0 ? dy : dy / 4)` — dá feedback elástico sem deixar o sheet subir de verdade.
3. `onPointerUp` / `onPointerCancel`: decide e limpa.

**Regra de dispensa** — usar as duas, como iOS:

- **distância:** `dragY > alturaDoSheet * 0.28`, ou
- **velocidade:** `dragY / (performance.now() - tempoInicial) > 0.5` px/ms (flick rápido e curto também fecha).

Guardar `tempoInicial` num `useRef` junto com `dragStartY`.

**Se dispensa:** animar até `translateY(100%)` e só então chamar `onClose()` — senão o React desmonta e o sheet some sem transição. Padrão: `setDragY(alturaDoSheet)` com a transição ligada + `setTimeout(onClose, 220)`; ou `onTransitionEnd`. Prefira `onTransitionEnd` com um `setTimeout` de guarda (o evento não dispara se a transição for interrompida).

**Se não dispensa:** `setDragY(0)` com transição ligada (volta ao lugar).

**CSS do elemento** (`:37`/`:38`):

```tsx
style={{
  background: 'var(--color-surface-elevated)',
  transform: `translateY(${dragY}px)`,
  transition: isDragging ? 'none' : 'transform 220ms cubic-bezier(0.32, 0.72, 0, 1)',
}}
```

`transition: none` durante o arrasto é obrigatório — sem isso o dedo "arrasta borracha" com 220 ms de atraso.

**Obrigatório:** `touch-action: none` na zona de arrasto (via classe `[touch-action:none]`), senão o Chrome Android inicia o scroll da página e cancela o pointer no meio do gesto.

**Backdrop acompanhando** (opcional, barato e faz muita diferença): `opacity: 1 - Math.min(dragY / alturaDoSheet, 1)` no `div` do `:30`, com a mesma regra de `transition`.

### Interações com o que já existe

| Item | Impacto |
|---|---|
| `animate-slide-up` (`:37`) | **Conflita.** A animação escreve `transform` no mesmo elemento. Remover a classe do sheet e fazer a entrada pelo mesmo canal do drag: montar com `dragY = alturaDoSheet` e zerar num `requestAnimationFrame` (ou `useLayoutEffect`) logo após. |
| `useDialog` focus trap | **Sem impacto** se o grabber continuar `aria-hidden` e não focável. Não transformar o grabber em `<button>`: ele viraria o primeiro focável e roubaria o foco inicial (`useDialog.ts:64-66`), que hoje vai para o X. ESC e o X já cobrem teclado e leitor de tela — o gesto é enriquecimento tátil, não a única saída. |
| `prefers-reduced-motion` | O `!important` do `index.css:262-266` **não** atinge `transition` inline. Adicionar no bloco: `.sheet-draggable { transition: none !important; }` — ou verificar `matchMedia('(prefers-reduced-motion: reduce)')` no componente e pular a animação de saída, fechando direto. |
| P0-1 (VizSection) | **Fazer P0-1 antes.** Com o `VizSection` fora do scroller, a altura do sheet não é confiável e a régua de 28% fica inconsistente entre mercados com 2 e com 5 resultados. |
| Altura fixa `h-[60vh]` | Ler a altura real com `sheetRef.current.getBoundingClientRect().height` no `pointerDown` em vez de assumir `0.6 * innerHeight` — depois de P0-1 a altura pode virar `auto`/`max-h`. |

### Fora de escopo (não fazer agora)

- **Snap points** (60% → 90% ao arrastar para cima). Dobra a complexidade e ninguém pediu.
- **Arrasto pelo corpo com `scrollTop === 0`.** Só se o teste manual mostrar que arrastar pelo header é desconfortável de alcançar.

---

## Parte 3 — Ordem de execução sugerida

1. **P0-1** — mover `<VizSection>` para dentro do scroller do `ResultView` (ou dar `overflow` único ao sheet). Verificar nos dois temas.
2. **P0-2** — unificar breakpoint; apagar a persona desktop do `ResultsDrawer`.
3. **P1-2** — `60vh` → `dvh`.
4. **P1-1** — safe area (conferir `viewport-fit=cover` no `index.html`).
5. **P2-1** — `relative` no botão da `BottomNav`.
6. **Parte 2** — drag-to-dismiss + entrada de 100%.
7. `npm run typecheck` + `npm run build` limpos, preview em 375 px / 820 px / 1440 px, nos dois temas.
8. Bump de `APP_VERSION` (um por entrega) e commit **no Windows** (nunca `git add/commit` pelo sandbox neste repo).
