# Ravena Solar · landing page

Landing page de energia solar residencial para a Ravena Solar, integradora de Sorocaba que atende Sorocaba, Votorantim, Itu e Salto. O objetivo da página é gerar pedidos de simulação qualificados, de casas com conta de luz acima de R$ 450.

É um site estático: HTML, CSS e JavaScript puros, sem dependências e sem build.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `index.html` | A página |
| `assets/css/styles.css` | Estilos, com os tokens do `DESIGN.md` |
| `assets/js/main.js` | Rolagem dinâmica, gráfico, trilha, FAQ, calculadora e formulário |
| `material/logo.svg` | Logo original da empresa (única peça reaproveitada do site antigo) |
| `SPEC.md` | O que foi decidido e por quê, incluindo o que ficou de fora |
| `DESIGN.md` | Cores, tipografia, espaçamentos e componentes |
| `CLAUDE.md` | Regras de trabalho para o Claude Code neste projeto |
| `evidencias/` | Relatório de verificação, capturas de celular e desktop, resultados e script dos testes |
| `vercel.json`, `.vercelignore` | Publicação na Vercel |

## Rodar localmente

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Depois, abra http://127.0.0.1:8765. O `--bind` impede que a pasta do projeto fique acessível para outras máquinas da rede.

## Publicar na Vercel

1. Na Vercel, escolha **Add New → Project** e importe o repositório `Ericboot10/ravena-solar-case`.
2. Em **Framework Preset**, escolha **Other**.
3. Deixe **Build Command** vazio e **Output Directory** como a raiz (`.`).
4. Clique em **Deploy**.

O `.vercelignore` é uma lista de permissão: só `index.html`, `assets/`, `material/logo.svg` e o `vercel.json` vão para a Vercel. A documentação, as evidências e qualquer arquivo novo ficam fora até serem liberados nele. O `vercel.json` configura URLs limpas e cabeçalhos básicos de segurança.

Isso ainda não foi conferido em produção: depois do primeiro deploy, siga as checagens listadas em "Pendências" no [`evidencias/VERIFICACAO.md`](evidencias/VERIFICACAO.md).

## Verificação

Veja [`evidencias/VERIFICACAO.md`](evidencias/VERIFICACAO.md): testes automatizados, capturas, contraste, comparação das promessas com o brief e pendências.

## Limites desta entrega

- O formulário é **somente front-end**. Ele valida os dados e mostra o próximo passo, mas não envia nem guarda nada. A própria página avisa que é uma demonstração.
- O brief original da prática não está no repositório.
