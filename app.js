/* ============================================================
   BANTU AJA — Frontend (SPA) · Bagian 1 dari 4
   Konstanta, router, kerangka, notifikasi, halaman publik.
   ============================================================ */
'use strict';

const APP_VER = '1.5';   // harus sama dengan APP_VERSION di Kode.gs
const CFG = window.BB_CONFIG || {};
const PWA = !!CFG.GAS_URL;

const S = { token: null, user: null, partner: null, home: null, route: null, hist: [], unread: 0, charts: {}, after: null, badge: {} };
const R = { PEL: 'pelanggan', MIT: 'mitra', KEC: 'admin_kecamatan', KAB: 'admin_kabupaten', SUP: 'super_admin' };
const ADMIN_ROLES = [R.KEC, R.KAB, R.SUP];
const ROLE_LBL = { pelanggan: 'Pelanggan', mitra: 'Mitra', admin_kecamatan: 'Admin Kecamatan', admin_kabupaten: 'Admin Kabupaten', super_admin: 'Super Admin' };

const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const E = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isAdm = () => !!S.user && ADMIN_ROLES.indexOf(S.user.role) >= 0;
const isSup = () => !!S.user && S.user.role === R.SUP;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const HARI = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const store = {
  get(k) { try { return (PWA ? window.localStorage : window.sessionStorage).getItem(k); } catch (e) { return null; } },
  set(k, v) { try { (PWA ? window.localStorage : window.sessionStorage).setItem(k, v); } catch (e) { /* diabaikan */ } },
  del(k) { try { (PWA ? window.localStorage : window.sessionStorage).removeItem(k); } catch (e) { /* diabaikan */ } },
  lget(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
  lset(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* diabaikan */ } },
  ldel(k) { try { window.localStorage.removeItem(k); } catch (e) { /* diabaikan */ } }
};

// ── Format ───────────────────────────────────────────────
const rp = n => 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(Number(n) || 0));
const rpShort = n => {
  n = Number(n) || 0;
  return n >= 1e9 ? 'Rp ' + (n / 1e9).toFixed(2).replace('.', ',') + ' M'
    : n >= 1e6 ? 'Rp ' + (n / 1e6).toFixed(2).replace('.', ',') + ' jt' : rp(n);
};
function tgl(iso, withTime) {
  if (!iso) return '-';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return E(iso);
  return m[3] + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] + (withTime !== false && m[4] ? ', ' + m[4] + ':' + m[5] : '');
}
function ago(iso) {
  if (!iso) return '';
  const t = new Date(String(iso).replace(' ', 'T') + '+07:00').getTime();
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (m < 1) return 'baru saja';
  if (m < 60) return m + ' mnt lalu';
  const h = Math.round(m / 60);
  if (h < 24) return h + ' jam lalu';
  return Math.round(h / 24) + ' hari lalu';
}
const jadwalLbl = o => o.jadwalTipe === 'hari_ini' ? 'Hari ini (segera)' : o.jadwalTipe === 'besok' ? 'Besok pagi, 09.00 WIB' : tgl(o.jadwal);
const initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const stars = n => {
  n = Math.round(Number(n) || 0);
  return '<span class="stars" aria-label="Rating ' + n + ' dari 5">' + '★'.repeat(n) + '<span class="off">' + '★'.repeat(5 - n) + '</span></span>';
};
const waLink = (phone, text) => 'https://wa.me/' + String(phone || '').replace(/\D/g, '') + (text ? '?text=' + encodeURIComponent(text) : '');
const ST_KIND = {
  'Menunggu Konfirmasi': 'warn', 'Mencari Mitra': 'warn', 'Menunggu Penawaran': 'warn', 'Menunggu Persetujuan': 'gold',
  'Disetujui': 'ok', 'Dijadwalkan': 'ok', 'Dalam Pengerjaan': 'gold', 'Selesai': 'ok', 'Dikonfirmasi': 'ok',
  'Dibatalkan': 'err', 'Dalam Pengaduan': 'err'
};
const bdg = (t, k) => '<span class="bdg ' + (k || '') + '">' + E(t) + '</span>';
const stBdg = s => bdg(s, ST_KIND[s] || '');
const FINAL = ['Dikonfirmasi', 'Dibatalkan'];

// ── Merek: nama & logo aplikasi (dari Pengaturan Sistem) ──
const versionMismatch = () => !!(S.home && S.home.versi !== APP_VER);
const versionBanner = () => '<div class="note err mb-3" role="alert"><i class="bi bi-exclamation-octagon"></i><div><b>Versi server tidak sama dengan tampilan.</b> Tampilan v' + E(APP_VER) + ', server Apps Script v' + E((S.home && S.home.versi) || 'lama') + '. Salin <b>Kode.gs</b> terbaru, lalu <b>Deploy → Kelola deployment → Versi baru → Deploy</b>.</div></div>';
const appName = () => (S.home && S.home.settings && S.home.settings.appName) || 'BANTU AJA';
const logoSrc = () => (S.home && S.home.settings && S.home.settings.logo) || store.lget('bb_logo') || '';
function logoMark(cls, style) {
  const l = logoSrc();
  return '<span class="logo-mark ' + (l ? 'has-img ' : '') + (cls || '') + '"' + (style ? ' style="' + style + '"' : '') + '>' +
    (l ? '<img alt="Logo ' + E(appName()) + '" src="' + E(l) + '">' : '<i class="bi bi-hand-thumbs-up-fill"></i>') + '</span>';
}
function applyBrand() {
  const s = S.home && S.home.settings; if (!s) return;
  if (s.logo) store.lset('bb_logo', s.logo); else store.ldel('bb_logo');
  const setLink = (rel, href) => {
    let l = document.querySelector('link[rel="' + rel + '"]');
    if (!l) { l = document.createElement('link'); l.rel = rel; document.head.appendChild(l); }
    l.href = href;
  };
  if (s.logo) { setLink('icon', s.logo); setLink('apple-touch-icon', s.logo); }
  document.title = (S.route && ROUTES[S.route.name] ? ROUTES[S.route.name].title + ' · ' : '') + appName();
}

// ── Pemuat & toast ───────────────────────────────────────
let loads = 0;
function loader(d) { loads = Math.max(0, loads + d); const b = $('#pbar'); if (b) b.classList.toggle('on', loads > 0); }
function toast(msg, type) {
  const t = document.createElement('div');
  t.className = 'toast-i ' + (type || '');
  t.innerHTML = '<i class="bi ' + (type === 'ok' ? 'bi-check-circle-fill' : type === 'err' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill') + '"></i><div class="grow">' + E(msg) + '</div>';
  $('#toasts').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, type === 'err' ? 5500 : 3200);
}
const toastErr = e => toast((e && e.message) || 'Terjadi kesalahan.', 'err');

// ── Pemanggilan server (google.script.run → api, atau REST di PWA) ─────
function api(action, data, opt) {
  opt = opt || {};
  return new Promise((resolve, reject) => {
    const done = res => {
      if (!opt.silent) loader(-1);
      if (res && res.success) return resolve(res.data);
      if (res && res.code === 'AUTH' && S.user) sessionExpired();
      const err = new Error(res ? res.message : 'Respons server kosong.');
      err.code = res && res.code ? res.code : '';
      if (/^Aksi tidak dikenal/.test(err.message)) err.message = 'Fitur ini belum ada di server Apps Script Anda. Salin Kode.gs terbaru lalu Deploy → Kelola deployment → Versi baru.';
      reject(err);
    };
    const fail = err => { if (!opt.silent) loader(-1); reject(err instanceof Error ? err : new Error('Koneksi bermasalah. Periksa internet Anda lalu coba lagi.')); };
    if (!opt.silent) loader(1);
    if (PWA) {
      if (navigator.onLine === false) return fail(new Error('Anda sedang offline. Sambungkan internet lalu coba lagi.'));
      const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), opt.timeout || 90000);
      fetch(CFG.GAS_URL, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ token: S.token || '', action: action, data: data || {} }), redirect: 'follow', signal: ctl.signal
      })
        .then(r => r.json())
        .then(j => { clearTimeout(tm); done(j); })
        .catch(e => { clearTimeout(tm); fail(new Error(e && e.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : 'Koneksi bermasalah. Periksa internet Anda lalu coba lagi.')); });
    } else {
      google.script.run.withSuccessHandler(done).withFailureHandler(err => { console.error(err); fail(); })
        .api(S.token, action, data || {});
    }
  });
}
function sessionExpired() {
  clearSession();
  toast('Sesi berakhir. Silakan masuk kembali.', 'err');
  applyChrome(); go('login', {}, { reset: true });
}
function clearSession() { S.token = null; S.user = null; S.partner = null; S.unread = 0; S.badge = {}; store.del('bb_t'); }

// ── Tema ─────────────────────────────────────────────────
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  store.lset('bb_theme', t);
  const m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#0F1115' : '#F6F3EA');
  Object.values(S.charts).forEach(c => { try { c.destroy(); } catch (e) { /* abaikan */ } });
  S.charts = {};
  if (S.route && S.route.name) go(S.route.name, S.route.params, { back: true, soft: true });
  applyChrome();
}
const toggleTheme = () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');

// ── Modal, konfirmasi, formulir ──────────────────────────
let _mdl = null, _pv = null;
function openModal(o) {
  $('#mdlTitle').textContent = o.title || '';
  $('#mdlBody').innerHTML = o.body || '';
  const f = $('#mdlFoot'); f.innerHTML = o.foot || ''; f.style.display = o.foot ? '' : 'none';
  $('#mdlDlg').className = 'modal-dialog modal-dialog-centered' + (o.size ? ' modal-' + o.size : '');
  _mdl = _mdl || new bootstrap.Modal('#mdl');
  _mdl.show();
  if (o.onShown) setTimeout(o.onShown, 30);
}
const closeModal = () => { if (_mdl) _mdl.hide(); };
function ask(o) {
  return new Promise(resolve => {
    const reason = o.reason ? '<div class="fld mt-3"><label for="askR">' + E(o.reason.label) + '</label><textarea class="inp" id="askR" rows="3" placeholder="' + E(o.reason.ph || '') + '"></textarea></div>' : '';
    openModal({
      title: o.title, body: '<div>' + (o.text || '') + '</div>' + reason,
      foot: '<button class="btn-gh" data-bs-dismiss="modal">Batal</button><button class="' + (o.danger ? 'btn-dg' : 'btn-g') + '" id="askYes">' + E(o.ok || 'Lanjutkan') + '</button>'
    });
    let done = false;
    $('#askYes').onclick = () => {
      const v = o.reason ? $('#askR').value.trim() : true;
      if (o.reason && o.reason.required && v.length < 3) { toast('Isi alasan terlebih dahulu.', 'err'); return; }
      done = true; closeModal(); resolve(v);
    };
    $('#mdl').addEventListener('hidden.bs.modal', () => { if (!done) resolve(null); }, { once: true });
  });
}
/** Kolom formulir. Kolom kata sandi otomatis memakai ikon mata. */
function fieldHtml(f) {
  const id = 'f_' + f.name, req = f.req ? ' required' : '', v = f.value == null ? '' : f.value;
  let inp;
  if (f.type === 'textarea') {
    inp = '<textarea class="inp" id="' + id + '" name="' + f.name + '" rows="' + (f.rows || 3) + '" placeholder="' + E(f.ph || '') + '"' + req + (f.max ? ' maxlength="' + f.max + '"' : '') + '>' + E(v) + '</textarea>';
  } else if (f.type === 'select') {
    inp = '<select class="inp" id="' + id + '" name="' + f.name + '"' + req + '>' + (f.blank ? '<option value="">' + E(f.blank) + '</option>' : '') +
      (f.options || []).map(o => '<option value="' + E(o.v) + '"' + (String(o.v) === String(v) ? ' selected' : '') + '>' + E(o.t) + '</option>').join('') + '</select>';
  } else {
    inp = '<input class="inp" id="' + id + '" name="' + f.name + '" type="' + (f.type || 'text') + '" value="' + E(v) + '" placeholder="' + E(f.ph || '') + '"' + req +
      (f.min != null ? ' min="' + f.min + '"' : '') + (f.max != null ? ' max="' + f.max + '"' : '') + (f.step ? ' step="' + f.step + '"' : '') +
      (f.type === 'password' ? ' autocomplete="' + (f.ac || 'current-password') + '"' : '') + (f.ac && f.type !== 'password' ? ' autocomplete="' + f.ac + '"' : '') +
      (f.inputmode ? ' inputmode="' + f.inputmode + '"' : '') + (f.ro ? ' readonly' : '') + '>';
  }
  if (f.type === 'password') inp = '<div class="pw-wrap">' + inp + '<button type="button" class="pw-eye" data-act="eye" aria-label="Tampilkan kata sandi"><i class="bi bi-eye"></i></button></div>';
  return '<div class="fld"' + (f.half ? ' style="flex:1"' : '') + '><label for="' + id + '">' + E(f.label) + (f.req ? ' <span style="color:var(--err)">*</span>' : '') + '</label>' +
    inp + (f.help ? '<div class="help">' + E(f.help) + '</div>' : '') + '</div>';
}
const formVals = form => { const o = {}; new FormData(form).forEach((v, k) => { o[k] = typeof v === 'string' ? v.trim() : v; }); return o; };
/** Pasang handler submit: cegah reload, validasi HTML5, kunci tombol saat memproses. */
function bindForm(form, handler, btnSel) {
  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const btn = $(btnSel || 'button[type=submit]', form) || $('#mdlFoot [type=submit]');
    const old = btn ? btn.innerHTML : '';
    if (btn) { if (btn.disabled) return; btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Memproses...'; }
    try { await handler(formVals(form), form); }
    catch (e) { toastErr(e); }
    finally { if (btn) { btn.disabled = false; btn.innerHTML = old; } }
  });
}
function formModal(o) {
  const body = '<form id="mf" novalidate>' + (o.intro ? '<p class="muted">' + o.intro + '</p>' : '') + o.fields.map(fieldHtml).join('') + (o.extra || '') + '</form>';
  openModal({
    title: o.title, body: body, size: o.size,
    foot: '<button class="btn-gh" data-bs-dismiss="modal">Batal</button><button class="btn-g" type="submit" form="mf">' + E(o.submit || 'Simpan') + '</button>',
    onShown: () => {
      const f = $('#mf');
      bindForm(f, async (v, form) => { await o.onSubmit(v, form); closeModal(); });
      if (o.onReady) o.onReady(f);
    }
  });
}

// ── Berkas: kompres gambar, pratinjau ────────────────────
const b64Blob = (b64, mime) => {
  const bin = atob(b64), a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return new Blob([a], { type: mime });
};
function showBlob(blob, title, filename) {
  const url = URL.createObjectURL(blob);
  const isImg = blob.type.indexOf('image/') === 0;
  $('#pvTitle').textContent = title || 'Pratinjau';
  $('#pvBody').innerHTML = isImg ? '<img class="pv-img" alt="' + E(title) + '" src="' + url + '">'
    : '<iframe class="pv-frame" title="' + E(title) + '" src="' + url + '"></iframe><p class="small muted mt-2">Jika pratinjau tidak tampil, gunakan tombol Unduh.</p>';
  const dl = $('#pvDl'); dl.href = url; dl.setAttribute('download', filename || 'berkas');
  _pv = _pv || new bootstrap.Modal('#pv');
  _pv.show();
}
async function showFile(kind, id, title) {
  try { const r = await api('file.get', { kind: kind, id: id }); showBlob(b64Blob(r.data, r.mime), title, title); } catch (e) { toastErr(e); }
}
async function showPdf(action, data, title) {
  try { const r = await api(action, data); showBlob(b64Blob(r.base64, 'application/pdf'), title, r.nama); } catch (e) { toastErr(e); }
}
function loadImg(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); res(im); };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Gambar tidak dapat dibaca.')); };
    im.src = url;
  });
}
/** Kompres foto di klien: sisi terpanjang `max` px, kualitas diturunkan hingga ≤ maxBytes. */
async function prepImage(file, opt) {
  opt = opt || {};
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Gunakan foto JPG, PNG, atau WebP.');
  const im = await loadImg(file);
  const draw = max => {
    const k = Math.min(1, max / Math.max(im.width, im.height));
    const c = document.createElement('canvas');
    c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    return c;
  };
  const c = draw(opt.max || 1280);
  let q = 0.82, url = c.toDataURL('image/jpeg', q);
  const lim = (opt.maxBytes || 800000) * 1.33;
  while (url.length > lim && q > 0.35) { q -= 0.08; url = c.toDataURL('image/jpeg', q); }
  if (url.length > lim) throw new Error('Foto terlalu besar, pilih foto lain.');
  let tq = 0.55, th = draw(opt.thumb || 240).toDataURL('image/jpeg', tq);
  while (th.length > 24000 && tq > 0.25) { tq -= 0.1; th = draw(200).toDataURL('image/jpeg', tq); }
  return { name: file.name.replace(/\.\w+$/, '') + '.jpg', mime: 'image/jpeg', data: url.split(',')[1], thumb: th.length <= 28000 ? th : '' };
}
const readB64 = file => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result).split(',')[1]);
  r.onerror = () => rej(new Error('Berkas tidak dapat dibaca.'));
  r.readAsDataURL(file);
});

// ── Komponen tampilan kecil ──────────────────────────────
const card = (inner, cls) => '<div class="bb-card ' + (cls || '') + '">' + inner + '</div>';
const secH = (icon, title, right) => '<div class="sec-h"><i class="bi ' + icon + '"></i><h2>' + E(title) + '</h2>' + (right ? '<span class="more">' + right + '</span>' : '') + '</div>';
const empty = (icon, text, cta) => '<div class="empty"><i class="bi ' + icon + '"></i><div>' + text + '</div>' + (cta ? '<div class="mt-3">' + cta + '</div>' : '') + '</div>';
const kpi = (lbl, val, sub, icon, cls) => '<div class="kpi"><div class="lbl">' + E(lbl) + '</div><div class="val ' + (cls || '') + '">' + val + '</div>' +
  (sub ? '<div class="sub">' + sub + '</div>' : '') + (icon ? '<div class="ico"><i class="bi ' + icon + '"></i></div>' : '') + '</div>';
const skeleton = () => '<div class="skel"></div><div class="skel" style="height:140px"></div><div class="skel"></div>';
const kv = (k, v) => '<div class="kv"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>';
const note = (icon, html, cls) => '<div class="note ' + (cls || '') + '"><i class="bi ' + icon + '"></i><div>' + html + '</div></div>';
const goBtn = (route, label, cls, extra) => '<button class="' + (cls || 'btn-g') + '" data-go="' + route + '" ' + (extra || '') + '>' + label + '</button>';
const avatar = (name, foto, cls) => '<span class="avatar ' + (cls || '') + '">' + (foto ? '<img alt="" src="' + E(foto) + '">' : E(initials(name))) + '</span>';
const waBtn = (phone, text, label, cls) => '<a class="' + (cls || 'btn-wa') + '" href="' + E(waLink(phone, text)) + '" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> ' + (label || 'WhatsApp') + '</a>';

function table(cols, rows, opt) {
  opt = opt || {};
  if (!rows.length) return empty('bi-inbox', opt.empty || 'Belum ada data.');
  return '<div class="tbl-wrap"><table class="tbl"><thead><tr>' + cols.map(c => '<th' + (c.num ? ' class="num"' : '') + '>' + E(c.h) + '</th>').join('') +
    '</tr></thead><tbody>' + rows.map(r => '<tr>' + cols.map(c => '<td' + (c.num ? ' class="num"' : '') + '>' + c.f(r) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
}
function tabs(items, cur, act) {
  return '<div class="tabs" role="tablist">' + items.map(i => '<button class="chip ' + (i.v === cur ? 'on' : '') + '" role="tab" data-act="' + act + '" data-v="' + E(i.v) + '">' +
    E(i.t) + (i.n != null ? ' <b>' + i.n + '</b>' : '') + '</button>').join('') + '</div>';
}
function tracker4(status) {
  const idx = { 'Menunggu Konfirmasi': 0, 'Mencari Mitra': 0, 'Menunggu Penawaran': 1, 'Menunggu Persetujuan': 1, 'Disetujui': 1, 'Dijadwalkan': 1, 'Dalam Pengerjaan': 2, 'Selesai': 3, 'Dikonfirmasi': 4 }[status];
  if (idx == null) return '';
  const L = ['Diajukan', 'Diterima', 'Dikerjakan', 'Selesai'];
  return '<div class="tracker">' + L.map((l, i) => '<div class="st ' + (idx > i ? 'done' : idx === i ? 'now' : '') + '"><div class="nd">' +
    (idx > i ? '<i class="bi bi-check-lg"></i>' : '') + '</div>' + l + '</div>').join('') + '</div>';
}
function progress6(o) {
  const idx = { 'Menunggu Konfirmasi': 0, 'Mencari Mitra': 1, 'Menunggu Penawaran': 1, 'Menunggu Persetujuan': 2, 'Disetujui': 3, 'Dijadwalkan': 3, 'Dalam Pengerjaan': 4, 'Selesai': 5, 'Dikonfirmasi': 6, 'Dalam Pengaduan': 3 }[o.status];
  if (idx == null) return '';
  const L = ['Pesanan Dibuat', 'Dicocokkan Admin', 'Penawaran Masuk', 'Disetujui', 'Dikerjakan', 'Selesai'];
  return '<div class="tracker" style="overflow-x:auto">' + L.map((l, i) => '<div class="st ' + (idx > i ? 'done' : idx === i ? 'now' : '') + '" style="min-width:58px"><div class="nd">' +
    (idx > i ? '<i class="bi bi-check-lg"></i>' : '') + '</div>' + l + '</div>').join('') + '</div>';
}
const barPct = (n, max) => '<div class="bar"><i style="width:' + Math.min(100, max ? Math.round(n / max * 100) : 0) + '%"></i></div>';
const catIcon = c => '<span class="ic"><i class="bi ' + E(c.ikon || 'bi-grid') + '"></i></span>';

// ── Grafik (Chart.js) ────────────────────────────────────
function chartColors() {
  const cs = getComputedStyle(document.documentElement);
  return {
    tx: cs.getPropertyValue('--mut').trim() || '#94A3B8', grid: cs.getPropertyValue('--line').trim() || '#333948',
    gold: cs.getPropertyValue('--gold').trim() || '#D4AF37', ok: '#10B981', goldD: cs.getPropertyValue('--gold-d').trim() || '#997A15'
  };
}
function mkChart(id, cfg) {
  const cv = document.getElementById(id);
  if (!cv || typeof Chart === 'undefined') return;
  if (S.charts[id]) { try { S.charts[id].destroy(); } catch (e) { /* abaikan */ } }
  const c = chartColors();
  Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
  Chart.defaults.color = c.tx;
  cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: c.tx, boxWidth: 12 } } } }, cfg.options || {});
  if (cfg.options.scales) Object.values(cfg.options.scales).forEach(s => {
    s.grid = Object.assign({ color: c.grid }, s.grid || {});
    s.ticks = Object.assign({ color: c.tx }, s.ticks || {});
  });
  S.charts[id] = new Chart(cv, cfg);
}
const destroyCharts = () => { Object.values(S.charts).forEach(c => { try { c.destroy(); } catch (e) { /* abaikan */ } }); S.charts = {}; };
function downloadCsv(name, rows) {
  const csv = '\ufeff' + rows.map(r => r.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  $('#pvTitle').textContent = name;
  $('#pvBody').innerHTML = '<div class="empty"><i class="bi bi-file-earmark-spreadsheet"></i>Berkas <b>' + E(name) + '</b> siap diunduh (' + rows.length + ' baris).</div>';
  const dl = $('#pvDl'); dl.href = url; dl.setAttribute('download', name);
  _pv = _pv || new bootstrap.Modal('#pv');
  _pv.show();
}

// ── Router SPA ───────────────────────────────────────────
const ROUTES = {};
const reg = (name, title, roles, fn, nav) => { ROUTES[name] = { title: title, roles: roles, fn: fn, nav: nav || name }; };
const homeRoute = () => !S.user ? 'beranda' : S.user.role === R.PEL ? 'pelDash' : S.user.role === R.MIT ? 'mitraDash' : 'admDash';
async function go(name, params, opt) {
  opt = opt || {}; params = params || {};
  const rt = ROUTES[name];
  if (!rt) return;
  if (rt.roles && (!S.user || rt.roles.indexOf(S.user.role) < 0)) {
    if (!S.user) { S.after = { name: name, params: params }; toast('Silakan masuk terlebih dahulu.'); return go('login'); }
    toast('Anda tidak memiliki akses ke halaman itu.', 'err');
    return go(homeRoute());
  }
  if (!opt.back && !opt.soft && S.route && !opt.reset) { S.hist.push(S.route); if (S.hist.length > 30) S.hist.shift(); }
  if (opt.reset) S.hist = [];
  S.route = { name: name, params: params };
  if (PWA && !opt.fromPop) {
    const stt = { bb: 1, n: name, p: params };
    try { if (S.started && !opt.reset && !opt.soft && !opt.back) history.pushState(stt, ''); else history.replaceState(stt, ''); } catch (e) { /* abaikan */ }
  }
  S.started = true;
  closeDrawer(); destroyCharts();
  const v = $('#view');
  if (!opt.soft) v.innerHTML = skeleton();
  setChrome(rt);
  if (!opt.soft) window.scrollTo(0, 0);
  try {
    await rt.fn(params, v);
    v.focus({ preventScroll: true });
    if (isAdm() && versionMismatch()) v.insertAdjacentHTML('afterbegin', versionBanner());
  } catch (e) {
    v.innerHTML = card(empty('bi-exclamation-triangle', E(e.message || 'Gagal memuat halaman.'), '<button class="btn-g" data-act="reload">Coba lagi</button>'));
  }
}
function back() {
  if (PWA && S.hist.length) { history.back(); return; }
  const p = S.hist.pop();
  if (p) go(p.name, p.params, { back: true }); else go(homeRoute(), {}, { back: true });
}
const refresh = () => go(S.route.name, S.route.params, { soft: true });

// ── Kerangka: topbar, sidebar, navigasi bawah ────────────
function menuDef() {
  if (!S.user) return { type: 'mobile', bottom: [['beranda', 'bi-house', 'Beranda'], ['mitraList', 'bi-people', 'Mitra'], ['pesanBaru', 'bi-plus-lg', 'Pesan', 'fab'], ['bantuan', 'bi-question-circle', 'Bantuan'], ['login', 'bi-box-arrow-in-right', 'Masuk']] };
  if (S.user.role === R.PEL) return { type: 'mobile', bottom: [['pelDash', 'bi-house', 'Beranda'], ['beranda', 'bi-grid', 'Katalog'], ['pesanBaru', 'bi-plus-lg', 'Pesan', 'fab'], ['pesananList', 'bi-receipt', 'Pesanan'], ['akun', 'bi-person', 'Akun']] };
  if (S.user.role === R.MIT) return { type: 'staff', sec: 'MENU MITRA', items: [
    ['mitraDash', 'bi-grid-1x2', 'Ringkasan'], ['mitraMasuk', 'bi-bell', 'Pesanan Masuk', 'masuk'],
    ['mitraKerja', 'bi-tools', 'Pekerjaan Berjalan', 'aktif'], ['mitraRiwayat', 'bi-clock-history', 'Riwayat & Ulasan'],
    ['mitraUang', 'bi-wallet2', 'Saldo & Komisi'], ['mitraProfil', 'bi-person-badge', 'Profil & Keahlian'],
    ['mitraWilayah', 'bi-geo-alt', 'Wilayah Layanan'], ['bantuan', 'bi-question-circle', 'Bantuan & Pengaduan']] };
  const a = [
    ['admDash', 'bi-grid-1x2', 'Dashboard Utama'], ['admPencocokan', 'bi-diagram-3', 'Pencocokan Pesanan', 'cocok'],
    ['admAntrean', 'bi-check2-square', 'Deposit & Keahlian', 'persetujuan'], ['admPesanan', 'bi-receipt', 'Semua Pesanan'],
    ['admVerifikasi', 'bi-shield-check', 'Verifikasi Mitra', 'verif'], ['admWilayah', 'bi-geo-alt', 'Wilayah', 'wilayah'],
    ['admLayanan', 'bi-tools', 'Katalog Layanan'], ['admPengguna', 'bi-people', 'Pelanggan & Mitra'],
    ['admKomisi', 'bi-cash-coin', 'Saldo, Komisi & Laporan'], ['admPengaduan', 'bi-chat-square-text', 'Pengaduan & Ulasan', 'aduan']
  ];
  if (isSup()) a.push(['admPromosi', 'bi-megaphone', 'Promosi Mitra'], ['admPengaturan', 'bi-gear', 'Pengaturan Sistem'], ['admAkun', 'bi-person-gear', 'Akun Admin'], ['admAudit', 'bi-journal-text', 'Audit Log']);
  a.push(['profil', 'bi-key', 'Profil & Kata Sandi']);
  return { type: 'staff', sec: 'MENU OPERASIONAL', items: a };
}
function applyChrome() {
  const m = menuDef();
  document.body.setAttribute('data-layout', m.type);
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const bell = S.user ? '<button class="iconbtn" data-act="notif" aria-label="Notifikasi"><i class="bi bi-bell"></i>' + (S.unread ? '<span class="dot">' + (S.unread > 9 ? '9+' : S.unread) + '</span>' : '') + '</button>' : '';
  const themeBtn = '<button class="iconbtn" data-act="theme" aria-label="Ganti tema" title="Ganti tema"><i class="bi ' + (dark ? 'bi-sun' : 'bi-moon-stars') + '"></i></button>';
  const app = appName();
  const instBtn = (PWA && !isStandalone()) ? '<button class="iconbtn" data-act="install" aria-label="Pasang aplikasi di HP" title="Pasang aplikasi"><i class="bi bi-download"></i></button>' : '';
  if (m.type === 'mobile') {
    $('#topbar').innerHTML = '<button class="grow row-flex" style="background:none;border:0;padding:0;text-align:left;cursor:pointer" data-go="' + homeRoute() + '" aria-label="Beranda">' +
      logoMark('', 'width:40px;height:40px;font-size:20px') + '<span class="brand">' + E(app) + '<small><i class="bi bi-geo-alt-fill"></i> ' +
      E((S.home && S.home.settings.namaDaerah) || 'Lumbir, Banyumas') + '</small></span></button>' + instBtn + themeBtn + bell +
      (S.user ? '<button class="avatar" style="border:1px solid var(--gold-a);cursor:pointer" data-go="akun" aria-label="Akun saya">' + E(initials(S.user.nama)) + '</button>' : '');
    $('#bottomnav').innerHTML = m.bottom.map(b => '<button class="bn ' + (b[3] || '') + '" data-go="' + b[0] + '" data-nav="' + b[0] + '"><i class="bi ' + b[1] + '"></i><span>' + b[2] + '</span></button>').join('');
    $('#sidebar').innerHTML = '';
  } else {
    $('#topbar').innerHTML = '<button class="iconbtn" id="menuBtn" data-act="drawer" aria-label="Buka menu"><i class="bi bi-list"></i></button>' +
      logoMark('d-lg-none', 'width:36px;height:36px;font-size:18px') + '<div class="grow"><b style="color:var(--tx)" id="pageTitle"></b></div>' + instBtn + themeBtn + bell +
      '<button class="row-flex gap-2" style="padding-left:6px;background:none;border:0;text-align:left;cursor:pointer" data-go="profil" aria-label="Profil dan ganti kata sandi" title="Profil & kata sandi">' +
      avatar(S.user.nama, S.partner && S.partner.foto, 'sm') + '<div class="small d-none d-md-block"><b style="color:var(--tx)">' + E(S.user.nama) + '</b><br><span class="muted">' + ROLE_LBL[S.user.role] + '</span></div></button>';
    $('#bottomnav').innerHTML = '';
    $('#sidebar').innerHTML = '<div class="row-flex gap-3" style="padding:4px 8px 6px">' + logoMark() + '<div class="brand">' + E(app) + '<small>' + E((S.home && S.home.settings.namaDaerah) || '') + '</small></div></div>' +
      '<div style="padding:0 8px"><span class="role-pill">' + ROLE_LBL[S.user.role] + '</span></div><div class="side-sec">' + m.sec + '</div>' +
      m.items.map(i => '<button class="side-link" data-go="' + i[0] + '" data-nav="' + i[0] + '"><i class="bi ' + i[1] + '"></i><span>' + i[2] + '</span>' +
        (i[3] && S.badge[i[3]] ? '<span class="cnt" data-badge="' + i[3] + '">' + S.badge[i[3]] + '</span>' : '') + '</button>').join('') +
      '<div style="flex:1"></div><button class="side-link" data-act="logout"><i class="bi bi-box-arrow-left"></i><span>Keluar</span></button>';
  }
  if (S.route) setChrome(ROUTES[S.route.name]);
}
function setChrome(rt) {
  if (!rt) return;
  $$('[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === rt.nav));
  const t = $('#pageTitle'); if (t) t.textContent = rt.title;
  document.title = rt.title + ' · BANTU AJA';
}
const openDrawer = () => { $('#sidebar').classList.add('open'); $('#drawerBack').classList.add('on'); };
const closeDrawer = () => { $('#sidebar').classList.remove('open'); $('#drawerBack').classList.remove('on'); };
/** Badge menu: angka pada item menu sesuai peran. */
function setBadges(b) {
  S.badge = b || {};
  const items = (menuDef().items || []);
  $$('#sidebar [data-nav]').forEach(btn => {
    const def = items.filter(i => i[0] === btn.dataset.nav)[0];
    if (!def || !def[3]) return;
    let c = $('.cnt', btn);
    const n = S.badge[def[3]] || 0;
    if (n && !c) { c = document.createElement('span'); c.className = 'cnt'; btn.appendChild(c); }
    if (c) { if (n) c.textContent = n; else c.remove(); }
  });
}

// ── Notifikasi ───────────────────────────────────────────
const NOTIF_ICON = { pesanan: 'bi-receipt', penawaran: 'bi-tag', mitra: 'bi-shield-check', wilayah: 'bi-geo-alt', pengaduan: 'bi-chat-square-text', komisi: 'bi-cash-coin', ulasan: 'bi-star', deposit: 'bi-wallet2' };
const NOTIF_ROUTE = n => {
  if (['pesanan', 'penawaran', 'ulasan'].indexOf(n.tipe) >= 0 && n.refId) return ['pesananDetail', { id: n.refId }];
  if (n.tipe === 'mitra') return isAdm() ? ['admVerifikasi', { id: n.refId }] : ['mitraProfil', {}];
  if (n.tipe === 'wilayah') return isAdm() ? ['admWilayah', {}] : ['mitraWilayah', {}];
  if (n.tipe === 'pengaduan') return isAdm() ? ['admPengaduan', {}] : ['bantuan', {}];
  if (n.tipe === 'komisi') return S.user.role === R.MIT ? ['mitraUang', {}] : ['admKomisi', {}];
  if (n.tipe === 'deposit') return isAdm() ? ['admAntrean', {}] : ['mitraUang', {}];
  return null;
};
async function showNotifs() {
  try {
    const r = await api('notif.list');
    S.notifs = r.items;
    openModal({
      title: 'Notifikasi', size: 'lg',
      body: r.items.length ? r.items.map((n, i) => '<div class="list-row" data-act="notifOpen" data-i="' + i + '" style="' + (n.dibaca ? 'opacity:.7' : '') + '"><span class="ic"><i class="bi ' + (NOTIF_ICON[n.tipe] || 'bi-bell') + '"></i></span><div class="grow"><div style="color:var(--tx);font-weight:700">' +
        E(n.judul) + (n.dibaca ? '' : ' <span class="bdg gold">Baru</span>') + '</div><div class="small muted">' + E(n.isi) + '</div><div class="tiny muted mt-1">' + ago(n.createdAt) + '</div></div></div>').join('') : empty('bi-bell-slash', 'Belum ada notifikasi.'),
      foot: r.items.length ? '<button class="btn-gh" data-act="notifAll">Tandai semua dibaca</button>' : ''
    });
  } catch (e) { toastErr(e); }
}
/** Bunyi pendek lewat Web Audio API (tanpa berkas audio) dan getar. */
function bunyiMasuk() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1175, 880].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.22;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.start(t); o.stop(t + 0.21);
    });
  } catch (e) { /* perangkat tanpa audio */ }
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}
let _lastMasuk = null;
/** Penyegaran berkala: notifikasi, saldo mitra, badge menu, dan bunyi saat ada penugasan baru. */
async function pollMe() {
  if (!S.user || document.hidden) return;
  try {
    const r = await api('me', {}, { silent: true });
    const changed = r.unread !== S.unread;
    S.unread = r.unread;
    if (r.partner) S.partner = Object.assign(S.partner || {}, r.partner);
    if (changed) applyChrome();
    if (S.user.role === R.MIT) {
      const d = await api('order.list', { grup: 'aktif' }, { silent: true });
      const masuk = d.filter(o => o.assignStatus === 'Menunggu');
      if (_lastMasuk !== null && masuk.length > _lastMasuk) bunyiMasuk();
      _lastMasuk = masuk.length;
      setBadges({ masuk: masuk.length, aktif: d.filter(o => o.assignStatus === 'Diterima').length });
    } else if (isAdm()) {
      const [o, dep, us] = await Promise.all([
        api('order.list', { grup: 'aktif' }, { silent: true }),
        api('deposit.list', {}, { silent: true }),
        api('usulan.list', {}, { silent: true })
      ]);
      setBadges({
        cocok: o.filter(x => x.status === 'Menunggu Konfirmasi' || x.status === 'Mencari Mitra').length,
        persetujuan: dep.filter(x => x.status === 'Menunggu').length + us.length
      });
    }
  } catch (e) { /* senyap */ }
}

// ── Aksi global (delegasi klik; tanpa onclick inline) ────
const ACT = {};
document.addEventListener('click', ev => {
  const g = ev.target.closest('[data-go]');
  if (g && !g.disabled) {
    const p = Object.assign({}, g.dataset); const name = p.go; delete p.go; delete p.nav;
    ev.preventDefault(); go(name, p); return;
  }
  const a = ev.target.closest('[data-act]');
  if (a && ACT[a.dataset.act]) {
    if (a.tagName !== 'INPUT') ev.preventDefault();
    ACT[a.dataset.act](a.dataset, a, ev);
  }
});
$('#drawerBack').addEventListener('click', closeDrawer);
ACT.theme = toggleTheme;
ACT.drawer = openDrawer;
ACT.notif = showNotifs;
ACT.back = back;
ACT.reload = () => { if (S.route) go(S.route.name, S.route.params, { back: true }); else init(); };
ACT.notifAll = async () => {
  try { await api('notif.read', {}); S.unread = 0; applyChrome(); closeModal(); toast('Semua notifikasi ditandai dibaca.', 'ok'); }
  catch (e) { toastErr(e); }
};
ACT.notifOpen = async d => {
  const n = S.notifs[+d.i]; closeModal();
  if (!n.dibaca) api('notif.read', { id: n.id }, { silent: true }).then(() => { S.unread = Math.max(0, S.unread - 1); applyChrome(); });
  const r = NOTIF_ROUTE(n);
  if (r) go(r[0], r[1]);
};
ACT.logout = async () => {
  const ok = await ask({ title: 'Keluar dari akun?', text: 'Anda perlu masuk lagi untuk mengakses dashboard.', ok: 'Keluar' });
  if (!ok) return;
  try { await api('auth.logout', {}, { silent: true }); } catch (e) { /* abaikan */ }
  clearSession(); applyChrome(); go('beranda', {}, { reset: true }); toast('Anda telah keluar.', 'ok');
};
ACT.photo = d => showFile('foto', d.id, 'Foto kebutuhan');
ACT.doc = d => showFile('dokumen', d.id, d.nama || 'Dokumen');
ACT.pdfBukti = d => showPdf('pdf.bukti', { orderId: d.id }, 'Bukti Pesanan');
ACT.pdfTerima = d => showPdf('pdf.tandaTerima', { orderId: d.id }, 'Tanda Terima');
/** Tombol show/hide kata sandi: ikon mata di setiap kolom kata sandi. */
ACT.eye = (d, el) => {
  const i = el.parentElement.querySelector('input');
  const show = i.type === 'password';
  i.type = show ? 'text' : 'password';
  el.innerHTML = '<i class="bi ' + (show ? 'bi-eye-slash' : 'bi-eye') + '"></i>';
};
/** WhatsApp dari kartu mitra publik: wajib login pelanggan, kontak dicatat sebagai audit. */
ACT.wa = async d => {
  if (!S.user) { S.after = { name: S.route.name, params: S.route.params }; toast('Masuk dulu untuk menghubungi mitra.'); return go('login'); }
  if (S.user.role !== R.PEL) return toast('Kontak mitra dibuka untuk akun pelanggan.', 'err');
  try {
    const r = await api('mitra.kontak', { userId: d.id });
    openModal({
      title: 'Hubungi ' + r.nama,
      body: '<p class="muted">Kontak Anda dengan mitra dicatat pengelola BANTU AJA demi keamanan bersama. Untuk harga dan jadwal yang tercatat resmi, gunakan fitur <b>Pesan</b>.</p>',
      foot: '<button class="btn-gh" data-bs-dismiss="modal">Tutup</button>' + waBtn(r.telepon, 'Halo ' + r.nama + ', saya ' + S.user.nama + ' dari BANTU AJA. Saya ingin bertanya tentang jasa Anda.', 'Buka WhatsApp', 'btn-wa')
    });
  } catch (e) { toastErr(e); }
};

// ============================================================
// HALAMAN PUBLIK
// ============================================================
async function loadHome(force) {
  if (!S.home || force) {
    const prev = logoSrc();
    S.home = await api('publik.home');
    applyBrand();
    if (logoSrc() !== prev) applyChrome();
  }
  return S.home;
}
const lowestPrice = (cid, h) => {
  const t = h.services.filter(s => s.categoryId === cid && s.tarifMin > 0).map(s => s.tarifMin);
  return t.length ? Math.min.apply(null, t) : 0;
};

function mitraCard(m) {
  return '<div class="bb-card mitra"><div class="top"><span class="photo" style="display:flex;align-items:center;justify-content:center;overflow:hidden">' +
    (m.foto ? '<img alt="Foto ' + E(m.nama) + '" src="' + E(m.foto) + '" style="width:100%;height:100%;object-fit:cover">' : '<b style="color:var(--gold-text);font-size:20px">' + E(initials(m.nama)) + '</b>') + '</span>' +
    '<div class="grow"><div class="row-flex between"><button class="nm" style="background:none;border:0;padding:0;text-align:left;cursor:pointer" data-go="mitraDetail" data-id="' + m.userId + '">' + E(m.nama) + '</button>' +
    (m.rating ? '<span class="bdg gold">★ ' + m.rating.toFixed(1) + '</span>' : '<span class="bdg">Baru</span>') + '</div>' +
    '<div class="small muted ellipsis">' + E(m.keahlian) + '</div><div class="small mt-1"><i class="bi bi-geo-alt" style="color:var(--gold-text)"></i> ' +
    E(m.wilayah.slice(0, 2).join(', ') || 'Lumbir') + ' · ' + m.ulasan + ' ulasan</div>' +
    '<div class="row-flex gap-2 mt-1">' + (m.verified ? '<span class="bdg ok"><i class="bi bi-patch-check-fill"></i> Terverifikasi</span>' : '') +
    (m.tersedia ? '<span class="bdg ok">Siaga</span>' : '<span class="bdg">Sibuk</span>') + (m.promo ? '<span class="bdg gold">Pilihan</span>' : '') + '</div></div></div>' +
    '<div class="row-flex between"><div><div class="tiny muted">' + (m.tarifMulai ? 'Tarif mulai' : 'Tarif') + '</div><div class="price">' +
    (m.tarifMulai ? rp(m.tarifMulai) : 'Sesuai penawaran') + '</div></div>' +
    '<div class="row-flex gap-2"><button class="btn-wa btn-sm" data-act="wa" data-id="' + m.userId + '" aria-label="WhatsApp ' + E(m.nama) + '"><i class="bi bi-whatsapp"></i> WA</button>' +
    '<button class="btn-g btn-sm" data-go="pesanBaru" data-kat="' + (m.kategoriId[0] || '') + '">Minta Jasa</button></div></div></div>';
}

reg('beranda', 'Beranda', null, async (p, v) => {
  const h = await loadHome(!p.k);
  const area = S.homeArea || '';
  const list = h.mitra.filter(m => !area || m.wilayah.indexOf(area) >= 0);
  v.innerHTML =
    '<div class="chips" role="group" aria-label="Filter desa"><button class="chip ' + (!area ? 'on' : '') + '" data-act="homeArea" data-v="">Semua Desa</button>' +
    '<div class="chips desa-strip" role="group" aria-label="Filter desa">' +
h.areas.map((d, i) => '<button class="chip ' + (area === d.nama ? 'on' : '') + '" style="--i:' + (i + 1) + '" data-act="homeArea" data-v="' + E(d.nama) + '">' + E(d.nama.replace('Desa ', '')) + '</button>').join('') + '</div>' +
    '<div class="bb-card hero mt-2"><div class="eyebrow">Solusi harian warga ' + E(h.settings.namaDaerah || 'Banyumas') + '</div>' +
    '<h1 class="title-lg mt-2">Semua Urusan,<br><span style="color:var(--gold-text)">Ada Solusinya.</span></h1>' +
    '<p class="muted mt-2 mb-3">Penyedia jasa terverifikasi tetangga sendiri di Kecamatan Lumbir dan sekitarnya. Cepat, amanah, dan harga sedulur.</p>' +
    '<div class="row-flex between wrap gap-2 flat" style="background:var(--l2);border-radius:12px;padding:10px 12px"><span class="small">' +
    '<i class="bi bi-circle-fill" style="color:var(--ok);font-size:8px"></i> <b style="color:var(--tx)">' + h.stats.mitraSiaga + '</b> Mitra Siap Bantu</span>' +
    '<span class="small" style="color:var(--gold-text)"><i class="bi bi-patch-check"></i> ' + h.stats.mitraTerverifikasi + ' mitra terverifikasi</span></div></div>' +
    '<form id="srch" class="row-flex gap-2 mt-3" role="search"><div class="inp-ico grow"><i class="bi bi-search"></i>' +
    '<input class="inp" name="q" placeholder="Cari tukang ledeng, servis AC, renovasi..." aria-label="Cari jasa"></div>' +
    '<button class="iconbtn" style="border-radius:12px" type="submit" aria-label="Cari"><i class="bi bi-arrow-right"></i></button></form>' +
    secH('bi-grid', 'Kategori Jasa Populer', '<a href="javascript:void(0)" data-go="kategori">' + h.categories.length + ' layanan siaga</a>') +
    '<div class="cat-grid">' + h.categories.map(c => '<button class="cat" data-go="kategori" data-id="' + c.id + '">' + catIcon(c) + '<span class="nm">' + E(c.nama) + '</span></button>').join('') + '</div>' +
    '<div class="bb-card mt-4"><div class="row-flex gap-2 mb-3"><i class="bi bi-lightning-charge" style="color:var(--gold-text);font-size:20px"></i>' +
    '<b style="color:var(--tx)">Alur Pemesanan Jasa</b><span class="small muted" style="margin-left:auto">Praktis & ramah</span></div>' +
    '<div class="step3"><div><div class="n">1</div><b style="color:var(--tx)">Buat Pesanan</b><div class="muted">Tulis kebutuhan & alamat desa</div></div>' +
    '<div><div class="n">2</div><b style="color:var(--tx)">Tawaran Mitra</b><div class="muted">Admin cocokkan, mitra beri estimasi</div></div>' +
    '<div><div class="n" style="border-color:var(--ok);color:var(--ok)">3</div><b style="color:var(--tx)">Bayar & WA</b><div class="muted">Bayar langsung setelah selesai</div></div></div></div>' +
    secH('bi-award', 'Mitra Rekomendasi', '<a href="javascript:void(0)" data-go="mitraList">Semua</a>') +
    '<div class="small muted mb-2">Rating tertinggi & ulasan terjujur warga sekitar</div>' +
    (list.length ? list.map(mitraCard).join('') : card(empty('bi-people', area ? 'Belum ada mitra terverifikasi di ' + E(area) + '.' : 'Mitra terverifikasi akan tampil di sini. Jadilah yang pertama!'))) +
    (h.testimoni.length ? secH('bi-chat-heart', 'Kata Warga') + h.testimoni.map(t => card(stars(t.rating) + '<p class="mt-2 mb-1">“' + E(t.ulasan) + '”</p><div class="small muted">— ' + E(t.oleh) + (t.mitra ? ' untuk ' + E(t.mitra) : '') + '</div>')).join('') : '') +
    '<div class="bb-card flat row-flex gap-3"><i class="bi bi-shield-check" style="font-size:28px;color:var(--gold-text)"></i><div><b style="color:var(--tx)">Jaminan Amanah Warga</b>' +
    '<div class="small muted">Semua kontak mitra dicatat pengelola BANTU AJA untuk keamanan warga bersama.</div></div></div>' +
    '<div class="bb-card hero"><div class="eyebrow">Ayo gabung komunitas</div><h2 class="title-lg mt-1">Punya Keahlian?<br>Dapat Tambahan Rezeki.</h2>' +
    '<p class="muted mt-2">Daftarkan keahlian Anda sebagai tukang, teknisi, supir, atau pembantu harian di Lumbir. Pendaftaran gratis.</p>' +
    '<button class="btn-g btn-block" data-go="daftar" data-role="mitra"><i class="bi bi-person-plus"></i> Daftar Jadi Mitra</button></div>';
  bindForm($('#srch'), v2 => go('mitraList', { q: v2.q || '' }));
}, 'beranda');
ACT.homeArea = d => { S.homeArea = d.v; go('beranda', { k: '1' }, { soft: true }); };

reg('kategori', 'Kategori Jasa', null, async (p, v) => {
  const h = await loadHome();
  const cats = p.id ? h.categories.filter(c => c.id === p.id) : h.categories;
  v.innerHTML = '<div class="chips"><button class="chip ' + (!p.id ? 'on' : '') + '" data-go="kategori">Semua</button>' +
    h.categories.map(c => '<button class="chip ' + (p.id === c.id ? 'on' : '') + '" data-go="kategori" data-id="' + c.id + '"><i class="bi ' + E(c.ikon) + '"></i> ' + E(c.nama) + '</button>').join('') + '</div>' +
    cats.map(c => {
      const sv = h.services.filter(s => s.categoryId === c.id);
      return '<div class="bb-card"><div class="row-flex gap-3"><span class="logo-mark"><i class="bi ' + E(c.ikon) + '"></i></span><div class="grow">' +
        '<h2 style="font-size:16px">' + E(c.nama) + '</h2><div class="small muted">' + E(c.deskripsi) + '</div></div></div><div class="mt-3">' +
        (sv.length ? sv.map(s => '<div class="list-row" data-go="pesanBaru" data-kat="' + c.id + '" data-svc="' + s.id + '"><span class="ic"><i class="bi ' + E(s.ikon || c.ikon) + '"></i></span><div class="grow">' +
          '<div style="color:var(--tx);font-weight:700">' + E(s.nama) + '</div><div class="small muted">' + E(s.deskripsi) + (s.estimasi ? ' · ' + E(s.estimasi) : '') + '</div></div>' +
          '<div style="text-align:right"><div class="price" style="font-size:14px">' + (s.tarifMin ? rp(s.tarifMin) + (s.tarifMax > s.tarifMin ? '–' + rpShort(s.tarifMax).replace('Rp ', '') : '') : 'Penawaran') +
          '</div><div class="tiny muted">/' + E(s.satuan) + '</div></div></div>').join('') : '<div class="small muted">Layanan akan segera ditambahkan.</div>') +
        '</div><button class="btn-g btn-block mt-3" data-go="pesanBaru" data-kat="' + c.id + '"><i class="bi bi-plus-lg"></i> Pesan layanan ini</button></div>';
    }).join('');
}, 'beranda');

reg('mitraList', 'Cari Mitra', null, async (p, v) => {
  const h = await loadHome();
  const q = { q: p.q || '', categoryId: p.kat || '', areaId: p.area || '' };
  const list = await api('publik.mitra', q);
  v.innerHTML = '<form id="mf2" class="toolbar"><div class="inp-ico" style="flex:1 1 100%"><i class="bi bi-search"></i>' +
    '<input class="inp" style="max-width:none;width:100%" name="q" value="' + E(q.q) + '" placeholder="Cari nama atau keahlian"></div>' +
    '<select class="inp" name="kat" aria-label="Kategori"><option value="">Semua kategori</option>' +
    h.categories.map(c => '<option value="' + c.id + '"' + (q.categoryId === c.id ? ' selected' : '') + '>' + E(c.nama) + '</option>').join('') + '</select>' +
    '<select class="inp" name="area" aria-label="Desa"><option value="">Semua desa</option>' +
    h.areas.map(a => '<option value="' + a.id + '"' + (q.areaId === a.id ? ' selected' : '') + '>' + E(a.nama) + '</option>').join('') + '</select>' +
    '<button class="btn-g" type="submit">Cari</button></form>' +
    '<div class="small muted mb-2">' + list.length + ' mitra ditemukan</div>' +
    (list.length ? list.map(mitraCard).join('') : card(empty('bi-search', 'Tidak ada mitra yang cocok. Coba ubah filter, atau buat pesanan dan admin akan mencarikan mitra.', goBtn('pesanBaru', 'Buat Pesanan'))));
  bindForm($('#mf2'), val => go('mitraList', { q: val.q, kat: val.kat, area: val.area }));
}, 'mitraList');

reg('mitraDetail', 'Profil Mitra', null, async (p, v) => {
  const r = await api('publik.mitraDetail', { userId: p.id });
  const m = r.mitra;
  v.innerHTML = '<button class="btn-gh btn-sm mb-3" data-act="back"><i class="bi bi-arrow-left"></i> Kembali</button>' +
    card('<div class="row-flex gap-3">' + avatar(m.nama, m.foto, 'lg') + '<div class="grow"><h2 class="title-lg" style="font-size:20px;line-height:26px">' + E(m.nama) +
      '</h2><div class="muted">' + E(m.keahlian) + '</div><div class="mt-1">' + stars(Math.round(m.rating)) + ' <span class="small muted">' +
      (m.rating ? m.rating.toFixed(1) : 'Belum ada rating') + ' · ' + m.ulasan + ' ulasan</span></div></div></div>' +
      '<div class="row-flex gap-2 wrap mt-3"><span class="bdg ok"><i class="bi bi-patch-check-fill"></i> Terverifikasi</span>' +
      (m.tersedia ? '<span class="bdg ok">Siaga</span>' : '<span class="bdg">Sedang sibuk</span>') + '<span class="bdg gold">' + E(m.kodeMitra) + '</span></div>' +
      (m.bio ? '<p class="mt-3 mb-0">' + E(m.bio) + '</p>' : '') + '<hr class="hr">' +
      kv('Kategori', E(m.kategori.join(', ') || '-')) + kv('Wilayah layanan', E(m.wilayah.join(', ') || '-')) +
      kv('Tarif mulai', m.tarifMulai ? '<span class="price" style="font-size:14px">' + rp(m.tarifMulai) + '</span>' : 'Sesuai penawaran') +
      '<div class="row-flex gap-2 mt-3"><button class="btn-wa grow" data-act="wa" data-id="' + m.userId + '"><i class="bi bi-whatsapp"></i> Hubungi via WhatsApp</button>' +
      '<button class="btn-g grow" data-go="pesanBaru" data-kat="' + (m.kategoriId[0] || '') + '">Minta Jasa</button></div>') +
    secH('bi-star', 'Ulasan Pelanggan') +
    (r.ulasan.length ? r.ulasan.map(u => card(stars(u.rating) + (u.ulasan ? '<p class="mt-2 mb-1">' + E(u.ulasan) + '</p>' : '') +
      '<div class="small muted">' + E(u.oleh) + ' · ' + tgl(u.createdAt, false) + '</div>')).join('') : card(empty('bi-chat', 'Belum ada ulasan.')));
}, 'mitraList');

reg('caraKerja', 'Cara Kerja', null, (p, v) => {
  const s = [
    ['bi-pencil-square', 'Buat pesanan', 'Pilih jasa, tulis kebutuhan, unggah foto, dan tentukan alamat serta jadwal.'],
    ['bi-diagram-3', 'Admin mencocokkan mitra', 'Admin wilayah memilih mitra terverifikasi yang paling cocok dan dekat dengan Anda.'],
    ['bi-tag', 'Terima penawaran harga', 'Mitra menerima pesanan dan mengirim penawaran. Anda setujui atau nego. Tidak ada biaya tersembunyi.'],
    ['bi-tools', 'Pekerjaan dilakukan', 'Mitra mengerjakan dan memperbarui status. Pekerjaan baru dimulai setelah harga disetujui.'],
    ['bi-cash-coin', 'Bayar langsung', 'Bayar langsung ke mitra setelah pekerjaan selesai. BANTU AJA hanya mencatat transaksi.'],
    ['bi-star', 'Beri ulasan', 'Konfirmasi pekerjaan selesai dan beri rating agar warga lain terbantu.']
  ];
  v.innerHTML = '<h1 class="title-lg mb-3">Cara Kerja BANTU AJA</h1>' + s.map((x, i) => card('<div class="row-flex gap-3"><span class="logo-mark"><i class="bi ' + x[0] +
    '"></i></span><div><div class="eyebrow">Langkah ' + (i + 1) + '</div><b style="color:var(--tx)">' + x[1] + '</b><div class="muted">' + x[2] + '</div></div></div>')).join('') +
    goBtn('pesanBaru', 'Mulai Buat Pesanan', 'btn-g btn-block');
}, 'beranda');

reg('tentang', 'Tentang BANTU AJA', null, (p, v) => {
  v.innerHTML = card(logoMark('mb-3') + '<h1 class="title-lg">' + E(appName()) + '</h1><div class="eyebrow mt-1">Semua Urusan, Ada Solusinya.</div>' +
    '<p class="mt-3">BANTU AJA adalah platform yang mempertemukan masyarakat yang membutuhkan bantuan sehari-hari dengan penyedia jasa lokal terpercaya. Dimulai dari Kecamatan Lumbir, Kabupaten Banyumas.</p>' +
    '<p>Kami percaya ekonomi lokal tumbuh ketika keahlian warga mudah ditemukan dan dihargai secara adil.</p>') +
    card('<h2 class="mb-2" style="font-size:16px">Nilai Kami</h2>' + [
      ['Mudah', 'layanan mudah ditemukan dan dipesan'], ['Terpercaya', 'mitra memiliki profil dan proses verifikasi'],
      ['Lokal', 'mengutamakan tenaga dan potensi warga sekitar'], ['Transparan', 'harga dikonfirmasi sebelum pekerjaan dimulai'],
      ['Bermanfaat', 'membuka peluang penghasilan bagi warga']
    ].map(x => '<div class="list-row"><span class="ic"><i class="bi bi-check2"></i></span><div><b style="color:var(--tx)">' + x[0] + '</b> — <span class="muted">' + x[1] + '</span></div></div>').join('')) +
    '<button class="btn-gh btn-block" data-act="policy"><i class="bi bi-shield-lock"></i> Kebijakan Privasi & Syarat Penggunaan</button>';
}, 'beranda');

function showPolicy() {
  openModal({
    title: 'Kebijakan Privasi & Syarat Penggunaan', size: 'lg', body:
      '<h6>Data yang kami kumpulkan</h6><p class="muted">Nama, nomor WhatsApp, email (opsional), alamat pekerjaan, foto kebutuhan, dan untuk mitra, dokumen verifikasi (KTP, SKCK). Data dikumpulkan seperlunya untuk menjalankan layanan.</p>' +
      '<h6>Penggunaan & akses</h6><p class="muted">Nomor telepon dan lokasi hanya dapat dilihat pihak yang berwenang: admin wilayah yang bertugas, serta pelanggan dan mitra pada pesanan yang sama setelah mitra menerima. Dokumen verifikasi mitra bersifat privat.</p>' +
      '<h6>Hak Anda</h6><p class="muted">Anda dapat meminta perubahan atau penghapusan data pribadi sesuai ketentuan hukum yang berlaku dengan menghubungi admin.</p>' +
      '<h6>Harga & pembayaran</h6><p class="muted">Pekerjaan dimulai setelah harga disetujui pelanggan. Pembayaran jasa dilakukan langsung antara pelanggan dan mitra. Komisi platform dicatat dan dipotong dari saldo deposit mitra sesuai ketentuan.</p>' +
      '<h6>Deposit mitra</h6><p class="muted">Deposit disetor ke rekening Admin Kecamatan dan dicatat sebagai saldo. Saldo dipotong otomatis sebagai komisi saat pekerjaan dikonfirmasi selesai. Saldo di bawah minimum atau komisi yang belum disetor dapat menghentikan penerimaan pesanan. Sisa saldo menjadi hak aplikator/admin apabila mitra berhenti, sesuai ketentuan yang disepakati.</p>' +
      '<h6>Tanggung jawab & pengaduan</h6><p class="muted">BANTU AJA berperan sebagai penghubung dan pencatat. Sengketa diajukan lewat menu Bantuan dan ditangani admin wilayah dengan riwayat yang tercatat.</p>' +
      '<div class="note"><i class="bi bi-info-circle"></i><div>Ringkasan ini bukan pendapat hukum. Ketentuan deposit dan saldo perlu ditinjau ahli hukum sebelum peluncuran komersial.</div></div>'
  });
}
ACT.policy = showPolicy;

const FAQ = [
  ['Bagaimana cara memesan jasa?', 'Daftar atau masuk, tekan tombol Pesan, isi kebutuhan, alamat, dan jadwal. Admin akan mencarikan mitra dan Anda akan menerima penawaran harga.'],
  ['Apakah pelanggan dikenakan biaya?', 'Tidak. Pelanggan memakai platform gratis dan tidak ada biaya tersembunyi. Anda hanya membayar jasa mitra sesuai penawaran yang Anda setujui.'],
  ['Kapan dan bagaimana saya membayar?', 'Bayar langsung ke mitra setelah pekerjaan selesai, secara tunai atau transfer. Catat metode pembayaran saat mengonfirmasi penyelesaian.'],
  ['Bagaimana jika pekerjaan bermasalah?', 'Ajukan pengaduan dari menu Bantuan atau halaman detail pesanan. Admin akan menanganinya dan Anda mendapat nomor laporan.'],
  ['Apakah semua mitra terverifikasi?', 'Hanya mitra yang lolos verifikasi admin (identitas dan keahlian) yang ditampilkan dan dapat menerima pesanan.'],
  ['Bagaimana menjadi mitra?', 'Pilih Daftar Jadi Mitra, pilih desa tempat Anda melayani, lalu unggah dokumen dan lengkapi profil. Setelah diverifikasi, aktifkan status Siaga. Pendaftaran gratis.']
];
reg('bantuan', 'Bantuan', null, async (p, v) => {
  const wa = (S.home && S.home.settings.waAdmin) || '';
  let mine = [];
  if (S.user && !isAdm()) { try { mine = await api('complaint.list'); } catch (e) { mine = []; } }
  v.innerHTML = '<h1 class="title-lg mb-3">Pusat Bantuan</h1>' +
    FAQ.map(f => '<details class="bb-card" style="padding:14px 16px"><summary style="cursor:pointer;font-weight:700;color:var(--tx);list-style:none;display:flex;justify-content:space-between;gap:10px">' +
      E(f[0]) + '<i class="bi bi-chevron-down"></i></summary><p class="muted mt-2 mb-0">' + E(f[1]) + '</p></details>').join('') +
    (wa ? waBtn(wa, 'Halo admin BANTU AJA, saya butuh bantuan.', 'Hubungi Admin via WhatsApp', 'btn-wa btn-block') : '') +
    (S.user && !isAdm() ? secH('bi-chat-square-text', 'Pengaduan Saya', '<a href="javascript:void(0)" data-act="newComplaint">+ Buat pengaduan</a>') +
      (mine.length ? mine.map(c => card('<div class="row-flex between"><b style="color:var(--tx)">' + E(c.nomor) + '</b>' +
        bdg(c.status, c.status === 'Selesai' ? 'ok' : c.status === 'Ditolak' ? 'err' : 'warn') + '</div><div class="mt-1">' + E(c.judul) + '</div><div class="small muted">' +
        (c.kode ? 'Pesanan ' + E(c.kode) + ' · ' : '') + tgl(c.createdAt) + '</div>' +
        (c.riwayat.length > 1 ? '<div class="note mt-2"><i class="bi bi-reply"></i><div>' + E(c.riwayat[c.riwayat.length - 1].catatan) + '</div></div>' : ''))).join('') :
        card(empty('bi-chat', 'Belum ada pengaduan.'))) : '') +
    (!S.user ? '<div class="note mt-3"><i class="bi bi-info-circle"></i><div>Masuk untuk membuat pengaduan dan memantau penanganannya.</div></div>' : '') +
    '<button class="btn-gh btn-block mt-3" data-act="policy"><i class="bi bi-shield-lock"></i> Kebijakan Privasi & Syarat Penggunaan</button>';
}, 'bantuan');
ACT.newComplaint = async d => {
  let orders = [];
  try { orders = await api('order.list', { limit: 50 }); } catch (e) { /* tanpa pesanan */ }
  formModal({
    title: 'Buat Pengaduan', submit: 'Kirim Pengaduan',
    fields: [
      { name: 'orderId', label: 'Terkait pesanan (opsional)', type: 'select', blank: '— Tidak terkait pesanan —', options: orders.map(o => ({ v: o.id, t: o.kode + ' · ' + o.judul })), value: d.id || '' },
      { name: 'judul', label: 'Judul pengaduan', req: true, max: 120, ph: 'Contoh: Mitra tidak datang sesuai jadwal' },
      { name: 'isi', label: 'Uraian masalah', type: 'textarea', req: true, rows: 4, max: 2000 }
    ],
    onSubmit: async v => { const r = await api('complaint.create', v); toast('Pengaduan ' + r.nomor + ' terkirim. Simpan nomor ini.', 'ok'); refresh(); }
  });
};

// [Lanjut ke Bagian 2: autentikasi, pendaftaran, pelanggan, dan detail pesanan]
// ============================================================
// BAGIAN 2 — Autentikasi, pendaftaran, pelanggan, dan detail pesanan
// ============================================================

// ── Autentikasi ───────────────────────────────────────────
async function afterLogin(res) {
  S.token = res.token; S.user = res.user; S.partner = res.partner || null;
  store.set('bb_t', res.token);
  S.unread = 0; applyChrome(); pollMe();
  const a = S.after; S.after = null;
  toast('Selamat datang, ' + res.user.nama.split(' ')[0] + '!', 'ok');
  if (a && ROUTES[a.name] && (!ROUTES[a.name].roles || ROUTES[a.name].roles.indexOf(res.user.role) >= 0)) go(a.name, a.params, { reset: true });
  else go(homeRoute(), {}, { reset: true });
}
reg('login', 'Masuk', null, (p, v) => {
  if (S.user) return go(homeRoute(), {}, { reset: true });
  v.innerHTML = '<div class="auth">' + logoMark() + '<h1 class="title-lg">Masuk</h1>' +
    '<p class="muted mb-3">Gunakan nomor WhatsApp atau email yang terdaftar, beserta kata sandi yang sama.</p>' +
    '<form id="lf" novalidate>' +
    fieldHtml({ name: 'ident', label: 'Nomor WhatsApp atau email', req: true, ac: 'username', ph: '0813xxxxxxx / nama@email.com' }) +
    fieldHtml({ name: 'password', label: 'Kata sandi', type: 'password', req: true, ac: 'current-password' }) +
    '<button class="btn-g btn-block" type="submit"><i class="bi bi-box-arrow-in-right"></i> Masuk</button></form>' +
    '<div class="row-flex between mt-3"><a href="javascript:void(0)" data-act="lupa">Lupa kata sandi?</a>' +
    '<a href="javascript:void(0)" data-go="daftar">Belum punya akun? Daftar</a></div></div>';
  bindForm($('#lf'), async val => afterLogin(await api('auth.login', val)));
}, 'login');
ACT.lupa = () => formModal({
  title: 'Pulihkan Akun', submit: 'Kirim Kata Sandi Sementara',
  intro: 'Masukkan nomor WhatsApp atau email. Kata sandi sementara dikirim ke email akun Anda, bila ada.',
  fields: [{ name: 'ident', label: 'Nomor WhatsApp atau email', req: true }],
  onSubmit: async v => { toast(await api('auth.lupa', v), 'ok'); }
});

/** Pendaftaran sederhana: nama, WhatsApp, kata sandi, dan desa (opsional untuk pelanggan). Email opsional. */
reg('daftar', 'Daftar', null, async (p, v) => {
  if (S.user) return go(homeRoute(), {}, { reset: true });
  const role = p.role === 'mitra' ? 'mitra' : 'pelanggan';
  const h = await loadHome();
  const otp = !!(h.settings && h.settings.otpAktif);
  v.innerHTML = '<div class="auth">' + logoMark() +
    '<h1 class="title-lg">' + (role === 'mitra' ? 'Daftar Jadi Mitra' : 'Daftar Gratis') + '</h1>' +
    '<p class="muted mb-3">' + (role === 'mitra' ? 'Gratis. Admin kecamatan akan memverifikasi akun Anda.' : 'Cukup isi 3 kolom. Nomor WhatsApp dipakai untuk masuk dan pesanan.') + '</p>' +
    '<div class="tabs"><button class="chip ' + (role === 'pelanggan' ? 'on' : '') + '" data-go="daftar" data-role="pelanggan">Pelanggan</button>' +
    '<button class="chip ' + (role === 'mitra' ? 'on' : '') + '" data-go="daftar" data-role="mitra">Penyedia Jasa</button></div>' +
    '<form id="rf" novalidate>' +
    fieldHtml({ name: 'nama', label: 'Nama lengkap', req: true, max: 80, ac: 'name' }) +
    fieldHtml({ name: 'telepon', label: 'Nomor WhatsApp', req: true, type: 'tel', ac: 'tel', ph: '0813xxxxxxx', inputmode: 'tel', help: 'Contoh: 0813xxxxxxx atau +62813xxxxxxx' }) +
    (otp ? '<div class="row-flex gap-2 mb-3"><button type="button" class="btn-gh btn-sm" data-act="otpKirim"><i class="bi bi-whatsapp"></i> Kirim kode ke WhatsApp</button></div>' +
      fieldHtml({ name: 'otp', label: 'Kode verifikasi (6 digit)', req: true, inputmode: 'numeric', max: 6, ph: '------' }) : '') +
    fieldHtml({ name: 'password', label: 'Kata sandi', type: 'password', req: true, ac: 'new-password' }) +
    '<div id="pwRules" class="small mb-3"></div>' +
    (role === 'mitra'
      ? fieldHtml({ name: 'areaId', label: 'Desa tempat Anda melayani', type: 'select', req: true, blank: '— Pilih desa —', options: h.areas.map(a => ({ v: a.id, t: a.nama })) })
      : fieldHtml({ name: 'areaId', label: 'Desa tempat Anda tinggal (opsional)', type: 'select', blank: '— Nanti saja —', options: h.areas.map(a => ({ v: a.id, t: a.nama })), help: 'Mempercepat pengisian formulir pesanan.' })) +
    fieldHtml({ name: 'email', label: 'Email (opsional)', type: 'email', ac: 'email', help: 'Untuk pemulihan kata sandi dan notifikasi.' }) +
    '<button class="btn-g btn-block mt-2" type="submit"><i class="bi bi-person-check"></i> Daftar Sekarang</button>' +
    '<p class="tiny muted mt-2" style="text-align:center">Dengan mendaftar, Anda menyetujui <a href="javascript:void(0)" data-act="policy">Kebijakan Privasi</a>.</p></form>' +
    '<div class="mt-3" style="text-align:center"><a href="javascript:void(0)" data-go="login">Sudah punya akun? Masuk</a></div></div>';

  const pw = $('#f_password');
  const rules = () => {
    const x = pw.value, a = x.length >= 8, b = /[A-Za-z]/.test(x) && /\d/.test(x);
    const mark = (ok, t) => '<span style="color:' + (ok ? 'var(--ok)' : 'var(--mut)') + '">' + (ok ? '✔' : '○') + ' ' + t + '</span>';
    $('#pwRules').innerHTML = mark(a, 'Minimal 8 karakter') + ' &nbsp; ' + mark(b, 'Huruf dan angka');
  };
  pw.addEventListener('input', rules);
  rules();

  bindForm($('#rf'), async val => {
    try {
      afterLogin(await api('auth.register', Object.assign({ role: role }, val)));
    } catch (e) {
      if (e && e.code === 'PHONE_EXISTS') {
        openModal({
          title: 'Nomor sudah terdaftar',
          body: '<p class="muted">Nomor WhatsApp <b>' + E(val.telepon) + '</b> sudah dipakai akun lain. Jika itu akun Anda, silakan masuk dengan nomor ini dan kata sandi Anda.</p>',
          foot: '<button class="btn-gh" data-bs-dismiss="modal">Ubah nomor</button><button class="btn-g" data-go="login" data-bs-dismiss="modal">Masuk dengan nomor ini</button>'
        });
        return;
      }
      throw e;
    }
  });
}, 'login');
ACT.otpKirim = async () => {
  const tel = ($('#f_telepon') || {}).value || '';
  try { await api('auth.otpKirim', { telepon: tel }); toast('Kode dikirim ke WhatsApp Anda.', 'ok'); }
  catch (e) { toastErr(e); }
};

// ── Pelanggan: kartu pesanan & penawaran ──────────────────
function orderRow(o) {
  return '<div class="list-row" data-go="pesananDetail" data-id="' + o.id + '"><span class="ic"><i class="bi bi-receipt"></i></span>' +
    '<div class="grow"><div class="row-flex between gap-2"><b class="ellipsis" style="color:var(--tx)">' + E(o.judul) + '</b>' + stBdg(o.status) + '</div>' +
    '<div class="small muted">' + E(o.kode) + ' · ' + E(o.kategori) + (o.mitra ? ' · ' + E(o.mitra) : '') + '</div>' +
    '<div class="tiny muted">' + ago(o.createdAt) + (o.nilai ? ' · ' + rp(o.nilai) : '') + '</div></div><i class="bi bi-chevron-right muted"></i></div>';
}
function quoteBox(o, withActions) {
  const q = o.penawaran.filter(x => x.id === o.quotationId)[0] || o.penawaran[0];
  if (!q) return '';
  const pend = q.status === 'Menunggu';
  return '<div class="bb-card' + (pend ? ' hi' : '') + '"><div class="row-flex between mb-2"><div class="eyebrow">Penawaran resmi mitra</div>' +
    bdg(q.status, q.status === 'Disetujui' ? 'ok' : q.status === 'Menunggu' ? 'gold' : 'err') + '</div>' +
    kv('Ongkos jasa', rp(q.jasa)) + kv('Material / bahan', rp(q.material)) +
    '<div class="total"><div><div class="small muted">Total biaya</div></div><div class="big">' + rp(q.total) + '</div></div>' +
    (q.catatan ? note('bi-info-circle', '<b>Catatan mitra:</b> ' + E(q.catatan), 'mt-2') : '') +
    (pend && q.berlakuSampai ? '<div class="small muted mt-2"><i class="bi bi-clock"></i> Berlaku s.d. ' + tgl(q.berlakuSampai) + ' WIB</div>' : '') +
    (q.alasanTolak ? '<div class="small mt-2" style="color:var(--err)">Alasan penolakan: ' + E(q.alasanTolak) + '</div>' : '') +
    (pend && withActions ? '<div class="row-flex gap-2 mt-3"><button class="btn-g grow" data-act="quoteYes" data-id="' + q.id + '"><i class="bi bi-check2-circle"></i> Setujui Biaya</button>' +
      '<button class="btn-gh grow" data-act="quoteNo" data-id="' + q.id + '"><i class="bi bi-sliders"></i> Tolak / Nego</button></div>' : '') + '</div>';
}
ACT.quoteYes = async d => {
  const ok = await ask({ title: 'Setujui penawaran?', text: 'Dengan menyetujui, mitra dapat menjadwalkan dan memulai pekerjaan sesuai biaya tersebut.', ok: 'Ya, Setujui' });
  if (!ok) return;
  try { await api('quote.respond', { quotationId: d.id, setuju: true }); toast('Penawaran disetujui. Mitra akan segera menjadwalkan.', 'ok'); refresh(); }
  catch (e) { toastErr(e); }
};
ACT.quoteNo = async d => {
  const r = await ask({
    title: 'Tolak / nego penawaran', text: 'Mitra akan diberi tahu dan dapat mengirim penawaran baru.', ok: 'Kirim', danger: true,
    reason: { label: 'Alasan atau harga yang Anda harapkan', required: true, ph: 'Contoh: Mohon bahan lebih hemat, atau biaya jasa Rp 120.000' }
  });
  if (!r) return;
  try { await api('quote.respond', { quotationId: d.id, setuju: false, alasan: r }); toast('Permintaan nego terkirim ke mitra.', 'ok'); refresh(); }
  catch (e) { toastErr(e); }
};

// ── Pelanggan: dashboard ─────────────────────────────────
reg('pelDash', 'Beranda Saya', [R.PEL], async (p, v) => {
  const d = await api('dash.pelanggan');
  v.innerHTML =
    '<div class="bb-card hero"><div class="row-flex between"><div><h1 class="title-lg" style="font-size:22px">Halo, ' + E(d.sapaan.split(' ')[0]) + '! 👋</h1>' +
    '<div class="small muted"><i class="bi bi-geo-alt"></i> ' + E((S.home && S.home.settings.namaDaerah) || 'Lumbir') + '</div></div>' +
    '<span class="bdg ok"><i class="bi bi-shield-check"></i> Akun aktif</span></div>' +
    '<div class="small mt-2 mb-3"><span class="bdg warn">' + d.hitung.aktif + ' pesanan berjalan</span> <span class="bdg gold">' + d.hitung.perluSetuju + ' penawaran masuk</span></div>' +
    '<button class="btn-g btn-block" data-go="pesanBaru"><i class="bi bi-plus-circle"></i> Pesan Jasa Baru</button></div>' +
    (d.perluSetuju.length ? secH('bi-exclamation-circle', 'Perlu Persetujuan Anda') + d.perluSetuju.map(o =>
      '<div class="bb-card hi"><div class="row-flex between"><span class="small muted">' + E(o.kode) + '</span>' + stBdg(o.status) + '</div>' +
      '<b style="color:var(--tx);font-size:16px" class="d-block mt-1">' + E(o.judul) + '</b>' +
      (o.mitraInfo ? '<div class="row-flex gap-3 mt-3" style="background:var(--l2);border-radius:12px;padding:10px">' + avatar(o.mitraInfo.nama, o.mitraInfo.foto) +
        '<div class="grow"><b style="color:var(--tx)">' + E(o.mitraInfo.nama) + '</b> <span class="bdg gold">' + E(o.mitraInfo.kodeMitra) + '</span>' +
        '<div class="small muted">' + E(o.mitraInfo.keahlian) + '</div></div>' + (o.mitraInfo.rating ? '<span class="bdg gold">★ ' + o.mitraInfo.rating.toFixed(1) + '</span>' : '') + '</div>' : '') +
      '<div class="mt-3">' + quoteBox(o, true) + '</div>' +
      '<button class="btn-gh btn-block mt-2" data-go="pesananDetail" data-id="' + o.id + '">Lihat detail pesanan</button></div>').join('') : '') +
    (d.berjalan.length ? secH('bi-arrow-repeat', 'Pekerjaan Sedang Berjalan') + d.berjalan.map(o =>
      '<div class="bb-card" data-go="pesananDetail" data-id="' + o.id + '" style="cursor:pointer"><div class="row-flex between"><span class="small muted">' + E(o.kode) + '</span>' + stBdg(o.status) + '</div>' +
      '<b style="color:var(--tx);font-size:16px" class="d-block mt-1">' + E(o.judul) + '</b>' +
      (o.mitraInfo ? '<div class="small muted mt-1">Mitra: ' + E(o.mitraInfo.nama) + '</div>' : '<div class="small muted mt-1">Admin sedang mencarikan mitra...</div>') +
      tracker4(o.status) + (o.status === 'Selesai' ? '<button class="btn-g btn-block mt-2" data-act="confirmDone" data-id="' + o.id + '">Konfirmasi Pekerjaan Selesai</button>' : '') + '</div>').join('') : '') +
    '<div class="kpis" style="grid-template-columns:repeat(3,1fr);gap:8px">' + [['Total Pesanan', d.hitung.total], ['Tuntas Selesai', d.hitung.tuntas], ['Sedang Aktif', d.hitung.aktif]]
      .map(x => '<div class="kpi" style="min-height:90px;text-align:center"><div class="val" style="color:var(--gold-text)">' + x[1] + '</div><div class="lbl" style="margin-top:4px">' + x[0] + '</div></div>').join('') + '</div>' +
    card('<div class="list-row" data-go="beranda"><span class="ic"><i class="bi bi-grid"></i></span><div class="grow"><b style="color:var(--tx)">Katalog Layanan</b><div class="small muted">Pertukangan, air, angkutan, kebersihan, dan lainnya</div></div><i class="bi bi-chevron-right muted"></i></div>' +
      '<div class="list-row" data-go="pesananList" data-grup="riwayat"><span class="ic"><i class="bi bi-file-earmark-pdf"></i></span><div class="grow"><b style="color:var(--tx)">Tanda Terima (PDF)</b><div class="small muted">Bukti transaksi pekerjaan yang sudah selesai</div></div><i class="bi bi-chevron-right muted"></i></div>' +
      '<div class="list-row" data-go="bantuan"><span class="ic"><i class="bi bi-headset"></i></span><div class="grow"><b style="color:var(--tx)">Pusat Bantuan & Pengaduan</b><div class="small muted">Hubungi admin dan ajukan pengaduan</div></div><i class="bi bi-chevron-right muted"></i></div>', 'mb-0') +
    secH('bi-clock-history', 'Riwayat Pekerjaan Terakhir', '<a href="javascript:void(0)" data-go="pesananList" data-grup="riwayat">Lihat semua</a>') +
    (d.riwayat.length ? d.riwayat.map(o => card('<div class="row-flex between"><span class="small muted">' + E(o.kode) + '</span>' + stBdg(o.status) + '</div>' +
      '<b style="color:var(--tx)" class="d-block">' + E(o.judul) + '</b><div class="small muted">Mitra: ' + E(o.mitra || '-') + ' · ' + tgl(o.updatedAt, false) + '</div>' +
      (o.status === 'Dikonfirmasi' ? '<div class="row-flex between mt-2">' + (o.sudahUlas ? '<span>' + stars(o.rating) + ' <span class="small muted">Ulasan diberikan</span></span>' :
        '<button class="btn-g btn-sm" data-act="reviewNow" data-id="' + o.id + '"><i class="bi bi-star"></i> Beri ulasan</button>') +
        '<button class="btn-gh btn-sm" data-act="pdfTerima" data-id="' + o.id + '"><i class="bi bi-download"></i> Tanda Terima</button></div>' : ''), 'mb-2')).join('') :
      card(empty('bi-inbox', 'Belum ada riwayat pekerjaan.', goBtn('pesanBaru', 'Pesan Jasa Pertama')))) +
    note('bi-shield-check', '<b>Layanan terlindungi SOP BANTU AJA.</b> Pembayaran dilakukan langsung setelah pekerjaan diperiksa. Pendampingan mediasi tersedia bila timbul ketidaksesuaian.', 'mt-3');
}, 'pelDash');

reg('pesananList', 'Pesanan Saya', [R.PEL], async (p, v) => {
  const grup = p.grup === 'riwayat' ? 'riwayat' : 'aktif';
  const list = await api('order.list', { grup: grup });
  v.innerHTML = '<h1 class="title-lg mb-3">Pesanan Saya</h1>' +
    tabs([{ v: 'aktif', t: 'Aktif' }, { v: 'riwayat', t: 'Riwayat' }], grup, 'tabPesanan') +
    (list.length ? card(list.map(orderRow).join('')) :
      card(empty('bi-inbox', grup === 'aktif' ? 'Belum ada pesanan aktif.' : 'Belum ada riwayat pesanan.', goBtn('pesanBaru', 'Buat Pesanan'))));
}, 'pesananList');
ACT.tabPesanan = d => go('pesananList', { grup: d.v }, { soft: true });

// ── Pelanggan: formulir pesanan 3 langkah ─────────────────
let OF = null;
const newKey = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'k' + Date.now() + Math.random().toString(36).slice(2));
function resetOF() {
  OF = { step: 1, categoryId: '', serviceId: '', judul: '', deskripsi: '', photos: [], areaId: '', rtrw: '', dusun: '', alamat: '',
    lat: '', lng: '', jadwalTipe: 'besok', jadwal: '', requestKey: newKey(), agree: false, prefilled: false };
}
reg('pesanBaru', 'Buat Pesanan', [R.PEL], async (p, v) => {
  const h = await loadHome();
  if (!OF) resetOF();
  if (p.kat && p.kat !== OF.categoryId) { OF.categoryId = p.kat; OF.serviceId = p.svc || ''; OF.step = 1; }
  else if (p.svc) OF.serviceId = p.svc;
  if (!OF.prefilled) {
    try {
      const pr = (await api('profil.get')).profil;
      if (pr) { OF.areaId = OF.areaId || pr.areaId; OF.rtrw = OF.rtrw || pr.rtrw; OF.dusun = OF.dusun || pr.dusun; OF.alamat = OF.alamat || pr.alamat; }
    } catch (e) { /* abaikan */ }
    OF.prefilled = true;
  }
  drawOrderForm(v, h);
}, 'pesanBaru');
function drawOrderForm(v, h) {
  const st = OF.step, cat = h.categories.filter(c => c.id === OF.categoryId)[0];
  const maxFoto = h.settings.maxFoto || 3;
  const stp = (n, t) => '<div class="s ' + (st > n ? 'ok' : st === n ? 'on' : '') + '"><b>' + (st > n ? '<i class="bi bi-check-lg"></i>' : n) + '</b>' + t + '</div>';
  let body = '';
  if (st === 1) {
    const svcs = h.services.filter(s => s.categoryId === OF.categoryId);
    body = card('<h2 class="mb-3" style="font-size:16px"><i class="bi bi-tools" style="color:var(--gold-text)"></i> Kategori & Detail Pekerjaan</h2>' +
      '<div class="fld"><label>Pilih kategori layanan <span style="color:var(--err)">*</span></label><div class="chips" style="flex-wrap:wrap">' +
      h.categories.map(c => '<button type="button" class="chip ' + (c.id === OF.categoryId ? 'on' : '') + '" data-act="ofCat" data-id="' + c.id + '"><i class="bi ' + E(c.ikon) + '"></i> ' + E(c.nama) + '</button>').join('') + '</div></div>' +
      (svcs.length ? '<div class="fld"><label for="of_svc">Jenis pekerjaan (opsional)</label><select class="inp" id="of_svc" data-of="serviceId"><option value="">— Pilih jenis pekerjaan —</option>' +
        svcs.map(s => '<option value="' + s.id + '"' + (s.id === OF.serviceId ? ' selected' : '') + '>' + E(s.nama) + (s.tarifMin ? ' · mulai ' + rp(s.tarifMin) : '') + '</option>').join('') + '</select></div>' : '') +
      '<div class="fld"><label for="of_judul">Judul singkat pekerjaan <span style="color:var(--err)">*</span></label><input class="inp" id="of_judul" data-of="judul" maxlength="120" value="' + E(OF.judul) + '" placeholder="Contoh: Perbaiki genteng bocor & plafon"></div>' +
      '<div class="fld"><label for="of_desk">Deskripsi masalah lengkap <span style="color:var(--err)">*</span></label><textarea class="inp" id="of_desk" data-of="deskripsi" rows="4" maxlength="2000" placeholder="Ceritakan kondisi, ukuran, dan kebutuhan Anda">' + E(OF.deskripsi) + '</textarea></div>' +
      '<div class="fld"><label>Foto kerusakan / kebutuhan <span class="muted">(maks. ' + maxFoto + ' foto, otomatis dikompres)</span></label><div class="thumbs" id="ofPh">' +
      OF.photos.map((f, i) => '<div class="up-box"><img alt="Foto ' + (i + 1) + '" src="' + E(f.thumb || 'data:image/jpeg;base64,' + f.data) + '"><button type="button" aria-label="Hapus foto" data-act="ofDelPh" data-i="' + i + '">×</button></div>').join('') +
      (OF.photos.length < maxFoto ? '<label class="add-ph" tabindex="0"><i class="bi bi-camera" style="font-size:22px"></i>Tambah Foto<input type="file" id="ofFile" accept="image/jpeg,image/png,image/webp" multiple hidden></label>' : '') + '</div></div>');
  } else if (st === 2) {
    body = card('<h2 class="mb-3" style="font-size:16px"><i class="bi bi-geo-alt" style="color:var(--gold-text)"></i> Lokasi Pengerjaan</h2>' +
      '<div class="fld"><label for="of_area">Desa / Kelurahan <span style="color:var(--err)">*</span></label><select class="inp" id="of_area" data-of="areaId"><option value="">— Pilih desa —</option>' +
      h.areas.map(a => '<option value="' + a.id + '"' + (a.id === OF.areaId ? ' selected' : '') + '>' + E(a.nama) + '</option>').join('') + '</select></div>' +
      '<div class="grid2"><div class="fld"><label for="of_rt">RT / RW</label><input class="inp" id="of_rt" data-of="rtrw" value="' + E(OF.rtrw) + '" placeholder="02/04" maxlength="20"></div>' +
      '<div class="fld"><label for="of_du">Grumbul / Dusun</label><input class="inp" id="of_du" data-of="dusun" value="' + E(OF.dusun) + '" maxlength="60"></div></div>' +
      '<div class="fld"><label for="of_al">Patokan alamat <span style="color:var(--err)">*</span></label><input class="inp" id="of_al" data-of="alamat" value="' + E(OF.alamat) + '" maxlength="250" placeholder="Dekat Musholla Al-Huda, 100 m dari jalan raya"></div>' +
      '<div class="note" id="gpsBox"><i class="bi bi-crosshair"></i><div>' +
      (OF.lat !== '' ? 'Titik koordinat tersimpan (' + Number(OF.lat).toFixed(5) + ', ' + Number(OF.lng).toFixed(5) + ').' : 'Titik peta opsional, membantu mitra menemukan lokasi.') +
      '</div></div><button type="button" class="btn-gh btn-block mt-2" data-act="ofGps"><i class="bi bi-geo"></i> Perbarui Pin Koordinat (GPS)</button>') +
      card('<h2 class="mb-3" style="font-size:16px"><i class="bi bi-calendar-event" style="color:var(--gold-text)"></i> Jadwal Kedatangan Mitra</h2>' +
        [['hari_ini', 'Segera / Hari Ini', 'Untuk kondisi darurat atau kebocoran aktif'], ['besok', 'Besok Pagi', 'Pukul 09.00 WIB'], ['tanggal', 'Pilih Tanggal & Jam', 'Sesuaikan dengan ketersediaan Anda']]
          .map(o => '<label class="opt"><input type="radio" name="jt" data-of="jadwalTipe" value="' + o[0] + '"' + (OF.jadwalTipe === o[0] ? ' checked' : '') + '><div><div class="t">' + o[1] + '</div><div class="s">' + o[2] + '</div></div></label>').join('') +
        '<div class="grid2" id="jtDt" style="' + (OF.jadwalTipe === 'tanggal' ? '' : 'display:none') + '"><div class="fld"><label for="of_tgl">Tanggal</label>' +
        '<input class="inp" type="date" id="of_tgl" data-of="jdate" min="' + new Date().toISOString().slice(0, 10) + '" value="' + E((OF.jadwal || '').slice(0, 10)) + '"></div>' +
        '<div class="fld"><label for="of_jam">Jam</label><input class="inp" type="time" id="of_jam" data-of="jtime" value="' + E((OF.jadwal || '').slice(11, 16) || '09:00') + '"></div></div>');
  } else {
    const a = h.areas.filter(x => x.id === OF.areaId)[0], sv = h.services.filter(s => s.id === OF.serviceId)[0];
    body = card('<h2 class="mb-3" style="font-size:16px"><i class="bi bi-clipboard-check" style="color:var(--gold-text)"></i> Konfirmasi Pesanan</h2>' +
      kv('Kategori', E(cat ? cat.nama : '-')) + kv('Jenis', E(sv ? sv.nama : '-')) + kv('Pekerjaan', E(OF.judul)) +
      kv('Lokasi', E((a ? a.nama : '-') + (OF.rtrw ? ', RT/RW ' + OF.rtrw : '') + (OF.dusun ? ', ' + OF.dusun : ''))) + kv('Patokan', E(OF.alamat)) +
      kv('Jadwal', E(jadwalLbl({ jadwalTipe: OF.jadwalTipe, jadwal: OF.jadwal }))) + kv('Foto', OF.photos.length + ' foto') +
      '<hr class="hr"><div class="small muted">Deskripsi</div><div>' + E(OF.deskripsi) + '</div>') +
      note('bi-cash-coin', '<b>Transparan & tanpa uang muka.</b> Biaya disepakati lewat penawaran mitra. Tidak ada pembayaran di awal; bayar langsung setelah pekerjaan tuntas diperiksa.', 'ok') +
      '<label class="chk mt-2"><input type="checkbox" id="ofAgree" ' + (OF.agree ? 'checked' : '') + '><span class="small">Saya menyetujui ' +
      '<a href="javascript:void(0)" data-act="policy">Kebijakan Privasi & Syarat Penggunaan</a>, dan data pesanan ini dapat dilihat admin wilayah serta mitra yang ditugaskan.</span></label>';
  }
  v.innerHTML = '<div class="row-flex between mb-3"><h1 class="title-lg" style="font-size:22px">Formulir Buat Pesanan</h1></div>' +
    '<div class="stepper">' + stp(1, '1. Jasa') + '<div class="ln ' + (st > 1 ? 'ok' : '') + '"></div>' + stp(2, '2. Lokasi & Waktu') +
    '<div class="ln ' + (st > 2 ? 'ok' : '') + '"></div>' + stp(3, '3. Konfirmasi') + '</div>' + body +
    '<div class="sticky-cta row-flex gap-2">' + (st > 1 ? '<button class="btn-gh" data-act="ofPrev" aria-label="Langkah sebelumnya"><i class="bi bi-arrow-left"></i></button>' : '') +
    '<button class="btn-g grow" id="ofNext" data-act="ofNext">' + (st < 3 ? 'Lanjut <i class="bi bi-arrow-right"></i>' : '<i class="bi bi-send"></i> Kirim Pesanan (Dapatkan Penawaran)') + '</button></div>' +
    '<div class="small muted mt-2" style="text-align:center"><i class="bi bi-shield-check" style="color:var(--ok)"></i> Admin wilayah Anda akan mencocokkan mitra terdekat.</div>';
  $$('[data-of]', v).forEach(el => { el.addEventListener('input', ofInput); el.addEventListener('change', ofInput); });
  const ag = $('#ofAgree'); if (ag) ag.addEventListener('change', () => { OF.agree = ag.checked; });
  const f = $('#ofFile'); if (f) f.addEventListener('change', ofFiles);
}
function ofInput(ev) {
  const k = ev.target.dataset.of, val = ev.target.value;
  if (k === 'jdate' || k === 'jtime') {
    const d = ($('#of_tgl') || {}).value || '', t = ($('#of_jam') || {}).value || '09:00';
    OF.jadwal = d ? d + ' ' + t : '';
    return;
  }
  OF[k] = val;
  if (k === 'jadwalTipe') { const b = $('#jtDt'); if (b) b.style.display = val === 'tanggal' ? '' : 'none'; }
}
async function ofFiles(ev) {
  const h = S.home, max = h.settings.maxFoto || 3, mb = h.settings.maxMB || 0.8;
  const files = Array.from(ev.target.files).slice(0, max - OF.photos.length);
  for (const f of files) {
    try { OF.photos.push(await prepImage(f, { maxBytes: mb * 1048576 })); }
    catch (e) { toastErr(e); }
  }
  drawOrderForm($('#view'), h);
}
ACT.ofCat = d => { OF.categoryId = d.id; OF.serviceId = ''; drawOrderForm($('#view'), S.home); };
ACT.ofDelPh = d => { OF.photos.splice(+d.i, 1); drawOrderForm($('#view'), S.home); };
ACT.ofPrev = () => { OF.step = Math.max(1, OF.step - 1); drawOrderForm($('#view'), S.home); window.scrollTo(0, 0); };
ACT.ofGps = () => {
  if (!navigator.geolocation) return toast('Perangkat tidak mendukung GPS.', 'err');
  toast('Mencari lokasi...');
  navigator.geolocation.getCurrentPosition(pos => {
    OF.lat = pos.coords.latitude; OF.lng = pos.coords.longitude;
    $('#gpsBox div').textContent = 'Titik koordinat tersimpan (' + OF.lat.toFixed(5) + ', ' + OF.lng.toFixed(5) + ') ±' + Math.round(pos.coords.accuracy) + ' m.';
    toast('Koordinat tersimpan.', 'ok');
  }, () => toast('Izin lokasi ditolak atau tidak tersedia. Isi patokan alamat dengan jelas.', 'err'), { enableHighAccuracy: true, timeout: 10000 });
};
ACT.ofNext = async () => {
  const st = OF.step;
  if (st === 1) {
    if (!OF.categoryId) return toast('Pilih kategori layanan.', 'err');
    if (OF.judul.trim().length < 5) return toast('Judul pekerjaan minimal 5 karakter.', 'err');
    if (OF.deskripsi.trim().length < 10) return toast('Deskripsikan kebutuhan minimal 10 karakter.', 'err');
  } else if (st === 2) {
    if (!OF.areaId) return toast('Pilih desa/kelurahan.', 'err');
    if (OF.alamat.trim().length < 5) return toast('Isi patokan alamat dengan jelas.', 'err');
    if (OF.jadwalTipe === 'tanggal' && !OF.jadwal) return toast('Pilih tanggal pengerjaan.', 'err');
  } else {
    if (!OF.agree) return toast('Centang persetujuan kebijakan terlebih dahulu.', 'err');
    const b = $('#ofNext');
    if (b.disabled) return;
    b.disabled = true; b.innerHTML = '<span class="spin"></span> Mengirim...';
    try {
      const r = await api('order.create', {
        categoryId: OF.categoryId, serviceId: OF.serviceId, judul: OF.judul, deskripsi: OF.deskripsi, areaId: OF.areaId,
        rtrw: OF.rtrw, dusun: OF.dusun, alamat: OF.alamat, lat: OF.lat, lng: OF.lng, jadwalTipe: OF.jadwalTipe, jadwal: OF.jadwal,
        requestKey: OF.requestKey, photos: OF.photos.map(f => ({ name: f.name, mime: f.mime, data: f.data, thumb: f.thumb }))
      });
      resetOF();
      toast(r.peringatan || 'Pesanan ' + r.kode + ' terkirim!', r.peringatan ? '' : 'ok');
      go('pesananDetail', { id: r.id }, { reset: true });
    } catch (e) {
      b.disabled = false; b.innerHTML = '<i class="bi bi-send"></i> Kirim Pesanan (Dapatkan Penawaran)';
      toastErr(e);
    }
    return;
  }
  OF.step = st + 1;
  drawOrderForm($('#view'), S.home);
  window.scrollTo(0, 0);
};

// ── Konfirmasi selesai & ulasan ──────────────────────────
ACT.confirmDone = async d => {
  openModal({
    title: 'Konfirmasi pekerjaan selesai',
    body: '<p class="muted">Pastikan pekerjaan sudah Anda periksa. Catat cara pembayaran ke mitra:</p>' +
      [['Tunai', 'Dibayar tunai langsung'], ['Transfer', 'Dibayar via transfer'], ['Belum Dibayar', 'Akan dibayar kemudian']]
        .map((o, i) => '<label class="opt"><input type="radio" name="mt" value="' + o[0] + '"' + (i === 0 ? ' checked' : '') + '><div><div class="t">' + o[0] + '</div><div class="s">' + o[1] + '</div></div></label>').join(''),
    foot: '<button class="btn-gh" data-bs-dismiss="modal">Batal</button><button class="btn-g" id="cdYes">Konfirmasi Selesai</button>'
  });
  $('#cdYes').onclick = async () => {
    const m = ($('input[name=mt]:checked') || {}).value || 'Tunai';
    try {
      await api('order.confirm', { orderId: d.id, metode: m });
      closeModal(); toast('Terima kasih! Pekerjaan dikonfirmasi.', 'ok');
      await refresh();
      ACT.reviewNow(d);
    } catch (e) { toastErr(e); }
  };
};
ACT.reviewNow = d => {
  let rating = 0;
  openModal({
    title: 'Beri ulasan untuk mitra',
    body: '<div class="star-pick" id="sp" role="radiogroup" aria-label="Rating">' +
      [1, 2, 3, 4, 5].map(n => '<button type="button" data-n="' + n + '" aria-label="' + n + ' bintang">★</button>').join('') + '</div>' +
      '<div class="fld mt-3"><label for="rvT">Ulasan (opsional)</label><textarea class="inp" id="rvT" rows="3" maxlength="1000" placeholder="Ceritakan pengalaman Anda"></textarea></div>',
    foot: '<button class="btn-gh" data-bs-dismiss="modal">Nanti</button><button class="btn-g" id="rvYes">Kirim Ulasan</button>',
    onShown: () => {
      $$('#sp button').forEach(b => b.addEventListener('click', () => {
        rating = +b.dataset.n;
        $$('#sp button').forEach(x => x.classList.toggle('on', +x.dataset.n <= rating));
      }));
      $('#rvYes').onclick = async () => {
        if (!rating) return toast('Pilih jumlah bintang.', 'err');
        try {
          await api('review.create', { orderId: d.id, rating: rating, ulasan: $('#rvT').value });
          closeModal(); toast('Ulasan terkirim. Terima kasih!', 'ok'); refresh();
        } catch (e) { toastErr(e); }
      };
    }
  });
};

// ── Pelanggan: akun, profil, ulasan ──────────────────────
reg('akun', 'Akun Saya', [R.PEL], (p, v) => {
  const u = S.user;
  v.innerHTML = card('<div class="row-flex gap-3">' + avatar(u.nama, '', 'lg') + '<div class="grow"><h2 style="font-size:18px">' + E(u.nama) +
    '</h2><div class="small muted">' + E(u.email || '-') + '</div><div class="small muted">+' + E(u.telepon) + '</div></div></div>') +
    card('<div class="list-row" data-go="profil"><span class="ic"><i class="bi bi-person"></i></span><div class="grow"><b style="color:var(--tx)">Profil & Alamat</b><div class="small muted">Ubah data diri dan alamat bawaan</div></div><i class="bi bi-chevron-right muted"></i></div>' +
      '<div class="list-row" data-go="pesananList" data-grup="riwayat"><span class="ic"><i class="bi bi-clock-history"></i></span><div class="grow"><b style="color:var(--tx)">Riwayat Pesanan</b></div><i class="bi bi-chevron-right muted"></i></div>' +
      '<div class="list-row" data-go="ulasanSaya"><span class="ic"><i class="bi bi-star"></i></span><div class="grow"><b style="color:var(--tx)">Ulasan Saya</b></div><i class="bi bi-chevron-right muted"></i></div>' +
      '<div class="list-row" data-go="bantuan"><span class="ic"><i class="bi bi-headset"></i></span><div class="grow"><b style="color:var(--tx)">Pusat Bantuan & Pengaduan</b></div><i class="bi bi-chevron-right muted"></i></div>' +
      '<div class="list-row" data-act="policy"><span class="ic"><i class="bi bi-shield-lock"></i></span><div class="grow"><b style="color:var(--tx)">Kebijakan Privasi</b></div><i class="bi bi-chevron-right muted"></i></div>' +
      (PWA && !isStandalone() ? '<div class="list-row" data-act="install"><span class="ic"><i class="bi bi-download"></i></span><div class="grow"><b style="color:var(--tx)">Pasang Aplikasi di HP</b><div class="small muted">Buka cepat dari layar utama</div></div><i class="bi bi-chevron-right muted"></i></div>' : '')) +
    '<button class="btn-gh btn-block mb-2" data-act="theme"><i class="bi bi-circle-half"></i> Ganti Tema Terang/Gelap</button>' +
    '<button class="btn-dg btn-block" data-act="logout"><i class="bi bi-box-arrow-left"></i> Keluar</button>';
}, 'akun');

/** Profil bersama semua peran: data diri, alamat (pelanggan), rekening (admin kecamatan), ganti kata sandi. */
reg('profil', 'Profil Saya', [R.PEL, R.MIT, R.KEC, R.KAB, R.SUP], async (p, v) => {
  const r = await api('profil.get');
  const u = r.user, pr = r.profil || {};
  const h = await loadHome();
  v.innerHTML = '<button class="btn-gh btn-sm mb-3" data-act="back"><i class="bi bi-arrow-left"></i> Kembali</button>' +
    '<h1 class="title-lg mb-3">Profil Saya</h1><form id="pf" novalidate>' +
    card(fieldHtml({ name: 'nama', label: 'Nama lengkap', req: true, value: u.nama, max: 80 }) +
      fieldHtml({ name: 'telepon', label: 'Nomor WhatsApp', req: true, type: 'tel', value: u.telepon }) +
      fieldHtml({ name: 'email', label: 'Email', type: 'email', value: u.email }) +
      (u.role === R.PEL ? '<hr class="hr">' + fieldHtml({ name: 'areaId', label: 'Desa/kelurahan bawaan', type: 'select', blank: '— Pilih —', options: h.areas.map(a => ({ v: a.id, t: a.nama })), value: pr.areaId }) +
        '<div class="grid2">' + fieldHtml({ name: 'rtrw', label: 'RT/RW', value: pr.rtrw }) + fieldHtml({ name: 'dusun', label: 'Grumbul/Dusun', value: pr.dusun }) + '</div>' +
        fieldHtml({ name: 'alamat', label: 'Patokan alamat', value: pr.alamat, max: 250 }) : '') +
      (u.role === R.KEC ? '<hr class="hr">' + fieldHtml({ name: 'rekening', label: 'Rekening setoran & deposit mitra', type: 'textarea', value: r.rekening, max: 200, ph: 'Contoh: BRI 1234-5678-9012 a.n. Nama Admin' }) : '')) +
    '<button class="btn-g btn-block" type="submit">Simpan Perubahan</button></form>' +
    '<form id="pwf" novalidate class="mt-4"><div class="bb-card"><div class="row-flex gap-2 mb-2"><i class="bi bi-shield-lock" style="color:var(--gold-text);font-size:20px"></i>' +
    '<b style="color:var(--tx);font-size:16px">Ganti Kata Sandi</b></div>' +
    '<div class="small muted mb-3">Minimal 8 karakter dengan huruf dan angka.</div>' +
    fieldHtml({ name: 'lama', label: 'Kata sandi saat ini', type: 'password', req: true, ac: 'current-password' }) +
    fieldHtml({ name: 'baru', label: 'Kata sandi baru', type: 'password', req: true, ac: 'new-password' }) +
    fieldHtml({ name: 'baru2', label: 'Ulangi kata sandi baru', type: 'password', req: true, ac: 'new-password' }) +
    '<button class="btn-g btn-block" type="submit"><i class="bi bi-key"></i> Ganti Kata Sandi</button></div></form>' +
    (PWA && !isStandalone() ? '<button class="btn-gh btn-block mb-2" data-act="install"><i class="bi bi-download"></i> Pasang Aplikasi di HP</button>' : '') +
    '<button class="btn-dg btn-block" data-act="logout"><i class="bi bi-box-arrow-left"></i> Keluar</button>';
  bindForm($('#pwf'), async (val, form) => {
    if (val.baru !== val.baru2) throw new Error('Konfirmasi kata sandi baru tidak sama.');
    if (val.baru === val.lama) throw new Error('Kata sandi baru harus berbeda dari yang lama.');
    await api('auth.ubahPassword', { lama: val.lama, baru: val.baru });
    form.reset();
    toast('Kata sandi berhasil diganti.', 'ok');
  });
  bindForm($('#pf'), async val => {
    const nu = await api('profil.save', val);
    S.user = Object.assign(S.user, nu);
    applyChrome();
    if (OF) OF.prefilled = false;
    toast('Profil diperbarui.', 'ok');
  });
}, 'profil');

reg('ulasanSaya', 'Ulasan Saya', [R.PEL], async (p, v) => {
  const list = await api('review.list');
  v.innerHTML = '<button class="btn-gh btn-sm mb-3" data-act="back"><i class="bi bi-arrow-left"></i> Kembali</button><h1 class="title-lg mb-3">Ulasan Saya</h1>' +
    (list.length ? list.map(r => card(stars(r.rating) + '<div class="mt-1"><b style="color:var(--tx)">' + E(r.judul) + '</b> <span class="small muted">· ' + E(r.mitra) + '</span></div>' +
      (r.ulasan ? '<p class="mb-1 mt-1">' + E(r.ulasan) + '</p>' : '') + '<div class="small muted">' + E(r.kode) + ' · ' + tgl(r.createdAt, false) + '</div>')).join('') :
      card(empty('bi-star', 'Anda belum memberi ulasan.')));
}, 'akun');

// ── Detail pesanan (dipakai semua peran) ──────────────────
const CANCELABLE = ['Menunggu Konfirmasi', 'Mencari Mitra', 'Menunggu Penawaran', 'Menunggu Persetujuan', 'Disetujui', 'Dijadwalkan'];
reg('pesananDetail', 'Detail Pesanan', ['pelanggan', 'mitra', 'admin_kecamatan', 'admin_kabupaten', 'super_admin'], async (p, v) => {
  const o = await api('order.get', { id: p.id });
  const role = S.user.role, isP = role === R.PEL, isM = role === R.MIT, adm = isAdm();
  const pendQ = o.penawaran.filter(q => q.status === 'Menunggu' && q.id === o.quotationId)[0];
  const mi = o.mitraInfo, pi = o.pelangganInfo;
  let act = '';
  if (isP) {
    if (o.status === 'Selesai') act += '<button class="btn-g btn-block mb-2" data-act="confirmDone" data-id="' + o.id + '"><i class="bi bi-check2-circle"></i> Konfirmasi Pekerjaan Selesai</button>';
    if (o.status === 'Dikonfirmasi' && !o.ulasanPelanggan) act += '<button class="btn-g btn-block mb-2" data-act="reviewNow" data-id="' + o.id + '"><i class="bi bi-star"></i> Beri Ulasan untuk Mitra</button>';
    if (mi && mi.telepon) act += waBtn(mi.telepon, 'Halo ' + mi.nama + ', saya ' + S.user.nama + ' terkait pesanan ' + o.kode + ' (' + o.judul + ').', 'Chat ' + mi.nama + ' via WhatsApp', 'btn-wa btn-block mb-2');
  }
  if (isM) {
    if (o.assignStatus === 'Menunggu') act += '<div class="row-flex gap-2 mb-2"><button class="btn-g grow" data-act="respond" data-id="' + o.id + '" data-y="1"><i class="bi bi-check2"></i> Terima & Beri Penawaran</button><button class="btn-gh" data-act="respond" data-id="' + o.id + '" data-y="0">Tolak</button></div>';
    if (o.assignStatus === 'Diterima' && ['Menunggu Penawaran', 'Menunggu Persetujuan', 'Disetujui', 'Dijadwalkan'].indexOf(o.status) >= 0) act += '<button class="btn-g btn-block mb-2" data-act="quoteForm" data-id="' + o.id + '"><i class="bi bi-tag"></i> ' + (o.penawaran.length ? 'Revisi / Kirim Ulang Penawaran' : 'Kirim Penawaran Harga') + '</button>';
    if (o.status === 'Disetujui') act += '<div class="row-flex gap-2 mb-2"><button class="btn-gh grow" data-act="setStatus" data-id="' + o.id + '" data-st="Dijadwalkan"><i class="bi bi-calendar-check"></i> Jadwalkan</button><button class="btn-g grow" data-act="setStatus" data-id="' + o.id + '" data-st="Dalam Pengerjaan"><i class="bi bi-play-fill"></i> Mulai Kerja</button></div>';
    if (o.status === 'Dijadwalkan') act += '<button class="btn-g btn-block mb-2" data-act="setStatus" data-id="' + o.id + '" data-st="Dalam Pengerjaan"><i class="bi bi-play-fill"></i> Mulai Pengerjaan</button>';
    if (o.status === 'Dalam Pengerjaan') act += '<button class="btn-ok btn-block mb-2" data-act="setStatus" data-id="' + o.id + '" data-st="Selesai"><i class="bi bi-check2-all"></i> Tandai Selesai & Minta Konfirmasi</button>';
    if (pi && pi.telepon) act += waBtn(pi.telepon, 'Halo ' + pi.nama + ', saya ' + S.user.nama + ' dari BANTU AJA terkait pesanan ' + o.kode + ' (' + o.judul + ').', 'WhatsApp Pelanggan', 'btn-wa btn-block mb-2');
  }
  if (adm) {
    if (['Menunggu Konfirmasi', 'Mencari Mitra', 'Menunggu Penawaran'].indexOf(o.status) >= 0) act += '<button class="btn-g btn-block mb-2" data-go="admPencocokanDetail" data-id="' + o.id + '"><i class="bi bi-diagram-3"></i> ' + (o.mitraId ? 'Ganti Mitra' : 'Cocokkan & Pasangkan Mitra') + '</button>';
    if (o.status === 'Menunggu Konfirmasi') act += '<button class="btn-gh btn-block mb-2" data-act="setStatus" data-id="' + o.id + '" data-st="Mencari Mitra">Konfirmasi pesanan & mulai cari mitra</button>';
    if (o.status === 'Selesai') act += '<button class="btn-gh btn-block mb-2" data-act="confirmDone" data-id="' + o.id + '">Konfirmasi atas nama pelanggan</button>';
    if (mi && mi.telepon) act += waBtn(mi.telepon, 'Halo ' + mi.nama + ', admin BANTU AJA terkait pesanan ' + o.kode + '.', 'WA Mitra', 'btn-wa btn-sm') + ' ';
    if (pi && pi.telepon) act += waBtn(pi.telepon, 'Halo ' + pi.nama + ', admin BANTU AJA terkait pesanan ' + o.kode + '.', 'WA Pelanggan', 'btn-wa btn-sm');
  }
  if (CANCELABLE.indexOf(o.status) >= 0 && (isP || adm)) act += '<button class="btn-dg btn-block mt-2" data-act="cancelOrder" data-id="' + o.id + '"><i class="bi bi-x-circle"></i> Batalkan Pesanan</button>';

  v.innerHTML = '<button class="btn-gh btn-sm mb-3" data-act="back"><i class="bi bi-arrow-left"></i> Kembali</button>' +
    (isP && pendQ ? note('bi-bell-fill', '<b>Penawaran biaya diterima!</b> Harap konfirmasi sebelum masa berlaku habis.', 'mb-3') + '<div class="mb-3"></div>' : '') +
    '<div class="two-col" style="align-items:start"><div>' +
    card('<div class="row-flex between wrap gap-2"><div><div class="eyebrow">No. Pesanan</div><h1 class="title-lg" style="font-size:22px">#' + E(o.kode) +
      '</h1><div class="small muted"><i class="bi bi-calendar"></i> ' + tgl(o.createdAt) + ' WIB</div></div>' + stBdg(o.status) + '</div>' +
      progress6(o) + '<div class="mt-2"><b style="color:var(--tx);font-size:16px">' + E(o.judul) + '</b></div>') +
    quoteBox(o, isP) +
    (mi && !isM ? card('<div class="eyebrow mb-2">Mitra pelaksana</div><div class="row-flex gap-3">' + avatar(mi.nama, mi.foto) + '<div class="grow"><b style="color:var(--tx)">' + E(mi.nama) +
      '</b> <span class="bdg gold">' + E(mi.kodeMitra) + '</span><div class="small muted">' + E(mi.keahlian) + '</div></div>' +
      (mi.rating ? '<span class="bdg gold">★ ' + mi.rating.toFixed(1) + '</span>' : '') + '</div>' +
      (o.assignStatus === 'Menunggu' ? '<div class="small muted mt-2"><i class="bi bi-hourglass-split"></i> Menunggu konfirmasi mitra</div>' : '')) : '') +
    (pi && !isP ? card('<div class="eyebrow mb-2">Pelanggan</div><div class="row-flex gap-3">' + avatar(pi.nama) + '<div class="grow"><b style="color:var(--tx)">' + E(pi.nama) + '</b>' +
      (pi.telepon ? '<div class="small muted">+' + E(pi.telepon) + '</div>' : '<div class="small muted">Nomor terlihat setelah Anda menerima pesanan</div>') + '</div></div>') : '') +
    card('<div class="row-flex between mb-2"><b style="color:var(--tx)">Informasi Pekerjaan</b><span class="bdg">' + E(o.kategori) + '</span></div>' +
      (o.foto.length ? '<div class="thumbs mb-3">' + o.foto.map(f => '<img class="thumb" alt="Foto kebutuhan" ' + (f.thumb ? 'src="' + E(f.thumb) + '"' : '') +
        ' tabindex="0" role="button" data-act="photo" data-id="' + f.id + '">').join('') + '</div>' : '') +
      kv('Layanan', E(o.layanan || o.kategori)) + kv('Lokasi', E(o.area + (o.rtrw ? ', RT/RW ' + o.rtrw : '') + (o.dusun ? ', ' + o.dusun : ''))) +
      kv('Patokan', E(o.alamat)) + (o.lat !== '' && o.lat != null ? kv('Koordinat', E(Number(o.lat).toFixed(5) + ', ' + Number(o.lng).toFixed(5))) : '') +
      kv('Jadwal', E(jadwalLbl(o))) + '<hr class="hr"><div class="small muted">Deskripsi</div><div>' + E(o.deskripsi) + '</div>') +
    (o.ulasanPelanggan ? card('<div class="eyebrow mb-1">Ulasan pelanggan</div>' + stars(o.ulasanPelanggan.rating) + (o.ulasanPelanggan.ulasan ? '<p class="mb-0 mt-1">' + E(o.ulasanPelanggan.ulasan) + '</p>' : '')) : '') +
    '</div><div>' +
    (act ? card('<div class="eyebrow mb-2">Tindakan</div>' + act, 'hi') : '') +
    (o.transaksi ? card('<div class="eyebrow mb-2">Transaksi</div>' + kv('Nilai', '<span class="price" style="font-size:14px">' + rp(o.transaksi.nilai) + '</span>') +
      kv('Pembayaran', E(o.transaksi.statusBayar)) + (o.komisi ? kv('Komisi ' + o.komisi.persen + '%', rp(o.komisi.nilai) + ' · ' + E(o.komisi.status)) : '')) : '') +
    note('bi-shield-check', '<b>Perlindungan:</b> pekerjaan fisik tidak boleh dimulai sebelum penawaran disetujui pelanggan di sistem BANTU AJA.', 'mb-3') + '<div class="mb-3"></div>' +
    '<div class="row-flex gap-2 wrap mb-3"><button class="btn-gh btn-sm" data-act="pdfBukti" data-id="' + o.id + '"><i class="bi bi-file-earmark-pdf"></i> Bukti Pesanan (PDF)</button>' +
    (o.status === 'Dikonfirmasi' ? '<button class="btn-gh btn-sm" data-act="pdfTerima" data-id="' + o.id + '"><i class="bi bi-download"></i> Tanda Terima (PDF)</button>' : '') +
    (!adm ? '<button class="btn-gh btn-sm" data-act="newComplaint" data-id="' + o.id + '"><i class="bi bi-flag"></i> Ajukan Pengaduan</button>' : '') + '</div>' +
    card('<div class="eyebrow mb-3">Riwayat Status</div><div class="tline">' + o.log.slice().reverse().map(l => '<div class="it"><div style="color:var(--tx);font-weight:700">' +
      E(l.statusBaru) + '</div><div class="small muted">' + E(l.nama) + ' · ' + tgl(l.createdAt) + '</div>' + (l.catatan ? '<div class="small">' + E(l.catatan) + '</div>' : '') + '</div>').join('') + '</div>') +
    '</div></div>';
  setChrome({ title: 'Detail Pesanan', nav: isP ? 'pesananList' : isM ? 'mitraKerja' : 'admPesanan' });
}, null);

ACT.cancelOrder = async d => {
  const r = await ask({ title: 'Batalkan pesanan?', text: 'Pesanan akan dibatalkan dan pihak terkait diberi tahu.', ok: 'Ya, Batalkan', danger: true, reason: { label: 'Alasan pembatalan', required: true } });
  if (!r) return;
  try { await api('order.cancel', { orderId: d.id, alasan: r }); toast('Pesanan dibatalkan.', 'ok'); refresh(); }
  catch (e) { toastErr(e); }
};

// [Lanjut ke Bagian 3: mitra dan pemilih ikon]
// ============================================================
// BAGIAN 3 — Mitra dan pemilih ikon
// ============================================================

// ── Pemilih ikon (dipakai kategori dan sub layanan) ───────
const ICON_PICK = [
  'bi-tools', 'bi-wrench', 'bi-wrench-adjustable', 'bi-hammer', 'bi-bricks', 'bi-house-gear', 'bi-house-heart', 'bi-door-open',
  'bi-droplet', 'bi-droplet-half', 'bi-water', 'bi-bucket', 'bi-lightning-charge', 'bi-plug', 'bi-tv', 'bi-snow',
  'bi-truck', 'bi-box-seam', 'bi-car-front', 'bi-bicycle', 'bi-fuel-pump', 'bi-basket', 'bi-cart', 'bi-bag',
  'bi-stars', 'bi-broom', 'bi-recycle', 'bi-trash', 'bi-brush', 'bi-paint-bucket', 'bi-scissors', 'bi-tree',
  'bi-flower1', 'bi-person-workspace', 'bi-people', 'bi-cup-hot', 'bi-heart-pulse', 'bi-shield-check', 'bi-clock', 'bi-geo-alt'
];
/** Bagian pemilih ikon yang bisa dipakai di formulir kategori maupun sub layanan. */
function icoPickHtml(cur, fallback) {
  return '<div class="fld"><label>Ikon</label>' +
    '<input type="hidden" name="ikon" id="ikonVal" value="' + E(cur || '') + '">' +
    '<div class="row-flex gap-3 mb-2"><span class="logo-mark" id="ikonPrev"><i class="bi ' + E(cur || fallback) + '"></i></span>' +
    '<div class="small muted" id="ikonTxt">' + (cur ? E(cur) : 'Default: ' + E(fallback)) + '</div></div>' +
    '<div class="chips" id="ikonBox" style="flex-wrap:wrap">' +
    ICON_PICK.map(i => '<button type="button" class="chip ' + (i === cur ? 'on' : '') + '" data-ico="' + i + '" aria-label="' + i + '">' +
      '<i class="bi ' + i + '"></i></button>').join('') +
    '</div><div class="help">Ketuk ikon untuk memilih. Ketuk lagi untuk mengosongkan.</div></div>';
}
function bindIcoPick(f, fallback) {
  $$('#ikonBox [data-ico]').forEach(b => b.addEventListener('click', () => {
    const v = f.elements.ikon.value === b.dataset.ico ? '' : b.dataset.ico;
    f.elements.ikon.value = v;
    $$('#ikonBox [data-ico]').forEach(x => x.classList.toggle('on', x.dataset.ico === v));
    $('#ikonPrev').innerHTML = '<i class="bi ' + E(v || fallback) + '"></i>';
    $('#ikonTxt').textContent = v || ('Default: ' + fallback);
  }));
}

// ── Mitra: beranda, pesanan masuk, kerja, riwayat ─────────
const vStat = s => s === 'Terverifikasi' ? bdg('Terverifikasi', 'ok') : s === 'Menunggu' ? bdg('Menunggu verifikasi', 'warn') : bdg(s, 'err');

function mitraOrderCard(o, incoming) {
  return '<div class="bb-card ' + (incoming ? 'hi' : '') + '"><div class="row-flex between wrap gap-2"><span class="small muted">#' + E(o.kode) + ' · ' + ago(o.createdAt) + '</span>' +
    (incoming ? bdg('Butuh respons', 'warn') : stBdg(o.status)) + '</div>' +
    '<b style="color:var(--tx);font-size:16px" class="d-block mt-1">' + E(o.judul) + '</b>' +
    '<div class="small muted mt-1"><i class="bi bi-person"></i> ' + E(o.pelangganInfo ? o.pelangganInfo.nama : '') + ' · <i class="bi bi-geo-alt"></i> ' + E(o.area) + (o.rtrw ? ', RT/RW ' + E(o.rtrw) : '') + '</div>' +
    '<div class="small muted"><i class="bi bi-clock"></i> ' + E(jadwalLbl(o)) + '</div>' +
    '<div class="note mt-2"><i class="bi bi-chat-quote"></i><div><i>“' + E(o.deskripsi.length > 160 ? o.deskripsi.slice(0, 160) + '…' : o.deskripsi) + '”</i></div></div>' +
    (o.foto.length ? '<div class="thumbs mt-2">' + o.foto.map(f => '<img class="thumb" style="width:64px;height:64px" alt="Foto kerusakan" ' + (f.thumb ? 'src="' + E(f.thumb) + '"' : '') +
      ' tabindex="0" role="button" data-act="photo" data-id="' + f.id + '">').join('') + '</div>' : '') +
    (incoming ? '<div class="row-flex gap-2 mt-3"><button class="btn-g grow" data-act="respond" data-id="' + o.id + '" data-y="1"><i class="bi bi-tag"></i> Terima & Beri Penawaran</button>' +
      '<button class="btn-gh" data-act="respond" data-id="' + o.id + '" data-y="0"><i class="bi bi-x"></i> Tolak</button></div>'
      : (o.nilai ? '<div class="row-flex between mt-2"><span class="small muted">Nilai disepakati</span><span class="price" style="font-size:14px">' + rp(o.nilai) + '</span></div>' : '') +
        tracker4(o.status) + '<button class="btn-gh btn-block btn-sm mt-1" data-go="pesananDetail" data-id="' + o.id + '">Buka detail & tindakan</button>') + '</div>';
}

/** Banner saldo deposit mitra: saldo, komisi belum disetor, status blokir, dan top up. */
function setorBanner(st) {
  if (!st) return '';
  const blok = st.diblokir;
  const col = blok ? 'var(--err)' : (st.saldo < st.saldoMin * 1.5 || st.jumlah >= st.batasTrx - 1) ? 'var(--warn)' : 'var(--ok)';
  const judul = !blok ? 'Saldo Deposit Anda'
    : st.alasan === 'saldo' ? 'Penerimaan pesanan dihentikan: saldo habis'
    : 'Penerimaan pesanan dihentikan: komisi belum disetor';
  const wa = st.waAdmin ? waBtn(st.waAdmin, 'Halo admin, saya ' + S.user.nama + ' ingin mengonfirmasi deposit atau setoran komisi.', 'Konfirmasi via WhatsApp', 'btn-wa btn-sm') : '';
  return '<div class="bb-card hi" style="' + (blok ? 'border-color:var(--err);background:var(--err-bg)' : '') + '">' +
    '<div class="row-flex between wrap gap-2"><b style="color:var(--tx);font-size:16px"><i class="bi ' + (blok ? 'bi-slash-circle' : 'bi-wallet2') + '" style="color:' + col + '"></i> ' + judul + '</b>' +
    (blok ? bdg('Diblokir', 'err') : '') + '</div>' +
    '<div class="row-flex between mt-2"><span class="price" style="font-size:20px;color:' + col + '">' + rp(st.saldo) + '</span>' +
    '<span class="small muted">minimum ' + rp(st.saldoMin) + '</span></div>' +
    '<div class="small muted mt-2">Komisi belum disetor: ' + st.jumlah + ' dari batas ' + st.batasTrx + ' transaksi' +
    (st.tertunda ? ' (' + rp(st.tertunda) + ')' : '') + '</div>' +
    (blok ? '<div class="note err mt-2"><i class="bi bi-exclamation-triangle"></i><div>' +
      (st.alasan === 'saldo' ? 'Saldo di bawah minimum. Lakukan top up agar dapat menerima pesanan kembali. Pekerjaan yang sedang berjalan tetap dapat diselesaikan.'
        : 'Setorkan komisi ke admin kecamatan Anda, lalu admin mencatatnya.') + '</div></div>' : '') +
    (st.infoSetor ? '<div class="small mt-2"><i class="bi bi-bank" style="color:var(--gold-text)"></i> ' + E(st.infoSetor) + '</div>' : '') +
    '<div class="row-flex gap-2 wrap mt-2"><button class="btn-g btn-sm" data-act="depositForm"><i class="bi bi-plus-circle"></i> Top Up Deposit</button>' + wa + '</div></div>';
}
ACT.depositForm = async () => {
  const d = await api('dash.mitra', {}, { silent: true });
  formModal({
    title: 'Top Up Deposit', submit: 'Ajukan Deposit',
    intro: 'Transfer ke rekening Admin Kecamatan Anda, lalu ajukan di sini. Saldo bertambah setelah admin mengonfirmasi.',
    fields: [{ name: 'nilai', label: 'Nominal deposit (Rp)', type: 'number', req: true, min: 50000, step: 10000, value: 50000, help: 'Minimum Rp 50.000.' }],
    extra: note('bi-bank', '<b>Rekening tujuan:</b> ' + E(d.setor.infoSetor || 'Hubungi admin kecamatan Anda.'), 'mt-2'),
    onSubmit: async v => { await api('deposit.ajukan', { nilai: v.nilai }); toast('Deposit diajukan. Menunggu konfirmasi admin.', 'ok'); refresh(); }
  });
};

reg('mitraDash', 'Ringkasan Mitra', [R.MIT], async (p, v) => {
  const d = await api('dash.mitra'), pr = d.profil, k = d.kpi, persen = (S.home && S.home.settings.komisiPersen) || 5;
  S.partner = Object.assign(S.partner || {}, { statusVerifikasi: pr.statusVerifikasi, tersedia: pr.tersedia, foto: pr.foto, saldo: d.setor.saldo });
  setBadges({ masuk: k.masuk, aktif: k.aktif });
  v.innerHTML = setorBanner(d.setor) +
    (pr.statusVerifikasi !== 'Terverifikasi' ? note('bi-shield-exclamation', '<b>Akun Anda ' + (pr.statusVerifikasi === 'Menunggu' ? 'menunggu verifikasi admin' : pr.statusVerifikasi) + '.</b> ' +
      (pr.catatanAdmin ? E(pr.catatanAdmin) + ' ' : '') + 'Lengkapi profil dan dokumen agar dapat menerima pesanan. <a href="javascript:void(0)" data-go="mitraProfil">Buka Profil Mitra →</a>',
      pr.statusVerifikasi === 'Menunggu' ? '' : 'err') + '<div class="mb-3"></div>' : '') +
    '<div class="bb-card hero"><div class="row-flex between wrap gap-3"><div class="row-flex gap-3">' + avatar(pr.nama, pr.foto, 'lg') +
    '<div><h1 class="title-lg" style="font-size:22px">Halo, ' + E(pr.nama.split(' ').slice(0, 2).join(' ')) + '!</h1><div class="row-flex gap-2 wrap mt-1">' +
    vStat(pr.statusVerifikasi) + '<span class="bdg gold">' + E(pr.kodeMitra) + '</span>' + (pr.rating ? '<span class="bdg gold">★ ' + pr.rating.toFixed(1) + ' (' + pr.ulasan + ')</span>' : '') +
    '</div><div class="small muted mt-1">' + E(pr.keahlian || 'Lengkapi keahlian Anda') + '</div></div></div>' +
    '<label class="row-flex gap-3 flat" style="background:var(--l2);border:1px solid var(--line);border-radius:14px;padding:12px 14px;cursor:pointer">' +
    '<span class="switch"><input type="checkbox" id="avail" ' + (pr.tersedia ? 'checked' : '') + ' ' + (pr.statusVerifikasi !== 'Terverifikasi' ? 'disabled' : '') +
    ' aria-label="Siaga terima pesanan" data-act="avail"><span></span></span><span><b style="color:var(--tx)">Siaga Terima Pesanan</b><br>' +
    '<span class="small" style="color:' + (pr.tersedia ? 'var(--ok)' : 'var(--mut)') + '">' + (pr.tersedia ? 'Aktif menerima panggilan baru' : 'Tidak menerima pesanan baru') + '</span></span></label></div></div>' +
    '<div class="kpis">' +
    kpi('Tawaran Baru', k.masuk + ' Order', k.masuk ? 'Perlu respons Anda' : 'Tidak ada tawaran', 'bi-bell') +
    kpi('Sedang Dikerjakan', k.aktif + ' Pekerjaan', 'Aktif sekarang', 'bi-tools') +
    kpi('Pendapatan Bulan Ini', rpShort(k.pendapatanBulan), k.pesananBulan + ' pekerjaan · bersih ' + rpShort(k.pendapatanBulan - k.komisiBulan), 'bi-wallet2', 'gold') +
    kpi('Saldo Deposit', rpShort(d.setor.saldo), 'Minimum ' + rpShort(d.setor.saldoMin) + (d.setor.diblokir ? ' · <b style="color:var(--err)">diblokir</b>' : ''), 'bi-piggy-bank') +
    '</div>' +
    '<div class="two-col" style="align-items:start"><div>' + secH('bi-bell', 'Pesanan Masuk Perlu Respons') +
    (d.masuk.length ? d.masuk.map(o => mitraOrderCard(o, true)).join('') : card(empty('bi-inbox', 'Belum ada pesanan masuk. Pastikan status Siaga aktif.'))) + '</div><div>' +
    secH('bi-tools', 'Pekerjaan Berjalan') + (d.berjalan.length ? d.berjalan.map(o => mitraOrderCard(o, false)).join('') : card(empty('bi-hammer', 'Tidak ada pekerjaan berjalan.'))) +
    card('<div class="row-flex between mb-2"><b style="color:var(--tx)"><i class="bi bi-geo-alt" style="color:var(--gold-text)"></i> Wilayah Jangkauan</b>' +
      '<a href="javascript:void(0)" data-go="mitraWilayah" class="small">+ Ajukan wilayah</a></div><div class="small muted mb-2">Anda menerima order dari desa yang sudah disetujui admin wilayah.</div>' +
      '<div class="row-flex gap-2 wrap">' + (d.wilayah.length ? d.wilayah.map(w => '<span class="bdg ok">' + E(w) + '</span>').join('') : '<span class="small muted">Belum ada wilayah.</span>') + '</div>') +
    card('<b style="color:var(--tx)"><i class="bi bi-shield-check" style="color:var(--gold-text)"></i> SOP Deposit & Komisi</b>' +
      '<p class="small muted mt-2 mb-1">Setiap pekerjaan yang dikonfirmasi selesai dikenakan komisi platform ' + persen + '%. Komisi dipotong otomatis dari saldo deposit Anda.</p>' +
      '<p class="small muted mb-0">Jika saldo kurang, komisi dicatat sebagai belum disetor dan harus disetorkan ke admin kecamatan Anda. Pesanan baru dihentikan bila saldo di bawah minimum atau komisi belum disetor sudah mencapai batas.</p>') +
    '</div></div>' +
    secH('bi-clock-history', 'Riwayat Transaksi & Rekap', '<a href="javascript:void(0)" data-go="mitraUang">Lihat semua</a>') +
    (d.riwayat.length ? card(d.riwayat.slice(0, 5).map(t => '<div class="list-row" data-go="pesananDetail" data-id="' + t.orderId + '"><span class="ic"><i class="bi bi-check2-circle"></i></span>' +
      '<div class="grow"><b style="color:var(--tx)" class="ellipsis d-block">' + E(t.judul) + '</b><div class="small muted">' + E(t.kode) + ' · ' + tgl(t.createdAt, false) + '</div></div>' +
      '<div style="text-align:right"><div class="price" style="font-size:14px">' + rp(t.nilai) + '</div><div class="tiny muted">Komisi ' + rp(t.komisi) + '</div></div></div>').join('')) :
      card(empty('bi-receipt', 'Belum ada transaksi selesai.')));
}, 'mitraDash');
ACT.avail = async (d, el) => {
  try {
    const r = await api('partner.avail', { tersedia: el.checked });
    S.partner.tersedia = r;
    toast(r ? 'Status Siaga aktif.' : 'Status Siaga dimatikan.', 'ok');
    refresh();
  } catch (e) { el.checked = !el.checked; toastErr(e); }
};
ACT.respond = async d => {
  if (d.y === '1') {
    try {
      await api('order.respond', { orderId: d.id, terima: true });
      toast('Pesanan diterima. Silakan kirim penawaran harga.', 'ok');
      await refresh();
      ACT.quoteForm(d);
    } catch (e) { toastErr(e); }
  } else {
    const r = await ask({ title: 'Tolak penugasan?', text: 'Admin wilayah akan mencarikan mitra lain.', ok: 'Tolak', danger: true, reason: { label: 'Alasan penolakan', required: true, ph: 'Contoh: Sedang di luar kota' } });
    if (!r) return;
    try { await api('order.respond', { orderId: d.id, terima: false, alasan: r }); toast('Penugasan ditolak.', 'ok'); go('mitraDash', {}, { reset: true }); }
    catch (e) { toastErr(e); }
  }
};
ACT.quoteForm = d => {
  const persen = (S.home && S.home.settings.komisiPersen) || 5;
  formModal({
    title: 'Penawaran Harga', submit: 'Kirim Penawaran ke Pelanggan',
    intro: 'Total dihitung otomatis. Pelanggan harus menyetujui sebelum pekerjaan dimulai.',
    fields: [
      { name: 'jasa', label: 'Ongkos jasa tukang (Rp)', type: 'number', req: true, min: 0, step: 1000, inputmode: 'numeric', value: '' },
      { name: 'material', label: 'Estimasi material/bahan (Rp)', type: 'number', min: 0, step: 1000, inputmode: 'numeric', value: 0 },
      { name: 'catatan', label: 'Catatan untuk pelanggan', type: 'textarea', max: 500, ph: 'Contoh: sudah termasuk lem perekat, garansi 7 hari' },
      { name: 'berlakuJam', label: 'Berlaku (jam)', type: 'number', min: 1, max: 168, value: 48 }
    ],
    extra: '<div class="total"><div><div class="small muted">Total penawaran ke pelanggan</div><div class="tiny muted" id="qCom"></div></div><div class="big" id="qTot">Rp 0</div></div>',
    onReady: f => {
      const upd = () => {
        const t = (+f.jasa.value || 0) + (+f.material.value || 0);
        $('#qTot').textContent = rp(t);
        $('#qCom').textContent = 'Komisi platform ' + persen + '%: ' + rp(t * persen / 100) + ' (dipotong dari saldo deposit Anda saat pekerjaan dikonfirmasi)';
      };
      f.jasa.addEventListener('input', upd);
      f.material.addEventListener('input', upd);
      upd();
    },
    onSubmit: async v => {
      await api('quote.send', { orderId: d.id, jasa: v.jasa, material: v.material, catatan: v.catatan, berlakuJam: v.berlakuJam });
      toast('Penawaran terkirim ke pelanggan.', 'ok');
      refresh();
    }
  });
};
ACT.setStatus = async d => {
  if (d.st === 'Dijadwalkan') {
    return formModal({
      title: 'Jadwalkan Pekerjaan',
      fields: [
        { name: 'tgl', label: 'Tanggal', type: 'date', req: true, min: new Date().toISOString().slice(0, 10) },
        { name: 'jam', label: 'Jam', type: 'time', value: '09:00', req: true },
        { name: 'catatan', label: 'Catatan (opsional)', max: 200 }
      ],
      onSubmit: async v => {
        await api('order.setStatus', { orderId: d.id, status: 'Dijadwalkan', jadwal: v.tgl + ' ' + v.jam, catatan: v.catatan });
        toast('Pekerjaan dijadwalkan.', 'ok');
        refresh();
      }
    });
  }
  const txt = {
    'Dalam Pengerjaan': 'Tandai bahwa pekerjaan mulai dikerjakan?',
    'Selesai': 'Tandai pekerjaan selesai? Pelanggan akan diminta mengonfirmasi.',
    'Mencari Mitra': 'Konfirmasi pesanan ini dan mulai mencari mitra?'
  }[d.st] || 'Ubah status?';
  const ok = await ask({ title: 'Ubah status: ' + d.st, text: txt, ok: 'Ya, Lanjutkan' });
  if (!ok) return;
  try { await api('order.setStatus', { orderId: d.id, status: d.st }); toast('Status diperbarui.', 'ok'); refresh(); }
  catch (e) { toastErr(e); }
};

reg('mitraMasuk', 'Pesanan Masuk', [R.MIT], async (p, v) => {
  const d = await api('dash.mitra');
  v.innerHTML = '<h1 class="title-lg mb-3">Pesanan Masuk</h1>' +
    (d.masuk.length ? '<div class="two-col even">' + d.masuk.map(o => '<div>' + mitraOrderCard(o, true) + '</div>').join('') + '</div>' :
      card(empty('bi-inbox', 'Belum ada pesanan yang perlu direspons.')));
}, 'mitraMasuk');
reg('mitraKerja', 'Pekerjaan Berjalan', [R.MIT], async (p, v) => {
  const d = await api('dash.mitra');
  v.innerHTML = '<h1 class="title-lg mb-3">Pekerjaan Berjalan</h1>' +
    (d.berjalan.length ? '<div class="two-col even">' + d.berjalan.map(o => '<div>' + mitraOrderCard(o, false) + '</div>').join('') + '</div>' :
      card(empty('bi-tools', 'Tidak ada pekerjaan berjalan.')));
}, 'mitraKerja');
reg('mitraRiwayat', 'Riwayat & Ulasan', [R.MIT], async (p, v) => {
  const [orders, revs] = await Promise.all([api('order.list', { grup: 'riwayat' }), api('review.list')]);
  v.innerHTML = '<h1 class="title-lg mb-3">Riwayat Pekerjaan & Ulasan</h1><div class="two-col even"><div>' +
    secH('bi-clock-history', 'Riwayat Pekerjaan') + (orders.length ? card(orders.map(orderRow).join('')) : card(empty('bi-inbox', 'Belum ada riwayat.'))) +
    '</div><div>' + secH('bi-star', 'Ulasan Pelanggan') +
    (revs.length ? revs.map(r => card(stars(r.rating) + '<div class="mt-1"><b style="color:var(--tx)">' + E(r.judul) + '</b></div>' +
      (r.ulasan ? '<p class="mb-1 mt-1">' + E(r.ulasan) + '</p>' : '') + '<div class="small muted">' + E(r.pelanggan) + ' · ' + tgl(r.createdAt, false) + '</div>')).join('') :
      card(empty('bi-star', 'Belum ada ulasan.'))) + '</div></div>';
}, 'mitraRiwayat');

/** Saldo & komisi: saldo deposit, komisi per transaksi, dan status pembayaran komisi. */
reg('mitraUang', 'Saldo & Komisi', [R.MIT], async (p, v) => {
  const d = await api('dash.mitra', { all: 1 }), k = d.kpi;
  const statusKom = t => t.statusKomisi === 'Dipotong Saldo' ? bdg('Dipotong dari saldo', 'ok')
    : t.statusKomisi === 'Lunas Disetor' ? bdg('Lunas disetor', 'ok')
    : t.statusKomisi === 'Menunggu Setoran' ? bdg('Belum disetor', 'warn') : bdg('-', '');
  v.innerHTML = '<h1 class="title-lg mb-3">Saldo & Komisi</h1>' + setorBanner(d.setor) +
    '<div class="kpis">' + kpi('Saldo Deposit', rpShort(d.setor.saldo), 'Minimum ' + rpShort(d.setor.saldoMin), 'bi-piggy-bank', 'gold') +
    kpi('Pendapatan Bulan Ini', rpShort(k.pendapatanBulan), k.pesananBulan + ' pekerjaan', 'bi-wallet2') +
    kpi('Komisi Belum Disetor', rpShort(k.komisiTertunda), d.setor.jumlah + ' dari batas ' + d.setor.batasTrx + ' transaksi', 'bi-hourglass-split') +
    kpi('Total Pekerjaan Tuntas', k.totalSelesai, 'Sepanjang waktu', 'bi-check2-all') + '</div>' +
    '<div class="row-flex between mb-2"><b style="color:var(--tx)">Riwayat Transaksi</b><button class="btn-gh btn-sm" data-act="mitraCsv"><i class="bi bi-filetype-csv"></i> Ekspor CSV</button></div>' +
    table([
      { h: 'Pesanan', f: t => '<a href="javascript:void(0)" data-go="pesananDetail" data-id="' + t.orderId + '">' + E(t.kode) + '</a><div class="small muted ellipsis" style="max-width:220px">' + E(t.judul) + '</div>' },
      { h: 'Tanggal', f: t => tgl(t.createdAt, false) },
      { h: 'Metode', f: t => E(t.metode) },
      { h: 'Nilai', num: 1, f: t => rp(t.nilai) },
      { h: 'Komisi', num: 1, f: t => rp(t.komisi) },
      { h: 'Status Komisi', f: t => statusKom(t) }
    ], d.riwayat, { empty: 'Belum ada transaksi.' });
  S.mitraRows = d.riwayat;
}, 'mitraUang');
ACT.mitraCsv = () => downloadCsv('transaksi-mitra.csv',
  [['Kode', 'Pekerjaan', 'Tanggal', 'Metode', 'Nilai', 'Komisi', 'Status Komisi']]
    .concat((S.mitraRows || []).map(t => [t.kode, t.judul, t.createdAt, t.metode, t.nilai, t.komisi, t.statusKomisi])));

/** Profil & keahlian mitra: kategori, sub layanan (checkbox), dan keahlian baru yang menunggu persetujuan. */
reg('mitraProfil', 'Profil & Keahlian', [R.MIT], async (p, v) => {
  const d = await api('partner.get'), pr = d.profil;
  S.pFoto = null;
  S.pCats = d.categories; S.pLayanan = d.layanan;
  S.pKat = d.kategoriId.slice(); S.pSvc = d.pilihanLayanan.slice(); S.pUsul = d.usulanSaya.slice();
  v.innerHTML = '<h1 class="title-lg mb-3">Profil & Keahlian</h1>' +
    (pr.catatanAdmin && pr.statusVerifikasi !== 'Terverifikasi' ? note('bi-chat-square-text', '<b>Catatan admin:</b> ' + E(pr.catatanAdmin), 'err mb-3') + '<div class="mb-3"></div>' : '') +
    '<div class="two-col" style="align-items:start"><form id="mp" novalidate>' +
    card('<div class="row-flex between mb-3"><b style="color:var(--tx)">Data Keahlian</b>' + vStat(pr.statusVerifikasi) + '</div>' +
      '<div class="row-flex gap-3 mb-3">' + avatar(S.user.nama, pr.fotoThumb, 'lg') +
      '<label class="btn-gh btn-sm" style="cursor:pointer"><i class="bi bi-camera"></i> Ganti foto profil<input type="file" id="pfoto" accept="image/jpeg,image/png,image/webp" hidden></label></div>' +
      fieldHtml({ name: 'keahlian', label: 'Keahlian utama', req: true, value: pr.keahlian, max: 150, ph: 'Contoh: Tukang Kayu & Konstruksi Ringan' }) +
      fieldHtml({ name: 'tarifMulai', label: 'Tarif mulai (Rp)', type: 'number', min: 0, step: 1000, value: pr.tarifMulai || '' }) +
      fieldHtml({ name: 'bio', label: 'Tentang Anda', type: 'textarea', max: 600, value: pr.bio, ph: 'Pengalaman, spesialisasi, peralatan' }) +
      '<div class="fld"><label>Kategori keahlian <span style="color:var(--err)">*</span></label><div class="chips" id="pKatBox" style="flex-wrap:wrap"></div></div>' +
      '<div id="pSkill"></div>' +
      '<button class="btn-g btn-block" type="submit">Simpan Profil</button>') +
    '</form><div>' +
    card('<div class="row-flex between mb-2"><b style="color:var(--tx)">Dokumen Verifikasi</b><button class="btn-g btn-sm" data-act="docUp"><i class="bi bi-upload"></i> Unggah</button></div>' +
      '<div class="small muted mb-2">KTP wajib. SKCK dan portofolio kerja membantu verifikasi. Dokumen bersifat privat (hanya admin wilayah).</div>' +
      (d.dokumen.length ? d.dokumen.map(x => '<div class="list-row"><span class="ic"><i class="bi ' + (x.mime === 'application/pdf' ? 'bi-file-earmark-pdf' : 'bi-image') + '"></i></span>' +
        '<div class="grow"><b style="color:var(--tx)">' + E(x.jenis) + '</b><div class="small muted ellipsis">' + E(x.namaFile) + '</div></div>' +
        bdg(x.status, x.status === 'Valid' ? 'ok' : x.status === 'Menunggu' ? 'warn' : 'err') +
        '<button class="btn-gh btn-sm" data-act="doc" data-id="' + x.id + '" data-nama="' + E(x.jenis) + '" aria-label="Lihat"><i class="bi bi-eye"></i></button>' +
        (pr.statusVerifikasi !== 'Terverifikasi' ? '<button class="btn-dg btn-sm" data-act="docDel" data-id="' + x.id + '" aria-label="Hapus"><i class="bi bi-trash"></i></button>' : '') + '</div>').join('') :
        empty('bi-file-earmark', 'Belum ada dokumen diunggah.'))) +
    card('<b style="color:var(--tx)">Identitas Mitra</b>' + kv('Kode mitra', E(pr.kodeMitra)) + kv('Nama', E(S.user.nama)) +
      kv('Rating', pr.ratingAvg ? pr.ratingAvg.toFixed(1) + ' (' + pr.jumlahUlasan + ' ulasan)' : '-') +
      '<button class="btn-gh btn-block btn-sm mt-2" data-go="profil">Ubah nama, telepon, atau email</button>') +
    '</div></div>';
  drawSkills();
  $('#pfoto').addEventListener('change', async e => {
    try { S.pFoto = await prepImage(e.target.files[0], { max: 640, thumb: 160, maxBytes: 600000 }); toast('Foto siap disimpan.', 'ok'); }
    catch (x) { toastErr(x); }
  });
  bindForm($('#mp'), async val => {
    const usulan = S.pUsul.filter(x => !x.id).map(x => ({ categoryId: x.categoryId, nama: x.nama }));
    await api('partner.save', {
      keahlian: val.keahlian, bio: val.bio, tarifMulai: val.tarifMulai,
      categoryIds: S.pKat, serviceIds: S.pSvc, usulan: usulan, foto: S.pFoto
    });
    toast('Profil disimpan.' + (usulan.length ? ' Keahlian baru menunggu persetujuan admin kecamatan.' : ''), 'ok');
    refresh();
  });
}, 'mitraProfil');

/** Gambar ulang kategori dan sub layanan sesuai pilihan saat ini. */
function drawSkills() {
  $('#pKatBox').innerHTML = S.pCats.map(c => '<button type="button" class="chip ' + (S.pKat.indexOf(c.id) >= 0 ? 'on' : '') +
    '" data-act="pKat" data-id="' + c.id + '"><i class="bi ' + E(c.ikon) + '"></i> ' + E(c.nama) + '</button>').join('');
  $('#pSkill').innerHTML = S.pKat.map(cid => {
    const cat = S.pCats.filter(c => c.id === cid)[0];
    const subs = S.pLayanan.filter(s => s.categoryId === cid);
    const usul = S.pUsul.filter(x => x.categoryId === cid);
    return card('<div class="row-flex between mb-2"><b style="color:var(--tx)">' + E(cat.nama) + '</b><span class="small muted">Pilih keahlian</span></div>' +
      (subs.length ? subs.map(s => '<label class="chk" style="padding:6px 0"><input type="checkbox" data-act="pSvc" data-id="' + s.id + '" ' +
        (S.pSvc.indexOf(s.id) >= 0 ? 'checked' : '') + '><span><b style="color:var(--tx)">' + E(s.nama) + '</b>' +
        (s.tarifMin ? '<br><span class="small muted">mulai ' + rp(s.tarifMin) + '/' + E(s.satuan) + '</span>' : '') + '</span></label>').join('') :
        '<div class="small muted">Belum ada sub layanan di kategori ini.</div>') +
      '<hr class="hr"><div class="small muted mb-1">Keahlian tidak ada di daftar? Tulis sendiri:</div>' +
      '<div class="row-flex gap-2"><input class="inp" id="us_' + cid + '" maxlength="100" placeholder="Contoh: Pasang Water Heater">' +
      '<button type="button" class="btn-gh btn-sm" data-act="pUsulAdd" data-id="' + cid + '">+ Tambah</button></div>' +
      (usul.length ? '<div class="row-flex gap-2 wrap mt-2">' + usul.map(x => x.id
        ? bdg(x.nama + (x.status === 'Ditolak' ? ' (ditolak)' : ' (menunggu persetujuan)'), x.status === 'Ditolak' ? 'err' : 'warn')
        : bdg(x.nama + ' (baru, akan dikirim)', 'gold')).join('') + '</div>' : ''));
  }).join('');
}
ACT.pKat = d => {
  const i = S.pKat.indexOf(d.id);
  if (i >= 0) {
    S.pKat.splice(i, 1);
    S.pSvc = S.pSvc.filter(sid => { const s = S.pLayanan.filter(x => x.id === sid)[0]; return s && s.categoryId !== d.id; });
    S.pUsul = S.pUsul.filter(x => x.categoryId !== d.id);
  } else S.pKat.push(d.id);
  drawSkills();
};
ACT.pSvc = (d, el) => {
  if (el.checked) { if (S.pSvc.indexOf(d.id) < 0) S.pSvc.push(d.id); }
  else S.pSvc = S.pSvc.filter(x => x !== d.id);
};
ACT.pUsulAdd = d => {
  const nama = ($('#us_' + d.id).value || '').trim();
  if (nama.length < 3) return toast('Tulis nama keahlian minimal 3 karakter.', 'err');
  if (S.pUsul.some(x => x.categoryId === d.id && x.nama.toLowerCase() === nama.toLowerCase())) return toast('Keahlian ini sudah ditambahkan.', 'err');
  S.pUsul.push({ categoryId: d.id, nama: nama });
  drawSkills();
};
ACT.docUp = () => formModal({
  title: 'Unggah Dokumen Verifikasi', submit: 'Unggah',
  fields: [{ name: 'jenis', label: 'Jenis dokumen', type: 'select', req: true, options: [
    { v: 'KTP', t: 'KTP' }, { v: 'SKCK', t: 'SKCK / Surat Keterangan Desa' }, { v: 'Portofolio', t: 'Foto Portofolio Kerja' }, { v: 'Lainnya', t: 'Lainnya' }
  ] }],
  extra: '<div class="fld"><label for="docF">Berkas (JPG, PNG, WebP, atau PDF, maks. 2 MB)</label><input class="inp" type="file" id="docF" accept="image/jpeg,image/png,image/webp,application/pdf" required></div>',
  onSubmit: async v => {
    const f = $('#docF').files[0];
    if (!f) throw new Error('Pilih berkas terlebih dahulu.');
    let file;
    if (f.type === 'application/pdf') {
      if (f.size > 2 * 1048576) throw new Error('PDF maksimal 2 MB.');
      file = { name: f.name, mime: f.type, data: await readB64(f) };
    } else {
      const im = await prepImage(f, { max: 1600, maxBytes: 1.8 * 1048576 });
      file = { name: im.name, mime: im.mime, data: im.data };
    }
    await api('partner.uploadDoc', { jenis: v.jenis, file: file });
    toast('Dokumen terunggah.', 'ok');
    refresh();
  }
});
ACT.docDel = async d => {
  if (!(await ask({ title: 'Hapus dokumen?', text: 'Dokumen akan dihapus dari sistem.', ok: 'Hapus', danger: true }))) return;
  try { await api('partner.deleteDoc', { id: d.id }); toast('Dokumen dihapus.', 'ok'); refresh(); }
  catch (e) { toastErr(e); }
};

/** Wilayah layanan: desa yang sudah disetujui, dan status pengajuan wilayah baru. */
reg('mitraWilayah', 'Wilayah Layanan', [R.MIT], async (p, v) => {
  const d = await api('partner.get');
  const mine = d.wilayah.map(w => w.id);
  const cats = d.categories.filter(c => d.kategoriId.indexOf(c.id) >= 0);
  S.pAreas = d.areas.filter(a => mine.indexOf(a.id) < 0);
  v.innerHTML = '<h1 class="title-lg mb-3">Wilayah Layanan</h1><div class="two-col" style="align-items:start"><div>' +
    card('<div class="row-flex between mb-2"><b style="color:var(--tx)"><i class="bi bi-tools" style="color:var(--gold-text)"></i> Kategori Keahlian</b>' +
      '<a href="javascript:void(0)" data-go="mitraProfil" class="small">Ubah</a></div><div class="row-flex gap-2 wrap">' +
      (cats.length ? cats.map(c => '<span class="bdg gold">' + E(c.nama) + '</span>').join('') : '<span class="small muted">Belum dipilih.</span>') + '</div>') +
    card('<div class="row-flex between mb-2"><b style="color:var(--tx)"><i class="bi bi-geo-alt" style="color:var(--gold-text)"></i> Wilayah Jangkauan</b>' +
      '<button class="btn-g btn-sm" data-act="areaReq"><i class="bi bi-plus"></i> Ajukan Wilayah</button></div>' +
      '<div class="small muted mb-2">Anda hanya menerima order dari desa yang sudah disetujui admin wilayah.</div>' +
      '<div class="row-flex gap-2 wrap">' + (d.wilayah.length ? d.wilayah.map(w => '<span class="bdg ok">' + E(w.nama) + '</span>').join('') : '<span class="small muted">Belum ada wilayah disetujui.</span>') + '</div>') +
    '</div><div>' +
    card('<b style="color:var(--tx)">Status Pengajuan Wilayah</b><div class="small muted mb-2">Alur: Anda ajukan, admin kecamatan memverifikasi, lalu admin kabupaten atau Super Admin memutuskan.</div>' +
      (d.pengajuan.length ? d.pengajuan.map(r => '<div class="list-row" style="cursor:default"><span class="ic"><i class="bi bi-geo"></i></span><div class="grow">' +
        '<b style="color:var(--tx)">' + E(r.areaId ? areaNameOf(d, r.areaId) : r.areaNama) + '</b>' + (r.areaId ? '' : ' <span class="bdg">Wilayah baru</span>') +
        '<div class="small muted">' + E(r.alasan) + '</div>' + (r.catatanOperator ? '<div class="tiny muted">Admin kecamatan: ' + E(r.catatanOperator) + '</div>' : '') +
        (r.catatanSuper ? '<div class="tiny muted">Admin kabupaten/Super Admin: ' + E(r.catatanSuper) + '</div>' : '') + '</div>' +
        bdg(r.status, r.status === 'Disetujui' ? 'ok' : (r.status === 'Menunggu Verifikasi' || r.status === 'Diteruskan') ? 'warn' : 'err') + '</div>').join('') :
        empty('bi-geo', 'Belum ada pengajuan wilayah.'))) +
    '</div></div>';
}, 'mitraWilayah');
/** Nama desa dari daftar desa aktif atau wilayah yang sudah disetujui. */
function areaNameOf(d, id) {
  const a = (d.areas || []).concat(d.wilayah || []).filter(x => x.id === id)[0];
  return a ? a.nama : id;
}
ACT.areaReq = () => formModal({
  title: 'Ajukan Wilayah Layanan', submit: 'Kirim Pengajuan',
  intro: 'Pilih desa yang sudah terdaftar, atau sebutkan wilayah baru. Admin kecamatan Anda akan memverifikasi, lalu admin kabupaten atau Super Admin memutuskan.',
  fields: [
    { name: 'areaId', label: 'Desa terdaftar', type: 'select', blank: '— Wilayah lain (ketik di bawah) —', options: (S.pAreas || []).map(a => ({ v: a.id, t: a.nama })) },
    { name: 'areaNama', label: 'Atau nama wilayah baru', max: 80, ph: 'Contoh: Desa Parungkamal' },
    { name: 'alasan', label: 'Alasan pengajuan', type: 'textarea', req: true, max: 300, ph: 'Contoh: Banyak permintaan warga yang belum terlayani' }
  ],
  onSubmit: async v => {
    if (!v.areaId && !v.areaNama) throw new Error('Pilih desa atau tulis nama wilayah baru.');
    await api('areaReq.create', v);
    toast('Pengajuan terkirim. Menunggu verifikasi admin kecamatan.', 'ok');
    refresh();
  }
});

// [Lanjut ke Bagian 4: admin, pengaturan, logo, PWA, dan inisialisasi]
// ============================================================
// BAGIAN 4 — Admin, pengaturan, logo, PWA, dan inisialisasi
// ============================================================

// ── Admin: utilitas bersama ──────────────────────────────
const ADM_R = [R.KEC, R.KAB, R.SUP];
const SUP_R = [R.SUP];
const HARI_LBL = HARI;
const LEVEL_LBL = { kabupaten: 'Kabupaten', kecamatan: 'Kecamatan', desa: 'Desa' };
const insightsHtml = ins => '<ul class="ins">' + ins.map(i => '<li>' + E(i) + '</li>').join('') + '</ul>';
const admOrderRow = o => '<div class="list-row" data-go="pesananDetail" data-id="' + o.id + '"><span class="ic"><i class="bi bi-receipt"></i></span>' +
  '<div class="grow"><div class="row-flex between gap-2"><b class="ellipsis" style="color:var(--tx)">' + E(o.judul) + '</b>' + stBdg(o.status) + '</div>' +
  '<div class="small muted">' + E(o.kode) + ' · ' + E(o.kategori) + ' · ' + E(o.area) + '</div>' +
  '<div class="tiny muted">' + E(o.pelanggan) + (o.mitra ? ' → ' + E(o.mitra) + (o.assignStatus === 'Menunggu' ? ' (menunggu respons)' : '') : '') + ' · ' + ago(o.createdAt) + '</div></div>' +
  '<i class="bi bi-chevron-right muted"></i></div>';

// ── Dashboard admin ──────────────────────────────────────
reg('admDash', 'Dashboard Utama', ADM_R, async (p, v) => {
  const d = await api('dash.admin');
  const r = d.rep, h = r.hitung, f = r.finance;
  setBadges({
    cocok: d.antrean.length,
    verif: h.mitraMenunggu,
    wilayah: h.pengajuanWilayah,
    aduan: h.pengaduanBuka,
    persetujuan: d.persetujuan.deposit + d.persetujuan.keahlian
  });
  const slaN = d.antrean.filter(a => a.lewatSla).length;
  const lingkup = S.user.role === R.SUP ? 'Seluruh wilayah'
    : S.user.role === R.KAB ? 'Seluruh kecamatan di kabupaten Anda' : 'Kecamatan Anda';
  v.innerHTML = '<div class="bb-card hero"><div class="row-flex between wrap gap-3"><div>' +
    '<span class="bdg gold">' + E(lingkup) + '</span>' +
    '<h1 class="title-xl mt-2" style="font-size:26px">Dashboard Operasional</h1>' +
    '<div class="muted">Pusat pengawasan pesanan, mitra, saldo, dan komisi.</div></div>' +
    '<div class="row-flex gap-2 wrap"><button class="btn-gh" data-act="rekapPdf"><i class="bi bi-download"></i> Ekspor Laporan</button>' +
    '<button class="btn-g" data-go="admPencocokan"><i class="bi bi-plus-circle"></i> Pencocokan Cepat</button></div></div></div>' +
    '<div class="kpis">' +
    kpi('Total Pesanan', h.pesanan, h.selesai + ' selesai · ' + h.batal + ' batal', 'bi-receipt') +
    kpi('Pencocokan Cepat', d.antrean.length, slaN ? '<span style="color:var(--err)">' + slaN + ' melewati SLA ' + d.sla + ' mnt</span>' : 'SLA ' + d.sla + ' menit terpenuhi', 'bi-exclamation-lg', 'gold') +
    kpi('Mitra Siaga & Terverifikasi', h.mitraSiaga + ' / ' + h.mitraTerverifikasi, h.mitraMenunggu + ' menunggu verifikasi', 'bi-people') +
    (f ? kpi('Nilai Transaksi & Komisi', rpShort(f.gmv), 'Komisi ' + rpShort(f.komisi) + ' · belum disetor ' + rpShort(f.komisiTertunda), 'bi-cash-stack', 'gold')
      : kpi('Pengaduan Terbuka', h.pengaduanBuka, h.pengajuanWilayah + ' pengajuan wilayah', 'bi-chat-square-text')) +
    '</div>' +
    '<div class="two-col" style="align-items:start"><div>' +
    card('<div class="row-flex between mb-2"><b style="color:var(--tx);font-size:16px"><i class="bi bi-diagram-3" style="color:var(--gold-text)"></i> Antrean Pencocokan</b>' +
      '<a href="javascript:void(0)" data-go="admPencocokan" class="small">Semua</a></div>' +
      (d.antrean.length ? d.antrean.map(o => '<div class="list-row" data-go="admPencocokanDetail" data-id="' + o.id + '"><span class="ic"><i class="bi bi-wrench"></i></span>' +
        '<div class="grow"><div class="row-flex between gap-2"><b class="ellipsis" style="color:var(--tx)">' + E(o.judul) + '</b>' +
        (o.lewatSla ? bdg(o.menit + ' mnt · lewat SLA', 'err') : bdg(o.menit + ' mnt', 'warn')) + '</div>' +
        '<div class="small muted">#' + E(o.kode) + ' · ' + E(o.kategori) + ' · ' + E(o.pelanggan) + ' · ' + E(o.area) + '</div></div>' +
        '<span class="btn-g btn-sm">Cocokkan</span></div>').join('') : empty('bi-check2-circle', 'Tidak ada pesanan yang menunggu pencocokan.'))) +
    card('<b style="color:var(--tx);font-size:16px"><i class="bi bi-bar-chart" style="color:var(--gold-text)"></i> Distribusi Pesanan per Desa</b>' +
      '<div class="canvas-box mt-2"><canvas id="chArea" role="img" aria-label="Grafik distribusi pesanan per desa"></canvas></div>') +
    (f ? card('<b style="color:var(--tx);font-size:16px"><i class="bi bi-graph-up" style="color:var(--gold-text)"></i> Tren Transaksi & Komisi (6 bulan)</b>' +
      '<div class="canvas-box mt-2"><canvas id="chTren" role="img" aria-label="Grafik tren transaksi dan komisi"></canvas></div>') : '') +
    '</div><div>' +
    card('<div class="row-flex between mb-2"><b style="color:var(--tx);font-size:16px"><i class="bi bi-shield-check" style="color:var(--gold-text)"></i> Verifikasi Mitra Baru</b>' +
      '<a href="javascript:void(0)" data-go="admVerifikasi" class="small">Semua</a></div>' +
      (d.verifikasi.length ? d.verifikasi.map(m => '<div class="list-row" data-go="admVerifikasi" data-id="' + m.userId + '">' + avatar(m.nama, m.foto, 'sm') +
        '<div class="grow"><b style="color:var(--tx)">' + E(m.nama) + '</b><div class="small muted ellipsis">' + E(m.keahlian || 'Keahlian belum diisi') + ' · ' + m.dokumen + ' dokumen</div></div>' +
        '<span class="btn-gh btn-sm">Tinjau</span></div>').join('') : empty('bi-patch-check', 'Tidak ada antrean verifikasi.'))) +
    card('<b style="color:var(--tx);font-size:16px"><i class="bi bi-lightbulb" style="color:var(--gold-text)"></i> Wawasan Operasional</b>' + insightsHtml(r.insights)) +
    (d.sistem ? card('<b style="color:var(--tx);font-size:16px"><i class="bi bi-hdd-stack" style="color:var(--gold-text)"></i> Status Sistem</b>' +
      kv('Sheet terhubung', d.sistem.sheet) + kv('Kuota email harian', d.sistem.kuotaEmail + ' tersisa') + kv('Antrean email', d.sistem.antreanEmail)) : '') +
    (d.audit ? card('<div class="row-flex between mb-2"><b style="color:var(--tx);font-size:16px"><i class="bi bi-journal-text" style="color:var(--gold-text)"></i> Audit Log Terbaru</b>' +
      '<a href="javascript:void(0)" data-go="admAudit" class="small">Buka</a></div>' +
      d.audit.map(a => '<div class="small mb-2"><span class="muted">' + tgl(a.createdAt) + '</span> · <b style="color:var(--tx)">' + E(a.nama) + '</b> ' +
        E(a.aksi.replace(/_/g, ' ')) + (a.detail ? ' — ' + E(a.detail) : '') + '</div>').join('')) : '') +
    '</div></div>';
  const c = chartColors();
  mkChart('chArea', {
    type: 'bar',
    data: { labels: r.byArea.map(a => a.nama.replace('Desa ', '')), datasets: [{ label: 'Pesanan', data: r.byArea.map(a => a.n), backgroundColor: c.gold, borderRadius: 6 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
  });
  if (f) mkChart('chTren', {
    type: 'bar',
    data: { labels: f.bulan, datasets: [
      { type: 'bar', label: 'Nilai transaksi (Rp)', data: f.seriGmv, backgroundColor: c.gold, borderRadius: 6, yAxisID: 'y' },
      { type: 'line', label: 'Komisi (Rp)', data: f.seriKomisi, borderColor: c.ok, backgroundColor: c.ok, tension: .3, yAxisID: 'y1' }
    ] },
    options: { scales: {
      y: { beginAtZero: true, ticks: { callback: x => rpShort(x) } },
      y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { callback: x => rpShort(x) } }
    } }
  });
}, 'admDash');
ACT.rekapPdf = () => showPdf('pdf.rekap', S.rekapFilter || {}, 'Rekap Laporan');

// ── Pencocokan pesanan ───────────────────────────────────
reg('admPencocokan', 'Pencocokan Pesanan', ADM_R, async (p, v) => {
  const tab = p.tab || 'butuh';
  const all = await api('order.list', { grup: 'aktif' });
  const grp = {
    butuh: all.filter(o => (o.status === 'Menunggu Konfirmasi' || o.status === 'Mencari Mitra') && !o.mitraId),
    respons: all.filter(o => o.assignStatus === 'Menunggu'),
    tawar: all.filter(o => ['Menunggu Penawaran', 'Menunggu Persetujuan'].indexOf(o.status) >= 0),
    semua: all
  };
  v.innerHTML = '<h1 class="title-lg mb-1">Antrean Pencocokan & Dispatching</h1>' +
    '<div class="muted mb-3">Hubungkan pemesan dengan mitra terverifikasi di wilayah Anda.</div>' +
    tabs([
      { v: 'butuh', t: 'Butuh Pencocokan', n: grp.butuh.length },
      { v: 'respons', t: 'Menunggu Respons Mitra', n: grp.respons.length },
      { v: 'tawar', t: 'Proses Penawaran', n: grp.tawar.length },
      { v: 'semua', t: 'Semua Aktif', n: all.length }
    ], tab, 'tabCocok') +
    (grp[tab].length ? card(grp[tab].map(o => '<div class="list-row" data-go="' + (tab === 'butuh' || tab === 'respons' ? 'admPencocokanDetail' : 'pesananDetail') + '" data-id="' + o.id + '">' +
      '<span class="ic"><i class="bi bi-receipt"></i></span><div class="grow"><div class="row-flex between gap-2"><b class="ellipsis" style="color:var(--tx)">' + E(o.judul) + '</b>' + stBdg(o.status) + '</div>' +
      '<div class="small muted">#' + E(o.kode) + ' · ' + E(o.kategori) + ' · ' + E(o.pelanggan) + ' · ' + E(o.area) + '</div>' +
      '<div class="tiny muted">' + ago(o.createdAt) + (o.mitra ? ' · Mitra: ' + E(o.mitra) : '') + '</div></div>' +
      '<span class="btn-g btn-sm">' + (o.mitraId ? 'Tinjau' : 'Cocokkan') + '</span></div>').join('')) :
      card(empty('bi-check2-circle', 'Tidak ada pesanan pada antrean ini.')));
}, 'admPencocokan');
ACT.tabCocok = d => go('admPencocokan', { tab: d.v }, { soft: true });

reg('admPencocokanDetail', 'Pencocokan & Dispatching Mitra', ADM_R, async (p, v) => {
  const [o, cands] = await Promise.all([api('order.get', { id: p.id }), api('order.candidates', { orderId: p.id })]);
  S.cand = { o: o, list: cands, onlyAvail: true, onlyCat: false };
  drawCandidates(v);
  setChrome({ title: 'Pencocokan Pesanan', nav: 'admPencocokan' });
}, 'admPencocokan');

function drawCandidates(v) {
  v = v || $('#view');
  const o = S.cand.o, pi = o.pelangganInfo;
  const list = S.cand.list.filter(c => (!S.cand.onlyAvail || c.tersedia) && (!S.cand.onlyCat || c.kategoriCocok));
  v.innerHTML = '<button class="btn-gh btn-sm mb-3" data-act="back"><i class="bi bi-arrow-left"></i> Antrean</button>' +
    '<div class="row-flex between wrap gap-2 mb-3"><div><h1 class="title-lg">Pencocokan & Dispatching Mitra</h1>' + stBdg(o.status) +
    ' <span class="small muted">Dibuat ' + ago(o.createdAt) + '</span></div><button class="btn-gh" data-go="pesananDetail" data-id="' + o.id + '">Detail pesanan</button></div>' +
    '<div class="two-col even" style="align-items:start"><div>' +
    card('<div class="eyebrow mb-2">Pemohon jasa (pelanggan)</div><div class="row-flex gap-3">' + avatar(pi.nama) + '<div class="grow"><b style="color:var(--tx);font-size:16px">' + E(pi.nama) +
      '</b><div class="small muted">+' + E(pi.telepon) + '</div></div>' +
      waBtn(pi.telepon, 'Halo ' + pi.nama + ', admin BANTU AJA terkait pesanan ' + o.kode + '.', 'WA', 'btn-wa btn-sm') + '</div><hr class="hr">' +
      '<div class="small"><i class="bi bi-geo-alt" style="color:var(--gold-text)"></i> ' + E(o.area + (o.rtrw ? ', RT/RW ' + o.rtrw : '') + (o.dusun ? ', ' + o.dusun : '')) +
      '<div class="muted">Patokan: ' + E(o.alamat) + '</div></div>') +
    card('<div class="row-flex between mb-2"><div class="eyebrow">Kebutuhan layanan</div><span class="bdg gold">' + E(o.kategori) + '</span></div>' +
      '<b style="color:var(--tx);font-size:17px">' + E(o.judul) + '</b><div class="note mt-2"><i class="bi bi-chat-quote"></i><div><i>“' + E(o.deskripsi) + '”</i></div></div>' +
      '<div class="small mt-2"><i class="bi bi-clock" style="color:var(--gold-text)"></i> Target pengerjaan: <b style="color:var(--tx)">' + E(jadwalLbl(o)) + '</b></div>' +
      (o.foto.length ? '<div class="thumbs mt-3">' + o.foto.map(f => '<img class="thumb" alt="Bukti kerusakan" ' + (f.thumb ? 'src="' + E(f.thumb) + '"' : '') +
        ' tabindex="0" role="button" data-act="photo" data-id="' + f.id + '">').join('') + '</div>' : '')) +
    (o.mitraInfo ? card('<div class="eyebrow mb-2">Penugasan saat ini</div><b style="color:var(--tx)">' + E(o.mitraInfo.nama) + '</b> ' +
      bdg(o.assignStatus || '-', o.assignStatus === 'Diterima' ? 'ok' : 'warn') + '<div class="small muted">Memasangkan mitra lain akan menggantikan penugasan ini.</div>', 'hi') : '') +
    '</div><div>' +
    card('<div class="row-flex between mb-3"><b style="color:var(--tx);font-size:16px"><i class="bi bi-sliders" style="color:var(--gold-text)"></i> Filter Pencocokan</b></div>' +
      '<label class="chk" style="padding:4px 0"><input type="checkbox" data-act="fAvail" ' + (S.cand.onlyAvail ? 'checked' : '') + '><span>Hanya mitra siaga</span></label>' +
      '<label class="chk" style="padding:4px 0"><input type="checkbox" data-act="fCat" ' + (S.cand.onlyCat ? 'checked' : '') + '><span>Hanya keahlian sesuai kategori</span></label>') +
    '<div class="sec-h" style="margin-top:6px"><i class="bi bi-trophy"></i><h2>Kandidat Mitra (' + list.length + ')</h2><span class="more muted">Urut: skor kecocokan</span></div>' +
    (list.length ? list.map((c, i) => '<div class="bb-card ' + (i === 0 && !c.diblokir ? 'hi' : '') + '">' +
      (i === 0 && !c.diblokir ? '<span class="bdg gold mb-2">Skor tertinggi ' + c.skor + '%</span>' : '') +
      '<div class="row-flex gap-3">' + avatar(c.nama, c.foto) + '<div class="grow"><div class="row-flex between gap-2"><b style="color:var(--tx);font-size:16px">' + E(c.nama) + '</b>' +
      (i ? '<span class="bdg">Skor ' + c.skor + '%</span>' : '') + '</div><div class="small muted">' + E(c.keahlian) + '</div>' +
      '<div class="small mt-1">' + (c.rating ? '<span class="stars">★</span> ' + c.rating.toFixed(1) + ' (' + c.ulasan + ')' : 'Belum ada rating') + ' · ' + c.aktif + ' pesanan aktif</div></div></div>' +
      '<div class="row-flex gap-2 wrap mt-2">' + c.alasan.map(a => '<span class="bdg ' + (a === 'Siaga sekarang' ? 'ok' : '') + '">' + E(a) + '</span>').join('') +
      (c.diblokir ? '<span class="bdg err"><i class="bi bi-slash-circle"></i> ' + (c.alasanBlokir === 'saldo' ? 'Saldo di bawah minimum' : 'Komisi belum disetor') + ' — diblokir</span>' +
        '<span class="bdg">Saldo ' + rpShort(c.saldo) + '</span>' : '<span class="bdg">Saldo ' + rpShort(c.saldo) + '</span>') + '</div>' +
      '<div class="small muted mt-1">Wilayah: ' + E(c.wilayah.join(', ') || '-') + '</div>' +
      '<div class="row-flex gap-2 mt-3">' + (c.diblokir
        ? '<button class="btn-gh grow" disabled><i class="bi bi-slash-circle"></i> Diblokir sementara</button>'
        : '<button class="btn-g grow" data-act="assign" data-id="' + o.id + '" data-p="' + c.userId + '"><i class="bi bi-check2-square"></i> Pilih & Pasangkan</button>') +
      waBtn(c.telepon, '', '', 'btn-wa btn-sm') + '</div></div>').join('') :
      card(empty('bi-person-x', 'Tidak ada kandidat sesuai filter. Longgarkan filter, atau minta mitra baru bergabung.')));
}
ACT.fAvail = (d, el) => { S.cand.onlyAvail = el.checked; drawCandidates(); };
ACT.fCat = (d, el) => { S.cand.onlyCat = el.checked; drawCandidates(); };
ACT.assign = async d => {
  const c = S.cand.list.filter(x => x.userId === d.p)[0], o = S.cand.o;
  const ok = await ask({
    title: 'Pasangkan mitra?',
    text: 'Pesanan <b>' + E(o.kode) + '</b> akan ditugaskan ke <b>' + E(c.nama) + '</b>. Mitra menerima notifikasi dan harus menerima atau menolak.',
    ok: 'Ya, Pasangkan'
  });
  if (!ok) return;
  try {
    await api('order.assign', { orderId: o.id, partnerId: d.p });
    const msg = 'Halo ' + c.nama + ', ada penugasan baru dari BANTU AJA:\nNo. Pesanan: #' + o.kode + '\nLayanan: ' + o.judul +
      '\nLokasi: ' + o.area + (o.rtrw ? ', RT/RW ' + o.rtrw : '') + '\nJadwal: ' + jadwalLbl(o) + '\nBuka rincian & ajukan penawaran: ' + (o.appUrl || '');
    openModal({
      title: 'Mitra dipasangkan ✔',
      body: '<p>Notifikasi dalam aplikasi sudah dikirim. Kirim juga pesan WhatsApp agar mitra cepat merespons:</p>' +
        '<pre style="white-space:pre-wrap;background:var(--l2);border:1px solid var(--line);border-radius:12px;padding:12px;font-size:12px;color:var(--tx2)">' + E(msg) + '</pre>',
      foot: '<button class="btn-gh" data-bs-dismiss="modal">Selesai</button>' + waBtn(c.telepon, msg, 'Kirim via WhatsApp', 'btn-wa')
    });
    $('#mdl').addEventListener('hidden.bs.modal', () => go('pesananDetail', { id: o.id }, { reset: true }), { once: true });
  } catch (e) { toastErr(e); }
};

// ── Semua pesanan ────────────────────────────────────────
reg('admPesanan', 'Semua Pesanan', ADM_R, async (p, v) => {
  const h = await loadHome();
  const q = { q: p.q || '', status: p.status || '', areaId: p.areaId || '', from: p.from || '', to: p.to || '' };
  const list = await api('order.list', Object.assign({ limit: 300 }, q));
  const sts = ['Menunggu Konfirmasi', 'Mencari Mitra', 'Menunggu Penawaran', 'Menunggu Persetujuan', 'Disetujui', 'Dijadwalkan',
    'Dalam Pengerjaan', 'Selesai', 'Dikonfirmasi', 'Dibatalkan', 'Dalam Pengaduan'];
  v.innerHTML = '<h1 class="title-lg mb-3">Semua Pesanan</h1>' +
    '<form id="of" class="toolbar"><input class="inp" name="q" placeholder="Cari kode, judul, nama..." value="' + E(q.q) + '">' +
    '<select class="inp" name="status"><option value="">Semua status</option>' + sts.map(s => '<option' + (q.status === s ? ' selected' : '') + '>' + s + '</option>').join('') + '</select>' +
    '<select class="inp" name="areaId"><option value="">Semua desa</option>' + h.areas.map(a => '<option value="' + a.id + '"' + (q.areaId === a.id ? ' selected' : '') + '>' + E(a.nama) + '</option>').join('') + '</select>' +
    '<input class="inp" type="date" name="from" value="' + q.from + '" aria-label="Dari tanggal">' +
    '<input class="inp" type="date" name="to" value="' + q.to + '" aria-label="Sampai tanggal">' +
    '<button class="btn-g" type="submit">Terapkan</button></form>' +
    '<div class="small muted mb-2">' + list.length + ' pesanan</div>' +
    table([
      { h: 'Pesanan', f: o => '<a href="javascript:void(0)" data-go="pesananDetail" data-id="' + o.id + '"><b>' + E(o.kode) + '</b></a><div class="small muted ellipsis" style="max-width:240px">' + E(o.judul) + '</div>' },
      { h: 'Pelanggan', f: o => E(o.pelanggan) },
      { h: 'Desa', f: o => E(o.area) },
      { h: 'Mitra', f: o => E(o.mitra || '-') },
      { h: 'Status', f: o => stBdg(o.status) },
      { h: 'Nilai', num: 1, f: o => o.nilai ? rp(o.nilai) : '-' },
      { h: 'Dibuat', f: o => tgl(o.createdAt, false) }
    ], list, { empty: 'Tidak ada pesanan yang cocok.' });
  bindForm($('#of'), val => go('admPesanan', val, { soft: false }));
}, 'admPesanan');

// ── Deposit & keahlian baru (persetujuan admin wilayah) ──
reg('admAntrean', 'Deposit & Keahlian Baru', ADM_R, async (p, v) => {
  const [dep, us] = await Promise.all([api('deposit.list'), api('usulan.list')]);
  const pend = dep.filter(d => d.status === 'Menunggu');
  setBadges({ persetujuan: pend.length + us.length });
  v.innerHTML = '<h1 class="title-lg mb-1">Persetujuan Deposit & Keahlian Baru</h1>' +
    '<div class="muted mb-3">Konfirmasi transfer deposit mitra dan usulan keahlian dari wilayah Anda.</div>' +
    secH('bi-wallet2', 'Deposit Menunggu Konfirmasi') +
    (pend.length ? pend.map(d => card('<div class="row-flex between wrap gap-2"><div><b style="color:var(--tx)">' + E(d.mitra) + '</b> <span class="tiny muted">' + E(d.kodeMitra) +
      '</span><div class="small muted">' + tgl(d.createdAt) + '</div></div><span class="price">' + rp(d.nilai) + '</span></div>' +
      '<div class="row-flex gap-2 mt-3"><button class="btn-g btn-sm grow" data-act="depOk" data-id="' + d.id + '" data-n="' + E(rp(d.nilai)) + '"><i class="bi bi-check2"></i> Konfirmasi Masuk</button>' +
      '<button class="btn-gh btn-sm" data-act="depNo" data-id="' + d.id + '">Tolak</button></div>')).join('') :
      card(empty('bi-inbox', 'Tidak ada deposit menunggu.'))) +
    secH('bi-lightbulb', 'Usulan Keahlian Baru') +
    (us.length ? us.map(x => card('<b style="color:var(--tx)">' + E(x.nama) + '</b><div class="small muted">' + E(x.kategori) + ' · diusulkan ' + E(x.mitra) + '</div>' +
      '<div class="row-flex gap-2 mt-3"><button class="btn-g btn-sm grow" data-act="usulOk" data-id="' + x.id + '"><i class="bi bi-check2"></i> Setujui Keahlian</button>' +
      '<button class="btn-gh btn-sm" data-act="usulNo" data-id="' + x.id + '">Tolak</button></div>')).join('') :
      card(empty('bi-check2-circle', 'Tidak ada usulan keahlian.')));
}, 'admAntrean');
ACT.depOk = async d => {
  if (!(await ask({ title: 'Konfirmasi deposit masuk?', text: 'Pastikan ' + d.n + ' sudah diterima di rekening Anda. Saldo mitra akan bertambah.', ok: 'Ya, Konfirmasi' }))) return;
  try { await api('deposit.konfirmasi', { id: d.id, keputusan: 'Dikonfirmasi' }); toast('Deposit dikonfirmasi. Saldo bertambah.', 'ok'); refresh(); }
  catch (e) { toastErr(e); }
};
ACT.depNo = async d => {
  const r = await ask({ title: 'Tolak deposit?', text: 'Mitra akan diberi tahu alasannya.', ok: 'Tolak', danger: true, reason: { label: 'Alasan penolakan', required: true } });
  if (!r) return;
  try { await api('deposit.konfirmasi', { id: d.id, keputusan: 'Ditolak', catatan: r }); toast('Deposit ditolak.', 'ok'); refresh(); }
  catch (e) { toastErr(e); }
};
ACT.usulOk = async d => {
  try { await api('usulan.setuju', { id: d.id }); toast('Keahlian disetujui dan masuk katalog.', 'ok'); refresh(); }
  catch (e) { toastErr(e); }
};
ACT.usulNo = async d => {
  if (!(await ask({ title: 'Tolak usulan keahlian?', text: 'Mitra akan diberi tahu bahwa keahlian ini tidak disetujui.', ok: 'Tolak', danger: true }))) return;
  try { await api('usulan.tolak', { id: d.id }); toast('Usulan ditolak.', 'ok'); refresh(); }
  catch (e) { toastErr(e); }
};

// ── Verifikasi mitra ─────────────────────────────────────
reg('admVerifikasi', 'Verifikasi Mitra & Dokumen', ADM_R, async (p, v) => {
  const st = p.status || 'Menunggu';
  const qd = await api('partner.queue', { status: st });
  const sel = p.id || (qd.list[0] && qd.list[0].userId);
  const det = sel ? await api('partner.detail', { userId: sel }) : null;
  S.vdet = det;
  const c = qd.counts;
  v.innerHTML = '<h1 class="title-lg mb-1">Verifikasi Mitra & Dokumen</h1>' +
    '<div class="muted mb-3">Periksa identitas, keahlian, dan dokumen calon mitra di wilayah Anda sebelum memberi lencana terverifikasi.</div>' +
    '<div class="kpis">' + kpi('Menunggu Verifikasi', c['Menunggu'] || 0, 'Calon mitra', 'bi-hourglass-split', 'gold') +
    kpi('Terverifikasi', c['Terverifikasi'] || 0, 'Siap layani', 'bi-patch-check') +
    kpi('Perlu Perbaikan', c['Perlu Revisi'] || 0, 'Berkas pending', 'bi-file-earmark-x') +
    kpi('Ditolak', c['Ditolak'] || 0, 'Pengajuan', 'bi-person-x') + '</div>' +
    tabs([{ v: 'Menunggu', t: 'Menunggu' }, { v: 'Perlu Revisi', t: 'Perlu Revisi' }, { v: 'Terverifikasi', t: 'Terverifikasi' }, { v: 'Ditolak', t: 'Ditolak' }], st, 'tabVerif') +
    '<div class="two-col even" style="align-items:start"><div>' +
    card((qd.list.length ? qd.list.map(m => '<div class="list-row" data-go="admVerifikasi" data-id="' + m.userId + '" data-status="' + E(st) + '" style="' +
      (m.userId === sel ? 'background:var(--gold-bg);border-radius:12px;padding-left:8px' : '') + '">' + avatar(m.nama, m.foto, 'sm') +
      '<div class="grow"><b style="color:var(--tx)">' + E(m.nama) + '</b><div class="small muted ellipsis">' + E(m.keahlian || 'Belum mengisi keahlian') + '</div>' +
      '<div class="tiny muted">' + E(m.kodeMitra) + ' · ' + m.dokumen + ' dokumen · daftar ' + ago(m.createdAt) + '</div></div>' + vStat(m.statusVerifikasi) + '</div>').join('') :
      empty('bi-inbox', 'Tidak ada mitra pada kategori ini.'))) +
    '</div><div>' + (det ? verifDetail(det) : card(empty('bi-person-badge', 'Pilih mitra untuk ditinjau.'))) + '</div></div>';
}, 'admVerifikasi');
ACT.tabVerif = d => go('admVerifikasi', { status: d.v }, { soft: false });

function verifDetail(d) {
  const pr = d.profil, m = d.user, chk = d.checklist || {};
  const items = [
    ['identitas', 'Identitas KTP asli warga', 'NIK terdaftar sah dan sesuai domisili'],
    ['pengalaman', 'Pengalaman kerja teruji', 'Portofolio terkonfirmasi sesuai standar mutu'],
    ['sop', 'Persetujuan SOP & deposit komisi', 'Calon mitra menyetujui ketentuan saldo dan komisi platform'],
    ['uji', 'Panggilan uji / tatap muka', 'Nomor WhatsApp aktif dan kesiapan merespons']
  ];
  return card('<div class="row-flex gap-3">' + avatar(m.nama, pr.fotoThumb, 'lg') + '<div class="grow"><h2 style="font-size:19px">' + E(m.nama) +
    '</h2><div>' + vStat(pr.statusVerifikasi) + ' <span class="bdg gold">' + E(pr.kodeMitra) + '</span></div><div class="small muted mt-1">' + E(pr.keahlian || '-') + '</div></div>' +
    waBtn(m.telepon, 'Halo ' + m.nama + ', admin BANTU AJA terkait verifikasi akun mitra Anda.', 'Uji WA', 'btn-wa btn-sm') + '</div><hr class="hr">' +
    kv('Telepon', '+' + E(m.telepon)) + kv('Email', E(m.email || '-')) + kv('Terdaftar', tgl(m.createdAt)) +
    kv('Kategori', E(d.kategori.map(k => k.nama).join(', ') || '-')) + kv('Wilayah', E(d.wilayah.map(w => w.nama).join(', ') || 'Belum ditetapkan')) +
    (pr.bio ? '<div class="small muted mt-2">' + E(pr.bio) + '</div>' : '')) +
    card('<b style="color:var(--tx)"><i class="bi bi-folder2-open" style="color:var(--gold-text)"></i> Dokumen (' + d.dokumen.length + ')</b>' +
      (d.dokumen.length ? d.dokumen.map(x => '<div class="list-row"><span class="ic"><i class="bi ' + (x.mime === 'application/pdf' ? 'bi-file-earmark-pdf' : 'bi-image') + '"></i></span>' +
        '<div class="grow"><b style="color:var(--tx)">' + E(x.jenis) + '</b><div class="small muted ellipsis">' + E(x.namaFile) + '</div></div>' +
        bdg(x.status, x.status === 'Valid' ? 'ok' : x.status === 'Menunggu' ? 'warn' : 'err') +
        '<button class="btn-gh btn-sm" data-act="doc" data-id="' + x.id + '" data-nama="' + E(x.jenis + ' — ' + m.nama) + '"><i class="bi bi-eye"></i> Lihat</button></div>').join('') :
        '<div class="small muted mt-2">Belum ada dokumen diunggah.</div>')) +
    '<form id="vf" novalidate>' + card('<b style="color:var(--tx)"><i class="bi bi-list-check" style="color:var(--gold-text)"></i> Checklist Kelayakan</b>' +
      items.map(i => '<label class="chk"><input type="checkbox" name="' + i[0] + '" ' + (chk[i[0]] ? 'checked' : '') + '><span><b style="color:var(--tx)">' + i[1] +
        '</b><br><span class="small muted">' + i[2] + '</span></span></label>').join('') +
      (pr.statusVerifikasi !== 'Terverifikasi' ? '<div class="fld mt-2"><label>Wilayah awal mitra</label><div class="chips" style="flex-wrap:wrap">' +
        d.areas.map(a => '<label class="chip ' + (d.wilayah.some(w => w.id === a.id) ? 'on' : '') + '"><input type="checkbox" name="area" value="' + a.id + '" ' +
          (d.wilayah.some(w => w.id === a.id) ? 'checked' : '') + ' hidden>' + E(a.nama.replace('Desa ', '')) + '</label>').join('') +
        '</div><div class="help">Mitra hanya menerima order dari desa yang ditetapkan di sini.</div></div>' : '') +
      '<div class="fld mt-2"><label for="vcat">Catatan untuk mitra</label><textarea class="inp" id="vcat" name="catatan" rows="3" maxlength="500">' + E(pr.catatanAdmin) + '</textarea></div>' +
      '<div class="row-flex gap-2 wrap"><button class="btn-g grow" type="button" data-act="verif" data-k="Terverifikasi"><i class="bi bi-patch-check"></i> Setujui & Beri Lencana</button>' +
      '<button class="btn-gh" type="button" data-act="verif" data-k="Perlu Revisi"><i class="bi bi-file-earmark-diff"></i> Minta Revisi</button>' +
      '<button class="btn-dg" type="button" data-act="verif" data-k="Ditolak">Tolak</button></div>') + '</form>';
}
document.addEventListener('change', e => {
  const i = e.target.closest('.chip > input[type=checkbox]');
  if (i) i.parentElement.classList.toggle('on', i.checked);
});
ACT.verif = async d => {
  const f = $('#vf'), det = S.vdet;
  if (!f || !det) return;
  const chk = {};
  ['identitas', 'pengalaman', 'sop', 'uji'].forEach(k => { chk[k] = f.elements[k].checked; });
  const areaIds = $$('input[name=area]:checked', f).map(i => i.value);
  if (d.k !== 'Terverifikasi') {
    const ok = await ask({ title: d.k === 'Ditolak' ? 'Tolak mitra?' : 'Minta revisi dokumen?', text: 'Catatan akan dikirim ke mitra.', ok: 'Ya', danger: d.k === 'Ditolak' });
    if (!ok) return;
  }
  try {
    await api('partner.verify', { userId: det.user.id, keputusan: d.k, checklist: chk, catatan: f.elements.catatan.value, areaIds: areaIds });
    toast('Keputusan verifikasi tersimpan: ' + d.k, 'ok');
    go('admVerifikasi', { status: d.k === 'Terverifikasi' ? 'Terverifikasi' : d.k }, { soft: false });
  } catch (e) { toastErr(e); }
};

// ── Pelanggan & mitra (pengguna) ─────────────────────────
reg('admPengguna', 'Pelanggan & Mitra', ADM_R, async (p, v) => {
  const role = p.role || 'pelanggan', q = p.q || '';
  const list = await api('user.list', { role: role, q: q });
  v.innerHTML = '<h1 class="title-lg mb-3">Pelanggan & Mitra</h1>' +
    tabs([{ v: 'pelanggan', t: 'Pelanggan' }, { v: 'mitra', t: 'Mitra' }], role, 'tabUser') +
    '<form id="uf" class="toolbar"><input class="inp" name="q" value="' + E(q) + '" placeholder="Cari nama, email, telepon"><button class="btn-g" type="submit">Cari</button></form>' +
    table([
      { h: 'Nama', f: u => '<b style="color:var(--tx)">' + E(u.nama) + '</b>' + (u.kodeMitra ? '<div class="tiny muted">' + E(u.kodeMitra) + '</div>' : '') },
      { h: 'Kontak', f: u => '+' + E(u.telepon) + '<div class="tiny muted">' + E(u.email || '-') + '</div>' },
      { h: 'Status', f: u => bdg(u.status, u.status === 'aktif' ? 'ok' : 'err') + (u.verifikasi ? ' ' + vStat(u.verifikasi) : '') },
      { h: 'Pesanan', num: 1, f: u => u.pesanan },
      { h: 'Terdaftar', f: u => tgl(u.createdAt, false) },
      { h: 'Aksi', f: u => '<div class="row-flex gap-2 wrap">' +
          '<button class="btn-' + (u.status === 'aktif' ? 'dg' : 'ok') + ' btn-sm" data-act="userSt" data-id="' + u.id + '" data-s="' +
          (u.status === 'aktif' ? 'ditangguhkan' : 'aktif') + '" data-n="' + E(u.nama) + '">' +
          (u.status === 'aktif' ? 'Tangguhkan' : 'Aktifkan') + '</button>' +
          '<button class="btn-gh btn-sm" data-act="resetSandi" data-id="' + u.id + '" data-n="' + E(u.nama) + '">Reset sandi</button>' +
          '</div>' }
    ], list, { empty: 'Tidak ada pengguna.' });
  bindForm($('#uf'), val => go('admPengguna', { role: role, q: val.q }, { soft: false }));
}, 'admPengguna');
ACT.tabUser = d => go('admPengguna', { role: d.v }, { soft: false });
ACT.userSt = async d => {
  const susp = d.s === 'ditangguhkan';
  const r = await ask({
    title: (susp ? 'Tangguhkan' : 'Aktifkan') + ' akun?',
    text: '<b>' + E(d.n) + '</b> ' + (susp ? 'tidak akan dapat masuk sampai diaktifkan kembali.' : 'akan dapat masuk kembali.'),
    ok: 'Ya', danger: susp, reason: susp ? { label: 'Alasan (dicatat di audit log)', required: true } : null
  });
  if (!r) return;
  try { await api('user.setStatus', { id: d.id, status: d.s, catatan: r === true ? '' : r }); toast('Status akun diperbarui.', 'ok'); refresh(); }
  catch (e) { toastErr(e); }
};
ACT.resetSandi = async d => {
  const ok = await ask({
    title: 'Atur ulang kata sandi?',
    text: 'Kata sandi lama <b>' + E(d.n) + '</b> tidak berlaku lagi. Kata sandi sementara akan ditampilkan sekali.',
    ok: 'Atur Ulang',
    danger: true
  });
  if (!ok) return;
  try {
    const r = await api('user.resetSandi', { id: d.id });
    openModal({
      title: 'Kata sandi sementara',
      body: '<p>Berikan kepada <b>' + E(d.n) + '</b>. Minta mereka segera menggantinya lewat menu Profil.</p>' +
        '<div class="total"><div class="small muted">Kata sandi sementara</div>' +
        '<div class="big" style="font-size:20px;user-select:all">' + E(r.passwordSementara) + '</div></div>',
      foot: '<button class="btn-g" data-bs-dismiss="modal">Selesai</button>'
    });
  } catch (e) { toastErr(e); }
};

// ── Katalog layanan (Super Admin mengubah; lainnya melihat) ─
reg('admLayanan', 'Katalog Layanan', ADM_R, async (p, v) => {
  const d = await api('cat.list');
  S.cat = d;
  const sel = p.id || (d.categories[0] && d.categories[0].id);
  const c = d.categories.filter(x => x.id === sel)[0];
  const sv = d.services.filter(s => s.categoryId === sel);
  const sup = isSup();
  v.innerHTML = '<div class="row-flex between wrap gap-2 mb-3"><div><h1 class="title-lg">Katalog Layanan & Kategori</h1>' +
    '<div class="muted">' + (sup ? 'Kelola kategori induk dan sub layanan.' : 'Mode lihat. Hanya Super Admin yang dapat mengubah katalog.') + '</div></div>' +
    (sup ? '<div class="row-flex gap-2"><button class="btn-gh" data-act="svcEdit" data-cat="' + (sel || '') + '"><i class="bi bi-plus"></i> Tambah Sub-Layanan</button>' +
      '<button class="btn-g" data-act="catEdit"><i class="bi bi-plus-circle"></i> Tambah Kategori</button></div>' : '') + '</div>' +
    '<div class="two-col even" style="align-items:start"><div>' +
    card('<b style="color:var(--tx)">Kategori Induk</b>' + d.categories.map(x => '<div class="list-row" data-go="admLayanan" data-id="' + x.id + '" style="' +
      (x.id === sel ? 'background:var(--gold-bg);border-radius:12px;padding-left:8px' : '') + '"><span class="ic"><i class="bi ' + E(x.ikon) + '"></i></span>' +
      '<div class="grow"><b style="color:var(--tx)">' + E(x.nama) + '</b><div class="tiny muted">' + E(x.kode) + ' · ' + x.layanan + ' sub-layanan · ' + x.mitra + ' mitra · ' + x.pesanan + ' pesanan</div></div>' +
      bdg(x.status, x.status === 'aktif' ? 'ok' : 'err') + '</div>').join('')) +
    '</div><div>' +
    (c ? card('<div class="row-flex between"><div><span class="bdg gold">' + E(c.kode) + '</span><h2 class="mt-1" style="font-size:19px">' + E(c.nama) + '</h2></div>' +
      (sup ? '<button class="btn-gh btn-sm" data-act="catEdit" data-id="' + c.id + '"><i class="bi bi-pencil"></i> Ubah</button>' : '') + '</div>' +
      '<p class="muted mt-2 mb-0">' + E(c.deskripsi) + '</p>') : '') +
    secH('bi-list-ul', 'Sub-Layanan (' + sv.length + ')') +
    (sv.length ? sv.map(s => card('<div class="row-flex between gap-2"><span class="logo-mark"><i class="bi ' + E(s.ikon || (c && c.ikon) || 'bi-grid') + '"></i></span><div class="grow"><span class="tiny muted">' + E(s.kode) + '</span>' +
      '<div style="color:var(--tx);font-weight:700">' + E(s.nama) + '</div><div class="small muted">' + E(s.deskripsi) + '</div>' +
      '<div class="small mt-1"><span class="price" style="font-size:13px">' + (s.tarifMin ? rp(s.tarifMin) + (s.tarifMax > s.tarifMin ? ' – ' + rp(s.tarifMax) : '') : 'Sesuai penawaran') +
      '</span> /' + E(s.satuan) + (s.estimasi ? ' · ' + E(s.estimasi) : '') + '</div></div>' +
      (sup ? '<button class="btn-gh btn-sm" data-act="svcEdit" data-id="' + s.id + '" aria-label="Ubah"><i class="bi bi-pencil"></i></button>' : '') +
      bdg(s.status, s.status === 'aktif' ? 'ok' : 'err') + '</div>', 'mb-2')).join('') : card(empty('bi-list-ul', 'Belum ada sub-layanan.'))) +
    '</div></div>';
}, 'admLayanan');
ACT.catEdit = d => {
  const c = d.id ? S.cat.categories.filter(x => x.id === d.id)[0] : {};
  const cur = c.ikon || '';
  formModal({
    title: d.id ? 'Ubah Kategori' : 'Tambah Kategori',
    fields: [
      { name: 'nama', label: 'Nama kategori', req: true, value: c.nama, max: 80 },
      { name: 'deskripsi', label: 'Deskripsi', type: 'textarea', value: c.deskripsi, max: 250 },
      { name: 'urutan', label: 'Urutan tampil', type: 'number', min: 0, value: c.urutan || 99 },
      { name: 'status', label: 'Status', type: 'select', options: [{ v: 'aktif', t: 'Aktif' }, { v: 'nonaktif', t: 'Nonaktif' }], value: c.status || 'aktif' }
    ],
    extra: icoPickHtml(cur, 'bi-grid'),
    onReady: f => bindIcoPick(f, 'bi-grid'),
    onSubmit: async v => {
      await api('cat.save', Object.assign({ id: d.id }, v));
      toast('Kategori disimpan.', 'ok');
      S.home = null; refresh();
    }
  });
};
ACT.svcEdit = d => {
  const s = d.id ? S.cat.services.filter(x => x.id === d.id)[0] : {};
  const curIkon = s.ikon || '';
  const catIkon = (S.cat.categories.filter(c => c.id === (s.categoryId || d.cat))[0] || {}).ikon || 'bi-grid';
  formModal({
    title: d.id ? 'Ubah Sub-Layanan' : 'Tambah Sub-Layanan',
    fields: [
      { name: 'categoryId', label: 'Kategori induk', type: 'select', req: true, options: S.cat.categories.map(c => ({ v: c.id, t: c.nama })), value: s.categoryId || d.cat },
      { name: 'nama', label: 'Nama layanan', req: true, value: s.nama, max: 100 },
      { name: 'deskripsi', label: 'Deskripsi / info untuk form', type: 'textarea', value: s.deskripsi, max: 250 },
      { name: 'tarifMin', label: 'Tarif acuan minimum (Rp)', type: 'number', min: 0, step: 1000, value: s.tarifMin || 0 },
      { name: 'tarifMax', label: 'Tarif acuan maksimum (Rp)', type: 'number', min: 0, step: 1000, value: s.tarifMax || 0 },
      { name: 'satuan', label: 'Satuan', value: s.satuan || 'sesi' },
      { name: 'estimasi', label: 'Estimasi waktu', value: s.estimasi },
      { name: 'status', label: 'Status', type: 'select', options: [{ v: 'aktif', t: 'Aktif' }, { v: 'nonaktif', t: 'Nonaktif' }], value: s.status || 'aktif' }
    ],
    extra: icoPickHtml(curIkon, catIkon),
    onReady: f => bindIcoPick(f, catIkon),
    onSubmit: async v => { await api('svc.save', Object.assign({ id: d.id }, v)); toast('Sub-layanan disimpan.', 'ok'); S.home = null; refresh(); }
  });
};

// ── Wilayah & pengajuan mitra ────────────────────────────
const reqStep = r => {
  const s = r.status;
  if (s === 'Menunggu Verifikasi') return [1, 'now', 'wait'];
  if (s === 'Diteruskan') return [1, 1, 'now'];
  if (s === 'Disetujui') return [1, 1, 1];
  if (s === 'Ditolak Operator') return [1, 'x', 'wait'];
  return [1, 1, 'x'];
};
reg('admWilayah', 'Wilayah & Pengajuan Mitra', ADM_R, async (p, v) => {
  const d = await api('area.list');
  S.areas = d.areas;
  const sup = isSup(), kab = S.user.role === R.KAB || sup;
  const kabList = d.areas.filter(a => a.level === 'kabupaten');
  const kids = id => d.areas.filter(a => a.parentId === id);
  const desa = d.areas.filter(a => a.level === 'desa');
  const open = d.pengajuan.filter(r => r.status === 'Menunggu Verifikasi' || r.status === 'Diteruskan');
  const node = (a, lv) => '<div class="tree-row" style="padding-left:' + (12 + lv * 22) + 'px"><i class="bi ' +
    (a.level === 'desa' ? 'bi-geo-alt' : a.level === 'kecamatan' ? 'bi-buildings' : 'bi-bank') + '" style="color:var(--gold-text)"></i>' +
    '<div class="grow"><b style="color:var(--tx)">' + E(a.nama) + '</b>' + (a.aktif ? '' : ' <span class="bdg">Nonaktif</span>') +
    '<div class="tiny muted">' + LEVEL_LBL[a.level] + ' · ' + a.mitra + ' mitra</div></div>' +
    (sup ? '<label class="switch" aria-label="Aktif atau nonaktif ' + E(a.nama) + '"><input type="checkbox" data-act="areaTog" data-id="' + a.id + '" ' +
      (a.status === 'aktif' ? 'checked' : '') + '><span></span></label><button class="btn-gh btn-sm" data-act="areaEdit" data-id="' + a.id + '" aria-label="Ubah"><i class="bi bi-pencil"></i></button>' : '') +
    '</div>' + kids(a.id).map(k => node(k, lv + 1)).join('');
  v.innerHTML = '<div class="row-flex between wrap gap-2 mb-3"><div><h1 class="title-lg">Wilayah & Pengajuan Mitra</h1>' +
    '<div class="muted">Hierarki Kabupaten › Kecamatan › Desa, serta persetujuan wilayah layanan mitra.</div></div>' +
    (sup ? '<button class="btn-g" data-act="areaEdit"><i class="bi bi-geo-alt"></i> Tambah Wilayah</button>' : '') + '</div>' +
    note('bi-shield-lock', '<b>Hak akses:</b> Super Admin mengelola seluruh wilayah. Admin Kabupaten memutuskan pengajuan dari kecamatannya. Admin Kecamatan memverifikasi pengajuan mitra di kecamatannya. Menonaktifkan wilayah menyembunyikannya dari formulir pesanan, tetapi data lama tetap tersimpan.', 'mb-3') +
    '<div class="kpis mt-3">' + kpi('Desa Terdaftar', desa.length, 'Desa / kelurahan', 'bi-diagram-3') +
    kpi('Desa Aktif', desa.filter(a => a.aktif).length + ' / ' + desa.length, 'Tampil di formulir pesanan', 'bi-check2-circle', 'gold') +
    kpi('Pengajuan Mitra', open.length, 'Menunggu proses', 'bi-bell') +
    kpi('Mitra Tercakup', kabList.reduce((s, a) => s + a.mitra, 0), 'Seluruh wilayah', 'bi-people') + '</div>' +
    '<div class="two-col" style="align-items:start"><div>' +
    card('<b style="color:var(--tx);font-size:16px">Master Wilayah</b><div class="small muted mb-2">Struktur pohon administratif</div>' + kabList.map(a => node(a, 0)).join('')) +
    '</div><div>' +
    card('<div class="row-flex between mb-2"><b style="color:var(--tx);font-size:16px">Pengajuan Wilayah Mitra</b>' +
      (open.length ? '<span class="bdg warn">' + open.length + ' menunggu</span>' : '') + '</div>' +
      '<div class="small muted mb-2">Alur: Mitra mengajukan, admin kecamatan memverifikasi, lalu admin kabupaten atau Super Admin memutuskan.</div>' +
      (d.pengajuan.length ? d.pengajuan.slice(0, 12).map(r => {
        const s = reqStep(r), lbl = ['Mitra', 'Admin Kecamatan', 'Admin Kabupaten / Super'];
        return '<div class="bb-card flat"><div class="row-flex between"><div><b style="color:var(--tx)">' + E(r.mitra) + '</b> <span class="bdg gold">' + E(r.kodeMitra) +
          '</span><div class="small muted">' + E(r.keahlian) + '</div></div>' + bdg(r.status, r.status === 'Disetujui' ? 'ok' : s.indexOf('x') >= 0 ? 'err' : 'warn') + '</div>' +
          '<div class="row-flex between mt-2"><span class="small muted">Wilayah diajukan</span><b style="color:var(--gold-text)">' + E(r.area) + (r.baru ? ' <span class="bdg">baru</span>' : '') + '</b></div>' +
          '<div class="small mt-1"><span class="muted">Alasan:</span> <i>“' + E(r.alasan) + '”</i></div>' +
          '<div class="row-flex gap-2 mt-2 wrap">' + s.map((x, i) => '<span class="bdg ' + (x === 1 ? 'ok' : x === 'now' ? 'warn' : x === 'x' ? 'err' : '') + '">' + (i + 1) + '. ' + lbl[i] + '</span>').join('') + '</div>' +
          (r.catatanOperator ? '<div class="note mt-2"><i class="bi bi-person-check"></i><div><b>Admin kecamatan:</b> ' + E(r.catatanOperator) + '</div></div>' : '') +
          (r.catatanSuper ? '<div class="note mt-2"><i class="bi bi-shield-check"></i><div><b>Admin kabupaten/Super Admin:</b> ' + E(r.catatanSuper) + '</div></div>' : '') +
          (r.status === 'Menunggu Verifikasi' ? '<div class="row-flex gap-2 mt-3"><button class="btn-g grow btn-sm" data-act="reqVerify" data-id="' + r.id + '" data-y="1"><i class="bi bi-send-check"></i> Verifikasi & Teruskan</button>' +
            '<button class="btn-gh btn-sm" data-act="reqVerify" data-id="' + r.id + '" data-y="0">Tolak</button></div>' : '') +
          (r.status === 'Diteruskan' ? (kab ? '<div class="row-flex gap-2 mt-3"><button class="btn-g grow btn-sm" data-act="reqDecide" data-id="' + r.id + '" data-y="1"><i class="bi bi-check2-circle"></i> Setujui & Aktifkan Wilayah</button>' +
            '<button class="btn-gh btn-sm" data-act="reqDecide" data-id="' + r.id + '" data-y="0">Tolak</button></div>' :
            '<div class="small muted mt-2"><i class="bi bi-hourglass-split"></i> Menunggu keputusan admin kabupaten atau Super Admin.</div>') : '') + '</div>';
      }).join('') : empty('bi-geo', 'Belum ada pengajuan wilayah.'))) +
    '</div></div>';
}, 'admWilayah');
ACT.areaTog = async (d, el) => {
  try {
    await api('area.toggle', { id: d.id, status: el.checked ? 'aktif' : 'nonaktif' });
    toast(el.checked ? 'Wilayah diaktifkan.' : 'Wilayah dinonaktifkan. Data lama tetap tersimpan.', 'ok');
    S.home = null; refresh();
  } catch (e) { el.checked = !el.checked; toastErr(e); }
};
ACT.areaEdit = d => {
  const a = d.id ? S.areas.filter(x => x.id === d.id)[0] : { level: 'desa', status: 'aktif', parentId: 'kec_lumbir' };
  const par = lv => S.areas.filter(x => x.level === (lv === 'kecamatan' ? 'kabupaten' : 'kecamatan')).map(x => ({ v: x.id, t: x.nama }));
  formModal({
    title: d.id ? 'Ubah Wilayah' : 'Tambah Wilayah Layanan',
    intro: 'Hierarki berjenjang Kabupaten › Kecamatan › Desa.',
    fields: [
      { name: 'level', label: 'Tingkat wilayah', type: 'select', req: true, options: [{ v: 'desa', t: 'Desa / Kelurahan' }, { v: 'kecamatan', t: 'Kecamatan' }, { v: 'kabupaten', t: 'Kabupaten' }], value: a.level },
      { name: 'parentId', label: 'Wilayah induk', type: 'select', options: par(a.level), value: a.parentId },
      { name: 'nama', label: 'Nama wilayah', req: true, value: a.nama || '', max: 80, ph: 'Contoh: Desa Parungkamal' },
      { name: 'radiusKm', label: 'Radius dari posko pusat (km)', type: 'number', min: 0, step: 0.1, value: a.radiusKm || 0 },
      { name: 'catatan', label: 'Catatan & aksesibilitas', type: 'textarea', value: a.catatan || '', max: 250 },
      { name: 'status', label: 'Status', type: 'select', options: [{ v: 'aktif', t: 'Aktif langsung' }, { v: 'nonaktif', t: 'Nonaktif (uji)' }], value: a.status }
    ],
    onReady: f => {
      f.level.addEventListener('change', () => {
        const l = f.level.value;
        f.parentId.innerHTML = l === 'kabupaten' ? '<option value="">—</option>' : par(l).map(o => '<option value="' + E(o.v) + '">' + E(o.t) + '</option>').join('');
        f.parentId.disabled = l === 'kabupaten';
      });
    },
    onSubmit: async v => { await api('area.save', Object.assign({ id: d.id }, v)); toast('Wilayah disimpan.', 'ok'); S.home = null; refresh(); }
  });
};
ACT.reqVerify = async d => {
  const yes = d.y === '1';
  const r = await ask({
    title: yes ? 'Verifikasi & teruskan' : 'Tolak pengajuan wilayah',
    text: yes ? 'Pengajuan diteruskan ke admin kabupaten atau Super Admin untuk keputusan akhir.' : 'Mitra akan diberi tahu alasan penolakan.',
    ok: yes ? 'Teruskan' : 'Tolak', danger: !yes,
    reason: { label: 'Catatan verifikasi' + (yes ? ' (mis. jarak wajar, kebutuhan nyata)' : ''), required: !yes }
  });
  if (r === null) return;
  try {
    await api('areaReq.verify', { id: d.id, keputusan: yes ? 'Diteruskan' : 'Ditolak', catatan: r === true ? '' : r });
    toast(yes ? 'Diteruskan ke admin kabupaten atau Super Admin.' : 'Pengajuan ditolak.', 'ok');
    refresh();
  } catch (e) { toastErr(e); }
};
ACT.reqDecide = async d => {
  const yes = d.y === '1';
  if (!yes) {
    const r = await ask({ title: 'Tolak pengajuan wilayah', text: 'Mitra akan diberi tahu.', ok: 'Tolak', danger: true, reason: { label: 'Alasan penolakan', required: true } });
    if (!r) return;
    try { await api('areaReq.decide', { id: d.id, keputusan: 'Ditolak', catatan: r }); toast('Pengajuan ditolak.', 'ok'); refresh(); }
    catch (e) { toastErr(e); }
    return;
  }
  const rq = (await api('area.list')).pengajuan.filter(x => x.id === d.id)[0];
  const kec = S.areas.filter(a => a.level === 'kecamatan').map(a => ({ v: a.id, t: a.nama }));
  formModal({
    title: 'Setujui & Aktifkan Wilayah',
    intro: rq.baru ? 'Wilayah <b>' + E(rq.area) + '</b> belum terdaftar. Akan dibuat sebagai desa baru yang aktif.'
      : 'Wilayah <b>' + E(rq.area) + '</b> akan ditambahkan ke jangkauan mitra.',
    fields: (rq.baru ? [
      { name: 'namaBaru', label: 'Nama wilayah baru', req: true, value: rq.area, max: 80 },
      { name: 'parentId', label: 'Kecamatan induk', type: 'select', req: true, options: kec, value: 'kec_lumbir' },
      { name: 'radiusKm', label: 'Radius dari posko (km)', type: 'number', min: 0, step: 0.1, value: 0 }
    ] : []).concat([{ name: 'catatan', label: 'Catatan keputusan', type: 'textarea', max: 300 }]),
    submit: 'Setujui & Aktifkan',
    onSubmit: async v => {
      await api('areaReq.decide', Object.assign({ id: d.id, keputusan: 'Disetujui' }, v));
      toast('Wilayah disetujui dan diaktifkan.', 'ok');
      S.home = null; refresh();
    }
  });
};

// ── Saldo, komisi & laporan ──────────────────────────────
/** Panel saldo & tagihan per mitra. */
function tertundaPanel(td) {
  const head = '<div class="row-flex between wrap gap-2 mb-2"><div><b style="color:var(--tx);font-size:16px"><i class="bi bi-wallet2" style="color:var(--gold-text)"></i> Saldo & Tagihan Mitra</b>' +
    '<div class="small muted">Saldo minimum ' + rp(td.min) + ' · batas ' + td.batasTrx + ' transaksi belum disetor.</div></div>' +
    (td.items.length ? '<button class="btn-g btn-sm" data-act="remindAll"><i class="bi bi-send"></i> Kirim Tagihan ke Semua</button>' : '') + '</div>' +
    '<div class="small muted mb-3"><i class="bi bi-clock-history"></i> Pengingat otomatis: ' + (td.aktif ? 'setiap <b>' + HARI_LBL[td.hari] + '</b> pukul 08.00' : '<b>nonaktif</b>') +
    ' · terakhir: ' + (td.terakhir ? tgl(td.terakhir, false) : 'belum') + (td.pemicu ? '' : ' · <span style="color:var(--err)">pemicu belum terpasang</span>') + '.</div>';
  const perlu = td.items.filter(x => x.diblokir || x.jumlah > 0 || x.saldo < x.saldoMin);
  if (!perlu.length) return card(head + empty('bi-check2-circle', 'Semua mitra di wilayah Anda aman: saldo dan setoran terkendali.'));
  return card(head + perlu.map(x => '<div class="list-row" style="cursor:default;align-items:flex-start"><span class="ic"><i class="bi ' +
    (x.diblokir ? 'bi-slash-circle' : 'bi-person') + '" style="' + (x.diblokir ? 'color:var(--err)' : '') + '"></i></span><div class="grow">' +
    '<div class="row-flex between wrap gap-2"><b style="color:var(--tx)">' + E(x.nama) + '</b> <span class="tiny muted">' + E(x.kodeMitra) + '</span>' +
    (x.diblokir ? bdg('Diblokir', 'err') : '') + '</div>' +
    '<div class="small muted">Saldo ' + rp(x.saldo) + ' (min. ' + rp(x.saldoMin) + ') · komisi belum disetor ' + x.jumlah + '/' + x.batasTrx +
    (x.total ? ' (' + rp(x.total) + ')' : '') + '</div>' +
    '<div class="row-flex gap-2 wrap mt-2">' + waBtn(x.telepon, x.pesan, 'WA', 'btn-wa btn-sm') +
    '<button class="btn-gh btn-sm" data-act="remind" data-id="' + x.userId + '"><i class="bi bi-bell"></i> Tagih</button>' +
    (x.jumlah ? '<button class="btn-g btn-sm" data-act="setorMitra" data-id="' + x.userId + '" data-n="' + E(x.nama) + '" data-t="' + x.total + '">Catat Setoran</button>' : '') +
    '</div></div></div>').join(''));
}
ACT.remindAll = async () => {
  if (!(await ask({ title: 'Kirim tagihan ke semua?', text: 'Notifikasi dalam aplikasi dan email dikirim ke mitra yang memiliki saldo kurang atau komisi belum disetor.', ok: 'Kirim' }))) return;
  try {
    const r = await api('komisi.pengingat', {});
    toast(r.terkirim ? 'Tagihan terkirim ke ' + r.terkirim + ' mitra.' : 'Tidak ada mitra yang perlu ditagih.', r.terkirim ? 'ok' : '');
  } catch (e) { toastErr(e); }
};
ACT.remind = async d => {
  try { await api('komisi.pengingat', { userId: d.id }); toast('Tagihan terkirim (notifikasi + email).', 'ok'); }
  catch (e) { toastErr(e); }
};
ACT.setorMitra = async d => {
  if (!(await ask({
    title: 'Catat setoran komisi?',
    text: 'Seluruh komisi belum disetor <b>' + E(d.n) + '</b> (' + rp(d.t) + ') ditandai lunas.',
    ok: 'Catat Setoran'
  }))) return;
  try {
    const r = await api('komisi.setorMitra', { userId: d.id });
    toast('Setoran ' + rp(r.total) + ' (' + r.jumlah + ' transaksi) dicatat.', 'ok');
    refresh();
  } catch (e) { toastErr(e); }
};

reg('admKomisi', 'Saldo, Komisi & Laporan', ADM_R, async (p, v) => {
  const h = await loadHome();
  const f = { from: p.from || '', to: p.to || '', areaId: p.areaId || '' };
  S.rekapFilter = f;
  const [rep, kom, td] = await Promise.all([api('laporan.ringkas', f), api('komisi.list', f), api('komisi.tertunda')]);
  const fi = rep.finance, c = rep.hitung;
  S.komRows = kom.rows;
  v.innerHTML = '<div class="row-flex between wrap gap-2 mb-3"><div><h1 class="title-lg">Saldo, Komisi & Laporan</h1>' +
    '<div class="muted">Komisi ' + ((S.home && S.home.settings.komisiPersen) || 5) + '% dicatat dan dipotong dari saldo deposit mitra.</div></div>' +
    '<div class="row-flex gap-2 wrap"><button class="btn-gh" data-act="komCsv"><i class="bi bi-filetype-csv"></i> Ekspor CSV</button>' +
    '<button class="btn-g" data-act="rekapPdf"><i class="bi bi-file-earmark-pdf"></i> Ekspor PDF</button></div></div>' +
    '<form id="kf" class="toolbar"><input class="inp" type="date" name="from" value="' + f.from + '" aria-label="Dari tanggal">' +
    '<input class="inp" type="date" name="to" value="' + f.to + '" aria-label="Sampai tanggal">' +
    '<select class="inp" name="areaId" aria-label="Desa"><option value="">Semua desa</option>' +
    h.areas.map(a => '<option value="' + a.id + '"' + (f.areaId === a.id ? ' selected' : '') + '>' + E(a.nama) + '</option>').join('') + '</select>' +
    '<button class="btn-g" type="submit">Terapkan</button></form>' +
    '<div class="kpis">' + kpi('Total Pesanan', c.pesanan, c.selesai + ' selesai · ' + c.batal + ' batal', 'bi-receipt') +
    (fi ? kpi('Nilai Transaksi', rpShort(fi.gmv), 'Tunai ' + fi.tunai + ' · Transfer ' + fi.transfer, 'bi-cash-stack', 'gold') +
      kpi('Komisi Platform', rpShort(fi.komisi), 'Sudah dibayar ' + rpShort(fi.komisiLunas), 'bi-percent', 'gold') +
      kpi('Komisi Belum Disetor', rpShort(fi.komisiTertunda), 'Menunggu setoran mitra', 'bi-hourglass-split')
      : kpi('Mitra Terverifikasi', c.mitraTerverifikasi, c.mitraSiaga + ' siaga', 'bi-people') + kpi('Pelanggan', c.pelanggan, 'Terdaftar', 'bi-person') +
        kpi('Catatan', 'Terbatas', 'Data finansial lengkap hanya untuk Super Admin', 'bi-lock')) +
    kpi('Tingkat Penyelesaian', (c.pesanan ? Math.round(c.selesai / c.pesanan * 100) : 0) + '%', 'dari pesanan periode ini', 'bi-check2-circle') + '</div>' +
    '<div class="two-col even" style="align-items:start">' +
    (fi ? card('<b style="color:var(--tx)">Tren Transaksi & Komisi</b><div class="canvas-box mt-2"><canvas id="chK" role="img" aria-label="Tren transaksi dan komisi"></canvas></div>')
      : card('<b style="color:var(--tx)">Status Pesanan</b><div class="canvas-box sm mt-2"><canvas id="chS" role="img" aria-label="Distribusi status pesanan"></canvas></div>')) +
    card('<b style="color:var(--tx)">Kontribusi per Desa</b>' + (rep.byArea.length ? rep.byArea.map(a => '<div class="mt-2"><div class="row-flex between small">' +
      '<span>' + E(a.nama) + '</span><b style="color:var(--tx)">' + a.n + ' pesanan' + (fi ? ' · ' + rpShort(a.nilai) : '') + '</b></div>' + barPct(a.n, rep.byArea[0].n) + '</div>').join('') :
      empty('bi-bar-chart', 'Belum ada data.')) + '<hr class="hr"><b style="color:var(--tx)"><i class="bi bi-lightbulb" style="color:var(--gold-text)"></i> Wawasan</b>' + insightsHtml(rep.insights)) +
    '</div>' +
    tertundaPanel(td) +
    secH('bi-journal-text', 'Catatan Transaksi & Komisi') +
    '<div class="small muted mb-2">' + kom.total.jumlah + ' catatan · komisi ' + rp(kom.total.komisi) + ' · belum disetor ' + rp(kom.total.tertunda) + '</div>' +
    table([
      { h: 'Pesanan', f: r => '<a href="javascript:void(0)" data-go="pesananDetail" data-id="' + r.orderId + '"><b>' + E(r.kode) + '</b></a><div class="tiny muted">' + tgl(r.createdAt) + '</div>' },
      { h: 'Pelanggan & Desa', f: r => E(r.pelanggan) + '<div class="tiny muted">' + E(r.area) + '</div>' },
      { h: 'Layanan', f: r => '<span class="ellipsis d-block" style="max-width:180px">' + E(r.judul) + '</span>' },
      { h: 'Mitra', f: r => E(r.mitra) },
      { h: 'Nilai', num: 1, f: r => rp(r.nilai) },
      { h: 'Komisi', num: 1, f: r => rp(r.komisi) },
      { h: 'Status', f: r => r.status === 'Dipotong Saldo' ? bdg('Dipotong dari saldo', 'ok')
        : r.status === 'Lunas Disetor' ? bdg('Lunas disetor', 'ok') : bdg('Belum disetor', 'warn') },
      { h: 'Aksi', f: r => r.status === 'Menunggu Setoran' ? '<button class="btn-g btn-sm" data-act="setor" data-id="' + r.id + '">Catat Setoran</button>' : '' }
    ], kom.rows, { empty: 'Belum ada transaksi pada periode ini.' });
  bindForm($('#kf'), val => go('admKomisi', val, { soft: false }));
  const col = chartColors();
  if (fi) mkChart('chK', {
    type: 'bar',
    data: { labels: fi.bulan, datasets: [
      { type: 'bar', label: 'Transaksi (Rp)', data: fi.seriGmv, backgroundColor: col.gold, borderRadius: 6, yAxisID: 'y' },
      { type: 'line', label: 'Komisi (Rp)', data: fi.seriKomisi, borderColor: col.ok, backgroundColor: col.ok, tension: .3, yAxisID: 'y1' }
    ] },
    options: { scales: {
      y: { beginAtZero: true, ticks: { callback: x => rpShort(x) } },
      y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { callback: x => rpShort(x) } }
    } }
  });
  else mkChart('chS', {
    type: 'doughnut',
    data: { labels: Object.keys(rep.byStatus), datasets: [{ data: Object.values(rep.byStatus),
      backgroundColor: ['#D4AF37', '#E5C158', '#997A15', '#10B981', '#F59E0B', '#EF4444', '#94A3B8', '#58e7aa', '#F3E5AB', '#475569', '#ffb4ab'] }] }
  });
}, 'admKomisi');
ACT.komCsv = () => downloadCsv('komisi-bantu-aja.csv',
  [['Kode', 'Tanggal', 'Pelanggan', 'Desa', 'Layanan', 'Mitra', 'Nilai', 'Komisi %', 'Komisi', 'Metode', 'Status']]
    .concat((S.komRows || []).map(r => [r.kode, r.createdAt, r.pelanggan, r.area, r.judul, r.mitra, r.nilai, r.persen, r.komisi, r.metode, r.status])));
ACT.setor = async d => {
  if (!(await ask({ title: 'Catat setoran komisi?', text: 'Komisi ditandai lunas disetor dan mitra diberi tahu.', ok: 'Catat Setoran' }))) return;
  try { await api('komisi.setor', { id: d.id }); toast('Setoran dicatat.', 'ok'); refresh(); }
  catch (e) { toastErr(e); }
};

// ── Pengaduan & ulasan ───────────────────────────────────
reg('admPengaduan', 'Pengaduan & Ulasan', ADM_R, async (p, v) => {
  const tab = p.tab || 'pengaduan';
  const [cp, rv] = await Promise.all([api('complaint.list'), api('review.list')]);
  v.innerHTML = '<h1 class="title-lg mb-3">Pengaduan & Ulasan</h1>' +
    tabs([{ v: 'pengaduan', t: 'Pengaduan', n: cp.filter(c => c.status === 'Baru' || c.status === 'Diproses').length }, { v: 'ulasan', t: 'Ulasan', n: rv.length }], tab, 'tabAdu') +
    (tab === 'pengaduan'
      ? (cp.length ? cp.map(c => card('<div class="row-flex between wrap gap-2"><div><b style="color:var(--tx)">' + E(c.nomor) + '</b>' +
          '<span class="small muted"> · ' + E(c.pelapor) + ' (' + ROLE_LBL[c.peran] + ')</span></div>' +
          bdg(c.status, c.status === 'Selesai' ? 'ok' : c.status === 'Ditolak' ? 'err' : 'warn') + '</div>' +
          '<div class="mt-1" style="color:var(--tx);font-weight:700">' + E(c.judul) + '</div><p class="mb-1">' + E(c.isi) + '</p>' +
          '<div class="small muted">' + (c.kode ? '<a href="javascript:void(0)" data-go="pesananDetail" data-id="' + c.orderId + '">Pesanan ' + E(c.kode) + '</a> · ' : '') + tgl(c.createdAt) + '</div>' +
          '<div class="tline mt-3">' + c.riwayat.map(r => '<div class="it"><div class="small"><b style="color:var(--tx)">' + E(r.oleh) + '</b> · <span class="muted">' +
          tgl(r.waktu) + '</span></div><div class="small">' + E(r.catatan) + '</div></div>').join('') + '</div>' +
          (c.status === 'Baru' || c.status === 'Diproses' ? '<div class="row-flex gap-2 mt-2 wrap"><button class="btn-g btn-sm" data-act="aduUpd" data-id="' + c.id + '" data-s="Diproses">Tandai Diproses</button>' +
          '<button class="btn-ok btn-sm" data-act="aduUpd" data-id="' + c.id + '" data-s="Selesai">Selesaikan</button>' +
          '<button class="btn-gh btn-sm" data-act="aduUpd" data-id="' + c.id + '" data-s="Ditolak">Tolak</button></div>' : ''))).join('')
        : card(empty('bi-chat-square', 'Belum ada pengaduan.')))
      : (rv.length ? card(rv.map(r => '<div class="list-row" style="cursor:default"><div class="grow">' + stars(r.rating) + ' <span class="small muted">' +
          E(r.pelanggan) + ' → ' + E(r.mitra) + ' · ' + E(r.kode) + '</span>' + (r.ulasan ? '<div>' + E(r.ulasan) + '</div>' : '') + '</div>' +
          bdg(r.status, r.status === 'Tampil' ? 'ok' : 'err') + '<button class="btn-gh btn-sm" data-act="rvSt" data-id="' + r.id + '" data-s="' +
          (r.status === 'Tampil' ? 'Disembunyikan' : 'Tampil') + '">' + (r.status === 'Tampil' ? 'Sembunyikan' : 'Tampilkan') + '</button></div>').join('')) :
        card(empty('bi-star', 'Belum ada ulasan.'))));
}, 'admPengaduan');
ACT.tabAdu = d => go('admPengaduan', { tab: d.v }, { soft: true });
ACT.aduUpd = async d => {
  const r = await ask({ title: 'Perbarui pengaduan: ' + d.s, text: 'Catatan akan tercatat di riwayat dan dikirim ke pelapor.', ok: 'Simpan', reason: { label: 'Catatan penanganan', required: true } });
  if (!r) return;
  try { await api('complaint.update', { id: d.id, status: d.s, catatan: r }); toast('Pengaduan diperbarui.', 'ok'); refresh(); }
  catch (e) { toastErr(e); }
};
ACT.rvSt = async d => {
  try { await api('review.setStatus', { id: d.id, status: d.s }); toast('Status ulasan diubah.', 'ok'); refresh(); }
  catch (e) { toastErr(e); }
};

// ── Super Admin: promosi, akun admin, audit ──────────────
reg('admPromosi', 'Promosi Mitra', SUP_R, async (p, v) => {
  const list = await api('promo.list');
  S.promos = list;
  v.innerHTML = '<div class="row-flex between mb-3"><h1 class="title-lg">Promosi Mitra</h1>' +
    '<button class="btn-g" data-act="promoEdit"><i class="bi bi-plus"></i> Tambah Promosi</button></div>' +
    '<div class="muted mb-3">Mitra dengan promosi aktif tampil lebih dulu di beranda dan pencarian.</div>' +
    table([
      { h: 'Mitra', f: x => '<b style="color:var(--tx)">' + E(x.mitra) + '</b>' },
      { h: 'Judul', f: x => E(x.judul) },
      { h: 'Periode', f: x => E((x.mulai || '-') + ' s.d. ' + (x.selesai || '-')) },
      { h: 'Status', f: x => bdg(x.status, x.status === 'aktif' ? 'ok' : '') },
      { h: '', f: x => '<button class="btn-gh btn-sm" data-act="promoEdit" data-id="' + x.id + '">Ubah</button>' }
    ], list, { empty: 'Belum ada promosi.' });
}, 'admPromosi');
ACT.promoEdit = async d => {
  const ms = await api('user.list', { role: 'mitra' });
  const x = d.id ? S.promos.filter(p => p.id === d.id)[0] : {};
  formModal({
    title: d.id ? 'Ubah Promosi' : 'Tambah Promosi',
    fields: [
      { name: 'userId', label: 'Mitra', type: 'select', req: true, options: ms.map(m => ({ v: m.id, t: m.nama + ' (' + (m.kodeMitra || '') + ')' })), value: x.userId },
      { name: 'judul', label: 'Judul', value: x.judul || 'Mitra Pilihan', max: 100 },
      { name: 'mulai', label: 'Mulai', type: 'date', value: x.mulai },
      { name: 'selesai', label: 'Selesai', type: 'date', value: x.selesai },
      { name: 'status', label: 'Status', type: 'select', options: [{ v: 'aktif', t: 'Aktif' }, { v: 'nonaktif', t: 'Nonaktif' }], value: x.status || 'aktif' }
    ],
    onSubmit: async v => { await api('promo.save', Object.assign({ id: d.id }, v)); toast('Promosi disimpan.', 'ok'); refresh(); }
  });
};

reg('admAkun', 'Akun Admin', SUP_R, async (p, v) => {
  const list = (await api('user.list', {})).filter(u => ADMIN_ROLES.indexOf(u.role) >= 0);
  v.innerHTML = '<div class="row-flex between mb-3"><h1 class="title-lg">Akun Admin</h1><button class="btn-g" data-act="adminNew"><i class="bi bi-person-plus"></i> Tambah Admin</button></div>' +
    table([
      { h: 'Nama', f: u => '<b style="color:var(--tx)">' + E(u.nama) + '</b><div class="tiny muted">' + E(u.email) + '</div>' },
      { h: 'Peran & Wilayah', f: u => bdg(ROLE_LBL[u.role], 'gold') + (u.role === R.SUP ? '' : '<div class="tiny muted mt-1">' + E(u.scopeNama || '-') + '</div>') },
      { h: 'Status', f: u => bdg(u.status, u.status === 'aktif' ? 'ok' : 'err') },
      { h: 'Login terakhir', f: u => tgl(u.lastLogin) },
      { h: 'Aksi', f: u => u.id === S.user.id ? '<span class="small muted">Anda</span>' :
        '<div class="row-flex gap-2 wrap">' +
        '<button class="btn-gh btn-sm" data-act="adminEdit" data-id="' + u.id + '"><i class="bi bi-pencil"></i> Ubah</button>' +
        '<button class="btn-' + (u.status === 'aktif' ? 'dg' : 'ok') + ' btn-sm" data-act="userSt" data-id="' + u.id + '" data-s="' +
        (u.status === 'aktif' ? 'ditangguhkan' : 'aktif') + '" data-n="' + E(u.nama) + '">' + (u.status === 'aktif' ? 'Tangguhkan' : 'Aktifkan') + '</button>' +
        '<button class="btn-dg btn-sm" data-act="adminDel" data-id="' + u.id + '" data-n="' + E(u.nama) + '" aria-label="Hapus akun"><i class="bi bi-trash"></i></button>' +
        '</div>' }
    ], list, { empty: 'Belum ada admin.' });
}, 'admAkun');
ACT.adminNew = async () => {
  const d = await api('area.list');
  const kab = d.areas.filter(a => a.level === 'kabupaten'), kec = d.areas.filter(a => a.level === 'kecamatan');
  formModal({
    title: 'Tambah Akun Admin', submit: 'Buat Akun',
    fields: [
      { name: 'nama', label: 'Nama', req: true },
      { name: 'email', label: 'Email', type: 'email', req: true },
      { name: 'telepon', label: 'Telepon (WhatsApp)', type: 'tel', req: true, inputmode: 'tel' },
      { name: 'role', label: 'Peran', type: 'select', value: 'admin_kecamatan', options: [
        { v: 'admin_kecamatan', t: 'Admin Kecamatan' }, { v: 'admin_kabupaten', t: 'Admin Kabupaten' }, { v: 'super_admin', t: 'Super Admin' }
      ] },
      { name: 'scopeId', label: 'Wilayah', type: 'select', options: kec.map(a => ({ v: a.id, t: a.nama })) },
      { name: 'rekening', label: 'Rekening setoran (untuk admin kecamatan)', type: 'textarea', max: 200 }
    ],
    onReady: f => {
      const sync = () => {
        const r = f.elements.role.value, list = r === 'admin_kabupaten' ? kab : kec;
        f.elements.scopeId.disabled = r === 'super_admin';
        f.elements.scopeId.innerHTML = list.map(a => '<option value="' + E(a.id) + '">' + E(a.nama) + '</option>').join('');
      };
      f.elements.role.addEventListener('change', sync);
      sync();
    },
    onSubmit: async v => {
      const r = await api('admin.create', v);
      setTimeout(() => openModal({
        title: 'Akun dibuat',
        body: '<p>Berikan kata sandi sementara ini kepada <b>' + E(r.email) + '</b>. Hanya ditampilkan sekali.</p>' +
          '<div class="total"><div class="small muted">Kata sandi sementara</div><div class="big" style="font-size:20px;user-select:all">' + E(r.passwordSementara) + '</div></div>',
        foot: '<button class="btn-g" data-bs-dismiss="modal">Selesai</button>'
      }), 450);
      refresh();
    }
  });
};
ACT.adminEdit = async d => {
  const [ar, list] = await Promise.all([api('area.list'), api('user.list', {})]);
  const u = list.filter(x => x.id === d.id)[0];
  if (!u) return toast('Akun tidak ditemukan.', 'err');
  const kab = ar.areas.filter(a => a.level === 'kabupaten'), kec = ar.areas.filter(a => a.level === 'kecamatan');
  formModal({
    title: 'Ubah Akun Admin', submit: 'Simpan Perubahan',
    fields: [
      { name: 'nama', label: 'Nama', req: true, value: u.nama, max: 80 },
      { name: 'email', label: 'Email', type: 'email', req: true, value: u.email },
      { name: 'telepon', label: 'Telepon (WhatsApp)', type: 'tel', value: u.telepon, inputmode: 'tel' },
      { name: 'role', label: 'Peran', type: 'select', value: u.role, options: [
        { v: 'admin_kecamatan', t: 'Admin Kecamatan' }, { v: 'admin_kabupaten', t: 'Admin Kabupaten' }, { v: 'super_admin', t: 'Super Admin' }
      ] },
      { name: 'scopeId', label: 'Wilayah', type: 'select', options: [] },
      { name: 'rekening', label: 'Rekening setoran (untuk admin kecamatan)', type: 'textarea', max: 200, value: u.rekening || '' }
    ],
    onReady: f => {
      const sync = keep => {
        const r = f.elements.role.value, list2 = r === 'admin_kabupaten' ? kab : kec;
        f.elements.scopeId.disabled = r === 'super_admin';
        f.elements.scopeId.innerHTML = list2.map(a => '<option value="' + E(a.id) + '"' +
          (keep && a.id === u.scopeId ? ' selected' : '') + '>' + E(a.nama) + '</option>').join('');
      };
      f.elements.role.addEventListener('change', () => sync(false));
      sync(true);
    },
    onSubmit: async v => {
      await api('admin.update', Object.assign({ id: d.id }, v));
      toast('Akun admin diperbarui.', 'ok');
      refresh();
    }
  });
};
ACT.adminDel = async d => {
  const ok = await ask({
    title: 'Hapus akun admin?',
    text: '<b>' + E(d.n) + '</b> tidak akan dapat masuk lagi. Riwayat aktivitas (audit log) tetap tersimpan. Tindakan ini tidak dapat dibatalkan dari aplikasi.',
    ok: 'Ya, Hapus', danger: true
  });
  if (!ok) return;
  try { await api('admin.delete', { id: d.id }); toast('Akun admin dihapus.', 'ok'); refresh(); }
  catch (e) { toastErr(e); }
};

reg('admAudit', 'Audit Log Sistem', SUP_R, async (p, v) => {
  const list = await api('audit.list', { limit: 200 });
  v.innerHTML = '<h1 class="title-lg mb-3">Audit Log Sistem</h1>' + table([
    { h: 'Waktu', f: a => tgl(a.createdAt) },
    { h: 'Pengguna', f: a => E(a.nama) },
    { h: 'Aksi', f: a => '<b style="color:var(--tx)">' + E(a.aksi.replace(/_/g, ' ')) + '</b>' },
    { h: 'Entitas', f: a => E(a.entitas) },
    { h: 'Detail', f: a => E(a.detail) }
  ], list, { empty: 'Belum ada catatan.' });
}, 'admAudit');

// ── Pengaturan sistem ────────────────────────────────────
let LOGO = null;
function logoCard(s) {
  return card('<div class="row-flex gap-2 mb-1"><i class="bi bi-image" style="color:var(--gold-text);font-size:20px"></i><b style="color:var(--tx);font-size:16px">Logo Aplikasi</b></div>' +
    '<div class="small muted mb-3">Tampil di header, menu, halaman masuk, ikon tab browser, dan kop PDF. Berkas asli tersimpan di Google Drive.</div>' +
    '<div class="row-flex gap-3 wrap"><span id="logoPrev">' + logoMark('', 'width:84px;height:84px;font-size:38px') + '</span><div class="grow">' +
    '<div class="row-flex gap-2 wrap"><label class="btn-gh btn-sm" style="cursor:pointer"><i class="bi bi-upload"></i> Pilih gambar<input type="file" id="logoFile" accept="image/png,image/jpeg,image/webp" hidden></label>' +
    '<button class="btn-g btn-sm" type="button" id="logoSaveBtn" data-act="logoSave" disabled>Simpan Logo</button>' +
    (s.adaLogo ? '<button class="btn-dg btn-sm" type="button" data-act="logoDel">Hapus</button>' : '') + '</div>' +
    '<div class="small muted mt-2" id="logoInfo">PNG, JPG, atau WebP maks. 1,5 MB. Disarankan persegi (mis. 512×512).</div></div></div>' +
    '<div class="small mt-2 muted"><i class="bi bi-hdd-network"></i> Versi tampilan v' + E(APP_VER) + ' · server v' + E((S.home && S.home.versi) || 'lama') +
    (versionMismatch() ? ' <b style="color:var(--err)">— tidak cocok, perbarui Kode.gs</b>' : ' <b style="color:var(--ok)">— cocok</b>') + '</div>' +
    '<hr class="hr"><div class="small"><b style="color:var(--tx)">Ikon pasang di HP (PWA)</b><div class="muted">Unduh ikon dari logo ini, lalu ganti berkas dengan nama yang sama di repository GitHub.</div></div>' +
    '<div class="row-flex gap-2 wrap mt-2"><button class="btn-gh btn-sm" type="button" data-act="iconDl" data-s="192">icon-192.png</button>' +
    '<button class="btn-gh btn-sm" type="button" data-act="iconDl" data-s="512">icon-512.png</button>' +
    '<button class="btn-gh btn-sm" type="button" data-act="iconDl" data-s="maskable">icon-maskable-512.png</button></div>');
}
reg('admPengaturan', 'Pengaturan Sistem', SUP_R, async (p, v) => {
  const s = await api('settings.get');
  v.innerHTML = '<h1 class="title-lg mb-3">Pengaturan Sistem</h1>' + logoCard(s) +
    '<form id="sf" novalidate>' +
    card('<b style="color:var(--tx)">Umum</b><div class="mt-3"></div>' +
      fieldHtml({ name: 'appName', label: 'Nama aplikasi', value: s.appName }) +
      fieldHtml({ name: 'namaDaerah', label: 'Wilayah peluncuran', value: s.namaDaerah }) +
      fieldHtml({ name: 'waAdmin', label: 'WhatsApp admin/posko', type: 'tel', value: s.waAdmin, help: 'Tampil di Pusat Bantuan.' }) +
      fieldHtml({ name: 'emailAdmin', label: 'Email admin', type: 'email', value: s.emailAdmin })) +
    card('<b style="color:var(--tx)">Saldo, Komisi & Sanksi</b><div class="mt-3"></div>' +
      fieldHtml({ name: 'komisiPersen', label: 'Komisi platform (%)', type: 'number', min: 0, max: 50, step: 0.5, value: s.komisiPersen,
        help: 'Komisi dipotong dari saldo deposit mitra saat pekerjaan dikonfirmasi selesai.' }) +
      fieldHtml({ name: 'saldoMin', label: 'Saldo deposit minimum (Rp)', type: 'number', min: 0, step: 10000, value: s.saldoMin,
        help: 'Di bawah nilai ini, mitra tidak dapat menerima pesanan baru.' }) +
      fieldHtml({ name: 'sanksiTrx', label: 'Batas komisi belum disetor (transaksi)', type: 'number', min: 1, max: 20, value: s.sanksiTrx,
        help: 'Saat jumlah komisi belum disetor mencapai batas ini, mitra diblokir sampai menyetor.' }) +
      fieldHtml({ name: 'pengingatAktif', label: 'Tagihan mingguan otomatis', type: 'select', options: [{ v: '1', t: 'Aktif (notifikasi + email)' }, { v: '0', t: 'Nonaktif' }], value: s.pengingatAktif }) +
      fieldHtml({ name: 'hariPengingat', label: 'Hari tagihan (pukul 08.00)', type: 'select', options: HARI_LBL.slice(1).map((h, i) => ({ v: String(i + 1), t: h })), value: s.hariPengingat,
        help: s.pemicuPengingat ? 'Pemicu otomatis terpasang. Terakhir terkirim: ' + (s.pengingatTerakhir ? tgl(s.pengingatTerakhir, false) : 'belum pernah') + '.'
          : 'Pemicu belum terpasang. Jalankan setupAppEnvironment() sekali dari editor Apps Script.' }) +
      fieldHtml({ name: 'infoSetor', label: 'Petunjuk setoran bawaan', type: 'textarea', value: s.infoSetor, max: 200,
        help: 'Dipakai bila admin kecamatan belum mengisi rekening sendiri.' })) +
    card('<b style="color:var(--tx)">Operasional</b><div class="mt-3"></div>' +
      fieldHtml({ name: 'slaMenit', label: 'Batas SLA pencocokan (menit)', type: 'number', min: 1, value: s.slaMenit }) +
      fieldHtml({ name: 'berlakuPenawaranJam', label: 'Masa berlaku penawaran bawaan (jam)', type: 'number', min: 1, max: 168, value: s.berlakuPenawaranJam }) +
      fieldHtml({ name: 'kebijakanBayar', label: 'Kebijakan pembayaran (ditampilkan ke pengguna)', type: 'textarea', value: s.kebijakanBayar, max: 300 }) +
      fieldHtml({ name: 'otpAktif', label: 'Verifikasi WhatsApp (OTP) saat daftar', type: 'select', options: [{ v: '0', t: 'Nonaktif' }, { v: '1', t: 'Aktif (butuh FONNTE_TOKEN)' }], value: s.otpAktif,
        help: 'Aktifkan hanya setelah token Fonnte tersimpan di Script Properties.' }) +
      fieldHtml({ name: 'waPenugasanAktif', label: 'Kirim WhatsApp ke mitra saat ada penugasan', type: 'select', options: [{ v: '1', t: 'Aktif' }, { v: '0', t: 'Nonaktif' }], value: s.waPenugasanAktif,
        help: 'Membutuhkan FONNTE_TOKEN. Setiap penugasan memakai satu pesan WhatsApp.' })) +
    card('<b style="color:var(--tx)">Unggahan Foto</b><div class="mt-3"></div><div class="grid2">' +
      fieldHtml({ name: 'maxFoto', label: 'Batas foto per pesanan', type: 'number', min: 1, max: 6, value: s.maxFoto }) +
      fieldHtml({ name: 'maxMB', label: 'Maks. ukuran per foto (MB)', type: 'number', min: 0.2, max: 3, step: 0.1, value: s.maxMB }) + '</div>') +
    '<button class="btn-g btn-block" type="submit"><i class="bi bi-save"></i> Simpan Pengaturan</button></form>';
  LOGO = null;
  const lf = $('#logoFile');
  if (lf) lf.addEventListener('change', onLogoPick);
  bindForm($('#sf'), async val => {
    await api('settings.save', val);
    S.home = null; await loadHome(true); applyChrome();
    toast('Pengaturan disimpan.', 'ok');
  });
}, 'admPengaturan');

// ── Logo aplikasi: aksi ──────────────────────────────────
async function prepLogo(file) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error('Gunakan logo berformat PNG, JPG, atau WebP.');
  const im = await loadImg(file);
  const draw = max => {
    const k = Math.min(1, max / Math.max(im.width, im.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    return c;
  };
  const tm = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  let thumb = '';
  for (const sz of [192, 160, 128, 96, 64]) { thumb = draw(sz).toDataURL(tm, 0.85); if (thumb.length <= 44000) break; }
  if (thumb.length > 44000) throw new Error('Logo terlalu kompleks untuk dijadikan ikon. Gunakan gambar yang lebih sederhana.');
  let orig;
  if (file.size <= 1.4 * 1048576) orig = { name: file.name, mime: file.type, data: await readB64(file) };
  else orig = { name: file.name.replace(/\.\w+$/, '') + '.jpg', mime: 'image/jpeg', data: draw(1024).toDataURL('image/jpeg', 0.85).split(',')[1] };
  return { thumb: thumb, file: orig };
}
async function onLogoPick(ev) {
  const f = ev.target.files[0];
  if (!f) return;
  try {
    LOGO = await prepLogo(f);
    $('#logoPrev').innerHTML = '<span class="logo-mark has-img" style="width:84px;height:84px"><img alt="Pratinjau logo" src="' + E(LOGO.thumb) + '"></span>';
    $('#logoSaveBtn').disabled = false;
    $('#logoInfo').textContent = 'Pratinjau siap (' + f.name + '). Tekan "Simpan Logo" untuk menerapkan.';
  } catch (e) { LOGO = null; toastErr(e); }
}
ACT.logoSave = async () => {
  if (!LOGO) return toast('Pilih gambar logo terlebih dahulu.', 'err');
  const btn = $('#logoSaveBtn'), info = $('#logoInfo'), payload = LOGO;
  const setInfo = h => { if (info) info.innerHTML = h; };
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Menyimpan...'; }
  setInfo('<i class="bi bi-cloud-upload"></i> Mengunggah logo ke Google Drive...');
  try {
    const r = await api('settings.logo', { file: payload.file, thumb: payload.thumb });
    if (S.home && S.home.settings) S.home.settings.logo = r.logo;
    LOGO = null;
    applyBrand(); applyChrome();
    toast('Logo tersimpan dan diterapkan.', 'ok');
    refresh();
  } catch (e) {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Simpan Logo'; }
    setInfo('<span style="color:var(--err)"><i class="bi bi-x-circle-fill"></i> <b>Logo belum tersimpan.</b> ' + E(e.message) + '</span>');
    toastErr(e);
  }
};
ACT.logoDel = async () => {
  if (!(await ask({ title: 'Hapus logo aplikasi?', text: 'Tampilan kembali memakai ikon bawaan.', ok: 'Hapus', danger: true }))) return;
  try {
    await api('settings.logoHapus');
    LOGO = null; S.home = null; store.ldel('bb_logo');
    await loadHome(true); applyChrome(); toast('Logo dihapus.', 'ok'); refresh();
  } catch (e) { toastErr(e); }
};
ACT.iconDl = async d => {
  try {
    let b64, mime;
    if (LOGO) { b64 = LOGO.file.data; mime = LOGO.file.mime; }
    else { const r = await api('settings.logoFile'); b64 = r.data; mime = r.mime; }
    const im = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('Logo tidak dapat dibaca.'));
      i.src = 'data:' + mime + ';base64,' + b64;
    });
    const mk = d.s === 'maskable', size = mk ? 512 : +d.s, name = mk ? 'icon-maskable-512.png' : 'icon-' + size + '.png';
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const x = c.getContext('2d');
    x.fillStyle = '#0F1115';
    if (mk || !x.roundRect) x.fillRect(0, 0, size, size);
    else { x.beginPath(); x.roundRect(0, 0, size, size, size * 0.2); x.fill(); }
    const box = size * (mk ? 0.6 : 0.78), k = Math.min(box / im.width, box / im.height), w = im.width * k, h = im.height * k;
    x.drawImage(im, (size - w) / 2, (size - h) / 2, w, h);
    c.toBlob(b => showBlob(b, name, name), 'image/png');
  } catch (e) { toastErr(e); }
};

// ── PWA: pasang di HP, offline, service worker ───────────
const isStandalone = () => !!((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator && window.navigator.standalone));
const isIOS = () => /iphone|ipad|ipod/i.test((navigator && navigator.userAgent) || '');
ACT.install = async () => {
  if (S.installEvt) {
    S.installEvt.prompt();
    try { await S.installEvt.userChoice; } catch (e) { /* abaikan */ }
    S.installEvt = null; applyChrome(); return;
  }
  const steps = isIOS()
    ? ['Buka halaman ini di <b>Safari</b>.', 'Ketuk tombol <b>Bagikan</b> <i class="bi bi-box-arrow-up"></i> di bawah layar.', 'Pilih <b>Tambahkan ke Layar Utama</b>, lalu ketuk <b>Tambah</b>.']
    : ['Buka halaman ini di <b>Chrome</b> (Android).', 'Ketuk menu <b>⋮</b> di pojok kanan atas.', 'Pilih <b>Instal aplikasi</b> atau <b>Tambahkan ke layar utama</b>.'];
  openModal({
    title: 'Pasang Aplikasi di HP',
    body: '<p class="muted">Aplikasi akan muncul di layar utama dan terbuka layar penuh seperti aplikasi biasa.</p><ol style="padding-left:20px">' +
      steps.map(t => '<li class="mb-2">' + t + '</li>').join('') + '</ol>',
    foot: '<button class="btn-g" data-bs-dismiss="modal">Mengerti</button>'
  });
};
if (PWA) {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.installEvt = e; applyChrome(); });
  window.addEventListener('appinstalled', () => { S.installEvt = null; toast('Aplikasi berhasil dipasang di HP.', 'ok'); applyChrome(); });
  const offBanner = () => { const b = $('#offline'); if (b) b.style.display = navigator.onLine === false ? 'flex' : 'none'; };
  window.addEventListener('online', () => { offBanner(); pollMe(); });
  window.addEventListener('offline', offBanner);
  offBanner();
  window.addEventListener('popstate', e => {
    const st = e.state;
    if (st && st.bb) { S.hist.pop(); go(st.n, st.p, { fromPop: true, back: true }); }
  });
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => { /* aplikasi tetap berjalan tanpa cache */ });
    });
  }
}

// ── Inisialisasi ─────────────────────────────────────────
async function init() {
  const th = store.lget('bb_theme');
  if (th === 'light' || th === 'dark') {
    document.documentElement.setAttribute('data-theme', th);
    const m = $('meta[name="theme-color"]');
    if (m) m.setAttribute('content', th === 'dark' ? '#0F1115' : '#F6F3EA');
  }
  let fatal = '';
  if (PWA && (!CFG.GAS_URL || /GANTI_DENGAN/.test(CFG.GAS_URL))) fatal = 'Berkas config.js belum diisi URL Web App Apps Script.';
  else {
    try { S.home = await api('publik.home'); applyBrand(); }
    catch (e) { fatal = e.message; }
  }
  const t = store.get('bb_t');
  if (t && !fatal) {
    S.token = t;
    try {
      const r = await api('me');
      S.user = r.user; S.partner = r.partner || null; S.unread = r.unread;
    } catch (e) { clearSession(); }
  }
  applyChrome();
  if (fatal) {
    $('#view').innerHTML = card(empty('bi-exclamation-triangle', '<b style="color:var(--tx)">Aplikasi belum siap.</b><br>' + E(fatal) +
      '<br><span class="small">Pemilik: ' + (PWA ? 'periksa <code>config.js</code> dan pastikan deployment Apps Script berakses "Siapa saja".'
        : 'jalankan fungsi <code>setupAppEnvironment()</code> sekali dari editor Apps Script, lalu muat ulang halaman ini.') + '</span>',
      '<button class="btn-g" data-act="reload">Muat ulang</button>'));
  } else {
    await go(homeRoute(), {}, { reset: true });
    pollMe();
  }
  const b = $('#boot');
  if (b) { b.style.opacity = '0'; setTimeout(() => b.remove(), 300); }
  if (!window.__bbPoll) {
    window.__bbPoll = setInterval(pollMe, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) pollMe(); });
  }
}
init();