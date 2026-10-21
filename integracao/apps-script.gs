/**
 * Ravena Solar · recebimento dos pedidos de simulação
 *
 * Script vinculado à planilha de leads (Extensões → Apps Script).
 * Publicado como app da Web, recebe o POST do formulário da landing page e:
 *   1. valida os dados de novo (o navegador não é confiável);
 *   2. salva o anexo numa pasta privada do Google Drive;
 *   3. grava uma linha na aba "Leads";
 *   4. envia um e-mail de aviso para a equipe.
 *
 * Configuração em integracao/README.md.
 */

var ABA = 'Leads';
var PASTA_ANEXOS = 'Ravena Solar · Contas de luz';
var CIDADES = ['Sorocaba', 'Votorantim', 'Itu', 'Salto', 'Outra'];
var MAX_ARQUIVO = 4.5 * 1024 * 1024; // mesmo limite do formulário
var TIPOS = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/webp': 'webp'
};
var COLUNAS = ['Recebido em', 'Nome', 'WhatsApp', 'Cidade', 'Conta média (R$)', 'Conta a partir de R$ 450', 'Anexo', 'Status'];

function doPost(e) {
  try {
    var dados = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // Campo isca: pessoas não veem; robôs costumam preencher. Responde ok sem gravar.
    if (dados.site) return responder({ ok: true });

    var lead = validar(dados);
    var anexo = dados.arquivo ? salvarAnexo(dados.arquivo, lead) : null;
    var linha = gravar(lead, anexo);
    avisar(lead, anexo, linha);

    return responder({ ok: true });
  } catch (erro) {
    if (!erro.publico) console.error(erro); // erros de validação não são falhas do script
    return responder({ ok: false, erro: erro.publico ? erro.message : 'Não foi possível registrar o pedido.' });
  }
}

// Permite conferir no navegador se o app da Web está no ar.
function doGet() {
  return responder({ ok: true, servico: 'Ravena Solar · simulações' });
}

function validar(d) {
  var nome = texto(d.nome, 120);
  var whatsapp = String(d.whatsapp || '').replace(/\D/g, '');
  var cidade = String(d.cidade || '');
  var conta = Number(d.conta);

  if (nome.length < 2) falhar('Informe seu nome.');
  if (whatsapp.length < 10 || whatsapp.length > 11) falhar('Informe um WhatsApp válido, com DDD.');
  if (CIDADES.indexOf(cidade) < 0) falhar('Selecione sua cidade.');
  if (!(conta > 0 && conta <= 100000)) falhar('Informe o valor médio da conta de luz.');

  return { nome: nome, whatsapp: whatsapp, cidade: cidade, conta: Math.round(conta * 100) / 100 };
}

function salvarAnexo(arq, lead) {
  var ext = TIPOS[arq.tipo] || (String(arq.nome || '').match(/\.(pdf|jpe?g|png|heic|heif|webp)$/i) || [])[1];
  if (!ext) falhar('Envie uma foto (JPG, PNG, HEIC) ou um PDF.');

  var bytes = Utilities.base64Decode(String(arq.base64 || ''));
  if (!bytes.length) return null;
  if (bytes.length > MAX_ARQUIVO) falhar('O arquivo tem mais de 4,5 MB.');

  var data = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd HHmm');
  var nomeArquivo = data + ' · ' + lead.nome + ' · ' + lead.cidade + '.' + ext.toLowerCase();
  var blob = Utilities.newBlob(bytes, arq.tipo || 'application/octet-stream', nomeArquivo);
  // O arquivo herda o acesso da pasta, que é privada: só a dona da conta abre o link.
  return pasta().createFile(blob).getUrl();
}

function pasta() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('PASTA_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* pasta apagada: cria outra */ }
  }
  var nova = DriveApp.createFolder(PASTA_ANEXOS);
  props.setProperty('PASTA_ID', nova.getId());
  return nova;
}

function gravar(lead, anexo) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var aba = planilha.getSheetByName(ABA) || planilha.insertSheet(ABA);
    if (aba.getLastRow() === 0) {
      aba.appendRow(COLUNAS);
      aba.getRange(1, 1, 1, COLUNAS.length).setFontWeight('bold');
      aba.setFrozenRows(1);
    }
    aba.appendRow([
      new Date(),
      lead.nome,
      formatarWhatsapp(lead.whatsapp),
      lead.cidade,
      lead.conta,
      lead.conta >= 450 ? 'Sim' : 'Não',
      anexo || '',
      'Novo'
    ]);
    return aba.getLastRow();
  } finally {
    lock.releaseLock();
  }
}

function avisar(lead, anexo, linha) {
  var destino = PropertiesService.getScriptProperties().getProperty('EMAIL_AVISO') || Session.getEffectiveUser().getEmail();
  if (!destino) return;

  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var conta = 'R$ ' + lead.conta.toLocaleString('pt-BR');
  var corpo = [
    'Novo pedido de simulação pela landing page.',
    '',
    'Nome: ' + lead.nome,
    'WhatsApp: ' + formatarWhatsapp(lead.whatsapp) + ' (https://wa.me/55' + lead.whatsapp + ')',
    'Cidade: ' + lead.cidade,
    'Conta média: ' + conta + (lead.conta < 450 ? ' (abaixo de R$ 450)' : ''),
    'Anexo: ' + (anexo || 'não enviado'),
    '',
    'Planilha (linha ' + linha + '): ' + planilha.getUrl(),
    '',
    'Prazo prometido na página: retorno pelo WhatsApp em até 24 horas.'
  ].join('\n');

  MailApp.sendEmail({
    to: destino,
    subject: 'Nova simulação: ' + lead.nome + ' · ' + lead.cidade + ' · ' + conta,
    body: corpo,
    name: 'Ravena Solar · site'
  });
}

/* Utilitários ---------------------------------------------------------- */

// Limita o tamanho e impede que o texto vire fórmula na planilha (=, +, -, @).
function texto(v, max) {
  var s = String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function formatarWhatsapp(d) {
  return d.length === 11
    ? '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7)
    : '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
}

function falhar(msg) {
  var erro = new Error(msg);
  erro.publico = true;
  throw erro;
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
