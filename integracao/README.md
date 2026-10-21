# Integração do formulário com a planilha

O formulário de simulação envia os pedidos para um **app da Web do Google Apps Script**, vinculado a uma Planilha Google. Assim o site continua estático e gratuito na Vercel: quem recebe os dados é a sua conta Google, sem servidor próprio.

```
Formulário (index.html)  ──POST──▶  Apps Script (sua conta Google)
                                    ├─ aba "Leads" da planilha: uma linha por pedido
                                    ├─ pasta privada no Drive: foto ou PDF da conta
                                    └─ e-mail de aviso para a equipe
```

Esta pasta não vai para a Vercel (o `.vercelignore` só libera a página).

## O que fica na planilha

| Recebido em | Nome | WhatsApp | Cidade | Conta média (R$) | Conta a partir de R$ 450 | Anexo | Status |
|---|---|---|---|---|---|---|---|

- **Anexo:** link para o arquivo na pasta "Ravena Solar · Contas de luz" do seu Drive. A pasta é privada, então só a sua conta abre o link.
- **Status:** começa como "Novo". Use essa coluna para acompanhar o atendimento (por exemplo: Em contato, Visita marcada, Proposta enviada).

## Configuração (uma vez, uns 10 minutos)

1. Crie uma planilha nova em <https://sheets.new> com a conta Google que vai receber os leads. Dê um nome, por exemplo "Ravena Solar · Leads".
2. Na planilha, abra **Extensões → Apps Script**.
3. Apague o conteúdo de `Código.gs`, cole o conteúdo de [`apps-script.gs`](apps-script.gs) e salve.
4. Em **Configurações do projeto** (ícone de engrenagem) → **Propriedades do script**, adicione:
   - `EMAIL_AVISO`: o e-mail que recebe o aviso de cada pedido. Se ficar vazio, o aviso vai para a conta dona do script.
5. Clique em **Implantar → Nova implantação**, escolha o tipo **App da Web** e configure:
   - **Executar como:** Eu
   - **Quem pode acessar:** Qualquer pessoa
6. Clique em **Implantar** e autorize o acesso. O Google mostra o aviso "app não verificado", porque o script é seu e não passou por revisão: clique em **Avançado → Acessar**. O script pede acesso à planilha, ao Drive (para salvar os anexos) e ao envio de e-mail.
7. Copie a **URL do app da Web** (termina em `/exec`).
8. No `index.html`, cole essa URL no atributo `data-endpoint` do formulário:

   ```html
   <form class="form" id="form-simulacao" ... data-endpoint="https://script.google.com/macros/s/.../exec">
   ```

9. Publique o site de novo na Vercel.

Para conferir se o app está no ar, abra a URL `/exec` no navegador. Ela deve responder `{"ok":true,...}`.

### Ao alterar o script

Toda mudança no código exige **Implantar → Gerenciar implantações → editar (lápis) → Versão: Nova versão**. Assim a URL continua a mesma. Uma "Nova implantação" gera outra URL, que teria de ser trocada no `index.html`.

## Limites e cuidados

- **Anexo de até 4,5 MB**, em JPG, PNG, HEIC, WEBP ou PDF. O formulário e o script conferem o limite. Uma foto da conta tirada pelo celular costuma ficar bem abaixo disso.
- **E-mails:** contas Gmail gratuitas enviam até 100 e-mails por dia pelo Apps Script. Isso é suficiente para a meta de 25 pedidos por mês.
- **Robôs:** o formulário tem um campo isca, invisível para pessoas. Envios com esse campo preenchido são descartados sem gravar.
- **Validação dupla:** o script valida de novo nome, WhatsApp, cidade, conta e anexo, porque a URL do app é pública.
- **Fórmulas:** textos que começam com `=`, `+`, `-` ou `@` são gravados como texto, para não virarem fórmula na planilha.
- **WhatsApp:** a página diz que os dados foram encaminhados ao WhatsApp da equipe. Neste case, isso é só o texto da página. Não há envio automático para o WhatsApp; o aviso real é o e-mail. Para enviar de verdade, seria preciso a WhatsApp Cloud API da Meta (conta Business, número verificado e modelo de mensagem aprovado).
- **Dados pessoais:** a planilha e a pasta guardam nome, telefone e conta de luz. Mantenha as duas sem compartilhamento público.
