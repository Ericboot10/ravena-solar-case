// Ravena Solar — JavaScript puro, sem dependências. Tudo roda no navegador.
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var brl = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function money(v) { return 'R$\u00a0' + brl.format(Math.round(v)); }

  document.addEventListener('DOMContentLoaded', function () {
    initRevealAndCounters();
    initScrollEffects();
    initFormLinks();
    initFaq();
    initCalculator();
    initForm();
  });

  /* Revelação e contadores ------------------------------------------------ */
  function initRevealAndCounters() {
    var revealEls = document.querySelectorAll('[data-reveal]');
    var counters = document.querySelectorAll('[data-count]');

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
      return; // os valores finais já estão no HTML
    }

    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { revealObs.observe(el); });

    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) {
      el.textContent = formatCount(0, el);
      countObs.observe(el);
    });
  }

  function formatCount(v, el) {
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    return v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function animateCount(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    var start = null;
    var duration = 1400;
    function frame(ts) {
      if (start === null) start = ts;
      var t = clamp((ts - start) / duration, 0, 1);
      el.textContent = formatCount(to * easeOut(t), el);
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = formatCount(to, el);
    }
    requestAnimationFrame(frame);
  }

  /* Efeitos ligados à rolagem -------------------------------------------- */
  function initScrollEffects() {
    var root = document.documentElement;
    var header = document.getElementById('cabecalho');
    var progressFill = document.querySelector('.progress__fill');

    // Caso real
    var track = document.querySelector('[data-scrolly]');
    var sticky = track && track.querySelector('.case__sticky');
    var caseBar = document.querySelector('[data-case-bar]');
    var caseValue = document.querySelector('[data-case-value]');
    var casePct = document.querySelector('[data-case-pct]');
    var caseMonth = document.querySelector('[data-case-month]');
    var caseYear = document.querySelector('[data-case-year]');
    var BEFORE = 780, AFTER = 118, SCALE = 800;

    // Trilha de execução
    var trail = document.querySelector('[data-trail]');
    var trailLine = trail && trail.querySelector('.trail__line');
    var steps = trail ? Array.prototype.slice.call(trail.querySelectorAll('.step')) : [];
    var desktop = window.matchMedia('(min-width: 960px)');

    // Seção ativa no menu
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.header__nav a'));
    var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });

    var ticking = false;

    function update() {
      ticking = false;
      var vh = window.innerHeight;
      var max = root.scrollHeight - vh;
      progressFill.style.setProperty('--progress', max > 0 ? clamp(window.scrollY / max, 0, 1) : 0);

      if (!reduceMotion.matches) {
        updateCase(vh);
        updateTrail(vh);
      }
      updateNav(vh);
    }

    function updateCase(vh) {
      if (!track) return;
      var rect = track.getBoundingClientRect();
      var offset = parseFloat(getComputedStyle(sticky).top) || header.offsetHeight + 16;
      var span = rect.height - sticky.offsetHeight;
      var p = span > 0 ? clamp((offset - rect.top) / span, 0, 1) : 1;
      var e = easeOut(p);
      var value = BEFORE - (BEFORE - AFTER) * e;
      caseBar.style.setProperty('--h', (value / SCALE).toFixed(4));
      caseValue.textContent = money(value);
      casePct.textContent = brl.format(((BEFORE - value) / BEFORE) * 100) + '%';
      caseMonth.textContent = money(BEFORE - value);
      caseYear.textContent = money((BEFORE - value) * 12);
    }

    // O trilho vai do centro do primeiro marcador ao centro do último.
    function layoutTrail() {
      if (!trail) return;
      var base = trail.getBoundingClientRect();
      var first = steps[0].querySelector('.step__mark').getBoundingClientRect();
      var last = steps[steps.length - 1].querySelector('.step__mark').getBoundingClientRect();
      var s = trailLine.style;
      if (desktop.matches) {
        s.top = (first.top + first.height / 2 - base.top - 2) + 'px';
        s.left = (first.left + first.width / 2 - base.left) + 'px';
        s.width = (last.left - first.left) + 'px';
        s.height = '';
        s.bottom = '';
      } else {
        s.top = (first.top + first.height / 2 - base.top) + 'px';
        s.left = (first.left + first.width / 2 - base.left) + 'px';
        s.height = (last.top - first.top) + 'px';
        s.width = '';
        s.bottom = 'auto';
      }
    }

    function updateTrail(vh) {
      if (!trail) return;
      var lineRect = trailLine.getBoundingClientRect();
      var p, end;
      if (desktop.matches) {
        p = clamp((vh * 0.85 - lineRect.top) / (vh * 0.4), 0, 1);
        end = lineRect.left + lineRect.width * p;
      } else {
        // Acompanha a leitura: o trilho enche até a linha a 65% da altura da tela.
        p = lineRect.height > 0 ? clamp((vh * 0.65 - lineRect.top) / lineRect.height, 0, 1) : 1;
        end = lineRect.top + lineRect.height * p;
      }
      trailLine.style.setProperty('--p', p.toFixed(4));

      var current = -1;
      steps.forEach(function (step, i) {
        var m = step.querySelector('.step__mark').getBoundingClientRect();
        var center = desktop.matches ? m.left + m.width / 2 : m.top + m.height / 2;
        var done = p > 0 && center <= end + 1;
        step.classList.toggle('is-done', done);
        if (!done && current === -1) current = i;
      });
      steps.forEach(function (step, i) { step.classList.toggle('is-current', i === current); });
    }

    function updateNav(vh) {
      var active = -1;
      sections.forEach(function (sec, i) {
        if (sec && sec.getBoundingClientRect().top <= vh * 0.4) active = i;
      });
      navLinks.forEach(function (a, i) {
        if (i === active) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    layoutTrail();

    function applyMotionPreference() {
      if (reduceMotion.matches) {
        // Estado final imediato
        if (caseBar) {
          caseBar.style.setProperty('--h', (AFTER / SCALE).toFixed(4));
          caseValue.textContent = money(AFTER);
          casePct.textContent = brl.format(((BEFORE - AFTER) / BEFORE) * 100) + '%';
          caseMonth.textContent = money(BEFORE - AFTER);
          caseYear.textContent = money((BEFORE - AFTER) * 12);
        }
        if (trailLine) trailLine.style.setProperty('--p', 1);
        steps.forEach(function (s) { s.classList.add('is-done'); s.classList.remove('is-current'); });
      }
      update();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { layoutTrail(); onScroll(); });
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', applyMotionPreference);
    applyMotionPreference();
  }

  /* Botões que levam ao formulário ---------------------------------------- */
  function initFormLinks() {
    var nameInput = document.getElementById('nome');
    var form = document.getElementById('form-simulacao');
    document.querySelectorAll('[data-to-form]').forEach(function (link) {
      link.addEventListener('click', function (ev) {
        var target = document.getElementById('simulacao');
        if (!target) return;
        ev.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
        if (history.replaceState) history.replaceState(null, '', '#simulacao');
        // Leva o foco ao primeiro campo, sem interromper a rolagem suave.
        if (form && !form.hidden && nameInput) nameInput.focus({ preventScroll: true });
      });
    });
  }

  /* Dúvidas frequentes ----------------------------------------------------- */
  function initFaq() {
    document.querySelectorAll('[data-faq] .faq__q button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        panel.hidden = open;
        if (!open) {
          panel.classList.remove('is-opening');
          void panel.offsetWidth; // reinicia a animação
          panel.classList.add('is-opening');
        }
      });
    });
  }

  /* Estimativa de economia ------------------------------------------------- */
  function initCalculator() {
    var range = document.getElementById('calc-conta');
    if (!range) return;
    var out = document.getElementById('calc-conta-out');
    var after = document.getElementById('calc-depois');
    var month = document.getElementById('calc-mes');
    var year = document.getElementById('calc-ano');
    var warn = document.getElementById('calc-aviso');

    function render() {
      var bill = parseFloat(range.value);
      // Redução média de 75% a 90% (brief). Arredonda para dezenas.
      var r10 = function (v) { return Math.round(v / 10) * 10; };
      var saveMin = r10(bill * 0.75), saveMax = r10(bill * 0.90);
      out.textContent = money(bill);
      range.setAttribute('aria-valuetext', money(bill) + ' por mês');
      after.textContent = money(bill - saveMax) + ' a ' + money(bill - saveMin);
      month.textContent = money(saveMin) + ' a ' + money(saveMax);
      year.textContent = money(saveMin * 12) + ' a ' + money(saveMax * 12);
      warn.hidden = bill >= 450;
    }
    range.addEventListener('input', render);
    render();
  }

  /* Formulário: envia para o app da Web do Apps Script (integracao/) ------ */
  function initForm() {
    var form = document.getElementById('form-simulacao');
    if (!form) return;
    var summary = document.getElementById('form-resumo');
    var success = document.getElementById('form-sucesso');
    var phone = form.elements.whatsapp;
    var bill = form.elements.conta;
    var billNotice = document.getElementById('conta-aviso');
    var status = document.getElementById('form-status');
    var button = form.querySelector('button[type="submit"]');
    var buttonText = button.textContent;
    var sending = false;
    var MAX_FILE = 4.5 * 1024 * 1024; // limite do Apps Script e do texto da página
    var FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];

    function digits(v) { return v.replace(/\D/g, ''); }

    function maskPhone(v) {
      var d = digits(v).slice(0, 11);
      if (d.length <= 2) return d.length ? '(' + d : '';
      if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
      return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    }

    // "1.200,50", "1200", "R$ 850" -> número
    function parseMoney(v) {
      var s = v.replace(/[^\d,.]/g, '');
      if (!s) return NaN;
      if (s.indexOf(',') > -1) s = s.replace(/\./g, '').replace(',', '.');
      else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
      return parseFloat(s);
    }

    var rules = {
      nome: function (el) {
        var v = el.value.trim();
        if (!v) return 'Informe seu nome.';
        if (v.length < 2) return 'O nome precisa ter pelo menos 2 letras.';
        return '';
      },
      whatsapp: function (el) {
        var d = digits(el.value);
        if (!d) return 'Informe seu WhatsApp com DDD.';
        if (d.length < 10 || d.length > 11) return 'Use o formato (15) 99999-9999, com DDD.';
        if (d.length === 11 && d.charAt(2) !== '9') return 'Celular com 11 dígitos deve começar com 9 depois do DDD.';
        return '';
      },
      cidade: function (el) {
        return el.value ? '' : 'Selecione sua cidade.';
      },
      conta: function (el) {
        if (!el.value.trim()) return 'Informe o valor médio da sua conta de luz.';
        var n = parseMoney(el.value);
        if (isNaN(n) || n <= 0) return 'Use apenas números, por exemplo 650 ou 1.200,50.';
        if (n > 100000) return 'Confira o valor: parece alto demais para uma conta residencial.';
        return '';
      },
      arquivo: function (el) {
        var f = el.files && el.files[0];
        if (!f) return '';
        var okType = FILE_TYPES.indexOf(f.type) > -1 || /\.(pdf|jpe?g|png|heic|heif|webp)$/i.test(f.name);
        if (!okType) return 'Envie uma foto (JPG, PNG, HEIC) ou um PDF.';
        if (f.size > MAX_FILE) return 'O arquivo tem mais de 4,5 MB. Envie uma foto com menos resolução ou um PDF menor.';
        return '';
      }
    };

    function fieldOf(el) { return el.closest('.field'); }

    function showError(el, msg) {
      var field = fieldOf(el);
      var err = document.getElementById(el.id + '-erro');
      field.classList.toggle('is-invalid', !!msg);
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      err.textContent = msg;
      err.hidden = !msg;
    }

    function validate(el) {
      var msg = rules[el.name](el);
      showError(el, msg);
      return msg;
    }

    phone.addEventListener('input', function () {
      phone.value = maskPhone(phone.value);
    });

    var fileInput = form.elements.arquivo;
    var fileName = document.getElementById('arquivo-nome');
    fileInput.addEventListener('change', function () {
      var f = fileInput.files && fileInput.files[0];
      fileName.textContent = f ? f.name : 'Nenhum arquivo escolhido';
    });

    bill.addEventListener('input', function () {
      var n = parseMoney(bill.value);
      billNotice.hidden = !(n > 0 && n < 450);
    });

    // Valida ao sair do campo; depois do primeiro erro, revalida enquanto digita.
    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      el.addEventListener('blur', function () {
        if (el.value || el.getAttribute('aria-invalid') === 'true') validate(el);
      });
      el.addEventListener(el.tagName === 'SELECT' || el.type === 'file' ? 'change' : 'input', function () {
        if (el.getAttribute('aria-invalid') === 'true' || el.type === 'file' || el.tagName === 'SELECT') validate(el);
      });
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var errors = [];
      Object.keys(rules).forEach(function (name) {
        var el = form.elements[name];
        var msg = validate(el);
        if (msg) errors.push({ el: el, msg: msg });
      });

      var list = summary.querySelector('ul');
      list.innerHTML = '';
      if (errors.length) {
        errors.forEach(function (e) {
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.href = '#' + e.el.id;
          a.textContent = e.msg;
          a.addEventListener('click', function (clickEv) {
            clickEv.preventDefault();
            e.el.focus();
          });
          li.appendChild(a);
          list.appendChild(li);
        });
        summary.hidden = false;
        summary.focus();
        return; // os dados digitados ficam onde estão
      }

      summary.hidden = true;
      send();
    });

    function readFile(f) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () { resolve(String(reader.result).split(',')[1] || ''); };
        reader.onerror = function () { reject(reader.error); };
        reader.readAsDataURL(f);
      });
    }

    function setSending(on) {
      sending = on;
      button.disabled = on;
      button.setAttribute('aria-busy', on ? 'true' : 'false');
      button.textContent = on ? 'Enviando…' : buttonText;
    }

    function showStatus(msg) {
      status.textContent = msg;
      status.hidden = !msg;
      if (msg) status.focus();
    }

    function send() {
      if (sending) return;
      var endpoint = form.getAttribute('data-endpoint');
      if (!endpoint) {
        showStatus('O envio está indisponível no momento. Seus dados continuam no formulário; tente de novo mais tarde.');
        return;
      }

      showStatus('');
      setSending(true);
      var f = fileInput.files && fileInput.files[0];
      var data = {
        nome: form.elements.nome.value.trim(),
        whatsapp: digits(phone.value),
        cidade: form.elements.cidade.value,
        conta: parseMoney(bill.value),
        site: form.elements.site.value,
        arquivo: null
      };

      (f ? readFile(f) : Promise.resolve(null))
        .then(function (base64) {
          if (base64) data.arquivo = { nome: f.name, tipo: f.type, base64: base64 };
          var ctrl = new AbortController();
          var timer = setTimeout(function () { ctrl.abort(); }, 60000);
          // text/plain evita a requisição prévia (preflight), que o Apps Script não responde.
          return fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(data),
            signal: ctrl.signal
          }).finally(function () { clearTimeout(timer); });
        })
        .then(function (res) { return res.json(); })
        .then(function (res) {
          if (!res || !res.ok) throw new Error((res && res.erro) || '');
          showSuccess(data);
        })
        .catch(function (err) {
          // Erro com mensagem vem da validação do Apps Script; o resto é rede ou tempo esgotado.
          var server = err && err.name === 'Error' && err.message;
          showStatus(server
            ? server + ' Corrija e envie de novo.'
            : 'Não conseguimos enviar agora. Seus dados continuam no formulário; confira a conexão e tente de novo.');
        })
        .then(function () { setSending(false); });
    }

    function showSuccess(data) {
      success.querySelector('[data-success-name]').textContent = data.nome.split(/\s+/)[0];
      success.querySelector('[data-success-phone]').textContent = maskPhone(data.whatsapp);
      form.reset();
      fileName.textContent = 'Nenhum arquivo escolhido';
      billNotice.hidden = true;
      form.hidden = true;
      success.hidden = false;
      success.focus();
    }
  }
})();
