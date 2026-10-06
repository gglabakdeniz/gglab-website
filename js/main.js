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

const make = (tag, cls, text) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text) el.textContent = text;
  return el;
};

/* --- site tablosu (Google E-Tablolar) ---
   <main data-sheets> yayınlanmış tablonun adresi; tabloyu kullanan her bölüm kendi
   sheet'inin data-gid'ini taşır. Tablo açılmazsa ya da hücre boşsa HTML'deki hâli kalır.
   Tablodaki metinler yalnızca textContent / öznitelik olarak yazılır. */
const SHEETS = (document.getElementById('main')?.dataset.sheets || '').trim();
const sheetUrl = (gid) => (SHEETS && gid ? `${SHEETS}?gid=${gid}&single=true&output=csv` : '');

const fetchText = (url) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  return fetch(url, { signal: ctrl.signal })
    .then((res) => { if (!res.ok) throw new Error(res.status); return res.text(); })
    .finally(() => clearTimeout(timer));
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

/* "Açıklama" → "aciklama" */
const plain = (s) => s.trim().toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');

/* ilk satır başlık; her satır { başlık: değer } nesnesi olur */
const sheetRows = (text) => {
  const [head = [], ...rows] = parseCSV(text);
  const keys = head.map((h) => plain(h).replace(/\s+/g, ''));
  return rows.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] || '').trim()])));
};

/* görsel: repodaki bir dosya (assets/img/…) ya da https adresi. Google Drive paylaşım
   linki ("…/file/d/KİMLİK/view") doğrudan görsel adresine çevrilir, w verilirse o genişlikte
   istenir; dosya herkese açık olmalı.
   ponytail: lh3…/d/KİMLİK Google'ın belgelemediği bir adres; bozulursa yalnızca burası değişir. */
const safeImage = (v, w) => {
  const s = (v || '').trim();
  if (!s) return '';
  if (/^[\w\-./]+\.(webp|avif|jpe?g|png|gif)$/i.test(s) && !s.startsWith('/') && !s.includes('..')) return s;
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:') return '';
    if (u.hostname === 'drive.google.com') {
      const id = (u.pathname.match(/\/d\/([\w-]+)/) || [])[1] || u.searchParams.get('id');
      return id ? `https://lh3.googleusercontent.com/d/${id}${w ? '=w' + w : ''}` : '';
    }
    return u.href;
  } catch { return ''; }
};

/* bağlantı: yalnızca http(s) */
const safeLink = (v) => {
  try {
    const u = new URL((v || '').trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch { return ''; }
};

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
const reveals = [];
/* sonradan eklenen öğeler (tablodan gelen galeri) de buradan kaydolur */
let addReveals = (els) => els.forEach((el) => el.classList.add('in'));
if (!reduceMotion) {
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
  addReveals = (els) => { reveals.push(...els); requestCheck(); };
  window.addEventListener('scroll', requestCheck, { passive: true });
  window.addEventListener('resize', requestCheck);
  window.addEventListener('load', requestCheck);
}
addReveals($$('.reveal'));

/* --- galeri lightbox ---
   Kareler tablodan sonradan gelebildiği için liste her açılışta yeniden okunur.
   Liste galeri kareleri (data-full, data-caption) ya da Game Jam ekran görüntüleridir (href, aria-label). */
const lb = document.getElementById('lightbox');
if (lb) {
  const lbImg = document.getElementById('lbImg');
  const lbCap = document.getElementById('lbCap');
  const lbClose = document.getElementById('lbClose');
  let shots = [];
  let idx = 0;
  let lastFocus = null;

  const show = (i) => {
    idx = (i + shots.length) % shots.length;
    const el = shots[idx];
    const full = el.dataset.full || el.getAttribute('href');
    const caption = el.dataset.caption ?? el.getAttribute('aria-label') ?? '';
    lbImg.src = full;
    lbImg.alt = caption;
    lbCap.textContent = caption;
  };
  const open = (list, i) => {
    shots = list;
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

  /* Game Jam ekran görüntüsü galeride de varsa galerinin içinde açılır; galeri henüz
     yüklenmediyse ya da fotoğraf orada yoksa ekran görüntüleri kendi aralarında gezilir.
     Boş kutular (tablo gelmedi) açılmaz. JS kapalıysa bağlantı fotoğrafın kendisine gider. */
  document.addEventListener('click', (e) => {
    const list = $$('.shot[data-full]');
    const shot = e.target.closest('.shot[data-full]');
    if (shot) { open(list, list.indexOf(shot)); return; }
    const a = e.target.closest('.level-shot[href]');
    if (!a) return;
    e.preventDefault();
    const i = list.findIndex((s) => s.dataset.full === a.getAttribute('href'));
    if (i >= 0) { open(list, i); return; }
    const own = $$('.level-shot[href]');
    open(own, own.indexOf(a));
  });
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
   Liste site tablosunun "etkinlikler" sheet'inden okunur (#yaklasan data-gid).
   Sütunlar (ilk satır başlık, Türkçe karakterli de olabilir):
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

  const MONTHS = ['ocak', 'subat', 'mart', 'nisan', 'mayis', 'haziran', 'temmuz', 'agustos', 'eylul', 'ekim', 'kasim', 'aralik'];

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

  const toEvents = (text) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const events = sheetRows(text)
      .map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [ALIASES[k], v]).filter(([k]) => k)))
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

      /* fotoğraf isteğe bağlı; yüklenemezse yeri boş kalır (Drive sorunu görünsün) */
      const src = safeImage(ev.gorsel, 1200);
      if (src) {
        const fig = make('div', 'up-img');
        const img = make('img');
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.width = 800;
        img.height = 450;
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

  const url = sheetUrl(upSec.dataset.gid);
  if (!url) finish([]);
  else fetchText(url).then((text) => finish(toEvents(text), false)).catch(() => finish([], true));
}

/* --- tablodan görseller ---
   Galeri: her satır bir kare (gorsel, kucuk, aciklama, boyut); satır yoksa HTML'deki kareler kalır.
   Diğer bölümler: tablodaki "alan" sütunu, bölümdeki data-slot'la eşleşir.
     <img data-slot>        → görsel değişir
     <a data-slot><img></a> → bağlantı büyük, içteki görsel küçük hâle
     <… data-slot> içindeki [data-col="sütun"] → o sütunun değeri: <img> ise görsel, değilse metin
                                                (boş hücrede HTML'deki metin kalır)
   Drive'daki görsel açılmazsa yerine bir şey konmaz: boş kalan yer, sorunu görünür kılar. */
const GAL_SIZES = { genis: 'wide', uzun: 'tall', buyuk: 'wide tall' };
const fillGallery = (sec, rows) => {
  const tiles = rows.map((r, i) => {
    const full = safeImage(r.gorsel, 1600);
    if (!full) return null;
    const label = r.aciklama || `Fotoğraf ${i + 1}`;
    const b = make('button', `shot gallery-reveal reveal ${GAL_SIZES[r.boyut] || ''}`.trim());
    b.type = 'button';
    b.dataset.full = full;
    b.dataset.caption = r.aciklama || '';
    b.setAttribute('aria-label', label);
    const img = make('img');
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 700;
    img.height = 933;
    img.src = safeImage(r.kucuk, 700) || safeImage(r.gorsel, 700);
    b.append(img);
    return b;
  }).filter(Boolean);
  if (!tiles.length) return;
  $('#gallery', sec).replaceChildren(...tiles);
  addReveals(tiles);
};

const fillSlots = (sec, rows) => {
  const byKey = Object.fromEntries(rows.map((r) => [r.alan, r]));
  $$('[data-slot]', sec).forEach((el) => {
    const row = byKey[el.dataset.slot];
    if (!row) return;
    $$('[data-col]', el).forEach((c) => {
      const v = row[c.dataset.col];
      if (!v) return;
      if (c.tagName !== 'IMG') c.textContent = v;
      else if (safeImage(v)) c.src = safeImage(v, c.getAttribute('width'));
    });
    if (el.tagName === 'IMG') {
      const src = safeImage(row.gorsel, el.getAttribute('width'));
      if (src) el.src = src;
      if (row.aciklama) el.alt = row.aciklama;
    } else if (el.tagName === 'A') {
      const full = safeImage(row.gorsel, 1600);
      if (!full) return;
      el.href = full;
      $('img', el).src = safeImage(row.gorsel, 700);
      el.setAttribute('aria-label', row.aciklama || 'Game Jam fotoğrafı');
    }
  });
};

/* Üyelik: her "sosyal" satırı, tablodaki sırayla bir bağlantı olur (baslik, link, ikon). İkon yalnızca repodaki bir dosya
   (assets/…); boşsa ya da geçersizse genel bağlantı ikonu. Geçerli satır yoksa HTML'deki liste kalır. */
const DEFAULT_ICON = 'assets/img/icons/link.svg';
const localIcon = (v) => {
  const s = (v || '').trim();
  return /^assets\/[\w\-./]+\.(svg|webp|png)$/i.test(s) && !s.includes('..') ? s : '';
};
const fillJoin = (sec, rows) => {
  const links = rows.filter((r) => r.alan === 'sosyal').map((r) => {
    const href = safeLink(r.link);
    if (!href || !r.baslik) return null;
    const a = make('a', 'portal');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.title = r.baslik;
    a.setAttribute('aria-label', r.baslik);
    const img = make('img');
    img.alt = '';
    img.width = 24;
    img.height = 24;
    img.src = localIcon(r.ikon) || DEFAULT_ICON;
    a.append(img, make('span', 'portal-name', r.baslik));
    return a;
  }).filter(Boolean);
  if (links.length) $('.portals', sec).replaceChildren(...links);
};

const FILLERS = { galeri: fillGallery, uyelik: fillJoin };
$$('[data-gid]').forEach((sec) => {
  const url = sec !== upSec && sheetUrl(sec.dataset.gid);
  if (!url) return;
  const fill = FILLERS[sec.id] || fillSlots;
  fetchText(url).then((text) => fill(sec, sheetRows(text))).catch(() => { /* HTML'deki hâli kalır */ });
});

/* --- bölüm başlıkları: "ana sayfa" sheet'i ---
   Gid'i <main data-home-gid>. Her satır bir bölüm: alan = bölümün id'si (hakkimizda, yaklasan, …);
   ust / baslik / aciklama sütunları bölümdeki [data-head="…"] öğesine yazılır, boş hücrede HTML'deki
   metin kalır. *Yıldız içindeki* kısım vurgu rengiyle yazılır (yine yalnızca metin olarak). */
const setHead = (el, v) => {
  el.replaceChildren(...v.split('*').map((part, i) => (i % 2 ? make('span', 'accent', part) : part)));
  el.hidden = false;
};
const homeUrl = sheetUrl(document.getElementById('main')?.dataset.homeGid);
if (homeUrl) {
  fetchText(homeUrl).then((text) => sheetRows(text).forEach((row) => {
    const sec = row.alan && document.getElementById(row.alan);
    if (!sec) return;
    $$('[data-head]', sec).forEach((el) => {
      const v = row[el.dataset.head];
      if (v) setHead(el, v);
    });
  })).catch(() => { /* HTML'deki başlıklar kalır */ });
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
