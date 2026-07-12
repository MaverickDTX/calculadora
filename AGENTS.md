# Calculadora

Aplicacao Vite, React 18, TypeScript estrito e Tailwind para avaliar odds e bet builders.

## Comandos

- `npm run dev` inicia o servidor local.
- `npm run typecheck` valida apenas `src/` com TypeScript estrito.
- `npm run build` gera o build de producao.
- `npm run lint` executa ESLint no repositorio inteiro.
- `npx tsx scripts/verify-basketball.ts` valida o modelo de basquete.

## Estrutura

- `src/components/tabs/`: interfaces das calculadoras.
- `src/hooks/useCalculator.ts`: dispatcher e logica de calculo por aba.
- `src/lib/math.ts`: funcoes matematicas e de-vig compartilhadas.
- `src/lib/sgp/`: modelos multi-esporte e Monte Carlo.
- `src/lib/presets.ts`: exemplos carregaveis pela interface.
- `src/version.ts`: unica fonte da versao exibida no app; incrementar a cada commit.

## Convencoes

- Use `numDec` para entradas decimais brasileiras e preserve a normalizacao de virgula para ponto nos inputs.
- Mantenha a serializacao de pernas em `BetBuilderTab.tsx` compativel: campos de tenis usam os indices 17/18 e margem do basquete usa 19/20.
- Em `src/lib/sgp/`, mantenha as assinaturas publicas dos modelos e reutilize `normPpf`, `normCdf` e as utilidades de Monte Carlo existentes.
- Execute typecheck e build antes de concluir alteracoes de codigo.

## GLM 5.2: Limite de API

Ao usar o GLM 5.2, siga estas regras para respeitar o limite de 40 RPM e evitar erro HTTP 429:

- Nao execute chamadas de ferramentas, comandos ou leituras em paralelo; processe uma tarefa por vez.
- Agrupe leituras e analises relacionadas no menor numero de requisicoes possivel; evite micro-chamadas individuais.
- Antes de interagir com o ambiente, consolide o raciocinio, a logica e o plano de execucao em uma unica etapa de planejamento.
- Se uma ferramenta ou comando falhar, nao tente correcoes consecutivas em loop. Pare, apresente o diagnostico e solicite confirmacao antes de continuar.
