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
python3 -m http.server 8765
```

Depois, abra http://localhost:8765.

## Publicar na Vercel

1. Na Vercel, escolha **Add New → Project** e importe o repositório `Ericboot10/ravena-solar-case`.
2. Em **Framework Preset**, escolha **Other**.
3. Deixe **Build Command** vazio e **Output Directory** como a raiz (`.`).
4. Clique em **Deploy**.

O `.vercelignore` publica só a página (`index.html`, `assets/` e a logo). A documentação e as evidências ficam apenas no repositório. O `vercel.json` ativa URLs limpas e cabeçalhos básicos de segurança.

## Verificação

Veja [`evidencias/VERIFICACAO.md`](evidencias/VERIFICACAO.md): 55 testes automatizados, capturas, contraste, comparação das promessas com o brief e pendências.

## Limites desta entrega

- O formulário é **somente front-end**. Ele valida os dados e mostra o próximo passo, mas não envia nem guarda nada. A própria página avisa que é uma demonstração.
- O brief original da prática não está no repositório.
