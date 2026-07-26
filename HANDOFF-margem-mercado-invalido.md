# Handoff — Margem divergente e mercado inválido tratado como oportunidade (v0.21.1)

> Planejamento 2026-07-25 · Base: v0.21
> Escopo: `src/components/tabs/NResultsTab.tsx`, `src/lib/calc.ts`, `scripts/verify-engine.ts`
> Duas frentes. A primeira é regressão introduzida na v0.21; a segunda é anterior e mais grave.

---

## Frente 1 · P0 — A margem aparece com dois valores diferentes na mesma tela

### Sintoma

Mercado Over/Under com 2.50 e 3.30, odd da casa 3.50:

- card `MARGEM`: **−29,70%**
- alerta no card de odds: **"Margem Negativa / Arbitragem (−1.1%)"**

O card está certo — vem de `dv.M` no motor, que é `Σ(1/odd) − 1` sobre as odds do mercado. O alerta está errado.

### Causa

`src/components/tabs/NResultsTab.tsx:87-93`:

```ts
const sumProb = useMemo(() => {
  if (oddsNums.length < 2) return null;
  const yourOdd = Number(values["nres-your"]?.replace(",", ".") || 0);
  if (yourOdd <= 1) return null;
  const prob = 1 / yourOdd + oddsNums.reduce((s, o) => s + 1 / o, 0);
  return prob;
}, [values["nres-your"], oddsNums]);
```

O termo `1 / yourOdd` soma a odd da **sua casa** ao mercado de referência, do qual ela não faz parte.

Confere com o print: `1/2,50 + 1/3,30 = 0,703`, mais `1/3,50 = 0,286`, dá `0,989` → −1,1%.

**É regressão da v0.21.** No modelo antigo o termo somado era `1 / evalOdd`, onde `evalOdd` vinha de `nres-eval` — que *era* uma das odds do mercado. A soma dava o mercado completo e estava correta (os prints da v0.19 mostram "Overround: 6.0%" para 2.50/3.30/2.80, valor certo). Ao migrar para `nres-odds`, a lista passou a conter o mercado inteiro e o termo extra tornou-se indevido; em vez de ser removido, foi substituído pela variável errada.

### Correção estrutural (preferida)

A divergência só foi possível porque existem **duas implementações da mesma grandeza**: `dv.M` no motor e `sumProb` na aba. Enquanto as duas existirem, elas voltam a divergir.

A aba `nres` é reativa (não está em `LAZY_TABS`), então `result` acompanha os inputs. Ler a margem do resultado:

```ts
const marketMargin = result && !('err' in result) ? result.M : null;
```

e usar `marketMargin` no alerta, trocando as comparações de `sumProb > 1.2` / `< 1.0` por `marketMargin > 0.2` / `< 0` — a mesma grandeza deslocada de 1.

Efeito colateral aceito: com menos de duas odds válidas o `calcNres` devolve `err` e o alerta some, que é o mesmo comportamento do guard atual. Pode haver um render de atraso ao digitar; se isso incomodar no preview, cair para a correção local abaixo.

### Correção local (alternativa)

Se preferir manter o cálculo na aba, é uma linha — remover o termo e o guard que ficou sem função:

```ts
const sumProb = useMemo(() => {
  if (oddsNums.length < 2) return null;
  return oddsNums.reduce((s, o) => s + 1 / o, 0);
}, [oddsNums]);
```

Resolve o número, **não** resolve a duplicação.

---

## Frente 2 · P0 — Mercado impossível vira recomendação de stake máxima

### Sintoma

No mesmo print, com o mercado somando 70,3% das probabilidades, a coluna de resultado mostra:

```
Aprovada · R$ 50,00 · 5,00u
EV +93,26% · Kelly 37,31% → 5,00% · 100% do teto
```

Over 2.50 e Under 3.30 não são o mesmo mercado — falta 30 pontos de probabilidade. O de-vig normaliza `0,4 / 0,703 = 55,22%` para o Over, e é essa massa faltante que produz o EV de +93%. O número está matematicamente correto dado o input; o input é que não descreve mercado nenhum.

Entrada inválida entrando, recomendação máxima e confiante saindo. Para uma calculadora de stake é o pior modo de falha: pior que o painel fabricado da v0.18, porque ali o número era falso e aqui ele é verdadeiro-dado-um-pressuposto-falso, o que é mais difícil de duvidar.

### Por que não é pego hoje

Dois lugares deixam passar:

**1. A faixa do alerta não tem piso.** `NResultsTab.tsx:249` classifica qualquer `sumProb < 1.0` como "Margem Negativa / Arbitragem — odds fantásticas ou oportunidade clara de arbitragem", em verde. Arbitragem real vive entre −0,5% e −3%; três vias raramente passam de −2%. Uma soma de 70% cai no mesmo balde que uma de 99%.

**2. `calcNres` afirma confiança alta incondicionalmente.** `calc.ts:220-221`:

```ts
confClass: 'high',
confTxt: `Alta confiança — de-vig real de mercado completo com ${refs.length} vias.`,
```

Com `S = 0,703` a frase "mercado completo" é falsa, e o `confFactor` (`math.ts:56-59`) devolve 1 — nenhum redutor age.

### Correção

**a) Piso na faixa do alerta.** Quarto ramo, em `danger`, antes do ramo de arbitragem:

| soma | rótulo | cor |
|---|---|---|
| `> 1.20` | Erro de Linha: Overround Extremo | danger |
| `> 1.10` | Margem de Casa Salgada | warn |
| `>= 1.00` | Mercado Saudável | neutro |
| `>= 0.95` | Margem Negativa / Arbitragem | accent |
| `< 0.95` | **Erro de Linha: as odds não formam um mercado completo** | **danger** |

Texto de apoio do ramo novo: *"A soma das probabilidades é de X%. Faltam vias, ou as odds são de mercados diferentes. Verifique antes de apostar."* — em vez de sugerir oportunidade.

O piso de 0,95 é generoso de propósito (arbitragens reais dificilmente passam de 3%). Deixar como constante nomeada no topo do arquivo, não literal solto.

**b) O motor deixa de afirmar confiança alta sobre mercado implausível.** Em `calcNres`, antes do `makeBetBase`:

```ts
const S = refs.reduce((a, o) => a + 1 / o, 0);
const implausible = S < 0.95 || S > 1.20;
```

e então:

- `confClass: implausible ? 'low' : 'high'`
- `confTxt`: no caso implausível, dizer a verdade — *"Baixa confiança — as odds somam X% e não descrevem um mercado completo."*
- `warnings`: acrescentar a mesma mensagem. O `makeBetBase` já aceita `warnings` (`calc.ts:184`) e quatro outras funções de cálculo já usam; a `calcNres` é a única que nunca passou nenhum.

Isso usa a máquina que já existe em vez de criar caso especial: `confFactor` devolve 0,35 para `low`, o Kelly ajustado cai para ~1/3, e o `setQuality` passa a devolver "Valor frágil / Cautela" no lugar de "Aprovada". O usuário continua livre para apostar — só deixa de receber selo verde e stake máxima sobre um input quebrado.

**Não** transformar em `{ err }`. Bloquear o cálculo tira do usuário a capacidade de explorar, e arbitragem legítima existe. O objetivo é remover a *confiança*, não a *resposta*.

### Simetria

O ramo `S > 1.20` já é rotulado "Erro de Linha" no alerta, mas hoje também sai com `confClass: 'high'`. A condição `implausible` acima cobre os dois lados de uma vez — é por isso que ela testa as duas pontas.

---

## Impacto nos fixtures

Nenhum dos 12 fixtures atuais tem `S` fora da faixa: fixture 1 = 1,0335, fixture 2 = 1,0533, fixture 12 = 1,0602. **Os 12 devem continuar verdes sem alteração de valor.** Se algum mexer, a condição `implausible` está pegando caso legítimo.

Acrescentar o **fixture 13**: mercado inválido `2.50,3.30` com `sel=0`, `your=3.50` (o caso do print). Verificar `confClass: 'low'`, `warnings.length === 1`, e que `kadj` caiu para cerca de 35% do valor que teria com `high`.

---

## Ordem

1. **Frente 1** — uma linha (ou a versão estrutural), corrige afirmação numérica divergente.
2. **Frente 2a** — piso no alerta.
3. **Frente 2b** — `implausible` no motor + fixture 13.

## Verificação

- `npm run typecheck`, `npm run build`, `npm run lint` limpos.
- `npx tsx scripts/verify-engine.ts` — **12/12 sem alteração de valor**, depois 13/13.
- Reproduzir o print (Over/Under 2.50 e 3.30, sua odd 3.50): a margem tem que ser **−29,70% nos dois lugares**, o alerta tem que estar em vermelho dizendo que não é mercado completo, e o selo tem que sair de "Aprovada".
- Mercado legítimo (1X2 2.50/3.30/2.80, S = 1,0602): alerta segue "Mercado Saudável (6,0%)", `confClass` segue `high`, stake inalterada.
- Arbitragem real (dois lados somando 0,98): alerta segue verde, `confClass` segue `high` — o piso não pode engolir o caso legítimo.
- Bump para `0.21.1` e commit **no Windows**. Nenhum comando git pelo sandbox.
