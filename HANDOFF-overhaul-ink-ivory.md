# Handoff — Overhaul visual "Ink & Ivory" (v0.15)

> Escrito em 2026-07-17, sobre o estado **v0.14 em produção** (ver `HANDOFF.md`).
> Branch sugerida: `feature/ink-ivory` a partir de `main`.
> **Matemática, hooks e tipos intocados**: nenhuma alteração em `src/lib/**`, `src/hooks/**`, `src/types.ts`. Este overhaul é 100% casca: tokens, tipografia, navegação, layout e apresentação do resultado.

## 0. Contexto e decisões fechadas (não reabrir)

O usuário considera a UI atual um "Frankenstein" acumulado. Decisões tomadas com mockups aprovados:

1. **Linguagem única "Ink & Ivory", dois temas.** Ink (dark monocromático quente) é o **default**; Ivory (light editorial de papel) é o tema claro. Mesmos componentes, mesmos tokens — o tema troca só os valores via `[data-theme="ivory"]`.
2. **Tipografia nova**: Schibsted Grotesk (UI/sans), **Newsreader** (serif display — usada nos DOIS temas: valor da stake, título do sub-header, quotes), Geist Mono mantida (todos os números/dados).
3. **Verde vira semântica, não decoração.** No Ink o verde aparece dessaturado (`#4CBF95`) e restrito a: acento de interação (foco, pill ativa, botão primário), EV positivo e barra de stake. No Ivory o acento é verde-garrafa (`#1E5B4A`). Fora isso, monocromo.
4. **Navegação**: Sidebar sai do render; entra **Topbar fixa com pills + Command Palette (⌘K)**. Mobile: topbar só com brand + botão que abre a palette full-screen (sem bottom-nav).
5. **Resultado inline no desktop**: split de 2 colunas em `≥lg`, com `ResultView` + `VizSection` sticky na coluna direita. `ResultsModal` deixa de ser usado no desktop; no mobile o resultado abre em bottom-sheet (reaproveitar padrão do `ResultsDrawer`).
6. Zero gradientes, zero glow, zero glassmorphism residual — remover `.text-gradient*`, `shadow-glow` e afins. Profundidade = escada de superfícies + hairlines (princípio já vigente, agora sem exceções).

## 1. Tokens — reescrever o `@theme` de `src/index.css`

Manter a arquitetura atual (Tailwind v4 CSS-based, aliases de compatibilidade). Substituir os **valores**. Os nomes de variáveis existentes (`--color-surface-1..4`, `--color-hairline*`, `--color-text-*`, `--color-accent*`, aliases `--color-border`, `--color-surface`, `--color-kelly`, `--color-warn`) são consumidos pelo código — **preservar todos os nomes**, mudar só os hex.

### Ink (default, `:root`)

```css
--color-canvas:          #0E0E0F;   /* neutro quente, não azulado */
--color-surface-1:       #151517;
--color-surface-2:       #1A1A1D;
--color-surface-3:       #202024;
--color-surface-4:       #26262B;

--color-hairline:        #232326;
--color-hairline-strong: #2E2E33;
--color-hairline-tert:   #3A3A3E;

--color-text-primary:    #F4F3F1;   /* branco quente */
--color-text-secondary:  #C9C8C4;
--color-text-muted:      #85858B;  /* #7C7C82 media 4,4:1 sobre surface-1 — abaixo de AA */
--color-text-tertiary:   #5A5A60;

--color-accent:          #4CBF95;   /* verde-Kelly dessaturado p/ dark */
--color-accent-hover:    #63D3AA;
--color-accent-soft:     rgba(76,191,149,0.12);
--color-border-focus:    #4CBF95;

--color-semantic-up:     #4CBF95;
--color-semantic-down:   #E06055;
--color-warning:         #D9A144;
--color-danger:          #E06055;
--color-info:            #6C9ECF;
```

### Ivory (`:root[data-theme="ivory"]`)

```css
--color-canvas:          #F7F4EE;   /* papel, não branco puro */
--color-surface-1:       #FFFFFF;
--color-surface-2:       #FBF9F5;
--color-surface-3:       #F2EEE6;
--color-surface-4:       #EDE8DE;

--color-hairline:        #E5DFD3;
--color-hairline-strong: #D8D1C2;
--color-hairline-tert:   #C8C0AE;

--color-text-primary:    #1B1917;
--color-text-secondary:  #45413B;
--color-text-muted:      #6E675C;
--color-text-tertiary:   #9A9285;

--color-accent:          #1E5B4A;   /* verde-garrafa */
--color-accent-hover:    #17493B;
--color-accent-soft:     #E8F0EC;
--color-border-focus:    #1E5B4A;

--color-semantic-up:     #1E5B4A;
--color-semantic-down:   #A63D33;
--color-warning:         #8A6116;
--color-danger:          #A63D33;
--color-info:            #2F5D8A;
```

Notas de implementação:
- `color-scheme` deve acompanhar o tema (`dark` no Ink, `light` no Ivory) — hoje está fixo em `html { color-scheme: dark }`.
- Os *-soft/*-border das cores semânticas seguem a fórmula atual (12% alpha / 25% alpha) recalculada sobre os novos hex.
- Badges Notion multicoloridas (`--color-purple`, `--color-pink`, `--color-teal`…): **remover as não usadas**; auditar uso real com grep antes. A direção é monocromo + semântica.
- `theme-color` do `index.html`: `#0E0E0F` (e considerar `<meta name="theme-color" media="(prefers-color-scheme…)">` se trivial; senão fixo no Ink).
- Dark deixa de ser preto puro `#010102` → verificar se algum componente assume canvas ~preto (ex.: overlays com alpha).

## 2. Tipografia

`index.html`: trocar carga de fontes para Google Fonts: `Schibsted Grotesk:wght@400;500;600` + `Newsreader:opsz,wght@6..72,400;6..72,500;6..72,400italic` + manter Geist Mono.

```css
--font-sans:    'Schibsted Grotesk', system-ui, sans-serif;
--font-display: 'Newsreader', Georgia, serif;   /* passa a ser a serif */
--font-serif:   'Newsreader', Georgia, serif;   /* substitui Lyon Text */
--font-mono:    'Geist Mono', 'JetBrains Mono', monospace;
```

Papéis (onde a serif entra — e onde NÃO entra):
- **Newsreader 500**: valor da stake no `.stake-display` (o número protagonista), título do sub-header contextual (h1 do header), `.quote`.
- **Schibsted Grotesk**: todo o resto da UI — labels, botões, pills, corpo.
- **Geist Mono**: inalterada — todos os números de dados (odds, %, metric-values, inputs). A regra atual do `@layer utilities` (`.text-number, .mono, .stake-value…`) precisa de ajuste: **retirar `.stake-value` do grupo mono** (vira Newsreader) e manter `font-variant-numeric: tabular-nums` nela mesmo assim.
- Body `font-size` sobe de 14px para 15px (Schibsted renderiza menor que Inter); revisar se nada estoura.

## 3. Navegação — Topbar + Command Palette

### 3.1 `src/components/Topbar.tsx` (novo)
- `h-14`, sticky top, `bg-[var(--color-canvas)]` com `border-b` hairline. **Sem glass/blur** (decisão: flat).
- Esquerda: brand (logo quadrado `bg-accent` + "Kelly Stake Pro" + versão `APP_VERSION` em mono 10px).
- Centro: pills dos 7 mercados (mesmos `TABS` hoje em `Sidebar.tsx` — copiar array com ícones lucide). Pill: `h-9 px-3.5 rounded-full`, ícone 14px + label; scroll horizontal com fade nas bordas se faltar largura. Ativa: `bg-accent-soft text-accent` + `ring-1` accent 40%; sem glow.
- Direita: botão config (mostra `Kelly {frac}× · R$ {bank}` como o header atual) + `kbd` "⌘K" discreto.
- Acessibilidade: `role="tablist"`/`aria-selected` como a Sidebar atual; foco visível por anel accent; navegação por setas ←→ entre pills (padrão tablist).
- Mobile (`<md`): só brand + botão de menu (abre a palette). Pills escondidas.

### 3.2 `src/components/CommandPalette.tsx` (novo)
- Modal centralizado `max-w-lg` (full-screen no mobile), `surface-2`, hairline, `shadow-float`; backdrop `rgba(0,0,0,0.6)` (Ink) / `rgba(27,25,23,0.35)` (Ivory) — usar token, não hex fixo.
- Conteúdo: input de busca + lista dos 7 mercados (ícone, label, descrição de 1 linha — reaproveitar `TAB_LABELS[..].sub` do `App.tsx`) + item "Configurações".
- Atalhos: `⌘K`/`Ctrl+K` abre/fecha, `↑↓` navega, `Enter` seleciona, `Esc` fecha. Filtro por substring case/acento-insensitive.
- Item ativo: barra vertical accent 2px à esquerda (mesmo padrão do `Select.tsx` atual — consistência deliberada).
- Usar `useDialog.ts` existente se aplicável (focus trap/escape); senão, `<dialog>` nativo como nos modais atuais.

### 3.3 `Sidebar.tsx`
- Remover do render em `App.tsx`. Arquivo permanece no repo (não deletar).

## 4. Layout do `App.tsx`

- Estrutura vira `flex-col`: `<Topbar>` → sub-header contextual → conteúdo.
- Sub-header: título da aba em **Newsreader** (~22px) + subtítulo muted; à direita, nada (config já está na topbar).
- Conteúdo `≥lg`: `grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6`, container `max-w-6xl mx-auto`.
  - Coluna esquerda: `{tabContent}` (formulários das abas — sem mudança interna além da pele).
  - Coluna direita: `sticky top-[calc(3.5rem+1px)]` com `ResultView` (quando há `result`) + `VizSection` abaixo, em coluna com scroll próprio se exceder viewport.
- `<lg`: uma coluna, como hoje.

## 5. Apresentação do resultado

- **Desktop**: `handleCalculate` deixa de abrir `ResultsModal`; o resultado renderiza inline na coluna direita. Estado vazio da coluna: card tracejado discreto "Preencha e calcule" (sem ilustração). Scroll suave até a coluna se necessário em viewport curto.
- **Mobile**: `handleCalculate` abre bottom-sheet com `ResultView` + `VizSection` (base: `ResultsDrawer.tsx`, que já renderiza `ResultView` com `useDialog` + `useMediaQuery` mobile — verificado em 2026-07-17; falta só incluir `VizSection` e a pele nova).
- `ResultsModal.tsx`: sai do render (arquivo permanece).
- `ResultView.tsx`: re-skin apenas — `.stake-display` com valor em Newsreader; hierarquia atual (grid duplo de stake, metric cards, "Fluxo do ajuste") permanece.
- `VizSection` (UncertaintyBand, FairProbabilities, MonteCarlo): re-skin de cores via tokens; sem mudança funcional.

## 6. Componentes a re-skinar (só pele, via `@layer components`)

`.panel`, `.input-dark`, `.btn-primary` (texto `--color-canvas` sobre accent no Ink — verificar contraste, ver §8), `.btn-ghost`, `.metric-card`, `.tag*`, `.tooltip`, `.panel-collapsible`, `Select.tsx`, `ConfigModal.tsx`, `Toast.tsx`, `SkeletonResult.tsx`, `HelpTip.tsx`. Manter as decisões v0.13 que continuam válidas: foco accent nos inputs/Select, borda externa de cards neutra, barra à esquerda no dropdown.

Remover: `.text-gradient`, `.text-gradient-green/warn/danger`, `--shadow-glow`, `shadow-hero-mockup` (auditar uso com grep antes de apagar).

## 7. Toggle de tema

- `useConfig.ts` **não muda**. Tema é estado próprio: `localStorage['ks-theme']` (`'ink' | 'ivory'`), default `'ink'`; aplicar `data-theme` no `<html>` num efeito no `App.tsx` (ou mini-hook local `useTheme` dentro de `App.tsx` — sem criar arquivo em `src/hooks/`, que está fora de escopo).
- UI do toggle: segmented control no `ConfigModal` ("Escuro · Claro") + item "Alternar tema" na Command Palette.
- Sem flash: script inline de 3 linhas no `index.html` lendo o localStorage antes do paint.

## 8. Critérios de aceite

1. `npm run typecheck`, `npm run build`, lint e `verify-engine`/`verify-basketball` limpos.
2. **Contraste WCAG AA nos DOIS temas** — pares principais já medidos (luminância relativa WCAG): `#4CBF95`/`#0E0E0F` = 8,45:1, `#1E5B4A`/`#FFFFFF` = 7,92:1, primary/canvas Ink = 17,4:1 — todos passam AA normal. Ponto de atenção: text-muted (por isso o hex ajustado para `#85858B`) e re-medir qualquer hex que o agente altere. Auditar também texto sobre `btn-primary` e tags semânticas.
3. Teclado: ⌘K, tablist com setas, focus trap na palette e no bottom-sheet, `Esc` em tudo.
4. `prefers-reduced-motion` respeitado nas animações novas (palette fade/scale).
5. Mobile: campos Handicap/ρ mantêm `inputMode="text"` (teclado com sinal negativo — não regredir); decimal vírgula→ponto central intocado.
6. Sem `ResultsModal` no fluxo desktop; resultado inline funcional nas 7 abas.
7. Verificação visual no preview nos dois temas antes de commitar (convenção do projeto).

## 9. Fases sugeridas (commits)

1. `feat(tokens)`: novo `@theme` Ink + bloco Ivory + fontes + toggle (app ainda com Sidebar — já navegável nos 2 temas).
2. `feat(nav)`: Topbar + CommandPalette, Sidebar fora do render, novo layout do App.
3. `feat(result)`: resultado inline + bottom-sheet mobile, ResultsModal fora do render.
4. `refactor(skin)`: re-skin dos componentes restantes + remoção de utilities mortas.
5. Bump `APP_VERSION` → `0.15` (um bump só, no fim), apagar `vite.config.ts.timestamp-*`.

## 10. Avisos operacionais

- Git de escrita (add/commit/reset) **sempre no Windows**, nunca via sandbox (histórico de index corrompido).
- Push para `main` dispara deploy Vercel — push é decisão do Matheus, não do agente.
- Diffs podem mostrar CRLF/nulos fantasma pelo mount fuse; usar `git diff --ignore-all-space` para conferência.

## 11. Correções pós-preview (verificação visual de 2026-07-17, localhost:5174, Chrome/Windows)

### P0 — bugs
1. **Select vaza o dark no Ivory.** O trigger do `Select.tsx` ("Tipo do mercado" → "1X2 / Moneyline") renderiza com fundo cinza-escuro e texto claro dentro do form de papel. Causa provável: alguma variável usada pelo Select (ex.: alias tipo `--color-surface-hover`) definida só no `@theme` Ink e **ausente do bloco `[data-theme="ivory"]`** — qualquer var não sobrescrita vaza o valor dark. Correção estrutural: diffar a lista de variáveis do `@theme` contra o bloco Ivory e garantir cobertura 1:1 (não corrigir só o Select).
2. **Ctrl+K não abre a Command Palette.** Testado em Chrome/Windows com foco fora de input: nada renderiza. Verificar o listener (`e.key === 'k'` com `metaKey || ctrlKey`? `keydown` no `window`? `preventDefault` para não disparar o search do browser?) e se o componente está montado. Testar também o clique no badge ⌘K da topbar.
3. **Estado vazio mostra erro.** Com campos vazios (primeiro load e após "Limpar"), a coluna direita exibe o card vermelho "Erro no cálculo · Preencha o resultado 1…". O handoff (§5) pedia card tracejado neutro "Preencha e calcule"; erro vermelho só depois de interação do usuário com o form ou clique em Calcular. Sugestão: tratar `result.err` como vazio quando os campos da aba ativa estão todos vazios (ou flag "touched" por aba).

### P0 — código morto
0. **Remover o campo "Odd justa estimada" da aba Combinada.** `ComboTab.tsx` (~L138-141): é um `<input readOnly tabIndex={-1} placeholder="—">` sem binding — nunca preenche, nunca preencheu. A informação já existe no resultado (metric card "Odd justa" = 1/`jointDef` de `calcCombo`, e a decomposição traz a conjunta nas 4 escalas). Ao remover, "Sua odd combinada" ocupa a largura do grid (ou divide a linha com o checkbox de correlação). Nada a mudar em `calc.ts`.

### P1 — refinamentos
4. **Botão Calcular no Ink dominante demais.** O bloco mint full-width é o elemento mais saturado da tela num design que prometia monocromo + verde pontual. Conferir se o bg não está usando `--color-accent-hover`; reduzir massa: altura `h-11`, `max-w` alinhado ao card do form, ou variante outline com fill só no hover. No Ivory (verde-garrafa) está correto — o problema é só a versão Ink.
5. **Scrollbar permanente na coluna de resultados.** A trilha vertical aparece sempre; aplicar `scrollbar-thin` + `overflow-y: auto` (só quando estourar) ou deixar a coluna crescer com a página mantendo sticky apenas no bloco de viz.
6. **Vão label↔input nas linhas de odds.** Com a coluna mais larga do split, "Casa …………… [2.50]" ficou esparso. Compactar a linha: label e input próximos (grid `auto 1fr` com input `max-w-[140px]` à esquerda, ou label acima do input como nos demais campos).

Validação pós-fix: repetir o roteiro — load limpo (sem erro vermelho), exemplo 1X2 → Calcular (resultado inline), Ctrl+K abre/navega/fecha, toggle Ivory (select de papel, sem leak), Limpar (sem erro).

## 12. Densidade, hierarquia e consistência (feedback do usuário + guidelines, 2026-07-17)

Fundamentação: Material 3 — type scale (escala Major Second 1.125, papéis Display/Headline/Title/Body/Label, "reduced set" de ~5 estilos, contraste impactante entre tamanhos adjacentes, brand typeface nos estilos grandes / plain nos pequenos) e canonical layouts (supporting pane: conteúdo primário ~2/3 + painel de apoio ~1/3); Butterick, *Practical Typography* (corpo 15–25px web, entrelinha 120–145%, linha de 45–90 caracteres, ALL CAPS só abaixo de uma linha); NN/g, *Modal & Nonmodal Dialogs* (modais curtos e diretos; erro de formulário pertence ao conteúdo, junto do campo).

### 12.1 Tela vazia em monitores largos
Diagnóstico: container estreito centrado + coluna direita fixa de 380px = dois vãos mortos sem informação.
- Adotar a proporção supporting pane do M3: container `max-w-screen-xl`, grid `lg:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]` — as duas colunas **escalam** com o viewport em vez de deixar sobra.
- Densificar o form: em `≥lg`, campos curtos em grid de 2 colunas dentro do card; linhas de odds compactas (ver §11.6). O form não deve esticar full-width — o limite de ~45–90 caracteres por linha (Butterick) é o argumento para densificar, não alargar.
- **Matar o vazio da coluna direita**: no estado sem resultado, em vez de um único card tracejado, mostrar um "Resumo da banca" (banca, unidade, fração Kelly, teto/piso, edge mínimo — dados que já existem em `config`) + o card "Preencha e calcule". O painel de apoio nunca fica em branco.

### 12.2 ConfigModal vertical demais
NN/g: modal deve ser curto e direto; conteúdo que exige rolagem pede outro formato. Manter modal, mas reorganizar:
- Largura `max-w-3xl`; conteúdo em grid de 2 colunas por seção: (Tema + Banca e unidade) | (Critério de Kelly + Filtros de valor); "Método de de-vig" full-width com as opções em grid 2×2 de radio-cards compactos.
- Meta de aceite: **sem scroll interno** em viewport ≥ 720px de altura.

### 12.3 Consistência de radius — padronizar retangular
Decisão do usuário: cantos retos/levemente arredondados em tudo; eliminar pílulas. **Supera o §3.1 onde conflitar.**
- Nova escala: `--radius-xs: 2px`, `--radius-sm: 3px`, `--radius-md: 4px` (inputs, botões, itens de menu), `--radius-lg: 6px` (cards/panels), `--radius-xl: 8px` (modais/palette). `--radius-pill/full`: manter o token, mas **nenhum componente de UI o usa** (exceção única: o quadrado do logo pode ficar em `md`).
- Aplicar em: pills da topbar (viram "tabs" retangulares `rounded-[4px]`), trigger e menu do `Select`, itens da Command Palette, tags/badges (`rounded-[3px]`), botões, inputs, toast.

### 12.4 Hierarquia tipográfica — escala reduzida de 5 papéis
Diagnóstico do usuário ("grande, pequena, grande de novo") = zigue-zague entre título 22px serif → caption 11px caps → labels 11px caps → inputs 13px → botão 14px, com 3 variantes de ALL CAPS competindo. Prescrição (M3: conjunto reduzido, contraste claro entre passos, brand typeface só nos grandes):

| Papel | Fonte | Tamanho/peso | Uso |
|---|---|---|---|
| `display` | Newsreader 500 | 34/1.15 | valor da stake, só ele |
| `headline` | Newsreader 500 | 24/1.2 | título da aba no sub-header |
| `title` | Schibsted 500 | 14/1.4, sentence case | títulos de seção/card ("Mercado", "Odds da casa", "Decomposição") — **substitui os 11px ALL CAPS** |
| `body` | Schibsted 400 | 15/1.5 | corpo, labels de campo (13px permitido como `body-sm` em labels densos) |
| `caption/eyebrow` | Schibsted 500 | 12/1.4, caps + tracking 6% | **um único estilo de caps**, reservado a labels de metric-card e ao "Exemplos:" |

- Regra dura: no máximo esses 5 papéis por tela (números em Geist Mono mantêm tamanho do contexto; `metric-value` 20px). Nada de tamanhos ad hoc fora da tabela.
- Serif aparece exatamente 2 vezes por tela (headline + display) — é o que preserva o contraste "brand vs plain" do M3.
- Reordenar o topo da coluna esquerda para eliminar o zigue-zague: headline → subtítulo body-sm muted → card do form; a linha "Exemplos: [1X2] [Over/Under] · Limpar" desce para **dentro** do card do form (rodapé ou topo do card), deixando de interromper a escada tipográfica entre o título e o form.

Validação §12: screenshot 1440px de largura sem vãos mortos > 15% da largura; ConfigModal sem scroll; zero `rounded-full` em componentes; auditoria de tamanhos de fonte no CSS resultando só nos papéis da tabela.

## 13. Redesign da coluna de resultado (verificação de 2026-07-17, pós-fix da fonte; cenário EV+ real: 1X2 2,50/3,30/2,80, sua odd 3,00 → EV +13,94%, stake R$ 15,00)

Diagnóstico confirmado por screenshot: a coluna estoura a viewport (7 blocos empilhados sem colapso) e os cards estão desarmônicos — o par "Stake recomendado" / "Kelly cheio · ajustado" tem ~150px de largura cada, com label caps quebrando em 2 linhas, valor mono verde quebrando em 2 linhas, e 4 vozes tipográficas (serif bold + mono verde + caps + sans caption) competindo no mesmo nível hierárquico. O valor da stake está em Newsreader mas pequeno (~24px), sem funcionar como display.

Prescrição — reestruturar `ResultView.tsx` (continua sem tocar em cálculo):

1. **Hero único da stake** (substitui o grid 2-col atual): card full-width contendo, nesta ordem: linha de status compacta (badge "Aprovada/Revisar/Travada" + frase em body-sm muted — absorve o card "Aposta forte", que deixa de existir como bloco separado); valor em papel `display` (Newsreader 500, 34px, `white-space: nowrap`); linha de metadados em mono 12 muted: `1,50u · 1,50% · ideal 1,39u · Kelly 6,97%→1,39% · odds 3,000 · Automático`. Um card, uma voz por linha.
2. **Regra de vozes por card**: máximo 2 famílias — caption (sans) + valor (mono). Serif aparece na coluna **só** no hero. Verde só no valor de EV e no badge de aprovação.
3. **Metric cards sem quebra**: abreviar labels para 1 linha ("Prob. justa", "Margem", "EV", "Odd justa", "Odd efetiva"); valores `white-space: nowrap`; se a coluna ficar < 340px, grid vira 2-col em vez de espremer 3.
4. **Colapsar o secundário**: "Decomposição", "Fluxo do ajuste" e "Confiança do modelo" fecham por default (`.panel-collapsible` já existe); abertos só via clique, estado não persistido.
5. **Meta de altura**: com os 3 blocos colapsados, hero + metrics + VizSection cabem em viewport de 1080p sem scroll da coluna. É o critério de aceite deste bloco.
6. Ordem final da coluna: hero → metrics (3+2) → colapsáveis → VizSection. **[Superado pelo item 7.4 — viz sobe, colapsáveis descem.]**

### 13.7 Ajustes pós-implementação (2ª rodada de preview, 2026-07-17)

1. **Labels de metric card quebrando** ("PROB. / JUSTA" em 2 linhas infla a altura dos 3 cards). Regra: label de metric card é **sempre 1 linha** — `white-space: nowrap` + padding do card reduzido para 12px + fonte 11px. Se ainda não couber na largura corrente, o grid de 3 vira 2+1, nunca quebra o texto. Testar no pior caso ("MARGEM REMOVIDA" já foi abreviado para "MARGEM"; manter).
2. **Metadados do hero com scrollbar horizontal** (linha mono cortada em "Kelly 2,17%→0,…" com scroll). Proibir `overflow-x` no hero: a linha de metadados **quebra em até 2 linhas** — linha 1: unidades (`0,50u · 0,50% · ideal 0,43u`); linha 2: `Kelly 2,17%→0,43% · odds 3,000 · Automático`. Nunca scrollbar, nunca truncar com informação escondida.
3. **Botões "—" de remover perna desalinham os inputs** (linhas com e sem o botão têm larguras de input diferentes). Reservar coluna fixa de ação em TODAS as linhas de odds: grid `[label] [input] [32px]`, com a célula de 32px vazia quando a linha não é removível (Casa/via 1). Vale para NResultsTab, ComboTab e onde mais houver linha removível.
4. **FairProbabilities e Monte Carlo escondidos abaixo da dobra.** Reordenar a coluna: hero → metrics → **VizSection (Probabilidade justa por resultado + Projeção de banca, compactas)** → colapsáveis (Decomposição, Fluxo, Confiança, Retornos por estado). As duas visualizações são o payoff da ferramenta — ficam visíveis; o que colapsa é o diagnóstico textual. Compactar a Projeção de banca para 2 linhas (título+meta / ruína+mediana) para caber na meta de 1080p do item 5.

### 13.8 Restos da verificação final (2026-07-18, pré-commit)

Verificado funcionando: Ctrl+K (§11.2), remoção do campo morto da Combinada (§11.0), Resumo da banca no estado vazio (§12.1), hero sem scrollbar, metrics 1 linha, viz acima dos colapsáveis (§13.7). Restam:

1. **Linha do resultado avaliado ("Casa") sem a coluna de 32px** — o input dela termina ~34px à direita dos inputs de Empate/Fora. Aplicar o mesmo grid `[label] [input] [32px]` do §13.7.3 também à linha do avaliado (célula de ação vazia).
2. **Erro vermelho no load só no N Resultados** — a Combinada mostra o estado vazio correto ("Preencha e calcule"), mas o N Resultados abre com "Erro no cálculo". Causa provável: a detecção de "touched" considera os `DEFAULT_INPUTS` da aba (selects pré-setados) como conteúdo do usuário. Corrigir a heurística: só campos numéricos contam como "touched".
3. **ComboTab fora do fix de alinhamento** — o resumo do §13.7.3 cita só `NResultsTab`; aplicar a coluna de ação fixa também às linhas de pernas da Combinada (botão lixeira) e conferir AubTab.

Após os 3: bump `APP_VERSION` → 0.15, apagar `vite.config.ts.timestamp-*`, verificação rápida nos 2 temas, commit no Windows. Pendência de auditoria ainda aberta (pode ir em follow-up pós-0.15): reduced-motion da palette e backdrops `rgba` fixos no Ivory (§8.4/§3.2).

### 13.9 Viz na coluna esquerda (decisão do usuário, 2026-07-18 — supera a ordem do §13.7.4)

Mover a `VizSection` (Probabilidade justa por resultado + Projeção de banca) para a **coluna esquerda, abaixo do card do form/Calcular**, preenchendo o vazio que hoje sobra ali. Racional: as barras de probabilidade justa dialogam diretamente com as odds digitadas logo acima (proximidade input↔leitura), e a coluna direita passa a ser só hero → metrics → colapsáveis — cabendo na viewport sem scroll.

- Renderizar a viz na esquerda **apenas quando há `result` válido** (sem placeholder; o vazio pré-cálculo da esquerda é ocupado pelo próprio form).
- Coluna direita mantém o sticky; com a viz fora, revalidar a meta de altura do §13.7 (agora deve sobrar folga).
- **Mobile/bottom-sheet: ordem antiga permanece** (hero → metrics → viz → colapsáveis) — no sheet não existe segunda coluna.
- Título de seção da viz no papel `title` (§12.4) para ancorar visualmente ao form.

**Nota sobre os botões "—" de remover (N Resultados):** continuam desalinhando porque o §13.8 ainda não foi executado — foi escrito na verificação pós-"§13.7 completo". O fix previsto mantém os botões e alinha os inputs (coluna fixa de 32px em todas as linhas, inclusive "Casa"). Alternativa, se preferir menos cromo: botão visível só no hover/focus da linha (célula de 32px continua reservada, então o alinhamento não depende disso).

### 13.10 Botão Calcular por modo de cálculo (2026-07-18)

Fato do código (`useCalculator.ts`): abas **reativas** = nres, props, proxy, aub (resultado recalcula a cada input, síncrono); abas **lazy** = combo, poi, asia (cálculo só no trigger, com skeleton — necessário pela carga do Bet Builder tênis). Regra:

- **Desktop ≥lg, abas reativas**: ocultar o botão Calcular — o resultado já vive atualizado na coluna direita. O form termina no último campo (menos um elemento dominante na tela).
- **Desktop, abas lazy**: manter o botão — ele é o gatilho do cálculo. Considerar rótulo com estado: se já há resultado e algum input mudou depois, trocar para "Recalcular" (sinaliza resultado desatualizado; a detecção é comparar `trigger`/timestamp do último cálculo com última edição — só UI, sem tocar no hook).
- **Mobile <lg**: manter o botão em TODAS as abas — nele o Calcular é o que abre o bottom-sheet de resultado (nas reativas não dispara cálculo, só abre o sheet).
- Não alterar `useCalculator.ts`; a distinção reativa/lazy já existe (prop `trigger`), o componente da aba sabe em qual grupo está.

## Fora de escopo (explícito)

`src/lib/**`, `src/hooks/**`, `src/types.ts`, motor de cálculo, serialização de inputs (`nres-others` etc.), pendências #11/#13 (bloqueadas por cota de API), leitor de prints (#14, engavetado), fan chart do Monte Carlo (backlog separado).
