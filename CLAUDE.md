# CLAUDE.md

Instruções para trabalhar na landing page da Ravena Solar. Fonte de verdade do conteúdo: `brief.md`. Escopo e critérios de aceite: `SPEC.md`. Decisões visuais: `DESIGN.md`.

## Visão geral

Página que apresenta a Ravena Solar e mostra, com exemplos concretos, que a empresa é confiável. O foco é gerar pedidos de simulação qualificados (proprietários de casas em Sorocaba, Votorantim, Itu e Salto, com conta acima de R$ 450).

## Tom e visual

- Tecnológico, minimalista e moderno.
- Perfil analítico: transformar tudo em métrica e mostrar dados do benefício, tanto na redução da conta quanto em dinheiro economizado.
- O scroll deve ser dinâmico, com elementos que mudam de forma contínua conforme a página é rolada (barra de progresso, trilha com checks, gráfico animado etc.).
- Respeitar `prefers-reduced-motion`: as animações são desativadas e o conteúdo continua legível.

## Tipografia

- Uma única família de fonte em toda a página: **Georgia**.
- Só o tamanho e o formato (peso 400 ou 700, caixa, tracking) podem variar. Georgia não tem peso 500.

## Cores

- Paleta extraída da logo (ver `DESIGN.md`).
- **Evitar ao máximo o amarelo** (token `--cta`, `#F2A03D`). Ele é reservado ao botão "Pedir minha simulação", à barra de progresso do cabeçalho e à trilha de execução já percorrida, para dar destaque à ação e sensação de avanço.
- Não usar o amarelo em links, gráficos, rótulos nem decoração, e nunca como cor de texto.
- O texto sobre o botão amarelo é marinho (`--on-cta`); branco sobre amarelo não passa no contraste.
- O laranja `#E8721C` da logo não entra na interface.
- Usar tokens (variáveis CSS) definidos no `DESIGN.md`; nada de cor solta.

## Conteúdo

- Escrever em português. Usar inglês só quando o termo for mais cômodo ou já consolidado.
- Usar apenas dados do `brief.md`. Não inventar clientes, avaliações, marcas, contatos ou condições comerciais.
- Não prometer conta zerada e não oferecer baterias.
- Informações deliberadamente fora da página estão listadas em "Ficaram de fora" no `SPEC.md`; não reintroduzir.

## Técnica

- A página é inteiramente client-side.
- Não instalar bibliotecas externas. Escrever tudo em JavaScript puro (e HTML/CSS puros).
- Os botões da abertura e do cabeçalho rolam até o formulário no final da página.
- O formulário é somente front-end: valida e mostra a mensagem de sucesso, mas não envia nem armazena nada. Não implementar backend nem serviço externo, e não apresentar a solicitação como recebida pela Ravena.
- Anexos do formulário nunca entram no repositório.

## Regras de trabalho

- **Nunca fazer commit nem push sem eu pedir.**
- Não simular que algo funciona: se faltar material ou configuração, apontar como pendência.
