# Handoff — Correção do estouro da grade de métricas (v0.18.1)

> Planejamento 2026-07-24 · Base: v0.18 (`APP_VERSION = '0.18'`)
> Escopo: `src/components/ResultView.tsx`, `src/components/VizSection.tsx`
> Quatro patches pequenos. Nenhum toca cálculo.

## Contexto

O item C3 do `HANDOFF-ui-v0.18.md` sugeriu `xl:grid-cols-5` para eliminar a célula órfã na segunda linha das métricas. **A sugestão estava errada** e introduziu um estouro horizontal na coluna de resultado. Este handoff reverte e resolve o problema original de outro jeito.

**Causa raiz:** `xl:` é uma media query de **viewport**, mas a coluna de resultado tem **420 px fixos em qualquer largura de tela** (`App.tsx:233` — `lg:grid-cols-[minmax(0,1fr)_420px]`). O breakpoint pergunta "a tela é larga?" quando a pergunta é "a coluna é larga?", e a resposta da coluna é sempre 420 px. Num monitor de 2600 px a condição dispara, cinco cards recebem ~76 px cada, e como `.metric-value` tem `font-size: 20px` em Geist Mono com `white-space: nowrap` (`index.css:486-492`) nada consegue encolher.

Sintomas: barra de rolagem horizontal sob a coluna sticky, rótulos cortados ("PROB. JUST", "ODD JUSTA" comido pela borda), valor do EV sem o `%`.

**Regra a seguir daqui em diante:** nesta coluna, prefixo de viewport (`sm:`/`md:`/`lg:`/`xl:`) não descreve o espaço disponível. Ou o valor é fixo, ou usa container query.

---

## Patch 1 · P0 — Grade de métricas em 3 colunas, sem célula órfã

**Onde:** `src/components/ResultView.tsx:112-118`

Trocar a grade de 5 colunas por uma base de 6 com spans. As duas linhas fecham exatas (3 × 2 + 2 × 3) e não há dependência de viewport.

```tsx
<div className="grid grid-cols-6 gap-2.5">
  <MetricCard className="col-span-2" label="Prob. justa" value={B.p ? fpct(B.p) : 'multi'} />
  <MetricCard className="col-span-2" label="Margem" value={B.M !== null ? fpct(B.M) : '—'} />
  <MetricCard className="col-span-2" label="EV" value={`${B.ev >= 0 ? '+' : ''}${fpct(B.ev)}`} highlight={B.ev >= 0 ? 'good' : 'bad'} />
  <MetricCard className="col-span-3" label="Odd justa" value={B.fair ? fnum(B.fair, 3) : 'multi'} />
  <MetricCard className="col-span-3" label="Odd efetiva" value={fnum(B.yourEff, 3)} />
</div>
```

**Onde:** `src/components/ResultView.tsx:192-200` — `MetricCard` precisa aceitar `className`:

```tsx
export function MetricCard({ label, value, highlight, className = '' }: {
  label: string; value: string; highlight?: 'good' | 'bad' | 'kelly'; className?: string;
}) {
  const colorClass = highlight === 'good' ? 'text-value' : highlight === 'bad' ? 'text-danger' : highlight === 'kelly' ? 'text-kelly' : 'text-text-primary';
  return (
    <div className={`metric-card ${className}`}>
      <div className="metric-label">{label}</div>
      <div className={`metric-value whitespace-nowrap ${colorClass}`}>{value}</div>
    </div>
  );
}
```

`MetricCard` é exportado — conferir com `grep -rn "MetricCard" src/` se algum outro ponto o consome antes de mexer na assinatura. O parâmetro é opcional, então nenhum uso existente quebra.

**Não** trocar por container query. A coluna está cravada em 420 px e um `@lg:grid-cols-5` nunca dispararia; seria complexidade sem efeito.

## Patch 2 · P1 — `defaultOpen` não deve depender da largura da tela

**Onde:** `src/components/ResultView.tsx:61, 121, 130`

```ts
const isXl = useMediaQuery('(min-width: 1280px)');
// …
<CollapsibleSection title="Decomposição"    defaultOpen={isXl}>
<CollapsibleSection title="Fluxo do ajuste" defaultOpen={isXl}>
```

Mesmo vício do Patch 1 — largura de tela como proxy para uma coluna que não muda de largura. Aqui não estoura nada, mas tem um efeito colateral próprio: `<details open={valor que muda no resize}>` **reabre a seção por cima do que o usuário fechou manualmente**, porque o React reescreve o atributo `open` a cada mudança de `isXl`.

**Correção:** `defaultOpen={true}` literal nas duas, e remover a linha 61 (`useMediaQuery`) junto com o import se ficar sem uso. Previsível e sem stomp.

Se a preocupação for o sheet mobile ficar longo demais com as seções abertas: hoje ele tem `height: auto` + `maxHeight: 85dvh` e scroll unificado, então seções abertas apenas alongam o scroll — não quebram layout.

## Patch 3 · P1 — Conter a largura do `VizSection`

**Onde:** `src/components/VizSection.tsx:14`

Com o painel falso removido, a "Probabilidade justa por resultado" ficou sozinha na coluna esquerda e herdou o esticamento: barras de ~1400 px para representar 50 %. Uma barra de proporção não comunica melhor por ser mais longa — passa de gráfico a listra decorativa, e o valor numérico à direita fica a meia tela do rótulo à esquerda.

```tsx
<div className="space-y-4 animate-fade-in max-w-[720px]">
```

Aplicar na raiz do `VizSection` pega os dois painéis (`UncertaintyBand` e `FairProbabilities`) de uma vez. No sheet mobile não tem efeito — a largura ali já é menor que 720 px.

## Patch 4 · P2 — Cards famintos no card de entrada

**Onde:** `src/components/tabs/NResultsTab.tsx` (cards "Mercado" e "Odd da sua aposta")

Item C1 do handoff anterior, ainda aberto. "Mercado" tem um único `Select` e ~120 px de vazio abaixo; "Odd da sua aposta" tem o input mais o helper e sobra parecida. Numa grade de altura igual, a coluna mais pobre define o buraco.

Opções, em ordem de preferência:

1. Fundir "Mercado" com "Odds da casa" — o tipo de mercado é um cabeçalho daquele card, não um card à parte.
2. Deixar os cards com `align-self: start` em vez de esticar, para que cada um termine no próprio conteúdo.

**Fazer por último e conferir no preview antes de commitar** — é o único patch aqui que muda a estrutura da aba.

---

## Verificação

- `npm run typecheck` e `npm run build` limpos.
- Preview em **2560 px** (onde o bug apareceu), 1440 px, 1024 px e 375 px, nos dois temas.
- **Sem barra de rolagem horizontal** sob a coluna de resultado em nenhuma dessas larguras — é o critério de aceite do Patch 1.
- Nenhum rótulo de métrica truncado; o EV mostra o `%`.
- Fechar "Decomposição" manualmente, redimensionar a janela cruzando 1280 px, e conferir que ela **continua fechada** (Patch 2).
- Bump de `APP_VERSION` para `0.18.1` e commit **no Windows** — nunca `git add/commit` pelo sandbox neste repo.
