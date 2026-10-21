// Roda integracao/apps-script.gs com serviços do Google simulados (planilha, Drive, e-mail).
// Uso: node evidencias/verificar-apps-script.mjs integracao/apps-script.gs
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const code = readFileSync(process.argv[2], 'utf8');
const rows = [], mails = [], files = [], props = {};
const sheet = { getLastRow: () => rows.length, appendRow: (r) => rows.push(r), getRange: () => ({ setFontWeight() {} }), setFrozenRows() {} };
const ctx = {
  console,
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet, insertSheet: () => sheet, getUrl: () => 'https://docs.google.com/planilha' }) },
  DriveApp: { createFolder: () => ({ getId: () => 'pasta1', createFile: (b) => { files.push(b); return { getUrl: () => 'https://drive.google.com/arquivo/' + files.length }; } }),
              getFolderById: () => ({ createFile: (b) => { files.push(b); return { getUrl: () => 'https://drive.google.com/arquivo/' + files.length }; } }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  MailApp: { sendEmail: (m) => mails.push(m) },
  Session: { getEffectiveUser: () => ({ getEmail: () => 'dono@exemplo.com' }) },
  Utilities: { base64Decode: (s) => [...Buffer.from(s, 'base64')], formatDate: () => '2026-10-21 1200', newBlob: (bytes, tipo, nome) => ({ bytes: bytes.length, tipo, nome }) },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ setMimeType: () => JSON.parse(t) }) }
};
vm.createContext(ctx); vm.runInContext(code, ctx);
const post = (d) => ctx.doPost({ postData: { contents: JSON.stringify(d) } });
const base = { nome: 'Ana Teste', whatsapp: '15991234567', cidade: 'Sorocaba', conta: 650, site: '', arquivo: null };
const out = [];
const t = (nome, ok, det) => { out.push(ok); console.log((ok ? 'PASSOU' : 'FALHOU') + ' · ' + nome + (ok ? '' : ' · ' + JSON.stringify(det))); };

let r = post(base);
t('Pedido válido grava linha com cabeçalho e manda e-mail ao dono', r.ok && rows.length === 2 && rows[0][0] === 'Recebido em' && rows[1][2] === '(15) 99123-4567' && rows[1][5] === 'Sim' && rows[1][7] === 'Novo' && mails[0].to === 'dono@exemplo.com', { r, rows, mails });
props.EMAIL_AVISO = 'equipe@exemplo.com';
r = post({ ...base, conta: 300, cidade: 'Outra', arquivo: { nome: 'conta.pdf', tipo: 'application/pdf', base64: Buffer.alloc(1000).toString('base64') } });
t('EMAIL_AVISO define o destino; conta < 450 marcada "Não"; anexo salvo e linkado', r.ok && mails[1].to === 'equipe@exemplo.com' && rows[2][5] === 'Não' && rows[2][6].startsWith('https://drive') && files[0].bytes === 1000 && /\.pdf$/.test(files[0].nome) && /abaixo de R\$ 450/.test(mails[1].body), { rows, files, mail: mails[1] });
r = post({ ...base, arquivo: { nome: 'g.pdf', tipo: 'application/pdf', base64: Buffer.alloc(4.5 * 1024 * 1024 + 1).toString('base64') } });
t('Anexo acima de 4,5 MB é recusado com mensagem', !r.ok && /4,5 MB/.test(r.erro) && rows.length === 3, r);
r = post({ ...base, arquivo: { nome: 'x.exe', tipo: 'application/x-msdownload', base64: 'AAAA' } });
t('Tipo de anexo inválido é recusado', !r.ok && /PDF/.test(r.erro), r);
for (const [d, nome] of [[{ nome: 'A' }, 'nome curto'], [{ whatsapp: '1599' }, 'WhatsApp curto'], [{ cidade: 'Campinas' }, 'cidade fora da lista'], [{ conta: 0 }, 'conta zero'], [{ conta: 'abc' }, 'conta texto']]) {
  r = post({ ...base, ...d });
  t('Recusa ' + nome, !r.ok && r.erro && rows.length === 3, r);
}
r = post({ ...base, site: 'http://spam' });
t('Campo isca preenchido responde ok sem gravar nem avisar', r.ok && rows.length === 3 && mails.length === 2, { rows: rows.length, mails: mails.length });
r = post({ ...base, nome: '=HYPERLINK("x")' });
t('Nome que começa com = vira texto na planilha', r.ok && rows[3][1].startsWith("'="), rows[3]);
r = ctx.doPost({ postData: { contents: 'não é json' } });
t('Corpo inválido devolve erro genérico', !r.ok && r.erro === 'Não foi possível registrar o pedido.', r);
t('doGet responde ok', ctx.doGet().ok, null);
console.log(`\n${out.filter(Boolean).length}/${out.length} testes do Apps Script passaram`);
