/* موسوعة القرآن الكريم service worker: app shell + core data precached; tafsir chunks and fonts cached on first use */
const SHELL = 'qenc-shell-2863b10b3b', DATA = 'qenc-data-v1', CORE = ["tafasir.js", "./", "index.html", "app.js", "tools.js", "app.css", "theme.css", "fonts.css", "fonts/amiri-quran-arabic-400-normal.woff2", "fonts/amiri-quran-latin-400-normal.woff2", "fonts/aref-ruqaa-arabic-700-normal.woff2", "fonts/aref-ruqaa-latin-700-normal.woff2", "fonts/readex-pro-arabic-wght-normal.woff2", "fonts/readex-pro-latin-wght-normal.woff2", "manifest.webmanifest", "config.json", "icons/icon-192.png", "icons/icon-512.png", "data/quran.txt", "data/words.txt", "data/topics.txt", "data/tafsir.json", "data/geo.json", "data/qasas.txt", "data/t/muyassar/0.txt", "data/t/gharib/0.txt", "data/tr/index.json", "data/i18n/en.json", "mushaf.js", "fiqh.js", "study.js", "recite.js", "progress.js", "adhan.js", "mushaf.css", "fonts/kfgqpc-hafs-uthmanic-v18.woff2", "data/mushaf.txt", "mods/sira.js", "mods/nm.js", "mods/duaq.js", "mods/naskh.js", "mods/arbain.js", "mods/taam.js", "mods/hajj.js", "mods/asnaf.js", "mods/jannah.js", "mods/jamal.js", "mods/tawhid.js", "mods/ruqya.js", "mods/wazifa.js", "mods/amthal.js", "mods/asma.js", "mods/mawdui.js", "mods/rusul.js", "mods/tibb.js", "mods/maal.js", "mods/nabat.js", "mods/tawsiyat.js", "mods/maadin.js", "mods/hadithq.js", "mods/qasasx.js", "mods/fiqhq.js", "mods/bir.js", "mods/jud.js", "mods/firasa.js", "mods/zkq.js", "mods/krb.js", "mods/ttw.js", "mods/itam.js", "mods/waqf.js", "mods/hwj.js", "mods/kfl.js", "mods/amal.js", "mods/ijaz.js", "mods/taqwa.js", "mods/mumin.js", "mods/rsifat.js", "mods/taamul.js", "mods/sabr.js", "mods/nsira.js", "mods/hayawan.js", "mods/nikah.js", "mods/tifl.js", "mods/qtl.js", "mods/qatlas.js"];
self.addEventListener('install', e => e.waitUntil(caches.open(SHELL).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('qenc-shell-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET') return;
  if (u.origin === location.origin && (u.pathname.endsWith('config.json'))) { e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(SHELL).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request))); return; }
  if (u.hostname === 'everyayah.com') return;
  const isData = u.origin === location.origin && (u.pathname.includes('/data/t/') || u.pathname.includes('/data/hadith/') || u.pathname.includes('/data/tr/'));
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname) || u.pathname.includes('/fonts/');
  if (u.origin !== location.origin && !isFont) return;
  if (isData || isFont) {
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(isData ? DATA : SHELL).then(x => x.put(e.request, c)); } return r; })));
    return;
  }
  /* الصفحة والشيفرة والبيانات الأساسية: الشبكة أولاً (مع إعادة تحقق سريعة) ثم الكاش دون اتصال، فلا حاجة لتغيير رقم الإصدار عند كل نشر */
  e.respondWith(freshFirst(e.request));
});
const sig = r => r.headers.get('etag') || r.headers.get('last-modified') || r.headers.get('content-length') || '';
let notified = false;
async function freshFirst(req) {
  const cache = await caches.open(SHELL), u = new URL(req.url);
  try {
    const r = await Promise.race([fetch(u.href, { cache: 'no-cache' }), new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 4000))]);
    if (!r.ok) { const hit = await cache.match(req, { ignoreSearch: true }); return hit || r; }
    const old = await cache.match(req, { ignoreSearch: true });
    await cache.put(req.mode === 'navigate' ? new Request('./') : req, r.clone());
    if (old && !notified && /\.(js|css|html)$|\/$/.test(u.pathname) && sig(old) !== sig(r)) { notified = true; self.clients.matchAll().then(cs => cs.forEach(c => c.postMessage({ type: 'qenc-updated' }))); }
    return r;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true }) || await caches.match(req, { ignoreSearch: true });
    if (hit) return hit; throw err;
  }
}

self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => { const c = cs.find(x => x.url.startsWith(self.registration.scope)); if (c) { c.navigate(new URL('#prayer', c.url).href).catch(() => {}); return c.focus(); } return self.clients.openWindow('./#prayer'); })); });
