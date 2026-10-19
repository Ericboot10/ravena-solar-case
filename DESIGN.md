# DESIGN.md

Landing page **Ravena Solar**.
Tom: tecnológico, minimalista, moderno. Somente tema claro.

Este arquivo é a fonte das decisões visuais. O CSS (`assets/css/styles.css`, a criar) deve seguir os valores daqui, e não o contrário. Conteúdo e escopo: `SPEC.md`. Regras de trabalho: `CLAUDE.md`.

## Princípios

1. **Uma família tipográfica.** Só Georgia. A hierarquia vem de tamanho, peso (400 ou 700), caixa-alta e tracking, nunca de outra fonte.
2. **Amarelo tem missão.** Significa "dá para clicar" ou "isto avançou". Decoração, links, gráficos e rótulos ficam neutros.
3. **Tudo vira métrica.** Números grandes, rótulo pequeno em caixa-alta. Só dados do `brief.md`.
4. **O scroll é dinâmico.** Cada seção reage à rolagem; movimento sempre ligado ao progresso, nunca gratuito.
5. **Tokens, não hex.** Todo componente usa variáveis. Nenhuma cor solta no CSS.
6. **Sem dependências.** HTML, CSS e JavaScript puros, tudo client-side.
7. **Português**, salvo termos em inglês mais cômodos ou já consolidados.

## Cor

Paleta extraída de `material/logo.svg`: marinho `#123A55` (painel e "RAVENA"), âmbar `#F2A03D` (sol) e laranja `#E8721C` ("SOLAR").

| Token | Valor | Uso |
|---|---|---|
| `--navy` | `#123A55` | Títulos, texto principal, links, gráficos, painéis |
| `--cta` | `#F2A03D` | **Só** botão "Pedir minha simulação", barra de progresso e trilha percorrida |
| `--on-cta` | `#123A55` | Texto e ícones sobre `--cta` |
| `--bg` | `#FFFFFF` | Fundo da página |
| `--surface` | `#F3F6F8` | Cards e seções alternadas |
| `--text-muted` | `#4A5F70` | Texto de apoio e labels |
| `--line` | `rgba(18, 58, 85, .16)` | Bordas e divisores (decorativos) |
| `--error` | `#B3261E` | Erros do formulário |
| `--success` | `#0B6B3A` | Mensagem de sucesso |

O laranja `#E8721C` **não entra na interface**; ele só aparece na logo. Duas cores quentes disputariam o destaque do botão.

### Regra do amarelo (`--cta`)

- **Usar:** botão primário (cabeçalho, abertura e formulário), barra de progresso do cabeçalho e trilha de execução já percorrida.
- **Não usar:** links (marinho, sublinhados), gráficos (marinho e `--text-muted`), rótulos, ícones decorativos e fundos de seção.
- **Nunca** como cor de texto: sobre fundo claro ele dá apenas 2,1:1.
- Em qualquer tela, ele deve ser a cor mais rara; é por isso que o olho vai até ele.

### Contraste (WCAG, calculado)

| Combinação | Razão | Resultado |
|---|---|---|
| `--navy` sobre `--bg` | 11,9:1 | passa (AAA) |
| `--navy` sobre `--surface` | 11,0:1 | passa (AAA) |
| `--text-muted` sobre `--bg` | 6,6:1 | passa (AA) |
| `--text-muted` sobre `--surface` | 6,1:1 | passa (AA) |
| `--on-cta` (marinho) sobre `--cta` | 5,6:1 | passa (AA) |
| `--error` sobre `--bg` | 6,5:1 | passa (AA) |
| `--success` sobre `--bg` | 6,6:1 | passa (AA) |
| Branco sobre `--cta` | 2,1:1 | **falha: não usar** |
| `--cta` sobre `--bg` | 2,1:1 | **falha: não usar para texto nem como único limite** |

Como o âmbar sobre branco não atinge 3:1 para elementos gráficos, a barra de progresso e a trilha usam um **trilho marinho** por baixo (âmbar sobre marinho: 5,6:1), em vez de âmbar solto sobre branco.

## Tipografia

`--font: Georgia, "Times New Roman", serif;`

| Papel | Tamanho | Peso | Tracking | Altura de linha |
|---|---|---|---|---|
| Display | `clamp(30px, 4.6vw, 64px)` | 700 | -.035em | 1,05 |
| Título de seção | `clamp(26px, 4.4vw, 56px)` | 700 | -.03em | 1,1 |
| Título de card | 18–26px | 700 | -.015em | 1,2 |
| Corpo | 17px | 400 | 0 | 1,6 |
| Apoio | 14–15px | 400 | 0 | 1,5 |
| Label (caixa-alta) | 12–13px | 400 | .08–.14em | 1,3 |

- Georgia só tem os pesos 400 e 700; não usar 500, pois renderiza como 400.
- Mínimo de 12px em qualquer texto; nada abaixo disso, nem em labels.
- Os mínimos dos `clamp` (26–28px) já valem para o celular, sem regra separada.
- **Números de métrica:** testado no Chrome: `tabular-nums` **não tem efeito** em Georgia ("111" e "000" medem 129px e 184px a 100px, com ou sem a propriedade). Por isso os números animados ficam alinhados à direita, onde a variação de largura só move a borda esquerda, sem empurrar o layout.
- O display máximo ficou em 64px para o botão da abertura aparecer na primeira tela em 1440 × 900.
- O valor final de cada número fica escrito no HTML; o JavaScript só anima até ele.

## Espaçamento e forma

- Escala: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 72 px.
- Gutter `clamp(16px, 4vw, 48px)`; largura máxima 1240px.
- Breakpoints: 600px (celular para tablet) e 960px (tablet para desktop). Projetar mobile primeiro.
- Raios pequenos: 2 / 4 / 6px. Bordas de 1px; divisores internos tracejados.
- Alvo de toque mínimo de 44 × 44px em botões, links de navegação e itens do FAQ.

## Movimento

- Easing `cubic-bezier(.16, 1, .3, 1)`; durações .18s (cor), .4s (estado), .9s (revelação).
- Animações ligadas ao scroll: barra de progresso, trilha com checks, gráfico do caso e contadores.
- Com `prefers-reduced-motion: reduce`, nada anima: cada elemento aparece direto no estado final.
- Sem JavaScript, a página continua legível, com os valores finais no HTML.

## Componentes

**Logo.** Usar `material/logo.svg` (fundo transparente); o PNG tem fundo branco. Não recolorir nem distorcer. Altura mínima de 32px no cabeçalho e margem livre em volta de pelo menos a altura do sol. Não reaproveitar nada mais do site antigo.

**Cabeçalho.** Fixo no topo, fundo `--bg`, borda inferior `--line`. Logo à esquerda e botão "Pedir minha simulação" à direita, sempre visível. A barra de progresso (4px, trilho `--navy`, preenchimento `--cta`) fica na base do cabeçalho e cresce com a rolagem.

**Botão primário.** Fundo `--cta`, texto `--on-cta` em 700, altura mínima 48px, raio 4px. Hover: leve elevação e escurecimento; foco: contorno de 2px `--navy` com 2px de distância. Rola suavemente até o formulário final.

**Botão secundário e links.** Texto `--navy` com sublinhado; sem preenchimento amarelo.

**Card de métrica.** Fundo `--surface`, borda `--line`, número grande em `--navy`, label em caixa-alta `--text-muted`.

**Gráfico do caso (Sorocaba).** Duas barras: "antes" (R$ 780) em `--text-muted` e "depois" (R$ 118, média) em `--navy`. Valores escritos sobre as barras, não só por cor. Anima do zero até o valor ao entrar na tela. Dados do `brief.md`, sem inventar séries.

**Trilha de execução.** Quatro etapas (projeto, homologação, instalação, acompanhamento) em linha vertical no celular e horizontal no desktop. Trilho `--navy`; etapa concluída com marcador `--cta` e check `--on-cta`; etapa atual com contorno. Mostra o prazo total de 45 a 60 dias, dos quais a instalação ocupa dois.

**FAQ.** Acordeão com `<button>` e `aria-expanded`/`aria-controls`; abre por clique, Enter e Espaço. Divisores `--line`. Fica no final da página, logo antes do formulário, que é a última seção (conforme o `SPEC.md`).

**Formulário.** Seção final, para onde levam os botões. Label sempre visível acima do campo (nunca só placeholder). Campo com borda 1px `--navy` e altura mínima 48px. Foco: contorno 2px `--navy`. Erro: texto `--error` abaixo do campo, mais borda `--error` e ícone, sem depender só da cor. Os dados digitados são preservados quando há erro. Sucesso: bloco `--success` na própria página. Somente front-end; nada é enviado.

## Acessibilidade (resumo)

- Contraste mínimo 4,5:1 para texto e 3:1 para elementos gráficos.
- Foco visível em todo elemento interativo; ordem de tabulação igual à ordem visual.
- Landmarks (`header`, `main`, `section` com título, `footer`) e um único `h1`.
- Informação nunca só por cor.
- Verificar no celular e no desktop, sem cortes nem sobreposições.
