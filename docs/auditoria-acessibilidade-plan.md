# Plano de Correção — Auditoria de Acessibilidade

Baseado nas [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md).

> **Nota:** este documento foi reescrito contra o código real (o rascunho anterior, produzido em Plan Mode read-only, tinha números de linha e inventário de arquivos incorretos). O projeto tem 7 abas em `src/components/tabs/`, não 3.

## Fase 1 — Anti-patterns CSS + color-scheme (`src/index.css`)

| # | Alvo | O que fazer | Regra |
|---|------|-------------|-------|
| 1 | `.btn-ghost` (`transition: all 0.15s`) | → `transition: color .15s, background-color .15s, border-color .15s` | `transition: all` é anti-pattern |
| 2 | `.nav-item` (`transition: all 0.15s`) | → `transition: color .15s, background-color .15s` | idem |
| 3 | `html` (bloco `@layer base`) | Adicionar `color-scheme: dark` | scrollbars/inputs nativos no tema escuro |

> Obs.: `.panel`, `.input-dark`, `.metric-card` etc. já usam transições explícitas — não mexer.

## Fase 2 — Acessibilidade essencial

### 2a. `aria-label` em botões icon-only (sem texto visível)

| Arquivo | Linha | Botão | aria-label |
|---------|-------|-------|-----------|
| `ResultsDrawer.tsx` | 68 | X (fechar) | `"Fechar resultado"` |
| `ConfigModal.tsx` | 45 | X (fechar) | `"Fechar configurações"` |
| `NResultsTab.tsx` | 86 | remover resultado (Minus) | `"Remover resultado"` |
| `AubTab.tsx` | 71 | remover seleção (Trash2) | `"Remover seleção"` |
| `ProxyTab.tsx` | 137 | remover casa (Trash2) | `"Remover casa"` |
| `ComboTab.tsx` | 113 | remover perna (Trash2) | `"Remover perna"` |
| `BetBuilderTab.tsx` | 254 | remover perna (Trash2) | `"Remover perna"` |

### 2b. `aria-hidden="true"` em ícones decorativos

Ícones dentro de botões/headers que **já têm texto** ao lado são decorativos. Aplicar em:
`Sidebar.tsx` (Calculator, t.icon, Settings), botões Reset/Add de todas as abas (RotateCcw, Plus), `ConfigModal` (SlidersHorizontal, ícones de Section), `ResultsDrawer` (QualIcon, AlertTriangle dos warnings). Ícones que são o *único* conteúdo do botão **não** levam aria-hidden (levam aria-label — ver 2a).

### 2c. Conteúdo dinâmico

| Arquivo | Elemento | Ação |
|---------|----------|------|
| `ResultsDrawer.tsx:96` | `ErrorState` (painel de erro) | `role="alert"` |

## Fase 3 — Formulários (inputs numéricos)

Todos os 60 inputs de odds/valores são `type="text"`. Adicionar `inputMode="decimal"` e `autoComplete="off"` para acionar teclado numérico no mobile sem quebrar a máscara vírgula→ponto existente. Afeta as 7 abas + `ConfigModal` (componente `Field`).

## Fase 4 — Animação (`prefers-reduced-motion`)

Adicionar ao `index.css`. Classes reais em uso: `animate-fade-in`, `animate-slide-up`, `animate-slide-right`, `animate-pulse-soft`.

```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in, .animate-slide-up, .animate-slide-right, .animate-pulse-soft {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
```

## Fase 5 — HTML (`index.html`) + skip link

```html
<meta name="color-scheme" content="dark" />
<meta name="theme-color" content="#0B0F17" />
```
Skip link antes de `<div id="root">` + `.skip-link` no CSS. `id="main"` no `<main>` do `App.tsx:140`.

## Fase 6 — Touch / Mobile (`src/index.css` + componentes)

| Alvo | Ação |
|------|------|
| `.input-dark` | `touch-action: manipulation` |
| `ResultsDrawer` (drawer scroll) | `overscroll-behavior: contain` |
| `ConfigModal` (backdrop) | `overscroll-behavior: contain` |

## Verificação

```bash
npm run typecheck   # tsc --noEmit -p tsconfig.app.json
npm run lint        # eslint .
```

## Arquivos modificados

1. `index.html`
2. `src/index.css`
3. `src/App.tsx`
4. `src/components/Sidebar.tsx`
5. `src/components/ResultsDrawer.tsx`
6. `src/components/ConfigModal.tsx`
7. `src/components/VizSection.tsx` *(nenhuma alteração necessária — sem inputs/botões icon-only)*
8. `src/components/tabs/NResultsTab.tsx`
9. `src/components/tabs/PropsTab.tsx`
10. `src/components/tabs/ProxyTab.tsx`
11. `src/components/tabs/AubTab.tsx`
12. `src/components/tabs/ComboTab.tsx`
13. `src/components/tabs/BetBuilderTab.tsx`
14. `src/components/tabs/AsianTab.tsx`
