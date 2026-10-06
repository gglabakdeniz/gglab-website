/* GG Lab — site etkileşimleri
   type="module" olarak yüklenir: kendi kapsamı var, strict mode varsayılan,
   sayfa ayrıştırıldıktan sonra çalışır. */

/* i18n köprüsü: i18n.js yüklenmemişse Türkçe yedeğe düşer */
const FALLBACK = {
  'a11y.menuOpen': 'Menüyü aç',
  'a11y.menuClose': 'Menüyü kapat',
  'form.err': 'Lütfen ad, geçerli bir e-posta ve mesaj alanlarını doldur.',
  'form.ok': 'Teşekkürler! (Taslak site — mesaj henüz bir yere gönderilmiyor.)',
  'nl.err': 'Geçerli bir e-posta adresi yaz.',
  'nl.ok': 'Kaydın alındı, teşekkürler!',
  'nl.fail': 'Bir sorun oldu, biraz sonra tekrar dene.',
  'nl.soon': 'Bülten çok yakında açılıyor! O zamana kadar duyurular Discord\'da.',
  'up.today': 'Bugün',
  'up.tomorrow': 'Yarın',
  'up.daysLeft': '{n} gün kaldı',
  'up.next': 'Sıradaki',
  'up.featured': 'Öne çıkan',
  'up.signup': 'Kayıt ol',
  'up.errH': 'Takvim şu an yüklenemedi.',
  'up.dateSoon': 'Kesin tarih yakında'
};
const tr = (key) => window.I18N?.t(key) || FALLBACK[key] || '';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Olay başına en fazla bir kare çalıştırır (scroll/resize işleyicileri için) */
function perFrame(fn) {
  let queued = false;
  return () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fn(); });
  };
}

/* --- yıl --- */
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

/* --- üyelik arka planı: bölüme ~1 ekran kala yüklenir --- */
const joinSec = document.getElementById('uyelik');
if (joinSec) {
  const bgObs = new IntersectionObserver((entries) => {
    if (!entries.some((en) => en.isIntersecting)) return;
    joinSec.classList.add('bg-in');
    bgObs.disconnect();
  }, { rootMargin: '100% 0px' });
  bgObs.observe(joinSec);
}

/* --- header scroll durumu --- */
const header = document.getElementById('siteHeader');
if (header) {
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* --- mobil menü + aktif menü bağlantısı --- */
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
if (nav && navToggle) {
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', tr(open ? 'a11y.menuClose' : 'a11y.menuOpen'));
  };
  navToggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !nav.classList.contains('open')) return;
    setMenu(false);
    navToggle.focus();
  });
}
if (nav) {
  const navLinks = $$('a:not(.btn)', nav);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => spy.observe(s));
}

/* --- scroll reveal ---
   IntersectionObserver yerine scroll tabanlı kontrol: sayfa büyük adımlarla
   (jump scroll, anchor, yenileme sonrası konum) kaydığında atlanan öğeler
   görünmez kalmasın. */
const reveals = $$('.reveal');
if (reduceMotion) {
  reveals.forEach((el) => el.classList.add('in'));
} else {
  const checkReveals = () => {
    const vh = window.innerHeight;
    let batch = 0;
    for (let i = reveals.length - 1; i >= 0; i--) {
      const el = reveals[i];
      if (el.getBoundingClientRect().top < vh * 0.92) {
        setTimeout(() => el.classList.add('in'), batch * 70);
        batch++;
        reveals.splice(i, 1);
      }
    }
  };
  const requestCheck = perFrame(checkReveals);
  checkReveals();
  window.addEventListener('scroll', requestCheck, { passive: true });
  window.addEventListener('resize', requestCheck);
  window.addEventListener('load', requestCheck);
}

/* --- galeri lightbox --- */
const shots = $$('.shot');
const lb = document.getElementById('lightbox');
if (lb && shots.length) {
  const lbImg = document.getElementById('lbImg');
  const lbCap = document.getElementById('lbCap');
  const lbClose = document.getElementById('lbClose');
  let idx = 0;
  let lastFocus = null;

  const show = (i) => {
    idx = (i + shots.length) % shots.length;
    const { full, caption = '' } = shots[idx].dataset;
    lbImg.src = full;
    lbImg.alt = caption;
    lbCap.textContent = caption;
  };
  const open = (i) => {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  };
  const close = () => {
    lb.hidden = true;
    document.body.style.overflow = '';
    lastFocus?.focus();
  };

  shots.forEach((s, i) => s.addEventListener('click', () => open(i)));
  /* Game Jam ekran görüntüleri galerideki aynı fotoğrafı açar; JS yoksa bağlantı fotoğrafın kendisine gider */
  $$('[data-shot]').forEach((a) => a.addEventListener('click', (e) => {
    const i = shots.findIndex((s) => s.dataset.full.endsWith('/' + a.dataset.shot + '.webp'));
    if (i < 0) return;
    e.preventDefault();
    open(i);
  }));
  lbClose.addEventListener('click', close);
  document.getElementById('lbPrev').addEventListener('click', () => show(idx - 1));
  document.getElementById('lbNext').addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  /* odak lightbox içinde döner: Tab sondaki düğmeden başa, Shift+Tab baştan sona */
  const lbButtons = [lbClose, document.getElementById('lbPrev'), document.getElementById('lbNext')];
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Tab') {
      const at = lbButtons.indexOf(document.activeElement);
      const next = at < 0 ? 0 : (at + (e.shiftKey ? -1 : 1) + lbButtons.length) % lbButtons.length;
      e.preventDefault();
      lbButtons[next].focus();
    }
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
}

/* --- iletişim formu (taslak: sunucuya gitmez; form şu an gizli) --- */
const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');
if (form && note) {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    ['name', 'email', 'message'].forEach((id) => {
      const el = document.getElementById(id);
      const bad = !el.value.trim() || (id === 'email' && !EMAIL_RE.test(el.value));
      el.classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    note.textContent = tr(ok ? 'form.ok' : 'form.err');
    note.className = 'form-note ' + (ok ? 'ok' : 'err');
    if (ok) form.reset();
  });
}

/* --- bülten ---
   action yoksa servis henüz bağlı değil: e-posta toplanmaz, "yakında" notu çıkar.
   action verilince form verisi oraya POST edilir (Formspree, kendi sunucumuz vb.). */
const nlForm = document.getElementById('newsletterForm');
const nlNote = document.getElementById('nlNote');
if (nlForm && nlNote) {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const input = nlForm.elements.email;
  const say = (key, ok) => {
    nlNote.textContent = tr(key);
    nlNote.className = 'form-note ' + (ok ? 'ok' : 'err');
  };
  nlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bad = !EMAIL_RE.test(input.value.trim());
    input.classList.toggle('invalid', bad);
    if (bad) { say('nl.err', false); input.focus(); return; }
    const endpoint = nlForm.getAttribute('action');
    if (!endpoint) { say('nl.soon', true); return; }
    try {
      const res = await fetch(endpoint, {
        method: 'POST', body: new FormData(nlForm), headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw new Error(res.status);
      say('nl.ok', true);
      nlForm.reset();
    } catch {
      say('nl.fail', false);
    }
  });
}

/* --- yaklaşan etkinlikler ---
   Liste #yaklasan'daki data-sheet adresinden okunur: Google E-Tablolar > Dosya > Paylaş >
   Web'de yayınla > CSV. Sütunlar (ilk satır başlık, Türkçe karakterli de olabilir):
   baslik, tarih, saat, yer, tur, aciklama, link, gorsel, oncelik (1/2/3; varsayılan 3). Tarih 2026-10-15 ya da 15.10.2026 biçiminde;
   günü belli değilse yalnızca ay: 2027-01, 01.2027 ya da "Ocak 2027".
   Geçmiş etkinlikler gizlenir; ilk öncelikli etkinlik ana afiştir. "Sıradaki" etiketi tarihe bağlıdır.
   Tablodaki metinler yalnızca textContent ile yazılır, bağlantılar yalnızca http(s) olabilir. */
const upSec = document.getElementById('yaklasan');
if (upSec) {
  const box = $('#upcoming', upSec);
  const list = $('#upList', upSec);
  const empty = $('#upEmpty', upSec);
  const MAX_SHOWN = 6;
  const ALIASES = {
    baslik: 'baslik', title: 'baslik', etkinlik: 'baslik',
    tarih: 'tarih', date: 'tarih',
    saat: 'saat', time: 'saat',
    yer: 'yer', mekan: 'yer', place: 'yer', location: 'yer',
    tur: 'tur', type: 'tur',
    oncelik: 'oncelik', priority: 'oncelik',
    aciklama: 'aciklama', description: 'aciklama',
    link: 'link', kayit: 'link', url: 'link',
    gorsel: 'gorsel', foto: 'gorsel', fotograf: 'gorsel', resim: 'gorsel', image: 'gorsel'
  };

  /* tırnaklı alanları, alan içindeki virgül ve satır sonlarını destekleyen küçük CSV ayrıştırıcı */
  const parseCSV = (text) => {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c !== '"') cell += c;
        else if (text[i + 1] === '"') { cell += '"'; i++; }
        else quoted = false;
      } else if (c === '"') quoted = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((v) => v.trim()));
  };

  /* "Başlık" → "baslik", "Açıklama" → "aciklama" */
  const headerKey = (h) => ALIASES[h.trim().toLocaleLowerCase('tr')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/\s+/g, '')] || null;

  const MONTHS = ['ocak', 'subat', 'mart', 'nisan', 'mayis', 'haziran', 'temmuz', 'agustos', 'eylul', 'ekim', 'kasim', 'aralik'];
  const plain = (s) => s.trim().toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');

  /* { date, monthOnly }: tam gün ya da yalnızca ay (o zaman ayın 1'i, sıralama için) */
  const parseDate = (v) => {
    const t = plain(v);
    let m;
    let y; let mo; let d;
    if ((m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) [, y, mo, d] = m;
    else if ((m = t.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/))) [, d, mo, y] = m;
    else if ((m = t.match(/^(\d{4})-(\d{1,2})$/))) [, y, mo] = m;
    else if ((m = t.match(/^(\d{1,2})[./](\d{4})$/))) [, mo, y] = m;
    else if ((m = t.match(/^([a-z]+)\s+(\d{4})$/)) && MONTHS.includes(m[1])) { mo = MONTHS.indexOf(m[1]) + 1; y = m[2]; }
    else return null;
    const date = new Date(+y, mo - 1, d ? +d : 1);
    if (date.getMonth() !== mo - 1 || (d && date.getDate() !== +d)) return null;
    return { date, monthOnly: !d };
  };

  const safeLink = (v) => {
    try {
      const u = new URL(v.trim());
      return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
    } catch { return ''; }
  };

  /* görsel: repodaki bir dosya (assets/img/…) ya da https adresi. Google Drive paylaşım
     linki ("…/file/d/KİMLİK/view") doğrudan görsel adresine çevrilir; dosya herkese açık olmalı. */
  const safeImage = (v) => {
    const s = v.trim();
    if (!s) return '';
    if (/^[\w\-./]+\.(webp|avif|jpe?g|png|gif)$/i.test(s) && !s.startsWith('/') && !s.includes('..')) return s;
    try {
      const u = new URL(s);
      if (u.protocol !== 'https:') return '';
      if (u.hostname === 'drive.google.com') {
        const id = (u.pathname.match(/\/d\/([\w-]+)/) || [])[1] || u.searchParams.get('id');
        return id ? `https://lh3.googleusercontent.com/d/${id}` : '';
      }
      return u.href;
    } catch { return ''; }
  };

  const toEvents = (text) => {
    const [head = [], ...rows] = parseCSV(text);
    const keys = head.map(headerKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const events = rows
      .map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] || '').trim()]).filter(([k]) => k)))
      .map((ev) => ({ ...ev, ...parseDate(ev.tarih || ''), priority: /^[123]$/.test(ev.oncelik || '') ? Number(ev.oncelik) : 3 }))
      /* yalnızca ayı bilinen etkinlik o ay bitene kadar görünür */
      .filter((ev) => ev.baslik && ev.date
        && (ev.monthOnly ? new Date(ev.date.getFullYear(), ev.date.getMonth() + 1, 1) > today : ev.date >= today))
      .sort((a, b) => a.date - b.date || (a.saat || '').localeCompare(b.saat || ''));
    // Kesin günü olmayan bir etkinlik, yakın tarihli buluşmanın etiketini almaz.
    const next = events.find((ev) => !ev.monthOnly) || events[0];
    const featured = events.find((ev) => ev.priority === 1);
    const selected = featured ? [featured, ...events.filter((ev) => ev !== featured)] : events;
    return selected.slice(0, MAX_SHOWN).map((ev) => ({ ...ev, isNext: ev === next, isFeatured: ev === featured }));
  };

  const make = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text) el.textContent = text;
    return el;
  };

  const render = (events) => {
    const locale = document.documentElement.lang === 'en' ? 'en-GB' : 'tr-TR';
    const fmt = (opts, d) => new Intl.DateTimeFormat(locale, opts).format(d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    list.classList.toggle('has-featured', events.some((ev) => ev.isFeatured));
    list.style.setProperty('--up-rows', Math.max(1, events.length - 1));
    events.forEach((ev, i) => {
      const li = make('li', 'up-card' + (ev.isNext ? ' is-next' : '') + (ev.isFeatured ? ' is-featured' : '') + (ev.monthOnly ? ' is-planned' : ''));
      li.dataset.priority = ev.priority;
      li.style.setProperty('--up-delay', `${Math.min(i, 3) * 70}ms`);
      const ym = `${ev.date.getFullYear()}-${String(ev.date.getMonth() + 1).padStart(2, '0')}`;
      const iso = `${ym}-${String(ev.date.getDate()).padStart(2, '0')}`;
      const time = make('time', 'up-date' + (ev.monthOnly ? ' is-month' : ''));
      const month = fmt({ month: ev.monthOnly && !ev.isFeatured ? 'short' : 'long' }, ev.date).replace('.', '');
      if (ev.monthOnly) {
        time.dateTime = ym;
        time.append(make('span', 'up-day', month), make('span', 'up-mon', String(ev.date.getFullYear())));
      } else {
        time.dateTime = ev.saat ? `${iso}T${ev.saat}` : iso;
        time.append(
          make('span', 'up-day', String(ev.date.getDate())),
          make('span', 'up-mon', `${month} ${ev.date.getFullYear()}`),
          make('span', 'up-wd', fmt({ weekday: 'long' }, ev.date))
        );
      }

      const body = make('div', 'up-body');
      const meta = make('div', 'up-meta');
      if (ev.isFeatured) meta.append(make('span', 'up-chip', tr('up.featured')));
      if (ev.isNext) meta.append(make('span', 'up-chip is-next', tr('up.next')));
      if (ev.tur) meta.append(make('span', 'up-chip', ev.tur));
      const days = Math.round((ev.date - today) / 864e5);
      meta.append(make('span', 'up-left', ev.monthOnly ? tr('up.dateSoon')
        : days === 0 ? tr('up.today') : days === 1 ? tr('up.tomorrow') : tr('up.daysLeft').replace('{n}', days)));
      body.append(make('h3', '', ev.baslik));
      const where = [ev.saat, ev.yer].filter(Boolean).join(' · ');
      if (where) body.append(make('p', 'up-where', where));
      if (ev.aciklama) body.append(make('p', 'up-desc', ev.aciklama));
      const href = safeLink(ev.link || '');
      if (href) {
        const a = make('a', 'cut-btn cut-btn-light up-cta');
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.append(make('span', '', tr('up.signup') + ' ↗'));
        body.append(a);
      }
      const content = make('div', 'up-content');
      content.append(time, body);
      li.append(meta);

      /* fotoğraf isteğe bağlı; yüklenemezse kart fotoğrafsız düzene döner */
      const src = safeImage(ev.gorsel || '');
      if (src) {
        const fig = make('div', 'up-img');
        const img = make('img');
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.width = 800;
        img.height = 450;
        img.addEventListener('error', () => { fig.remove(); li.classList.remove('has-img'); }, { once: true });
        img.src = src;
        fig.append(img);
        li.append(fig);
        li.classList.add('has-img');
      }
      li.append(content);
      list.append(li);
    });
    list.hidden = false;
    $('#upFooter', upSec).hidden = false;
    /* Kartlar sadece ilk görünüşte canlanır; sürekli çalışan bir döngü yok. */
    if (!reduceMotion && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          target.classList.add('is-visible');
          observer.unobserve(target);
        });
      }, { threshold: 0.08 });
      $$('.up-card', list).forEach((card) => {
        card.classList.add('up-enter');
        observer.observe(card);
      });
    }
  };

  const finish = (events, failed) => {
    if (events.length) render(events);
    else {
      if (failed) $('#upEmptyH', upSec).textContent = tr('up.errH');
      empty.hidden = false;
    }
    box.setAttribute('aria-busy', 'false');
  };

  const url = (upSec.dataset.sheet || '').trim();
  if (!url) finish([]);
  else {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    fetch(url, { signal: ctrl.signal })
      .then((res) => { if (!res.ok) throw new Error(res.status); return res.text(); })
      .then((text) => finish(toEvents(text), false))
      .catch(() => finish([], true))
      .finally(() => clearTimeout(timer));
  }
}

/* --- scroll ilerleme çubuğu --- */
const bar = document.getElementById('scrollProgress');
if (bar && !reduceMotion) {
  const drawBar = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    bar.style.transform = `scaleX(${p})`;
  };
  const requestBar = perFrame(drawBar);
  drawBar();
  window.addEventListener('scroll', requestBar, { passive: true });
  window.addEventListener('resize', requestBar);
}

/* --- sayı sayaçları: görünür olunca hedefe kadar say --- */
const counters = $$('[data-count]');
if (reduceMotion) {
  counters.forEach((el) => { el.textContent = el.dataset.count; });
} else if (counters.length) {
  counters.forEach((el) => { el.textContent = '0'; });
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting, target: el }) => {
      if (!isIntersecting) return;
      countObs.unobserve(el);
      const target = parseInt(el.dataset.count, 10) || 0;
      const dur = 1100;
      let t0 = 0;
      const step = (now) => {
        if (!t0) t0 = now;
        const k = Math.min(1, (now - t0) / dur);
        /* ease-out: sona doğru yavaşlar */
        el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  counters.forEach((el) => countObs.observe(el));
}

const hero = $('.hud-hero');

/* --- kart spotlight: imleci takip eden ışık halkası ---
   Her .spotlight kartı kendi --mx/--my'sini tutar; CSS'teki radial-gradient
   bu konumu okuyup ışığı fareyle birlikte kaydırır. */
const spotlights = $$('.spotlight');
if (spotlights.length && !reduceMotion) {
  spotlights.forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%');
      el.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%');
    }, { passive: true });
  });
}

/* --- hero mini oyunu: düşen tuşları yakala, puan topla ---
   Tuşa tıklamak/dokunmak, klavyede A/B/X/Y'ye ya da bağlı bir Xbox
   kumandasında aynı tuşlara basmak, ekrandaki eşleşen tuşu patlatır. */
const xbs = $$('.hud-hero .xb');
const scoreBox = document.getElementById('xbScore');
if (hero && xbs.length && scoreBox) {
  const scoreVal = $('.xb-score-val', scoreBox);
  const POINTS = 10;
  let score = 0;

  const inView = (el) => {
    const r = el.getBoundingClientRect();
    const h = hero.getBoundingClientRect();
    return r.bottom > Math.max(0, h.top) && r.top < Math.min(window.innerHeight, h.bottom);
  };

  const popup = (x, y) => {
    const h = hero.getBoundingClientRect();
    const fx = document.createElement('span');
    fx.className = 'xb-plus';
    fx.textContent = '+' + POINTS;
    fx.style.left = (x - h.left) + 'px';
    fx.style.top = (y - h.top) + 'px';
    hero.append(fx);
    fx.addEventListener('animationend', () => fx.remove());
    if (reduceMotion) setTimeout(() => fx.remove(), 700);
  };

  const hit = (el, x, y) => {
    if (el.classList.contains('xb-hit')) return;
    if (x == null) {
      const r = el.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }
    el.classList.add('xb-hit');
    /* tuş bir sonraki düşüşünde (döngü başında) geri gelir */
    const back = () => el.classList.remove('xb-hit');
    if (reduceMotion) setTimeout(back, 1500);
    else el.addEventListener('animationiteration', back, { once: true });

    score += POINTS;
    scoreVal.textContent = String(score).padStart(4, '0');
    scoreBox.hidden = false;
    scoreBox.classList.remove('bump');
    void scoreBox.offsetWidth; /* animasyonu yeniden başlat */
    scoreBox.classList.add('bump');
    popup(x, y);
  };

  xbs.forEach((el) => el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    hit(el, e.clientX, e.clientY);
  }));

  /* ekranda görünen, eşleşen ilk tuşu patlatır */
  const press = (k) => {
    const el = xbs.find((b) => b.dataset.k === k && !b.classList.contains('xb-hit') && inView(b));
    if (el) hit(el);
  };

  document.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return;
    const k = e.key.toLowerCase();
    if ('abxy'.includes(k) && k.length === 1) press(k);
  });

  /* Gamepad API: standart düzende 0=A 1=B 2=X 3=Y */
  const PAD_KEYS = ['a', 'b', 'x', 'y'];
  const prev = {};
  let polling = false;
  const poll = () => {
    const pads = [...(navigator.getGamepads?.() || [])].filter(Boolean);
    if (!pads.length) { polling = false; return; }
    pads.forEach((pad) => {
      PAD_KEYS.forEach((k, i) => {
        const down = !!pad.buttons[i]?.pressed;
        const id = pad.index + ':' + i;
        if (down && !prev[id]) press(k);
        prev[id] = down;
      });
    });
    requestAnimationFrame(poll);
  };
  window.addEventListener('gamepadconnected', () => {
    if (polling) return;
    polling = true;
    requestAnimationFrame(poll);
  });
}
