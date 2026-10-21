# Verificação: landing page Ravena Solar

Data: 19/10/2026, atualizada em 21/10/2026 com a integração do formulário com a planilha. Ambiente: macOS 26.6.2, Google Chrome 155 (headless, via DevTools Protocol) e o navegador do Claude Desktop, com a página servida localmente (`python3 -m http.server 8765 --bind 127.0.0.1`).

**Resultado: 62 de 62 testes automatizados da página e 13 de 13 testes do Apps Script passaram.** Os detalhes de cada teste da página estão em [`resultados-testes.json`](resultados-testes.json).

O envio foi testado contra um **endpoint local que imita o app da Web do Apps Script** ([`endpoint-teste.py`](endpoint-teste.py)): ele recebe o POST, grava o que chegou e redireciona para a resposta, como o Google faz. O script do Apps Script foi testado em Node, com planilha, Drive e e-mail simulados ([`verificar-apps-script.mjs`](verificar-apps-script.mjs)). Em 21/10/2026, depois da implantação na conta Google, também foi feito o **teste de ponta a ponta com a planilha real** (ver "Integração real com a planilha").

## Como repetir

1. Na raiz do projeto, rode `python3 -m http.server 8765 --bind 127.0.0.1` (o `--bind` impede que a pasta fique acessível na rede local).
2. Crie uma pasta de arquivos de teste **fora do repositório** com:
   - `conta-teste.pdf`: um PDF pequeno qualquer;
   - `arquivo.txt`: um texto qualquer;
   - `medio.pdf`: um arquivo de 4,4 MB, abaixo do limite (por exemplo, `mkfile -n 4400k medio.pdf`);
   - `grande.pdf`: um arquivo acima de 4,5 MB (por exemplo, `mkfile -n 5m grande.pdf`).

   Esses anexos de teste não entram no repositório.
3. Em outro terminal, suba o endpoint de teste: `python3 evidencias/endpoint-teste.py <arquivo-de-log>`.
4. Rode:
   ```bash
   node --experimental-websocket evidencias/verificar.mjs http://127.0.0.1:8765/ evidencias <pasta-dos-arquivos-de-teste> http://127.0.0.1:8766 <arquivo-de-log>
   ```
5. Para o Apps Script: `node evidencias/verificar-apps-script.mjs integracao/apps-script.gs`.

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
| `07d-formulario-falha-de-envio.png` | Falha de rede: mensagem de erro acima do botão, com os dados mantidos |
| `08-formulario-sucesso.png` | Sucesso: encaminhamento ao WhatsApp da equipe, análise, retorno em até 24 horas e o número informado |

## Testes automatizados

| Grupo | O que foi verificado | Resultado |
|---|---|---|
| Layout | Sem rolagem lateral nem elementos cortados em 320, 360, 390, 600, 768, 960, 1024, 1280, 1440 e 1920px | 10/10 |
| Cabeçalho | Botão "Pedir minha simulação" visível em 0%, 25%, 50%, 75% e 100% da rolagem; barra de progresso indo de 0 a 1 | 2/2 |
| Links | Os 11 links internos têm seção de destino | 1/1 |
| Botões | Botão do cabeçalho, botão da abertura e link "Quero o cálculo" levam ao formulário e põem o foco no campo Nome | 3/3 |
| FAQ | As 7 perguntas abrem e fecham por clique; abre com Enter e fecha com Espaço; `aria-expanded` atualizado | 2/2 |
| Teclado | Tab começa em "Pular para o conteúdo", segue logo, menu e botões com contorno de foco de 2px; no formulário, a ordem é Nome → WhatsApp → Cidade → Conta → Arquivo → Enviar | 2/2 |
| Formulário | Envio vazio mostra os 4 erros e foca o resumo; mostra erro claro para nome com 1 letra, WhatsApp com 9 dígitos, celular sem 9, conta com letras, conta zero e conta acima de R$ 100 mil; recusa `.txt` e PDF de 5 MB, aceita e envia PDF de 4,4 MB e PDF pequeno; preserva os dados após erro; aceita "1.200,50"; aplica a máscara do WhatsApp; conta de R$ 300 mostra o aviso e **ainda pode ser enviada**; o envio faz **um único POST `text/plain`** (sem requisição prévia) com nome, WhatsApp só com dígitos, cidade, conta em número e anexo; o sucesso fala em WhatsApp da equipe, análise, até 24 horas e visita sem compromisso, com o primeiro nome e o número informado; a página não fala mais em "mesmo dia útil" nem em demonstração; falha de rede e erro devolvido pelo Apps Script aparecem com os dados mantidos; sem endpoint configurado, avisa que o envio está indisponível e não mostra sucesso; o botão mostra "Enviando…" e fica desativado durante o envio; o campo isca fica fora da tela, do Tab e da leitura de tela | 26/26 |
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
| Resposta por WhatsApp em até 24 horas (prazo alterado a pedido do cliente; o brief dizia "no mesmo dia útil"); visita sem compromisso | Próximos passos e mensagem de sucesso |
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

## Apps Script (`integracao/apps-script.gs`)

Testado em Node com os serviços do Google simulados: 13 de 13 testes passaram.

| O que foi verificado |
|---|
| Pedido válido grava o cabeçalho e a linha (WhatsApp formatado, faixa "Sim", status "Novo") e envia o e-mail para a dona da conta |
| A propriedade `EMAIL_AVISO` define o destino do e-mail; conta abaixo de R$ 450 fica marcada "Não" e o e-mail avisa; o anexo é salvo na pasta e o link vai para a planilha |
| Anexo acima de 4,5 MB e tipo de arquivo inválido são recusados com mensagem |
| Nome curto, WhatsApp curto, cidade fora da lista, conta zero e conta em texto são recusados sem gravar |
| Campo isca preenchido responde "ok" sem gravar nem enviar e-mail |
| Nome começando com `=` é gravado como texto, não como fórmula |
| Corpo que não é JSON devolve um erro genérico; `doGet` responde "ok" |

Problema encontrado e corrigido nesta rodada: o teste do PDF de 4,4 MB travava o script de verificação, porque o Chrome repassava o corpo inteiro do POST (6 MB em base64) pela conexão de depuração. O `verificar.mjs` agora limita esse repasse (`maxPostDataSize`). O envio em si funcionava: o endpoint de teste recebeu o arquivo inteiro.

## Integração real com a planilha

Em 21/10/2026, o Apps Script foi implantado na conta Google da Ravena (planilha "Ravena Solar · Leads", projeto "Ravena Solar · Leads (site)"), como app da Web, com "Executar como: Eu" e "Quem pode acessar: Qualquer pessoa". A URL foi colocada no `data-endpoint` do formulário.

| Verificação | Resultado |
|---|---|
| `GET` na URL do app, sem login | `{"ok":true,"servico":"Ravena Solar · simulações"}` |
| Envio pela página local, sem anexo (Sorocaba, R$ 780) | Sucesso na página em 4 s; linha gravada com WhatsApp formatado, faixa "Sim" e status "Novo" |
| Envio pela página local, com PDF (Itu, R$ 320, telefone fixo) | Sucesso na página em 7,5 s; linha gravada com faixa "Não" e link do arquivo no Drive |
| Link do anexo aberto sem login | 401: o arquivo só abre na conta dona |

Os dois pedidos de teste se chamam "(pode apagar)" e podem ser removidos da planilha. A primeira implantação saiu com "Quem pode acessar: Somente eu", e a URL pedia login; o acesso foi corrigido em "Gerenciar implantações" antes dos testes.

## Publicação

> As conferências abaixo são da versão de 19/10/2026, ainda sem a integração com a planilha. A versão nova ainda não foi publicada.

A página está publicada na Vercel em <https://ravena-solar-case.vercel.app/>. Em 19/10/2026, logo após o deploy de produção do commit `2e988fb` (lista de permissão no `.vercelignore`), as respostas da URL foram conferidas com `curl`:

| Verificação | Resultado |
|---|---|
| `/`, `/assets/css/styles.css`, `/assets/js/main.js`, `/material/logo.svg` | 200 |
| `/SPEC.md`, `/README.md`, `/CLAUDE.md`, `/DESIGN.md`, `/brief.md` | 404 |
| `/evidencias/VERIFICACAO.md`, `/evidencias/verificar.mjs`, `/evidencias/resultados-testes.json` | 404 |
| `/material/logo.png`, `/.vercelignore`, `/vercel.json`, `/.gitignore`, `/.claude/launch.json` | 404 |
| `/index.html` e `/index` | 308 para `/` (URLs limpas) |
| Cabeçalhos em `/` | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` presentes |

Os deploys de prévia (branches e pull requests) ficam atrás da proteção de deploy da Vercel e pedem login; a conferência foi feita só em produção.

### Página publicada no celular e no desktop

Também em 19/10/2026, a mesma bateria de testes rodou contra a URL de produção:

```bash
node --experimental-websocket evidencias/verificar.mjs https://ravena-solar-case.vercel.app/ evidencias/producao <pasta-dos-arquivos-de-teste>
```

**Resultado: 55 de 55 testes passaram em produção.** Os detalhes estão em [`producao/resultados-testes.json`](producao/resultados-testes.json), e as 28 capturas da página no ar estão em `producao/capturas/celular/` (390 × 844) e `producao/capturas/desktop/` (1440 × 900), com os mesmos nomes da tabela de capturas acima.

Antes disso, uma conferência com `curl` mostrou que o `index.html`, o `styles.css` e o `main.js` publicados são idênticos, byte a byte, aos do repositório.

Em produção, o envio do formulário também não fez nenhuma requisição de rede, e o console não mostrou nenhum erro de JavaScript. Também não houve rolagem lateral em nenhuma das larguras testadas, de 320 a 1920px.

## Pendências

- **Celular e desktop reais:** a página publicada foi testada no Chrome com emulação de celular (390 × 844) e em desktop (1440 × 900), mas não em um aparelho físico.
- **O repositório [Ericboot10/ravena-solar-case](https://github.com/Ericboot10/ravena-solar-case) não inclui o `brief.md`**, que é material da prática; ele fica só na máquina local.
- **E-mail de aviso:** os pedidos de teste chegaram à planilha e ao Drive, mas a chegada do e-mail na caixa de entrada não foi conferida daqui.
- **WhatsApp:** a página diz que os dados vão ao WhatsApp da equipe, mas não há envio automático (decisão do case, registrada no `SPEC.md`). O aviso real é o e-mail.
- **Publicar a versão nova** na Vercel e repetir a bateria em produção.
- **Testado só no Chrome.** Faltam Safari (macOS e iPhone real), Firefox e leitores de tela reais (VoiceOver, NVDA). A acessibilidade foi checada pela estrutura (labels, `aria-*`, ordem de foco, contraste), não com um leitor de tela.
- **Números em Georgia:** os algarismos têm larguras diferentes, então os contadores variam de largura durante a animação. O efeito é contido pelo alinhamento à direita, mas não é zero.
- **Caso real:** não existe série mês a mês no brief. O gráfico mostra só o antes (R$ 780) e a média depois (R$ 118); os valores intermediários aparecem apenas durante a animação.
