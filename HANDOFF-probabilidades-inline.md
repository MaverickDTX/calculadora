# Handoff — Mensagem falsa, escada legível e probabilidades sob os inputs (v0.20)

> Planejamento 2026-07-25 · Base: v0.19
> Escopo: `src/components/ResultView.tsx`, `src/components/BetSidePanels.tsx`, `src/components/tabs/NResultsTab.tsx`, `src/components/VizSection.tsx`, `src/App.tsx`
> Três frentes independentes. A frente 1 é correção de afirmação falsa e vem primeiro.

---

## Frente 1 · P0 — O painel de resultado afirma algo falso

### O sintoma

Com 1X2 em 2.50 / 3.30 / 2.80 e odd de 2.65, a tela mostra:

```
Filtros travaram stake
Edge 0,65% < mínimo 0,50%
```

0,65% não é menor que 0,50%. A frase é aritmeticamente falsa e aponta para a causa errada.

### A causa

`src/components/ResultView.tsx:104-106` — o título tem **três** ramos, o subtítulo só **dois**:

```tsx
<div className="t-title …">{B.ev <= 0 ? 'Sem valor / travado' : B.ev < config.edgemin ? 'Abaixo do edge mínimo' : 'Filtros travaram stake'}</div>
<p className="text-xs …">{B.ev <= 0 ? `EV de ${fpct(B.ev)}. Kelly cheio é zero.` : `Edge ${fpct(B.ev)} < mínimo ${fpct(config.edgemin)}`}</p>
```

Quando cai no terceiro ramo do título, o subtítulo continua imprimindo a frase do segundo.

### O diagnóstico real deste caso

O bloco `!hasStake` dispara sob `B.ev > 0 && B.kadj > 0 && gs.units > 0` ser falso. Aqui `B.ev = 0,65%` (acima do mínimo) e `B.kadj > 0` — o `setQuality` devolveu o pill "Revisar", que só é alcançado com `kadj > 0`. Logo o que zerou foi **`gs.units`**.

Conferindo: o "Fluxo do ajuste" mostra `sensibilidade 0,65` e `pré-travas 0,05%`. Com banca R$ 1.000, `kadj = 0,05%` → R$ 0,50. Em `gridStake` (`lib/math.ts:61-66`), `rawUnits = 0,50 / 10 = 0,05`, e `Math.round(0,05 / 0,25) * 0,25 = 0`. A stake foi **arredondada para zero na grade de 0,25u** — não foi filtro nenhum.

Ou seja: nesse caso o título também está errado, não só o subtítulo.

### A correção

Quatro ramos, título e subtítulo em paralelo. Usar `stakeFlow(B)` (já importado no arquivo) para nomear o redutor real no caso 3.

| # | condição | título | subtítulo |
|---|---|---|---|
| 1 | `B.ev <= 0` | Sem valor | `EV de {ev}. Kelly cheio é zero.` |
| 2 | `B.ev < cfg.edgemin` | Abaixo do edge mínimo | `Edge {ev} < mínimo {edgemin}` |
| 3 | `B.kadj <= 0` | Travada por filtros | nomear o fator < 1 de `stakeFlow`: confiança `flow.cf`, sensibilidade `flow.sf`, divergência `flow.df` |
| 4 | resto (`gs.units === 0`) | Stake abaixo do menor incremento | `R$ {rawUnits × unit} ficaria abaixo de 0,25u (R$ {0,25 × unit}). Aumente a unidade, a fração de Kelly, ou aceite não apostar.` |

No caso do print, o ramo 4 produziria: *"R$ 0,50 ficaria abaixo de 0,25u (R$ 2,50)."* — verdadeiro, diagnóstico e acionável, no lugar de uma desigualdade falsa.

`gs.rawUnits` já vem do `gridStake` e está em escopo (`const gs = gridStake(...)` na linha 59).

**Regra ao escrever os ramos:** cada subtítulo só pode citar números que pertencem à condição do seu próprio ramo. O bug nasceu de um subtítulo emprestado do ramo vizinho.

---

## Frente 2 · P1 — A escada de odds tem a coluna mais útil constante

### O sintoma

No mesmo print, o bloco "Se a odd fosse":

```
2,650   0,65%      —
2,670   1,41%   R$ 2,50
2,690   2,17%   R$ 2,50
2,710   2,93%   R$ 2,50
```

O EV varia 4,5× entre as linhas e a stake não sai de R$ 2,50. Não é bug: com unidade de R$ 10 e grade de 0,25u, o degrau mínimo é R$ 2,50, e três ticks de odd não chegam a movê-lo. Mas a coluna que deveria responder "vale caçar odd melhor?" ficou plana, e a tabela perde a razão de existir.

### A correção

Mostrar também o valor **antes** do arredondamento, que já vem pronto: `gridStake()` devolve `rawUnits`.

`src/components/BetSidePanels.tsx:39-56` — acrescentar uma coluna esmaecida à direita da stake:

```tsx
<span className="font-mono text-right min-w-[56px]">
  {gs.units > 0 ? `R$ ${fnum(gs.reais, 2)}` : '—'}
</span>
<span className="font-mono text-right min-w-[44px] text-text-muted text-[10px]">
  {fnum(gs.rawUnits, 2)}u
</span>
```

As mesmas quatro linhas passariam a ler `0,05u · 0,11u · 0,17u · 0,23u` — o movimento fica visível, e fica claro que a quarta linha ainda não cruzou o degrau de 0,25u.

**Não** estender a escada para 6-8 degraus. Ela ocupa 320 px de largura numa coluna que já tem três blocos; mais linhas roubam espaço do resumo da banca sem resolver o problema, que é de granularidade e não de alcance.

---

## Frente 3 · P1 — Dissolver as probabilidades justas sob os inputs

### Por quê

Os rótulos `CASA` / `EMPATE` / `FORA` aparecem hoje duas vezes na mesma tela: sobre os campos de odd, e de novo sobre as barras do painel "Probabilidade justa por resultado", ~250 px abaixo e atrás de uma borda de card. As probabilidades **são** a saída de de-vig daquelas odds — entrada e saída derivada devem ficar juntas.

### O desenho

Sob cada input de odd, dentro do próprio card "Odds da casa":

```
CASA
[ 2.50 ]
▔▔▔▔▔▔▔▔▔▔▔▔░░░░░░░░     ← barra de 2px, largura = probabilidade
37,98% · justa 2,633
```

Barra de 2 px (accent no resultado avaliado, `text-muted/50` nos demais), e uma linha de 10-11 px com percentual e odd justa. O painel separado deixa de existir na aba `nres`.

Mapeamento de índice: `fairProbabilities[0]` corresponde ao campo `nres-eval` e `[1..n]` aos `nres-others`, na mesma ordem em que os campos são renderizados — é a convenção que `calcNres` já usa (`refs = [ev, ...others]`, `selectedOutcomeIndex: 0`).

**Guarda obrigatória:** renderizar apenas quando `result` existir, não tiver `err`, e `fairProbabilities.length === numWays`. Se o usuário adicionou uma via e ainda não recalculou, os comprimentos divergem e a barra ficaria sob o campo errado — que é a família de erro que este projeto já pagou caro (`HANDOFF-ui-v0.18.md`, item A1). Sem correspondência exata, não renderiza.

### A armadilha de escopo

`VizSection` **não pertence à aba `nres`**. Ele renderiza em dois lugares e serve duas abas:

| consumidor | arquivo | efeito de remover o `FairProbabilities` |
|---|---|---|
| coluna esquerda desktop | `App.tsx:380` | é o que queremos substituir na `nres` |
| sheet mobile | `ResultsDrawer.tsx:155` | **perderia** a visualização no resultado mobile |
| aba Props | via `calcProps` (`calc.ts:253` popula `fairProbabilities`) | **perderia** o painel |

Portanto: **não apagar `FairProbabilities` de `VizSection`.** Suprimir só na instância que a `nres` desktop substitui.

`VizSection` ganha uma prop opcional:

```tsx
export function VizSection({ result, showFairProbabilities = true }: { result: …; showFairProbabilities?: boolean })
```

e `App.tsx:380` passa `showFairProbabilities={activeTab !== 'nres'}`. O sheet (`ResultsDrawer.tsx:155`) e a aba Props seguem com o default `true`, intactos.

Consequência no mobile: na `nres`, as barras inline aparecem no formulário e o painel aparece no sheet. Não coexistem na tela — o sheet cobre o formulário — então não é duplicação visível.

### Efeito colateral a verificar

Com o `FairProbabilities` suprimido, `VizSection` na `nres` pode ficar renderizando um `<div className="space-y-4 max-w-[720px]">` vazio quando o `UncertaintyBand` também retorna `null` (acontece sempre que `result.evBand` é nulo). Acrescentar um early return: se nenhum filho for renderizável, devolver `null`.

---

## Ordem de execução

1. **Frente 1** — é afirmação falsa em produção, e é a menor das três.
2. **Frente 2** — duas linhas.
3. **Frente 3** — a maior; fazer por último e em commit próprio.

## Verificação

- `npm run typecheck`, `npm run build`, `npm run lint` limpos.
- **Frente 1:** reproduzir o caso do print (1X2 em 2.50 / 3.30 / 2.80, sua odd 2.65, banca R$ 1.000, unidade R$ 10, fração 0,2×) e conferir que a mensagem passou a ser a do arredondamento, com R$ 0,50 e R$ 2,50 corretos. Forçar também os ramos 1, 2 e 3 (odd abaixo da justa; odd com edge entre 0 e o mínimo; confiança baixa) e conferir que nenhum subtítulo cita número que não é do seu ramo.
- **Frente 2:** a coluna de unidades cruas tem que variar linha a linha mesmo quando os reais não variam.
- **Frente 3:** trocar o tipo de mercado (1X2 → Over/Under → Ambas marcam) e conferir que as barras acompanham o número de campos; **adicionar uma via sem recalcular** e conferir que as barras somem em vez de deslizarem para o campo errado; abrir a aba **Props** e conferir que o painel continua lá; abrir o **sheet mobile** na `nres` e conferir que o painel continua lá.
- Bump para `0.20` e commit **no Windows**. Nenhum comando git pelo sandbox — nem `git status`, que deixa um `.git/index.lock` irremovível.
