/* ============================================================
   LP Tráfego Pago para Empresas — Agência Rei
   1) Interações da página (menu, FAQ, revelação, barra fixa, cookies)
   2) Formulário de diagnóstico (validação inline, anti-spam, tracking
      e envio ao CRM via webhook — mesmo padrão da LP principal)
   ============================================================ */

/* ---------- 1) INTERAÇÕES ---------- */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* CTAs: rolam até o formulário e focam o primeiro campo */
  document.querySelectorAll('[data-cta]').forEach(function (a) {
    a.addEventListener('click', function () {
      var first = document.getElementById('f-nome');
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 550);
    });
  });

  /* Menu mobile */
  var menu = document.getElementById('mobile-menu');
  var backdrop = document.getElementById('mobile-backdrop');
  var openBtn = document.getElementById('menu-open');
  var closeBtn = document.getElementById('menu-close');
  if (menu && backdrop && openBtn && closeBtn) {
    var setMenu = function (open) {
      menu.classList.toggle('is-open', open);
      backdrop.classList.toggle('is-open', open);
      openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) closeBtn.focus(); else openBtn.focus();
    };
    openBtn.addEventListener('click', function () { setMenu(true); });
    closeBtn.addEventListener('click', function () { setMenu(false); });
    backdrop.addEventListener('click', function () { setMenu(false); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false); });
  }

  /* FAQ — acordeão acessível (um aberto por vez) */
  document.querySelectorAll('.faq__item').forEach(function (item) {
    var btn = item.querySelector('.faq__q');
    var panel = item.querySelector('.faq__a');
    if (!btn || !panel) return;
    var set = function (open) {
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (REDUCED) { panel.style.height = open ? 'auto' : '0px'; return; }
      if (open) {
        panel.style.height = panel.scrollHeight + 'px';
        var done = function () { if (item.classList.contains('is-open')) panel.style.height = 'auto'; panel.removeEventListener('transitionend', done); };
        panel.addEventListener('transitionend', done);
      } else {
        panel.style.height = panel.scrollHeight + 'px';
        requestAnimationFrame(function () { panel.style.height = '0px'; });
      }
    };
    btn.addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      var group = item.closest('[data-accordion]');
      if (open && group) {
        group.querySelectorAll('.faq__item.is-open').forEach(function (o) {
          if (o === item) return;
          var p = o.querySelector('.faq__a'); var b = o.querySelector('.faq__q');
          o.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false');
          p.style.height = p.scrollHeight + 'px'; requestAnimationFrame(function () { p.style.height = '0px'; });
        });
      }
      set(open);
    });
  });

  /* Revelação suave ao rolar (fade-in curto, sem bloquear leitura) */
  var targets = document.querySelectorAll('[data-reveal], [data-reveal-group]');
  if ('IntersectionObserver' in window && !REDUCED) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -5% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('is-in'); });
  }

  /* Barra fixa inferior (mobile): aparece depois do hero, some no formulário */
  var bar = document.getElementById('sticky-bar');
  var hero = document.getElementById('inicio');
  var contato = document.getElementById('contato');
  if (bar && hero && contato) {
    var tick = false;
    var update = function () {
      tick = false;
      var on = hero.getBoundingClientRect().bottom < 0 && contato.getBoundingClientRect().top > window.innerHeight * 0.7;
      bar.classList.toggle('is-on', on);
      bar.setAttribute('aria-hidden', on ? 'false' : 'true');
      var link = bar.querySelector('a'); if (link) link.tabIndex = on ? 0 : -1;
    };
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* Cookies — consentimento compacto; a escolha ajusta o consent mode */
  var cookieBar = document.getElementById('cookie-bar');
  var KEY_COOKIE = 'agenciarei_cookie_consent';
  var aplicarConsent = function (ok) {
    var estado = ok ? 'granted' : 'denied';
    if (typeof gtag === 'function') {
      gtag('consent', 'update', { ad_storage: estado, analytics_storage: estado, ad_user_data: estado, ad_personalization: estado });
    }
    if (typeof fbq === 'function') fbq('consent', ok ? 'grant' : 'revoke');
  };
  if (cookieBar) {
    var salvo = null;
    try { salvo = localStorage.getItem(KEY_COOKIE); } catch (e) { /* no-op */ }
    if (salvo === 'accept' || salvo === 'reject') {
      aplicarConsent(salvo === 'accept');
    } else {
      setTimeout(function () { cookieBar.classList.add('is-on'); }, 1200);
    }
    cookieBar.querySelectorAll('[data-cookie-accept], [data-cookie-reject]').forEach(function (b) {
      b.addEventListener('click', function () {
        var ok = b.hasAttribute('data-cookie-accept');
        try { localStorage.setItem(KEY_COOKIE, ok ? 'accept' : 'reject'); } catch (e) { /* no-op */ }
        aplicarConsent(ok);
        cookieBar.classList.remove('is-on');
      });
    });
  }
})();

/* ---------- 2) FORMULÁRIO DE DIAGNÓSTICO ---------- */
(() => {
  'use strict';

  /* ---------- CONFIGURAÇÃO ---------- */
  /* Webhook do n8n — mesmo da LP principal (agenciarei.com); `funil` separa os fluxos no CRM */
  const WEBHOOK_URL = 'https://n-8-n-n8n.rdbtlj.easypanel.host/webhook/5137cdf9-e97b-48b0-93c5-5d27bd5fc49b';
  const FUNIL = 'lptrafegoempresas';

  /* Cloudflare Turnstile (anti-bot invisível). Cole a site key para ativar.
     Vazio = a página segue funcionando com honeypot + análise comportamental. */
  const TURNSTILE_SITEKEY = '';

  /* Bloqueio de e-mails de provedores públicos (gmail, hotmail...). Diretriz B2B: opcional.
     false = aceita, mas registra `email_corporativo` no payload para o CRM. */
  const BLOQUEAR_EMAIL_PUBLICO = false;

  /* Destino após o envio bem-sucedido. Vazio = mostra o sucesso inline. */
  const REDIRECT_OK = 'obrigado.html';

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const form = document.getElementById('leadForm');
  if (!form) return;

  const formSuccess = document.getElementById('formSuccess');
  const formAlert = document.getElementById('formAlert');
  const formAlertText = document.getElementById('formAlertText');
  const btnSubmit = document.getElementById('cta-form-submit');
  const consent = form.querySelector('[name="consentimento"]');
  const consentLabel = form.querySelector('[data-consent-label]');
  const hpEmpresa = document.getElementById('f-empresa-site');
  const hpEmail = document.getElementById('f-confirme-email');

  /* ---------- Sanitização de entrada ---------- */
  function sanitize(valor, max) {
    return String(valor == null ? '' : valor)
      .replace(/<[^>]*>/g, '')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max || 200);
  }

  /* ---------- Regras de validação ---------- */
  const DDD_VALIDOS = new Set([
    11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,37,38,
    41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,69,
    71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,98,99
  ]);

  const EMAIL_DESCARTAVEL = new Set([
    'mailinator.com','yopmail.com','tempmail.com','temp-mail.org','10minutemail.com',
    'guerrillamail.com','guerrillamail.info','sharklasers.com','trashmail.com',
    'throwawaymail.com','getnada.com','maildrop.cc','dispostable.com','fakeinbox.com',
    'mytemp.email','emailtemporario.com.br','tempmailo.com','moakt.com','mailnesia.com',
    'spam4.me','grr.la','mohmal.com','minuteinbox.com','tempr.email','burnermail.io',
    'inboxbear.com','armyspy.com','cuvox.de','dayrep.com','einrot.com','fleckens.hu',
    'gustr.com','jourrapide.com','rhyta.com','superrito.com','teleworm.us'
  ]);

  const EMAIL_PUBLICO = new Set([
    'gmail.com','hotmail.com','hotmail.com.br','outlook.com','outlook.com.br','live.com',
    'yahoo.com','yahoo.com.br','icloud.com','me.com','uol.com.br','bol.com.br','terra.com.br',
    'globo.com','ig.com.br','protonmail.com','proton.me','aol.com','msn.com','zipmail.com.br'
  ]);

  const DOMINIO_TIPICO = {
    'gmail.con':'gmail.com','gmail.co':'gmail.com','gmail.com.br':'gmail.com',
    'gmial.com':'gmail.com','gmai.com':'gmail.com','gmail.cm':'gmail.com',
    'hotmail.con':'hotmail.com','hotmial.com':'hotmail.com','hotmai.com':'hotmail.com',
    'hotmail.cm':'hotmail.com','outlook.con':'outlook.com','outlok.com':'outlook.com',
    'yahoo.con':'yahoo.com','uol.com':'uol.com.br','bol.com':'bol.com.br'
  };

  const PADRAO_SPAM = /(https?:\/\/|www\.|\[url|\{\{|\bviagra\b|\bcasino\b|\bcrypto\s*invest)/i;

  /* "joão DA silva" → "João da Silva" (conectivos ficam em minúsculas) */
  const CONECTIVOS = new Set(['da', 'de', 'do', 'das', 'dos', 'e', 'di', 'del', 'van', 'von']);
  const capitalizar = (s) => s.split(/([ \-'’])/).map((t, i) => {
    if (!/\p{L}/u.test(t)) return t;
    if (i > 0 && CONECTIVOS.has(t.toLowerCase())) return t.toLowerCase();
    if (t === t.toLowerCase() || t === t.toUpperCase()) return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    return t;
  }).join('');

  function mascararTelefone(valor) {
    const d = String(valor || '').replace(/\D/g, '').slice(0, 11);
    if (d.length > 6) return `(${d.slice(0,2)}) ${d.slice(2, d.length === 11 ? 7 : 6)}-${d.slice(d.length === 11 ? 7 : 6)}`;
    if (d.length > 2) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length > 0) return `(${d}`;
    return '';
  }

  function validarNome(valor) {
    const v = sanitize(valor, 80);
    if (!v)                   return { ok:false, msg:'Informe o seu nome completo.' };
    if (PADRAO_SPAM.test(v))  return { ok:false, msg:'O nome não pode conter links ou códigos.' };
    if (/\d/.test(v))         return { ok:false, msg:'O nome não pode conter números.' };
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ'’.\- ]+$/.test(v)) return { ok:false, msg:'Use apenas letras no seu nome.' };
    const partes = v.split(' ').filter(p => p.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g,'').length >= 2);
    if (partes.length < 2)    return { ok:false, msg:'Informe nome e sobrenome.' };
    if (v.length < 5)         return { ok:false, msg:'Informe o seu nome completo.' };
    if (/(.)\1{3,}/.test(v))  return { ok:false, msg:'Informe um nome válido.' };
    if (new Set(partes.map(p => p.toLowerCase())).size < partes.length) return { ok:false, msg:'Informe um nome válido.' };
    return { ok:true, value: capitalizar(v) };
  }

  function validarEmail(valor) {
    const v = sanitize(valor, 120).toLowerCase();
    if (!v) return { ok:false, msg:'Informe o seu e-mail corporativo.' };
    if (!/^[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}$/i.test(v)) return { ok:false, msg:'E-mail inválido. Exemplo: nome@empresa.com.br' };
    if (/\.\./.test(v) || /^[.@]|[.@]$/.test(v))      return { ok:false, msg:'E-mail inválido. Confira a digitação.' };
    const dominio = v.split('@')[1];
    if (DOMINIO_TIPICO[dominio])        return { ok:false, msg:`Você quis dizer @${DOMINIO_TIPICO[dominio]}?` };
    if (EMAIL_DESCARTAVEL.has(dominio)) return { ok:false, msg:'Use um e-mail permanente (não descartável).' };
    if (/^(teste?|test|asdf|abc|aaa|noreply|no-reply|admin|spam)\d*@/.test(v)) return { ok:false, msg:'Informe o seu e-mail real de contato.' };
    if (BLOQUEAR_EMAIL_PUBLICO && EMAIL_PUBLICO.has(dominio)) return { ok:false, msg:'Use o e-mail corporativo da sua empresa (ex.: nome@suaempresa.com.br).' };
    return { ok:true, value: v };
  }

  function validarTelefone(valor) {
    const d = String(valor || '').replace(/\D/g, '');
    if (!d)                             return { ok:false, msg:'Informe o seu WhatsApp com DDD.' };
    if (d.length < 10 || d.length > 11) return { ok:false, msg:'Informe DDD + número (10 ou 11 dígitos).' };
    if (/^(\d)\1+$/.test(d))            return { ok:false, msg:'Informe um número de telefone válido.' };
    if (!DDD_VALIDOS.has(Number(d.slice(0,2))))  return { ok:false, msg:'DDD inexistente. Confira os 2 primeiros dígitos.' };
    if (d.length === 11 && d[2] !== '9')         return { ok:false, msg:'Celular com 11 dígitos deve começar com 9 após o DDD.' };
    if (d.length === 10 && !/[2-5]/.test(d[2]))  return { ok:false, msg:'Número inválido. Se for celular, inclua o 9.' };
    return { ok:true, value: d };
  }

  function validarEmpresa(valor) {
    const v = sanitize(valor, 80);
    if (!v)                   return { ok:false, msg:'Informe o nome da sua empresa.' };
    if (v.length < 2)         return { ok:false, msg:'Nome da empresa muito curto.' };
    if (PADRAO_SPAM.test(v))  return { ok:false, msg:'O nome da empresa não pode conter links.' };
    if (/(.)\1{4,}/.test(v))  return { ok:false, msg:'Informe o nome real da empresa.' };
    return { ok:true, value: v };
  }

  function validarSelect(valor) {
    const v = sanitize(valor, 60);
    if (!v) return { ok:false, msg:'Selecione uma opção.' };
    return { ok:true, value: v };
  }

  const VALIDADORES = {
    nome: validarNome,
    email: validarEmail,
    telefone: validarTelefone,
    empresa: validarEmpresa,
    cargo: validarSelect,
    segmento: validarSelect,
    volume_vendas: validarSelect,
    faturamento: validarSelect,
    investe: validarSelect
  };

  /* ---------- Feedback inline em tempo real ---------- */
  function caixaErro(nome) { return form.querySelector(`[data-error-for="${nome}"]`); }

  function marcarErro(input, msg) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    input.setAttribute('aria-invalid', 'true');
    const box = caixaErro(input.name);
    if (box) { box.textContent = msg; box.hidden = false; }
  }

  function marcarValido(input) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    input.removeAttribute('aria-invalid');
    const box = caixaErro(input.name);
    if (box) { box.hidden = true; box.textContent = ''; }
  }

  function limparEstado(input) {
    input.classList.remove('is-invalid', 'is-valid');
    input.removeAttribute('aria-invalid');
    const box = caixaErro(input.name);
    if (box) { box.hidden = true; box.textContent = ''; }
  }

  function validarCampo(input, { aplicar = false, mostrarErro = true } = {}) {
    const fn = VALIDADORES[input.name];
    if (!fn) return true;
    const r = fn(input.value);
    if (!r.ok) {
      if (mostrarErro) marcarErro(input, r.msg);
      return false;
    }
    marcarValido(input);
    if (aplicar && r.value !== undefined) {
      input.value = (input.type === 'tel') ? mascararTelefone(r.value) : r.value;
    }
    return true;
  }

  Object.keys(VALIDADORES).forEach(nome => {
    const input = form.querySelector(`[name="${nome}"]`);
    if (!input) return;

    let tocado = false;

    if (input.tagName === 'SELECT') {
      input.addEventListener('change', () => {
        tocado = true;
        input.dataset.filled = input.value ? '1' : '';
        validarCampo(input);
      });
      return;
    }

    if (input.type === 'tel') {
      input.addEventListener('input', () => { input.value = mascararTelefone(input.value); });
    }

    /* Sucesso aparece em tempo real; erro só depois do primeiro blur */
    input.addEventListener('input', () => {
      const valido = VALIDADORES[nome](input.value).ok;
      if (valido) marcarValido(input);
      else if (tocado) validarCampo(input);
      else limparEstado(input);
    });

    input.addEventListener('blur', () => {
      tocado = true;
      if (input.value.trim() !== '') validarCampo(input);
      else limparEstado(input);
    });
  });

  if (consent) {
    consent.addEventListener('change', () => {
      if (!consent.checked) return;
      consentLabel && consentLabel.classList.remove('is-error');
      const box = caixaErro('consentimento');
      if (box) box.hidden = true;
    });
  }

  /* ---------- BLINDAGEM ANTI-SPAM ----------
     Camadas: Turnstile · honeypot · tempo mínimo · prova de interação humana · bloqueio de reenvio */
  const ABERTO_EM = Date.now();
  const MIN_FILL_MS = 6000;
  const MIN_INTERACOES = 5;
  const REENVIO_MS = 10 * 60 * 1000;
  const CHAVE_ENVIO = 'agenciarei_' + FUNIL + '_envio';

  let interacoes = 0;
  ['pointerdown', 'keydown', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, e => {
      if (!e.isTrusted) return;
      interacoes++;
    }, { passive: true, capture: true });
  });

  const tokenHumano = FUNIL + '_' + ABERTO_EM.toString(36) + '_' + Math.random().toString(36).slice(2, 10);

  let turnstileWidgetId = null;
  const turnstileSlot = document.getElementById('turnstileSlot');

  if (TURNSTILE_SITEKEY && turnstileSlot) {
    window.onTurnstileLoad = () => {
      if (!window.turnstile) return;
      turnstileWidgetId = window.turnstile.render(turnstileSlot, {
        sitekey: TURNSTILE_SITEKEY,
        theme: 'dark',
        size: 'flexible'
      });
    };
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  function tokenTurnstile() {
    if (!TURNSTILE_SITEKEY || !window.turnstile) return '';
    try { return window.turnstile.getResponse(turnstileWidgetId) || ''; }
    catch (e) { return ''; }
  }

  function envioDuplicado(email) {
    try {
      const bruto = localStorage.getItem(CHAVE_ENVIO);
      if (!bruto) return false;
      const ult = JSON.parse(bruto);
      if (Date.now() - ult.ts > REENVIO_MS) return false;
      return ult.email === email;
    } catch (e) { return false; }
  }

  function registrarEnvio(email) {
    try { localStorage.setItem(CHAVE_ENVIO, JSON.stringify({ email, ts: Date.now() })); }
    catch (e) { /* no-op */ }
  }

  function avisar(msg, tipo) {
    if (!formAlert || !formAlertText) return;
    formAlert.classList.toggle('form-alert--success', tipo === 'ok');
    formAlert.classList.toggle('form-alert--error', tipo !== 'ok');
    formAlertText.textContent = msg;
    formAlert.hidden = false;
  }
  function limparAviso() { if (formAlert) formAlert.hidden = true; }

  /* Regra de negócio por faixa de volume de vendas (tabela explícita — igual à LP principal) */
  const ZONA_POR_VOLUME = {
    'De 1 a 50 vendas':     'LQF',
    'De 51 a 100 vendas':   'LQF',
    'De 101 a 300 vendas':  'MQF',
    'De 301 a 500 vendas':  'MQF',
    'De 501 a 1000 vendas': 'QF',
    '+1000 vendas':         'QF'
  };

  /* ---------- SUBMIT ---------- */
  let enviando = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (enviando) return;
    limparAviso();

    /* Camada 1 — honeypot */
    if ((hpEmpresa && hpEmpresa.value.trim() !== '') ||
        (hpEmail   && hpEmail.value.trim()   !== '')) return;

    /* Camada 2 — validação de todos os campos */
    let primeiroInvalido = null;
    Object.keys(VALIDADORES).forEach(nome => {
      const input = form.querySelector(`[name="${nome}"]`);
      if (!input) return;
      if (!validarCampo(input, { aplicar: true })) {
        if (!primeiroInvalido) primeiroInvalido = input;
      }
    });
    if (primeiroInvalido) {
      primeiroInvalido.focus();
      primeiroInvalido.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth', block: 'center' });
      return;
    }

    /* Camada 3 — consentimento LGPD obrigatório */
    if (consent && !consent.checked) {
      consentLabel && consentLabel.classList.add('is-error');
      const box = caixaErro('consentimento');
      if (box) { box.textContent = 'Marque a caixa de consentimento para continuar.'; box.hidden = false; }
      consent.focus();
      return;
    }

    /* Camada 4 — tempo mínimo de preenchimento */
    const decorrido = Date.now() - ABERTO_EM;
    if (decorrido < MIN_FILL_MS) {
      avisar('Aguarde alguns segundos e envie novamente.');
      return;
    }

    /* Camada 5 — prova de interação humana real */
    if (interacoes < MIN_INTERACOES) {
      avisar('Não foi possível validar o envio. Recarregue a página e tente de novo.');
      return;
    }

    /* Camada 6 — Turnstile, quando configurado */
    const turnstileToken = tokenTurnstile();
    if (TURNSTILE_SITEKEY && !turnstileToken) {
      avisar('Confirme a verificação de segurança para continuar.');
      return;
    }

    /* Camada 7 — reenvio duplicado do mesmo contato */
    const emailVal = form.querySelector('[name="email"]').value.trim().toLowerCase();
    if (envioDuplicado(emailVal)) {
      avisar('Já recebemos os seus dados. Nosso time entrará em contato em breve.', 'ok');
      return;
    }

    /* ---------- Monta o payload ---------- */
    enviando = true;
    const rotuloEl = btnSubmit.querySelector('[data-btn-label]');
    const rotuloOriginal = rotuloEl ? rotuloEl.textContent : '';
    btnSubmit.disabled = true;
    if (rotuloEl) rotuloEl.textContent = 'Enviando...';

    const payload = {};
    new FormData(form).forEach((valor, chave) => { payload[chave] = sanitize(valor, 200); });
    delete payload.empresa_site;
    delete payload.confirme_email;
    delete payload['cf-turnstile-response'];

    /* UTMs e click ids: a URL manda */
    const urlParams = new URLSearchParams(window.location.search);
    const daUrl = (chave, padrao, max) => sanitize(urlParams.get(chave) || padrao || '', max || 100);

    payload.utm_source   = daUrl('utm_source', 'organico');
    payload.utm_medium   = daUrl('utm_medium', '');
    payload.utm_campaign = daUrl('utm_campaign', '');
    payload.utm_content  = daUrl('utm_content', '');
    payload.utm_term     = daUrl('utm_term', '');
    payload.gclid        = daUrl('gclid', '', 200);
    payload.fbclid       = daUrl('fbclid', '', 200);

    /* Amarra o lead à sessão do trck.js para deduplicar no CRM */
    payload.trck_user_id = sanitize(
      (typeof trck !== 'undefined' && trck.getUserId) ? trck.getUserId() : '', 200);

    payload.funil = FUNIL;
    payload.q1 = payload.volume_vendas || '';
    payload.q2 = payload.faturamento || ''; /* faixa de faturamento mensal — só payload, não entra na régua LQF/MQF/QF (igual à LP principal) */
    payload.email_corporativo = EMAIL_PUBLICO.has(emailVal.split('@')[1] || '') ? 'nao' : 'sim';
    payload.origem_lead = FUNIL + '_formulario_diagnostico';
    payload.pagina = window.location.pathname;
    payload.submittedAt = new Date().toISOString();

    /* Telemetria anti-bot para filtro no n8n */
    payload.tempo_preenchimento = Math.round(decorrido / 1000);
    payload.interacoes = interacoes;
    payload.token_humano = tokenHumano;
    if (turnstileToken) payload.turnstile_token = turnstileToken;

    /* ---------- Qualificação por faixa de volume de vendas + pixels ---------- */
    const vol = payload.volume_vendas || '';
    payload.qualificacao = ZONA_POR_VOLUME[vol] || '';

    if (typeof fbq === 'function') fbq('track', 'Lead');
    if (typeof gtag === 'function') gtag('event', 'generate_lead', { funil: FUNIL, qualificacao: payload.qualificacao });

    if (payload.qualificacao === 'LQF') {
      if (typeof fbq === 'function') fbq('trackCustom', 'LeadLQF', { value: 1000, currency: 'BRL' });
      if (typeof gtag_report_conversion_lqf === 'function') gtag_report_conversion_lqf();
      if (typeof trck !== 'undefined' && trck.qualify) trck.qualify('lqf', { value: vol });
    } else if (payload.qualificacao === 'MQF') {
      if (typeof fbq === 'function') fbq('trackCustom', 'LeadMQF', { value: 2000, currency: 'BRL' });
      if (typeof gtag_report_conversion_mqf === 'function') gtag_report_conversion_mqf();
      if (typeof trck !== 'undefined' && trck.qualify) trck.qualify('mqf', { value: vol });
    } else if (payload.qualificacao === 'QF') {
      if (typeof fbq === 'function') fbq('trackCustom', 'LeadQF', { value: 5000, currency: 'BRL', predicted_ltv: 40000 });
      if (typeof gtag_report_conversion_qf === 'function') gtag_report_conversion_qf();
      if (typeof trck !== 'undefined' && trck.qualify) trck.qualify('qf', { value: vol });
    }

    /* ---------- Envio ao CRM ---------- */
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 12000);

      const resp = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal
      });
      clearTimeout(timeout);

      if (!resp.ok) throw new Error('HTTP ' + resp.status);

      registrarEnvio(emailVal);

      if (REDIRECT_OK) {
        window.location.href = REDIRECT_OK + '?q=' + encodeURIComponent(payload.qualificacao || '');
        return;
      }
      form.hidden = true;
      if (formSuccess) formSuccess.hidden = false;

    } catch (err) {
      enviando = false;
      btnSubmit.disabled = false;
      if (rotuloEl) rotuloEl.textContent = rotuloOriginal;
      if (TURNSTILE_SITEKEY && window.turnstile) {
        try { window.turnstile.reset(turnstileWidgetId); } catch (e) { /* no-op */ }
      }
      avisar('Tivemos uma instabilidade temporária ao registrar a sua solicitação. Tente novamente em instantes ou fale diretamente pelo WhatsApp.');
    }
  });
})();
