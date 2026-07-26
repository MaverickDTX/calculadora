# Handoff — Seletor de resultado avaliado (v0.21)

> Planejamento 2026-07-25 · Base: v0.20 (frentes 1 e 2 do `HANDOFF-probabilidades-inline.md`)
> Escopo: `src/lib/calc.ts`, `src/App.tsx`, `src/components/tabs/NResultsTab.tsx`, `scripts/verify-engine.ts`
> **Sequenciamento:** este handoff precisa vir ANTES da frente 3 do `HANDOFF-probabilidades-inline.md`. Ver "Ordem" no fim.

---

## O problema

Hoje o campo avaliado é **posicional e fixo**: `nres-eval` é sempre o resultado #0, e o card de entrada rotula esse campo com o nome do primeiro resultado do mercado — `CASA` num 1X2.

Para apostar no empate, o usuário precisa digitar 3.30 no campo rotulado `CASA` e mover 2.50 para a lista de "outros". A partir daí a tela mente em cascata:

- o campo `CASA` contém a odd do empate;
- `decomp` diz "lado avaliado 3,300" sem dizer de quê;
- as barras de probabilidade (frente 3) ficariam coladas sob campos com rótulo trocado;
- `outcomeLabels`, que a v0.18 introduziu para dar nomes concretos, passa a nomear errado com confiança.

Antes da v0.18 o painel dizia "Resultado avaliado", que era posicionalmente honesto. Ao trocar por nomes reais, aumentamos o custo do engano — o que era neutro virou afirmação falsa.

## O que NÃO muda

`devigN` (`lib/math.ts:200`) calcula o de-vig sobre o **mercado inteiro** e devolve `probs` com todas as vias; o `p` retornado é apenas `probs[0]`, escolhido no código. Trocar o resultado avaliado é **ler outro índice do mesmo vetor**. Nenhuma conta de de-vig, margem ou método muda.

É isso que torna esta mudança segura: o peso está no formato dos inputs e na UI, não no motor.

---

## Parte 1 — Modelo de dados

### Hoje

```
nres-eval    → odd do resultado avaliado (string, um valor)
nres-others  → odds dos demais (string, lista separada por vírgula)
```

O papel ("avaliado" vs. "demais") está codificado na **posição de armazenamento**. É essa fusão entre papel e posição que produz o problema.

### Proposto

```
nres-odds  → todas as odds em ordem de mercado (lista separada por vírgula)
nres-sel   → índice do resultado avaliado (string, default '0')
```

Papel e posição ficam separados. Mudar de aposta passa a ser mover o seletor, não rearranjar valores entre campos.

### Alternativa considerada e descartada

Manter `nres-eval`/`nres-others` e acrescentar `nres-sel`, reordenando dentro do `calcNres`. Evita renomear chaves, mas mantém as odds guardadas por papel — então trocar a seleção continuaria exigindo mover valores entre campos, que é exatamente a fricção que se quer eliminar. Não vale o desconto.

### Pontos de migração

| arquivo | o que fazer |
|---|---|
| `App.tsx` `DEFAULT_INPUTS` | acrescentar `'nres-sel': '0'`. Fica em `DEFAULT_INPUTS` de propósito: é flag de roteamento, e `tabHasContent` exclui essas chaves para não contar como conteúdo do usuário |
| `App.tsx` `RAW_LIST_FIELDS` (linha ~177) | trocar `'nres-others'` por `'nres-odds'` — é lista, a vírgula é delimitador estrutural e não pode virar ponto |
| `App.tsx` `EXAMPLE_MAP` | `nres-1x2`: `'nres-odds': '2.50,3.30,2.80'`, `'nres-sel': '0'`. `nres-ou`: `'nres-odds': '1.95,1.95'`, `'nres-sel': '0'` |
| `scripts/verify-engine.ts` | atualizar as chaves de entrada dos fixtures da `nres`. **Os valores esperados não podem mudar** — ver Parte 4 |

---

## Parte 2 — `calcNres`

`src/lib/calc.ts:195-224`. A estrutura permanece; muda a leitura da entrada e cinco campos de saída.

```ts
const oddsRaw = get('nres-odds');
const refs = oddsRaw ? oddsRaw.split(',').map(s => numDec(s.trim())).filter(o => o > 1) : [];
const your = numDec(get('nres-your'));
const selRaw = parseInt(get('nres-sel') || '0', 10);

if (refs.length < 2) return { err: 'Preencha ao menos duas odds do mercado.' };
if (!(your > 1)) return { err: 'Preencha a sua odd (>1).' };

const sel = Number.isFinite(selRaw) && selRaw >= 0 && selRaw < refs.length ? selRaw : 0;

const dv = devigN(refs, cfg.method);
const type = get('nres-type') || '1X2 / Moneyline';
const mapped = outcomeLabels[type];
const labels = mapped?.length === refs.length ? mapped : undefined;
```

Saídas que passam a depender de `sel`:

| campo | antes | depois |
|---|---|---|
| `p` | `dv.p` | `dv.probs[sel]` |
| `fair` | `1 / dv.p` | `1 / dv.probs[sel]` |
| `decomp` | `… lado avaliado ${ev}` | `… lado avaliado ${labels?.[sel] ?? `#${sel + 1}`} ${refs[sel]}` |
| `sens.refEval` | `ev` | `refs[sel]` |
| `selectedOutcomeIndex` | `0` | `sel` |

`referenceOdds: refs` e `fairProbabilities: dv.probs` continuam em ordem de mercado, sem alteração — é o que faz as barras da frente 3 casarem com os campos por índice direto.

**Nota sobre `labels`:** aproveitar para aplicar a guarda de comprimento que ficou pendente da v0.18 (`mapped?.length === refs.length ? mapped : undefined`). Num 1X2 com só duas odds preenchidas, o mapa tem três nomes e hoje o segundo campo seria rotulado "Empate" mesmo que o usuário tenha digitado a odd do Fora. Com a guarda, cai no fallback genérico.

O `sel` fora de faixa cai em 0 em vez de estourar — pode acontecer se o usuário remover a via selecionada e o estado da UI ficar para trás por um render.

---

## Parte 3 — UI

### Desenho

Manipulação direta, sem controle extra. Cada resultado tem um radio **antes do rótulo**; o campo selecionado ganha a borda accent que hoje é do card "Odd da sua aposta".

```
( ) CASA          (•) EMPATE        ( ) FORA
[ 2.50  ]         [ 3.30  ]         [ 2.80  ]
                   ▲ avaliado
```

O radio fica no rótulo, **não no input** — clicar no campo tem que continuar focando para digitar. O `<label>` inteiro é alvo do radio.

### Acessibilidade

- Container dos campos: `role="radiogroup"` com `aria-label="Resultado avaliado"`.
- Cada item: `<input type="radio" name="nres-sel">` real, estilizado — não `<div role="radio">`. Radio nativo dá navegação por setas de graça, que é o comportamento esperado num grupo.
- O rótulo textual do radio precisa dizer o que a seleção significa. `aria-label` do tipo `"Avaliar Empate"`, não só "Empate".
- Não usar cor como único indicador do selecionado: além da borda accent, manter a marca do radio.

### Remoção de via

`removeOther` hoje só mexe na lista. Com `nres-sel` separado, precisa ajustar o índice:

- se `removido < sel` → `sel--`
- se `removido === sel` → `sel = 0`
- se `removido > sel` → não mexe

Sem isso, remover a primeira via faz o "avaliado" pular silenciosamente para outro resultado — mudança de aposta sem o usuário pedir. É o pior bug possível nesta tela.

### Rótulos

`outcomeLabel(i)` já existe em `NResultsTab.tsx:22` e passa a servir os dois papéis: rótulo do campo e rótulo do radio. Uma fonte só.

---

## Parte 4 — A rede de segurança

Os 11 fixtures de `scripts/verify-engine.ts` são contrato — o cabeçalho do arquivo proíbe atualizar snapshot sem justificativa.

Aqui a propriedade a explorar é: **com `nres-sel = '0'`, o comportamento tem que ser idêntico ao de hoje.** Os fixtures da `nres` mudam só as chaves de entrada (`nres-eval` + `nres-others` → `nres-odds`); todos os números esperados permanecem. Se algum snapshot mexer, a refatoração alterou comportamento sem querer.

Depois disso, **acrescentar um fixture novo** com `nres-sel = '1'` no mesmo mercado 1X2 (2.50 / 3.30 / 2.80). Valores esperados: `p = dv.probs[1]`, `fair = 1/dv.probs[1]`. É o único caso novo que o seletor introduz, e sem ele a funcionalidade fica sem cobertura.

---

## Ordem

Este handoff **conflita com a frente 3** do `HANDOFF-probabilidades-inline.md`: aquela frente assume que `fairProbabilities[0]` corresponde ao campo `nres-eval` e que os demais seguem em `nres-others`. Com o seletor, o mapeamento vira posicional puro (`fairProbabilities[i]` ↔ campo `i`) — mais simples, mas diferente. As duas mexem no mesmo bloco de markup.

Sequência recomendada:

1. **Frentes 1 e 2** do handoff anterior (mensagem falsa, escada legível) — independentes, podem ir agora como **v0.20**.
2. **Este handoff** — seletor, como **v0.21**.
3. **Frente 3** (probabilidades sob os inputs) — como **v0.22**, ou junto do passo 2, já que ambos editam o mesmo markup dos campos de odd. Fundir os dois é defensável e evita mexer duas vezes no mesmo lugar.

**Não** mandar a frente 3 antes deste handoff. Ela seria construída sobre um mapeamento de índice prestes a mudar.

## Verificação

- `npm run typecheck`, `npm run build`, `npm run lint` limpos.
- `npx tsx scripts/verify-engine.ts` — **11/11 sem alteração de valor**, depois 12/12 com o fixture novo.
- Mercado 1X2 em 2.50 / 3.30 / 2.80, sua odd 3.50: selecionar **Empate** e conferir que `Prob. justa` passa a ~28,3%, `Odd justa` a ~3,53, e que `Decomposição` nomeia "Empate".
- Selecionar cada uma das três vias em sequência: as probabilidades justas não podem mudar entre seleções (o de-vig é do mercado inteiro), só qual delas é lida.
- Remover a via selecionada e conferir que o "avaliado" vai para a primeira, visivelmente — não em silêncio.
- Navegação por setas dentro do grupo de radios; leitor de tela anuncia "Avaliar Empate", não só "Empate".
- Carregar os dois exemplos do topo da aba e conferir que ainda funcionam com as chaves novas.
- Bump para `0.21` e commit **no Windows**. Nenhum comando git pelo sandbox.
