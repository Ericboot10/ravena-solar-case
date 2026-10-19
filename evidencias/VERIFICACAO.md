# Verificação: landing page Ravena Solar

Data: 19/10/2026. Ambiente: macOS 26.6.2, Google Chrome 155 (headless, via DevTools Protocol) e o navegador do Claude Desktop, com a página servida localmente (`python3 -m http.server 8765`).

**Resultado: 55 de 55 testes automatizados passaram.** Os detalhes de cada teste estão em [`resultados-testes.json`](resultados-testes.json).

## Como repetir

1. Na raiz do projeto, rode `python3 -m http.server 8765`.
2. Crie uma pasta de arquivos de teste **fora do repositório** com:
   - `conta-teste.pdf`: um PDF pequeno qualquer;
   - `arquivo.txt`: um texto qualquer;
   - `grande.pdf`: um arquivo acima de 10 MB (por exemplo, `mkfile -n 11m grande.pdf`).

   Esses anexos de teste não entram no repositório.
3. Rode:
   ```bash
   node --experimental-websocket evidencias/verificar.mjs http://localhost:8765/ evidencias <pasta-dos-arquivos-de-teste>
   ```

O script [`verificar.mjs`](verificar.mjs) não tem dependências: ele abre o Chrome em modo headless, tira as capturas e grava o JSON.

## Capturas

As capturas ficam em `capturas/celular/` (390 × 844, densidade 2x, emulação de celular) e `capturas/desktop/` (1440 × 900).

| Arquivo | O que mostra |
|---|---|
| `00-pagina-inteira.png` | Página inteira no estado final (movimento reduzido) |
| `01-abertura.png` | Abertura: região, equipe própria, botão principal e ficha da empresa |
| `02-provas.png` | 412 sistemas, nota 4,8 com 137 avaliações, 6 anos, 11 pessoas (após a contagem) |
| `03a-caso-durante-rolagem.png` | Gráfico do caso de Sorocaba no meio da animação ligada ao scroll |
| `03b-caso-final.png` | Gráfico no estado final: R$ 780 para R$ 118, 85%, R$ 662/mês, R$ 7.944 em 12 meses |
| `04a-calculadora-1200.png` | Estimativa de economia para conta de R$ 1.200 |
| `04b-calculadora-abaixo-450.png` | Conta de R$ 350: aviso de que abaixo de R$ 450 geralmente não compensa |
| `05a-trilha-em-andamento.png` | Trilha de execução no meio: etapas 1 e 2 concluídas, 3 em destaque |
| `05b-trilha-completa-e-garantias.png` | Trilha completa e garantias (5 anos com infiltração em destaque) |
| `06-faq-aberta.png` | FAQ com a pergunta sobre a Lei 14.300 aberta |
| `07a-formulario.png` | Formulário vazio com os próximos passos |
| `07b-formulario-erros-vazio.png` | Envio vazio: resumo de erros e mensagens em cada campo |
| `07c-formulario-erros-e-aviso-450.png` | WhatsApp incompleto, cidade vazia e aviso de conta abaixo de R$ 450 (sem bloquear) |
| `08-formulario-sucesso.png` | Mensagem de sucesso com o aviso de que é uma demonstração |

## Testes automatizados

| Grupo | O que foi verificado | Resultado |
|---|---|---|
| Layout | Sem rolagem lateral nem elementos cortados em 320, 360, 390, 600, 768, 960, 1024, 1280, 1440 e 1920px | 10/10 |
| Cabeçalho | Botão "Pedir minha simulação" visível em 0%, 25%, 50%, 75% e 100% da rolagem; barra de progresso indo de 0 a 1 | 2/2 |
| Links | Os 11 links internos têm seção de destino | 1/1 |
| Botões | Botão do cabeçalho, botão da abertura e link "Quero o cálculo" levam ao formulário e põem o foco no campo Nome | 3/3 |
| FAQ | As 7 perguntas abrem e fecham por clique; abre com Enter e fecha com Espaço; `aria-expanded` atualizado | 2/2 |
| Teclado | Tab começa em "Pular para o conteúdo", segue logo, menu e botões com contorno de foco de 2px; no formulário, a ordem é Nome → WhatsApp → Cidade → Conta → Arquivo → Enviar | 2/2 |
| Formulário | Envio vazio mostra os 4 erros e foca o resumo; mostra erro claro para nome com 1 letra, WhatsApp com 9 dígitos, celular sem 9, conta com letras, conta zero e conta acima de R$ 100 mil; recusa `.txt` e PDF acima de 10 MB e aceita PDF pequeno; preserva os dados após erro; aceita "1.200,50"; aplica a máscara do WhatsApp; conta de R$ 300 mostra o aviso e **ainda pode ser enviada**; o sucesso fala em WhatsApp no mesmo dia útil e visita sem compromisso, deixa claro que nada foi enviado e **não faz nenhuma requisição de rede**; "Revisar meus dados" volta com os dados preenchidos | 19/19 |
| Calculadora | R$ 600 dá economia de R$ 450 a R$ 540/mês (75% a 90%); o aviso aparece abaixo de R$ 450 e some em R$ 450 | 2/2 |
| Caso real | O gráfico vai de R$ 780 (início) a R$ 200 (meio) e R$ 118 (fim) conforme a rolagem; valores finais de 85%, R$ 662 e R$ 7.944 | 2/2 |
| Execução | As etapas concluídas vão de 0 a 2, 3 e 4 conforme a rolagem | 1/1 |
| Provas | Contadores terminam em 412, 4,8, 6 e 11 | 1/1 |
| Movimento reduzido | Com `prefers-reduced-motion`, tudo aparece no estado final, sem trilho fixo | 1/1 |
| Sem JavaScript | Conteúdo visível e valores finais escritos no HTML | 1/1 |
| Promessas | Nenhum termo proibido ou dado deixado de fora aparece na página; todos os dados exigidos pelo SPEC aparecem (ver abaixo) | 2/2 |
| Tipografia | Uma única família (Georgia); só pesos 400 e 700; nenhum texto abaixo de 12px | 3/3 |
| Tipografia | `tabular-nums` em Georgia (informativo): **sem efeito**; "111" mede 129px e "000" mede 184px | registrado |
| Cor | Amarelo só no botão do cabeçalho, botão da abertura, botão de envio, barra de progresso e trilha; nunca como cor de texto | 1/1 |
| Console | Nenhum erro de JavaScript | 1/1 |

## Contraste (WCAG)

Calculado a partir dos tokens do `DESIGN.md`:

| Combinação | Razão | Resultado |
|---|---|---|
| Marinho `#123A55` sobre branco | 11,9:1 | AAA |
| Marinho sobre `--surface` `#F3F6F8` | 11,0:1 | AAA |
| `--text-muted` `#4A5F70` sobre branco | 6,6:1 | AA |
| `--text-muted` sobre `--surface` | 6,1:1 | AA |
| Texto marinho sobre o botão âmbar `#F2A03D` | 5,6:1 | AA |
| Erro `#B3261E` sobre branco | 6,5:1 | AA |
| Sucesso `#0B6B3A` sobre branco | 6,6:1 | AA |
| Âmbar sobre o trilho marinho (barra de progresso e trilha) | 5,6:1 | ≥ 3:1 para gráficos |
| Branco sobre âmbar | 2,1:1 | não usado |

## Promessas da página x brief

| Dado do brief | Na página |
|---|---|
| 412 sistemas residenciais | Provas, FAQ |
| Nota 4,8 no Google, com 137 avaliações | Provas (sem link, pois o brief não traz o endereço do perfil) |
| Seis anos, onze pessoas com carteira assinada, sem terceirizar | Abertura, ficha da empresa, provas, FAQ |
| Caso de Sorocaba: R$ 780 para média de R$ 118, 6,4 kWp, março de 2025 | Caso real. 85%, R$ 662 e R$ 7.944 são contas feitas a partir desses números e estão identificadas como tal |
| Redução média de 75% a 90%, sem conta zerada | Investimento, calculadora, caso real ("Ela não zerou") |
| Retorno de 3 a 4 anos; vida útil acima de 25 anos | Investimento, FAQ |
| Investimento de R$ 14 mil a R$ 19 mil | Investimento |
| 45 a 60 dias; instalação em 2 dias | Execução (barras na mesma escala e trilha) |
| Garantias de 25, 10 e 5 anos, com infiltração causada pela obra | Garantias, FAQ do telhado |
| Financiamento com dois bancos e entrada zero sujeita aos bancos | Investimento |
| Contas abaixo de R$ 450 geralmente não compensam, sem bloquear | Abertura, calculadora, seção do formulário, aviso no campo |
| Resposta por WhatsApp no mesmo dia útil; visita sem compromisso | Próximos passos e mensagem de sucesso |
| Não vende bateria | FAQ |

Ficaram fora, por decisão registrada no `SPEC.md`: ticket médio, sistema típico, detalhamento da conta residual, fotos, vídeos e assistência autorizada (sem material disponível), três tamanhos de proposta, acompanhamento no primeiro ano e limites de atendimento. O teste "Promessas" confirma que nenhum deles aparece. A página também não usa "grátis", "sustentabilidade", "energia do futuro", "revolução solar", promessa de 95% nem urgência artificial.

## Problemas encontrados e corrigidos durante a verificação

1. A mensagem de sucesso e o formulário apareciam juntos: `display: grid` anulava o atributo `hidden`. Corrigido com `[hidden] { display: none !important; }`.
2. A calculadora cortava a 320px, porque os valores não quebravam linha. Corrigido.
3. O trilho da trilha passava do último marcador no celular, e os checks não batiam com o preenchimento. Agora o trilho é medido entre o primeiro e o último marcador, e cada etapa é marcada pela posição real.
4. No desktop (1440 × 900), o botão da abertura ficava abaixo da primeira tela. O título máximo caiu de 80px para 64px.
5. O card do caso ficava colado no topo, com espaço vazio embaixo, no desktop. Agora ele fica centralizado na tela.
6. O "R$" quebrava a linha separado do número. Agora usa espaço sem quebra.
7. O botão de arquivo aparecia em inglês ("Choose File"). Foi substituído por "Escolher arquivo".
8. O campo de valor tinha borda dupla, e o "R$ 7.944" tinha um espaço grande antes do número. Os dois foram corrigidos.

## Pendências

- **A página ainda não está publicada.** Ela será publicada na Vercel (configuração em `vercel.json` e passo a passo no `README.md`). Depois de publicar, falta conferir a URL no celular e no desktop.
- **O repositório [Ericboot10/ravena-solar-case](https://github.com/Ericboot10/ravena-solar-case) não inclui o `brief.md`**, que é material da prática; ele fica só na máquina local.
- **O formulário não tem destino real**, por decisão do SPEC (somente front-end). Não houve, nem pode haver, "recebimento real da solicitação". A página avisa que é uma demonstração.
- **Testado só no Chrome.** Faltam Safari (macOS e iPhone real), Firefox e leitores de tela reais (VoiceOver, NVDA). A acessibilidade foi checada pela estrutura (labels, `aria-*`, ordem de foco, contraste), não com um leitor de tela.
- **Números em Georgia:** os algarismos têm larguras diferentes, então os contadores variam de largura durante a animação. O efeito é contido pelo alinhamento à direita, mas não é zero.
- **Caso real:** não existe série mês a mês no brief. O gráfico mostra só o antes (R$ 780) e a média depois (R$ 118); os valores intermediários aparecem apenas durante a animação.
