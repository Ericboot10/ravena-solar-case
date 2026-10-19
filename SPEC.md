# Spec: Landing page Ravena Solar

## Objetivo

Criar uma página de venda de energia solar residencial que incentive pedidos de simulação qualificados.

A meta do negócio é passar de 12 para 25 pedidos mensais, reduzindo solicitações de pessoas com conta de luz abaixo de R$ 450. Essa é uma meta, não uma garantia da página.

## Público e proposta

Atender proprietários de casas em Sorocaba, Votorantim, Itu e Salto, com conta de luz acima de R$ 450 e intenção de permanecer no imóvel.

Apresentar a Ravena Solar como uma integradora local com seis anos de atuação, equipe própria e responsabilidade pelo projeto, homologação, instalação e acompanhamento.

**Decisão:** priorizar confiança, números e clareza, porque o principal receio do público é contratar uma empresa que abandone a obra ou desapareça depois.

## Estrutura da página

1. **Abertura:** apresentar o serviço, a região atendida e o diferencial da equipe própria. Usar o botão "Pedir minha simulação", que leva (rolagem suave) ao formulário no final da página.
   1. Esse botão tem que ter uma cor específica que traga protagonismo ao usuário do site. Essa cor deve ser usada menos vezes que as outras, apenas para impulsionar a ação de criar a simulação ou, por exemplo, uma sensação de progresso ao longo da landing page, como uma barra de progresso no cabeçalho com a mesma cor.
2. **Provas de confiança:** destacar 412 sistemas residenciais instalados e nota 4,8 no Google, com 137 avaliações.
3. **Caso real:** mostrar a casa de Sorocaba cuja conta passou de R$ 780 para uma média de R$ 118, com sistema de 6,4 kWp instalado em março de 2025. Pode ser um gráfico dinâmico.
4. **Investimento e economia:** explicar valores, economia esperada, financiamento e custos que permanecem na conta.
5. **Execução e garantias:** apresentar as etapas (projeto, homologação com a distribuidora, instalação e acompanhamento), os prazos e a proteção contra infiltrações causadas pela instalação. Criar uma trilha dinâmica que vai dando check e mostre um tempo médio que condiga com o que está no brief.
6. **Dúvidas frequentes:** responder sobre continuidade da empresa, telhado, cobrança sobre energia injetada, mudança de casa, dias nublados, funcionamento à noite e necessidade de bateria. Criar um FAQ ao final da landing page.
7. **Formulário de simulação:** seção final da página, para onde levam o botão da abertura e o botão do cabeçalho. Repetir a chamada principal, mostrar os campos para o visitante preencher os dados e explicar o próximo passo. O cabeçalho mantém sempre visível a opção de ir ao formulário, a qualquer momento da rolagem. Apenas front-end (ver "Formulário e funcionamento").

## Conteúdo e limites das promessas

Preservar os dados do brief:

- Redução média da conta entre 75% e 90%, sem prometer conta zerada.
- Retorno estimado de três a quatro anos e vida útil superior a 25 anos.
- Prazo total de 45 a 60 dias; a instalação ocupa dois dias desse processo.
- Garantias de 25 anos de performance dos painéis, 10 anos do inversor e cinco anos da instalação, incluindo infiltrações causadas pela obra.
- Financiamento com possibilidade de entrada zero, sujeito às condições dos bancos.

Não oferecer baterias nem serviços fora do escopo informado. Não inventar clientes, avaliações, marcas, contatos ou condições comerciais.

**Decisão:** usar linguagem direta e específica, sem slogans genéricos, urgência artificial ou promessas exageradas. Usar apenas uma família de fontes (Georgia) em toda a landing page.

## Formulário e funcionamento

O objetivo da entrega é apenas a landing page. O formulário é **somente front-end**: não envia os dados a nenhum destino, backend ou serviço externo.

- Campos obrigatórios: nome, WhatsApp, cidade e valor médio mensal da conta de luz. Foto ou PDF da conta é opcional.
- Informar que contas abaixo de R$ 450 geralmente não justificam o investimento, sem bloquear automaticamente essas pessoas.
- Validar os campos no navegador, mostrar erros claros e preservar o que foi digitado quando houver erro.
- Ao enviar com os dados válidos, mostrar a mensagem de sucesso na própria página, sem transmitir nada. A mensagem informa que a resposta acontece por WhatsApp no mesmo dia útil e que a visita técnica é sem compromisso.
- Nenhum dado digitado nem anexo é armazenado ou enviado; o anexo nunca entra no repositório.
- A página não deve afirmar que a solicitação foi recebida pela Ravena Solar, pois não há destino real. Isso fica registrado como pendência fora do escopo (ver "Ficaram de fora").

## Design e implementação

Inspecionar `material/logo` antes de implementar. Reaproveitar apenas a logo para mostrar confiança: ela existe há seis anos, e uma das problemáticas desse mercado é a desconfiança do cliente quanto à continuidade do atendimento depois da instalação, já que a vida útil é de 25 anos.

Extrair a paleta da logo. Criar uma interface responsiva, com leitura confortável no celular, contraste adequado, campos identificados e navegação por teclado.

Salvar as decisões visuais em `DESIGN.md`, incluindo cores, tipografia, espaçamentos e componentes. O `DESIGN.md` é a fonte dos valores; o CSS deve segui-lo. Usar `material/logo.svg` (fundo transparente) e definir o texto do botão em marinho, pois branco sobre âmbar não passa no contraste.

## Entrega e critérios de aceite

Entregar a página publicada e o repositório público no GitHub, contendo `SPEC.md`, `CLAUDE.md`, `DESIGN.md` e evidências de verificação.

Verificar e registrar:

- Layout no celular e no computador, sem cortes ou sobreposições.
- Contraste de texto (mínimo 4,5:1) e foco visível na navegação por teclado.
- Comportamento com `prefers-reduced-motion` ativado.
- Funcionamento dos botões, links e perguntas frequentes.
- Botões "Pedir minha simulação" (abertura e cabeçalho) levando ao formulário.
- Validação, mensagens de erro e mensagem de sucesso do formulário (front-end).
- Correspondência entre as promessas da página e o brief.

Registrar capturas de tela, resultados dos testes e eventuais pendências. Materiais ou configurações ausentes devem ser identificados, sem simular que estão funcionando.

## Ficaram de fora

### Site antigo

O site antigo não será usado. Apenas a logo foi mantida.

- **Motivo:** adaptar o site anterior exigiria alterar tantas coisas que o desgaste e o esforço seriam muito maiores do que criar um novo do zero.
- **Por que manter a logo:** ela transmite tradição e mostra que a empresa existe há seis anos. Uma das principais dores dos clientes é o medo de a empresa desaparecer; atuar há seis anos indica que ela tende a perdurar.

### Informações do brief não incluídas na página

- **Ticket médio de R$ 16.300:** fica de fora. Na página, o investimento é apresentado apenas pela faixa de R$ 14 mil a R$ 19 mil.
- **Sistema típico (5 a 8 kWp, 12 a 20 painéis):** muito técnico; o visitante não entenderia de primeira.
- **Conta residual (taxa mínima e custo do fio):** pode poluir a página com informação demais. Será explicada depois, no atendimento.
- **Outras provas (fotos de 40 obras, três vídeos de clientes e assistência técnica autorizada da marca do inversor):** não há esses materiais disponíveis, e a página não deve afirmar nada sem prova concreta.
- **Processo (proposta com três tamanhos de sistema e acompanhamento da produção no primeiro ano):** poluiria a página; é melhor explicar diretamente ao cliente no início do atendimento.
- **Limites do serviço (sem manutenção de sistemas de outras empresas e sem atendimento a indústria ou comércio acima de 75 kWp):** o público-alvo já está claro no título da página, e mais informações poluiriam.

### Integração do formulário

- **Envio real dos dados (backend, e-mail, planilha ou CRM) e armazenamento de anexos:** fora do escopo, pois a entrega do case é apenas a landing page. Fica como pendência para uma etapa futura.
