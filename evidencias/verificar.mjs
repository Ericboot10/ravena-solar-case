// Verificação da landing page via Chrome DevTools Protocol (sem dependências).
// Uso: node --experimental-websocket verify.mjs <url> <pasta-evidencias> <pasta-fixtures>
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const [, , URL_BASE, OUT, FIX] = process.argv;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const profile = join(process.env.SCRATCH || tmpdir(), 'chrome-profile-verify');
rmSync(profile, { recursive: true, force: true });

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(path, method = 'GET') {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}${path}`, { method }); return await r.json(); }
    catch { await sleep(200); }
  }
  throw new Error('Chrome não respondeu');
}

await getJSON('/json/version');
const target = await getJSON('/json/new?about:blank', 'PUT');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));

let seq = 0;
const pending = new Map();
const listeners = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  } else if (msg.method) {
    listeners.forEach((l) => l(msg));
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq; pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const once = (method) => new Promise((r) => {
  const l = (m) => { if (m.method === method) { listeners.splice(listeners.indexOf(l), 1); r(m.params); } };
  listeners.push(l);
});

// Coleta de erros de console e requisições de rede
const consoleErrors = [];
const requests = [];
listeners.push((m) => {
  if (m.method === 'Runtime.exceptionThrown') consoleErrors.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description || ''));
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrors.push(m.params.args.map((a) => a.value).join(' '));
  if (m.method === 'Network.requestWillBeSent') requests.push(m.params.request.method + ' ' + m.params.request.url);
});

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('DOM.enable');

async function evaluate(expr) {
  const r = await send('Runtime.evaluate', { expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('JS: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  // Normaliza espaço sem quebra (R$\u00a0450) para comparar textos
  const v = r.result.value;
  return v === undefined ? v : JSON.parse(JSON.stringify(v).replace(/\u00a0/g, ' '));
}

async function viewport(w, h, mobile) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
}

async function reducedMotion(on) {
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: on ? 'reduce' : 'no-preference' }] });
}

async function load(url = URL_BASE) {
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url });
  await loaded;
  await sleep(500);
}

async function shot(file, full = false) {
  const params = { format: 'png' };
  if (full) {
    const { cssContentSize } = await send('Page.getLayoutMetrics');
    params.captureBeyondViewport = true;
    params.clip = { x: 0, y: 0, width: cssContentSize.width, height: cssContentSize.height, scale: 1 };
  }
  const { data } = await send('Page.captureScreenshot', params);
  writeFileSync(file, Buffer.from(data, 'base64'));
}

async function scrollToEl(sel, offset = 0) {
  await evaluate(`const el = document.querySelector(${JSON.stringify(sel)});
    const h = document.getElementById('cabecalho').offsetHeight;
    window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - h - 16 + ${offset}, behavior: 'instant' });`);
}

async function scrollCase(frac) {
  await evaluate(`const t = document.querySelector('[data-scrolly]');
    const s = t.querySelector('.case__sticky');
    const h = parseFloat(getComputedStyle(s).top);
    const top = t.getBoundingClientRect().top + scrollY;
    window.scrollTo({ top: top - h + (t.offsetHeight - s.offsetHeight) * ${frac}, behavior: 'instant' });`);
}

// Posiciona a trilha numa fração do preenchimento (mesma regra do main.js)
async function scrollTrail(frac) {
  await evaluate(`const line = document.querySelector('.trail__line');
    const vh = innerHeight; const r = line.getBoundingClientRect();
    const desktop = matchMedia('(min-width: 960px)').matches;
    const targetTop = desktop ? vh * 0.85 - ${frac} * vh * 0.4 : vh * 0.65 - ${frac} * r.height;
    window.scrollTo({ top: scrollY + r.top - targetTop, behavior: 'instant' });`);
}

async function setFile(path) {
  const { root } = await send('DOM.getDocument');
  const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector: '#arquivo' });
  await send('DOM.setFileInputFiles', { nodeId, files: path ? [path] : [] });
  await sleep(100);
}

async function key(k, code, keyCode) {
  const text = k === 'Enter' ? '\r' : (k === ' ' ? ' ' : undefined);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: keyCode, text });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: keyCode });
  await sleep(60);
}

const fill = (values) => evaluate(`const f = document.getElementById('form-simulacao');
  const v = ${JSON.stringify(values)};
  for (const [k, val] of Object.entries(v)) {
    const el = f.elements[k];
    el.value = val;
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  }`);

const formState = () => evaluate(`const f = document.getElementById('form-simulacao');
  return {
    values: { nome: f.nome.value, whatsapp: f.whatsapp.value, cidade: f.cidade.value, conta: f.conta.value },
    errors: Object.fromEntries([...f.querySelectorAll('.field__error')].filter(e => !e.hidden).map(e => [e.id.replace('-erro',''), e.textContent])),
    invalid: [...f.querySelectorAll('[aria-invalid="true"]')].map(e => e.id),
    summaryVisible: !document.getElementById('form-resumo').hidden,
    summary: [...document.querySelectorAll('#form-resumo li')].map(l => l.textContent),
    belowNotice: !document.getElementById('conta-aviso').hidden,
    formHidden: f.hidden,
    successVisible: !document.getElementById('form-sucesso').hidden,
    successText: document.getElementById('form-sucesso').innerText,
    active: document.activeElement.id || document.activeElement.tagName
  };`);
const submit = async () => { await evaluate(`document.querySelector('#form-simulacao button[type=submit]').click();`); await sleep(200); };

const results = { data: new Date().toISOString(), url: URL_BASE, testes: [] };
const record = (grupo, nome, ok, detalhe) => { results.testes.push({ grupo, nome, ok, detalhe }); console.log(`${ok ? 'PASSOU' : 'FALHOU'} · ${grupo} · ${nome}`); };

const devices = [
  { name: 'celular', w: 390, h: 844, mobile: true },
  { name: 'desktop', w: 1440, h: 900, mobile: false }
];

// 1. Capturas ---------------------------------------------------------------
for (const d of devices) {
  const dir = join(OUT, 'capturas', d.name);
  mkdirSync(dir, { recursive: true });
  await viewport(d.w, d.h, d.mobile);

  // Página inteira no estado final (movimento reduzido)
  await reducedMotion(true);
  await load();
  await shot(join(dir, '00-pagina-inteira.png'), true);

  // Sequência com animações
  await reducedMotion(false);
  await load();
  await sleep(1200);
  await shot(join(dir, '01-abertura.png'));

  await scrollToEl('#provas');
  await sleep(1900);
  await shot(join(dir, '02-provas.png'));

  await scrollCase(0.35); await sleep(400);
  await shot(join(dir, '03a-caso-durante-rolagem.png'));
  await scrollCase(1); await sleep(400);
  await shot(join(dir, '03b-caso-final.png'));

  await scrollToEl('.calc');
  await evaluate(`const r = document.getElementById('calc-conta'); r.value = 1200; r.dispatchEvent(new Event('input'));`);
  await sleep(1000);
  await shot(join(dir, '04a-calculadora-1200.png'));
  await evaluate(`const r = document.getElementById('calc-conta'); r.value = 350; r.dispatchEvent(new Event('input'));`);
  await sleep(200);
  await shot(join(dir, '04b-calculadora-abaixo-450.png'));

  await scrollTrail(0.45); await sleep(1100);
  await shot(join(dir, '05a-trilha-em-andamento.png'));
  await scrollToEl('.warranty__title', d.mobile ? 0 : -260); await sleep(1100);
  await shot(join(dir, '05b-trilha-completa-e-garantias.png'));

  await evaluate(`document.getElementById('faq-3-btn').click();`);
  await scrollToEl('#duvidas'); await sleep(1100);
  await shot(join(dir, '06-faq-aberta.png'));

  await scrollToEl('#form-simulacao'); await sleep(1000);
  await shot(join(dir, '07a-formulario.png'));
  await submit();
  await scrollToEl('#form-simulacao'); await sleep(300);
  await shot(join(dir, '07b-formulario-erros-vazio.png'));
  await fill({ nome: 'Ana Teste', whatsapp: '15999', conta: '300' });
  await submit();
  await scrollToEl('#whatsapp', -40); await sleep(300);
  await shot(join(dir, '07c-formulario-erros-e-aviso-450.png'));
  await fill({ whatsapp: '15991234567', cidade: 'Sorocaba', conta: '650' });
  await submit();
  await scrollToEl('#simulacao', d.mobile ? 700 : 0); await sleep(300);
  await shot(join(dir, '08-formulario-sucesso.png'));
}

// 2. Testes ----------------------------------------------------------------
await reducedMotion(false);

// Sem rolagem horizontal em várias larguras
for (const w of [320, 360, 390, 600, 768, 960, 1024, 1280, 1440, 1920]) {
  await viewport(w, 900, w < 768);
  await load();
  const r = await evaluate(`const vw = document.documentElement.clientWidth;
    const over = [...document.querySelectorAll('body *')].filter(e => { const b = e.getBoundingClientRect(); return b.width && b.right > vw + 1; }).map(e => e.tagName.toLowerCase() + '.' + e.className);
    const hdr = document.querySelector('.btn--header');
    return { sw: document.documentElement.scrollWidth, vw, over: over.slice(0, 5), headerBtnLines: Math.round(hdr.getBoundingClientRect().height) };`);
  record('Layout', `Sem corte ou rolagem lateral em ${w}px`, r.sw <= r.vw && r.over.length === 0, r);
}

await viewport(390, 844, true);
await load();

// Cabeçalho sempre visível com o botão
const hdrAlways = await evaluate(`const out = [];
  for (const f of [0, .25, .5, .75, 1]) {
    window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * f, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 150));
    const b = document.querySelector('.btn--header').getBoundingClientRect();
    const p = getComputedStyle(document.querySelector('.progress__fill')).transform;
    out.push({ f, btnTop: Math.round(b.top), visivel: b.top >= 0 && b.bottom <= innerHeight, progresso: p });
  }
  return out;`);
record('Cabeçalho', 'Botão "Pedir minha simulação" visível em toda a rolagem', hdrAlways.every((x) => x.visivel), hdrAlways);
record('Cabeçalho', 'Barra de progresso avança com a rolagem (0 → 1)', hdrAlways[0].progresso.includes('matrix(0') && hdrAlways[4].progresso.startsWith('matrix(1'), hdrAlways.map((x) => x.progresso));

// Links internos apontam para seções existentes
const links = await evaluate(`return [...document.querySelectorAll('a[href^="#"]')].map(a => ({ href: a.getAttribute('href'), texto: a.textContent.trim(), existe: !!document.querySelector(a.getAttribute('href')) }));`);
record('Links', `Todos os ${links.length} links internos têm destino`, links.every((l) => l.existe), links);

// Botões "Pedir minha simulação" levam ao formulário e focam o primeiro campo
for (const sel of ['.btn--header', '.hero__actions .btn--primary', '.inv__side .link-arrow']) {
  await load();
  await evaluate(`document.querySelector(${JSON.stringify(sel)}).click();`);
  await sleep(1500);
  const r = await evaluate(`return { foco: document.activeElement.id, topoSecao: Math.round(document.getElementById('simulacao').getBoundingClientRect().top), hash: location.hash };`);
  record('Botões', `"${sel}" leva ao formulário e foca o campo Nome`, r.foco === 'nome' && r.topoSecao >= 0 && r.topoSecao < 200, r);
}

// FAQ: abre e fecha por clique e por teclado
await load();
const faqClick = await evaluate(`const out = [];
  for (const b of document.querySelectorAll('[data-faq] button')) {
    const p = document.getElementById(b.getAttribute('aria-controls'));
    b.click(); const aberto = b.getAttribute('aria-expanded') === 'true' && !p.hidden && p.textContent.trim().length > 0;
    b.click(); const fechado = b.getAttribute('aria-expanded') === 'false' && p.hidden;
    out.push({ pergunta: b.textContent.trim(), aberto, fechado });
  }
  return out;`);
record('FAQ', `As ${faqClick.length} perguntas abrem e fecham por clique`, faqClick.length === 7 && faqClick.every((f) => f.aberto && f.fechado), faqClick);
await evaluate(`document.getElementById('faq-1-btn').focus();`);
await key('Enter', 'Enter', 13);
const kEnter = await evaluate(`return document.getElementById('faq-1-btn').getAttribute('aria-expanded');`);
await key(' ', 'Space', 32);
const kSpace = await evaluate(`return document.getElementById('faq-1-btn').getAttribute('aria-expanded');`);
record('FAQ', 'Abre com Enter e fecha com Espaço', kEnter === 'true' && kSpace === 'false', { enter: kEnter, espaco: kSpace });

// Navegação por teclado: ordem de Tab e foco visível
await viewport(1440, 900, false);
await load();
const tabs = [];
for (let i = 0; i < 12; i++) {
  await key('Tab', 'Tab', 9);
  tabs.push(await evaluate(`const e = document.activeElement; const cs = getComputedStyle(e);
    return { el: e.tagName.toLowerCase() + (e.id ? '#' + e.id : ''), texto: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 40), contorno: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor };`));
}
record('Teclado', 'Tab percorre pular-conteúdo, logo, menu e botões com foco visível', tabs[0].texto.startsWith('Pular') && tabs.every((t) => t.contorno.startsWith('solid 2px')), tabs);

const formTabs = await evaluate(`document.getElementById('nome').focus(); return true;`);
const order = [];
for (let i = 0; i < 5; i++) { await key('Tab', 'Tab', 9); order.push(await evaluate(`return document.activeElement.id || document.activeElement.textContent.trim();`)); }
record('Teclado', 'Ordem de Tab no formulário segue a ordem visual', JSON.stringify(order) === JSON.stringify(['whatsapp', 'cidade', 'conta', 'arquivo', 'Pedir minha simulação']), { aPartirDeNome: order, ok: formTabs });

// Formulário
await viewport(390, 844, true);
await load();
requests.length = 0;
await submit();
let s = await formState();
record('Formulário', 'Envio vazio mostra os 4 erros obrigatórios e o resumo recebe foco', Object.keys(s.errors).length === 4 && s.summaryVisible && s.active === 'form-resumo', s);

const casos = [
  [{ nome: 'A' }, 'nome', 'Nome com 1 letra'],
  [{ whatsapp: '159912345' }, 'whatsapp', 'WhatsApp com 9 dígitos'],
  [{ whatsapp: '15891234567' }, 'whatsapp', 'Celular de 11 dígitos sem 9 após o DDD'],
  [{ conta: 'abc' }, 'conta', 'Conta com letras'],
  [{ conta: '0' }, 'conta', 'Conta igual a zero'],
  [{ conta: '200000' }, 'conta', 'Conta acima de R$ 100 mil']
];
for (const [vals, campo, nome] of casos) {
  await load();
  await fill({ nome: 'Ana Teste', whatsapp: '15991234567', cidade: 'Itu', conta: '800', ...vals });
  await submit();
  s = await formState();
  record('Formulário', `Erro claro: ${nome}`, !!s.errors[campo] && !s.successVisible, { erro: s.errors[campo], valores: s.values });
}

await load();
await fill({ nome: 'Ana Teste', whatsapp: '15999', cidade: '', conta: '1.200,50' });
await submit();
s = await formState();
record('Formulário', 'Dados digitados são preservados após erro', s.values.nome === 'Ana Teste' && s.values.whatsapp === '(15) 999' && s.values.conta === '1.200,50', s.values);
record('Formulário', 'Valor "1.200,50" é aceito', !s.errors.conta, s.errors);
record('Formulário', 'Máscara do WhatsApp aplicada', s.values.whatsapp === '(15) 999', s.values.whatsapp);

await load();
await fill({ conta: '300' });
s = await formState();
record('Formulário', 'Conta abaixo de R$ 450 mostra aviso sem bloquear', s.belowNotice, { aviso: s.belowNotice });
await fill({ nome: 'Ana Teste', whatsapp: '15991234567', cidade: 'Salto' });
await submit();
s = await formState();
record('Formulário', 'Conta de R$ 300 ainda pode ser enviada', s.successVisible && !s.errors.conta, { sucesso: s.successVisible });

for (const [file, nome, espera] of [['arquivo.txt', 'Arquivo .txt é recusado', true], ['grande.pdf', 'PDF acima de 10 MB é recusado', true], ['conta-teste.pdf', 'PDF pequeno é aceito', false]]) {
  await load();
  await setFile(join(FIX, file));
  await fill({ nome: 'Ana Teste', whatsapp: '15991234567', cidade: 'Sorocaba', conta: '700' });
  await submit();
  s = await formState();
  const nomeArquivo = await evaluate(`return document.getElementById('arquivo-nome').textContent;`);
  record('Formulário', nome, espera ? !!s.errors.arquivo && !s.successVisible : !s.errors.arquivo && s.successVisible, { erro: s.errors.arquivo || null, arquivoMostrado: nomeArquivo });
}

await load();
requests.length = 0;
await fill({ nome: 'Ana Teste', whatsapp: '15991234567', cidade: 'Votorantim', conta: '650' });
await setFile(join(FIX, 'conta-teste.pdf'));
await submit();
await sleep(500);
s = await formState();
record('Formulário', 'Sucesso mostra WhatsApp no mesmo dia útil e visita sem compromisso', s.successVisible && s.formHidden && /WhatsApp/.test(s.successText) && /mesmo dia útil/.test(s.successText) && /sem compromisso/.test(s.successText), s.successText);
record('Formulário', 'Sucesso deixa claro que nada foi enviado (demonstração)', /nenhum dado foi enviado/.test(s.successText), s.successText);
record('Formulário', 'Nenhuma requisição de rede ao enviar (somente front-end)', requests.length === 0, requests.slice());
await evaluate(`document.querySelector('[data-success-back]').click();`);
s = await formState();
record('Formulário', '"Revisar meus dados" volta ao formulário com os dados', !s.formHidden && s.values.nome === 'Ana Teste' && s.active === 'nome', s.values);

// Calculadora
await load();
const calc = await evaluate(`const r = document.getElementById('calc-conta'); const out = {};
  for (const v of [600, 450, 440, 2000]) { r.value = v; r.dispatchEvent(new Event('input'));
    out[v] = { depois: document.getElementById('calc-depois').textContent, mes: document.getElementById('calc-mes').textContent, aviso: !document.getElementById('calc-aviso').hidden }; }
  return out;`);
record('Calculadora', 'R$ 600 → economia de R$ 450 a R$ 540 por mês (75% a 90%)', calc[600].mes === 'R$ 450 a R$ 540' && calc[600].depois === 'R$ 60 a R$ 150', calc[600]);
record('Calculadora', 'Aviso aparece abaixo de R$ 450 e some a partir de R$ 450', calc[440].aviso && !calc[450].aviso, calc);

// Caso real e trilha
await load();
await scrollCase(-0.05); await sleep(200);
const c0 = await evaluate(`return document.querySelector('[data-case-value]').textContent;`);
await scrollCase(0.5); await sleep(200);
const c5 = await evaluate(`return document.querySelector('[data-case-value]').textContent;`);
await scrollCase(1); await sleep(200);
const c1 = await evaluate(`return { conta: document.querySelector('[data-case-value]').textContent, reducao: document.querySelector('[data-case-pct]').textContent, mes: document.querySelector('[data-case-month]').textContent, ano: document.querySelector('[data-case-year]').textContent };`);
record('Caso real', 'Gráfico vai de R$ 780 a R$ 118 conforme a rolagem', c0 === 'R$ 780' && c1.conta === 'R$ 118' && c5 !== c0 && c5 !== c1.conta, { inicio: c0, meio: c5, fim: c1 });
record('Caso real', 'Valores finais: 85%, R$ 662/mês, R$ 7.944 em 12 meses', c1.reducao === '85%' && c1.mes === 'R$ 662' && c1.ano === 'R$ 7.944', c1);

const trail = [];
for (const off of [-400, 0, 250, 500, 900]) {
  await scrollToEl('.trail', off - 200); await sleep(150);
  trail.push(await evaluate(`return [...document.querySelectorAll('.step')].filter(s => s.classList.contains('is-done')).length;`));
}
record('Execução', 'Trilha marca as etapas uma a uma ao rolar (0 → 4)', trail[0] < trail[trail.length - 1] && trail[trail.length - 1] === 4 && trail.every((v, i) => i === 0 || v >= trail[i - 1]), { etapasConcluidas: trail });

// Contadores
await load();
await scrollToEl('#provas'); await sleep(1800);
const nums = await evaluate(`return [...document.querySelectorAll('[data-count]')].map(e => e.textContent);`);
record('Provas', 'Contadores terminam em 412, 4,8, 6 e 11', JSON.stringify(nums) === JSON.stringify(['412', '4,8', '6', '11']), nums);

// Movimento reduzido
await reducedMotion(true);
await load();
const rm = await evaluate(`return {
  caso: document.querySelector('[data-case-value]').textContent,
  etapas: document.querySelectorAll('.step.is-done').length,
  trilhoFixo: getComputedStyle(document.querySelector('.case__sticky')).position,
  revelados: [...document.querySelectorAll('[data-reveal]')].every(e => getComputedStyle(e).opacity === '1'),
  contadores: [...document.querySelectorAll('[data-count]')].map(e => e.textContent)
};`);
record('Movimento reduzido', 'Tudo aparece no estado final, sem trilho fixo nem animação', rm.caso === 'R$ 118' && rm.etapas === 4 && rm.trilhoFixo !== 'sticky' && rm.revelados && rm.contadores.join() === '412,4,8,6,11', rm);
await reducedMotion(false);

// Sem JavaScript
await send('Emulation.setScriptExecutionDisabled', { value: true });
await load();
const nojs = await evaluate(`return {
  temClasseJs: document.documentElement.classList.contains('js'),
  revelados: [...document.querySelectorAll('[data-reveal]')].every(e => getComputedStyle(e).opacity === '1'),
  caso: document.querySelector('[data-case-value]').textContent,
  contadores: [...document.querySelectorAll('[data-count]')].map(e => e.textContent)
};`).catch(() => null);
await send('Emulation.setScriptExecutionDisabled', { value: false });
if (nojs) record('Sem JavaScript', 'Conteúdo legível e valores finais no HTML', !nojs.temClasseJs && nojs.revelados && nojs.caso === 'R$ 118', nojs);

// Promessas x brief: termos proibidos ou deixados de fora não aparecem no texto da página
// Estado final (movimento reduzido) e texto completo, incluindo respostas fechadas do FAQ
await reducedMotion(true);
await load();
const pageText = await evaluate(`return document.body.textContent.replace(/\\s+/g, ' ');`);
await reducedMotion(false);
const proibidos = [
  [/gr[áa]tis|gratuit/i, '"grátis" (o brief proíbe)'],
  [/conta zer(a|o)(?!u)|zerar a conta|zera a conta/i, 'promessa de conta zerada'],
  [/95\s?%/, 'economia de 95%'],
  [/sustentabilidade|energia do futuro|revolu[çc][ãa]o solar/i, 'slogans vetados pelo brief'],
  [/16\.300|ticket/i, 'ticket médio (fora da página por decisão)'],
  [/12 a 20 pain|5 a 8 kWp/i, 'sistema típico (fora da página por decisão)'],
  [/40 obras|depoimento|v[íi]deo|assist[êe]ncia t[ée]cnica autorizada/i, 'provas sem material disponível'],
  [/tr[êe]s tamanhos|primeiro ano/i, 'detalhes do processo (fora da página por decisão)'],
  [/75 kWp|ind[úu]stria|com[ée]rcio/i, 'limites do serviço (fora da página por decisão)'],
  [/vendemos bateria(?!\.)|oferecemos bateria/i, 'oferta de bateria'],
  [/[úu]ltimas vagas|s[óo] hoje|promo[çc][ãa]o|corra/i, 'urgência artificial']
];
const achados = proibidos.filter(([re]) => re.test(pageText)).map(([re, d]) => d + ': ' + pageText.match(re)[0]);
record('Promessas', 'Nenhum termo proibido ou dado deixado de fora aparece na página', achados.length === 0, achados);
const obrigatorios = ['412', '4,8', '137', 'R$ 780', 'R$ 118', '6,4 kWp', 'março de 2025', '75% a 90%', '3 a 4 anos', '+25 anos', '45 a 60 dias', '2 dias', '25 anos', '10 anos', '5 anos', 'infiltração', 'Entrada zero', 'A conta não zera', 'R$ 14 mil', 'R$ 19 mil', 'R$ 450', 'Lei 14.300', 'Não vendemos bateria'.replace('Não', 'não')];
const faltando = obrigatorios.filter((t) => !pageText.toLowerCase().includes(t.toLowerCase()));
record('Promessas', 'Todos os dados exigidos pelo SPEC aparecem na página', faltando.length === 0, { faltando });

// Tipografia e cor
await load();
const fonts = await evaluate(`return [...new Set([...document.querySelectorAll('body, body *')].map(e => getComputedStyle(e).fontFamily))];`);
record('Tipografia', 'Uma única família de fonte (Georgia) em toda a página', fonts.length === 1 && fonts[0].startsWith('Georgia'), fonts);

const weights = await evaluate(`return [...new Set([...document.querySelectorAll('body *')].map(e => getComputedStyle(e).fontWeight))];`);
record('Tipografia', 'Só pesos 400 e 700', weights.every((w) => w === '400' || w === '700'), weights);

const minFont = await evaluate(`const vis = [...document.querySelectorAll('body *')].filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && e.getClientRects().length);
  const small = vis.map(e => ({ el: e.tagName.toLowerCase() + '.' + e.className, px: parseFloat(getComputedStyle(e).fontSize), texto: e.textContent.trim().slice(0, 30) })).filter(x => x.px < 12);
  return small;`);
record('Tipografia', 'Nenhum texto abaixo de 12px', minFont.length === 0, minFont);

const tab = await evaluate(`const m = (t, v) => { const s = document.createElement('span'); s.style.cssText = 'font-family:Georgia;font-size:100px;position:absolute;visibility:hidden;font-variant-numeric:' + v; s.textContent = t; document.body.appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return Math.round(w); };
  return { normal: { '111': m('111', 'normal'), '000': m('000', 'normal') }, tabular: { '111': m('111', 'tabular-nums'), '000': m('000', 'tabular-nums') } };`);
record('Tipografia', 'Teste de tabular-nums em Georgia (informativo)', true, { ...tab, conclusao: tab.tabular['111'] === tab.tabular['000'] ? 'tabular-nums funciona' : 'tabular-nums NÃO tem efeito em Georgia; dígitos têm larguras diferentes' });

const amber = await evaluate(`const isAmber = c => c.replace(/\\s/g, '') === 'rgb(242,160,61)';
  return [...document.querySelectorAll('body *')].filter(e => { const cs = getComputedStyle(e); return isAmber(cs.backgroundColor) || isAmber(cs.color) || isAmber(cs.borderTopColor); })
    .map(e => e.tagName.toLowerCase() + '.' + [...e.classList].join('.'));`);
const amberText = await evaluate(`return [...document.querySelectorAll('body *')].filter(e => getComputedStyle(e).color.replace(/\\s/g,'') === 'rgb(242,160,61)').length;`);
record('Cor', 'Amarelo só em botões primários, barra de progresso e trilha', amber.every((a) => /btn--primary|progress__fill|trail__fill|step__mark/.test(a)) && amberText === 0, amber);

results.consoleErrors = consoleErrors;
record('Console', 'Nenhum erro de JavaScript no console', consoleErrors.length === 0, consoleErrors);

writeFileSync(join(OUT, 'resultados-testes.json'), JSON.stringify(results, null, 2));
const ok = results.testes.filter((t) => t.ok).length;
console.log(`\n${ok}/${results.testes.length} testes passaram`);
ws.close();
chrome.kill();
process.exit(0);
