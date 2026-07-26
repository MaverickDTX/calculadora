# Handoff — Painéis laterais da aposta (v0.19)

> Planejamento 2026-07-24 · Base: v0.18.2
> Escopo: `src/lib/calc.ts`, `src/types.ts`, `src/App.tsx`, `src/components/tabs/NResultsTab.tsx`, componente novo
> Decisão: preencher o vazio abaixo de "Odd da sua aposta" com **A + B + C** (odd mínima, escada de odds, resumo da banca).

## Princípio que governa este handoff

Este projeto já removeu um painel com dado fabricado (`HANDOFF-ui-v0.18.md`, item A1). A causa não foi má-fé: foi um painel renderizado num componente que **não tinha acesso ao resultado do cálculo**, e alguém preencheu com literais para ver o layout.

Por isso, duas regras não-negociáveis aqui:

1. Nenhum dos três blocos renderiza sem `result` real. Sem resultado, não renderiza nada — não há estado "de exemplo".
2. A escada de odds (bloco C) **não pode ter cálculo próprio**. Ela sai da mesma função que produz a stake principal. Uma segunda implementação da cadeia de redutores divergiria da primeira na primeira mudança de regra, e as duas apareceriam lado a lado na mesma tela.

---

## Parte 1 — O que renderizar

Coluna de 320 px, abaixo do card "Odd da sua aposta". Espaço disponível ≈ 390 px. Três blocos empilhados com `gap-4`, cada um num `.panel`.

### Bloco A — Odd mínima (~70 px)

```
ODD MÍNIMA
2,000                    ← 18px mono, cor accent
Abaixo disso não há valor. Margem: +2,50%
```

`B.fair` e `B.ev`. É o número de decisão ao lado do campo de decisão — hoje ele mora na coluna da direita, longe de onde se digita.

### Bloco C — Se a odd fosse (~150 px)

```
SE A ODD FOSSE
2,05   +2,50%   R$ 5,00     ← linha atual, destacada
2,07   +3,50%   R$ 7,50
2,09   +4,50%   R$ 10,00
2,11   +5,50%   R$ 12,50
```

Quatro linhas: a odd atual e três degraus acima, no **tick real da faixa** — `tick()` em `lib/math.ts` já devolve o incremento por faixa de odd (0,01 abaixo de 2,00; 0,02 até 3,00; 0,05 até 4,00; etc.). Isso reflete o que uma casa efetivamente oferece; passos redondos de 0,05 seriam ficção.

**Sem linha de break-even** — o bloco A já ocupa esse papel, e duplicar a informação nos dois é o que eu evitaria.

Responde à pergunta que vem logo depois de digitar a odd: vale caçar linha melhor em outra casa?

### Bloco B — Banca (~60 px, comprimido)

```
BANCA
R$ 1.000              0,2× · teto 5,0%
```

Versão condensada. O painel completo (6 campos) continua existindo em `App.tsx:241-253` para quando não há resultado; aqui, com pouco espaço, uma linha basta para dar a escala da stake.

---

## Parte 2 — O refactor que sustenta o bloco C

### Onde está o problema

`lib/calc.ts`, dentro de `makeBetBase`, entre o cálculo de `base` e o `return`:

```ts
const sensInfo = args.sens ? calcSensitivity({ …, yourEff, … }) : { factor: 1, … };
const cf = confFactor(args.confClass, cfg.confAdj);
const divInfo = divergenceFactor(args.evPoints || null, cfg.confAdj);
let kadj = base.kfull * cfg.frac * cf * sensInfo.factor * divInfo.factor;
if (args.confClass === 'high' && sensInfo.factor >= 1 && df >= 1 && kadj > 0 && kadj < Math.min(cfg.floor, base.kfull)) kadj = Math.min(cfg.floor, base.kfull);
kadj = Math.min(kadj, cfg.cap, base.kfull);
if (base.ev < cfg.edgemin) kadj = 0;
```

Dessa cadeia, **só `cf` e `divInfo` são independentes da odd**. `base` (via `binaryBet(p, yourEff)` ou via `args.returns(yourEff)`) e `sensInfo` (via `calcSensitivity({ yourEff })`) mudam a cada odd hipotética. Ou seja: não dá para reaproveitar os fatores já guardados no `BetResult` — é preciso rodar a cadeia de novo por odd.

### Como extrair

Criar uma função privada em `calc.ts` que recebe a odd crua e devolve o resultado da cadeia:

```ts
function evaluateAtOdd(args: MakeBetArgs, rawOdd: number): { yourEff: number; ev: number; kfull: number; kadj: number; returns: ReturnState[]; b: number; sensInfo: SensInfo } {
  // move para cá, sem alterar uma linha da lógica:
  //   boostOdd → base (returns-fn ou binaryBet) → calcSensitivity
  //   → cf → divergenceFactor → kadj → piso → teto → edgemin
}
```

`makeBetBase` passa a ser o consumidor dela:

```ts
const main = evaluateAtOdd(args, args.your);
```

e monta o `BetResult` a partir de `main`. **O caminho principal tem que passar por `evaluateAtOdd`** — é isso que impede a escada de divergir. Se `makeBetBase` mantiver a cadeia inline e a escada usar uma cópia, o handoff falhou.

### Como expor a escada

Não guardar closure no estado (atrapalha memo e serialização). Calcular na hora, eager, e guardar como dado:

```ts
// types.ts — em BetResult
oddLadder?: { odd: number; ev: number; kadj: number }[];

// calc.ts — em makeBetBase, depois de `main`
const step = tick(args.your);
const ladder = [0, 1, 2, 3].map(i => {
  const odd = Number((args.your + i * step).toFixed(3));
  const r = evaluateAtOdd(args, odd);
  return { odd, ev: r.ev, kadj: r.kadj };
});
```

A stake em reais fica na camada de view, com `gridStake(kadj, config.bank, config.unit)` — a mesma função que o card principal usa, então o arredondamento na grade de 0,25u é idêntico.

**Custo:** 4 execuções extras da cadeia por cálculo. Para as abas leves é irrelevante. **Atenção nas abas lazy** (`combo`, `poi`, `asia`): se alguma delas tiver Monte Carlo dentro de `args.returns`, quatro execuções extras multiplicam o tempo por 5. Medir antes; se pesar, calcular a escada sob demanda (só quando o painel estiver visível) ou limitar o recurso às abas leves.

### Validação obrigatória

A primeira linha da escada usa `args.your` — a odd que o usuário digitou. Ela **tem que bater exatamente** com o card de stake principal: mesmo EV, mesmo kadj, mesma stake em reais. Se divergir em qualquer casa decimal, a extração está errada. Esse é o teste que vale escrever em `scripts/verify-engine.ts`.

---

## Parte 3 — Fiação até a view

`NResultsTab` **não recebe `result`** — foi exatamente essa falta que produziu o painel falso do A1. Corrigir na origem:

**`App.tsx:204`** — acrescentar ao objeto `common`:

```ts
const common = { …, result, config };
```

Assim todas as abas passam a ter acesso, e cada uma decide se renderiza os painéis. Uniforme, sem prop drilling caso a caso.

**Componente novo** — `src/components/BetSidePanels.tsx`:

```tsx
export function BetSidePanels({ result, config }: { result: BetResult | { err: string } | null; config: Config }) {
  if (!result || 'err' in result) return null;
  // A: result.fair, result.ev
  // C: result.oddLadder + gridStake(l.kadj, config.bank, config.unit)
  // B: config.bank, config.frac, config.cap
}
```

O early return é o que garante a regra 1: sem resultado válido, nada aparece.

**`NResultsTab.tsx:126`** — renderizar `<BetSidePanels result={result} config={config} />` logo abaixo do card "Odd da sua aposta", dentro do mesmo segundo track do grid.

Aplicar só na aba `nres` nesta entrega. As outras abas ganham de graça quando alguém quiser — o componente já estará pronto e o `common` já carrega os dados.

---

## Ordem de execução

1. Extrair `evaluateAtOdd` e fazer `makeBetBase` consumi-la. **Sem tocar em UI.** Rodar `scripts/verify-engine.ts` e confirmar que nenhum número mudou — este passo é puramente estrutural e tem que ser neutro.
2. `oddLadder` em `types.ts` + preenchimento em `makeBetBase`. Conferir no console que a linha 0 bate com o resultado principal.
3. `result` e `config` no `common` do `App.tsx`.
4. `BetSidePanels.tsx` com os três blocos.
5. Fiação no `NResultsTab`.
6. Medir o tempo de cálculo nas abas lazy antes e depois (passo 1 do handoff só é seguro se não regredir).

## Verificação

- `npm run typecheck`, `npm run build`, `npm run lint` limpos.
- **Nenhum número da tela mudou** depois do passo 1 — é refactor, não mudança de comportamento.
- Primeira linha da escada idêntica ao card de stake principal, incluindo o arredondamento de 0,25u.
- Com a odd abaixo da justa (ex.: 1,95 num mercado de justa 2,000): o bloco A mostra a odd mínima, a escada mostra as linhas com stake zerada pelo edge mínimo, e nada finge ter valor.
- Sem resultado calculado, os três blocos não aparecem (nem vazios, nem com placeholder).
- Preview em 1440 px e 2560 px, nos dois temas; a coluna de 320 px não pode gerar rolagem.
- Bump para `0.19` (é feature, não correção) e commit **no Windows**. Não rodar nenhum comando git pelo sandbox — nem `git status`, que deixa um `.git/index.lock` irremovível.
