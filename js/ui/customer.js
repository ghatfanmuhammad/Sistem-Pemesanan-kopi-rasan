/* Halaman pelanggan: menu, pilih opsi, keranjang, checkout, bayar, status.
   Satu state, satu fungsi render per layar. Mengubah layar = memanggil go(). */
(function () {
  var KR = globalThis.KR;
  var h = KR.h, F = KR.fmt, C = KR.cart, O = KR.orders, A = KR.art, store = KR.store;

  /* artBox: render konten HTML (SVG atau <img>) ke dalam span. Aman karena
     sumber kontennya adalah art.js yang dikontrol sendiri, bukan input user. */
  function artBox(cls, html) {
    var sp = h('span', cls ? { class: cls } : {});
    sp.innerHTML = html;
    return sp;
  }
  function svgBox(cls, svg) { return artBox(cls, svg); }

  KR.customer = {
    mount: function mount(root, overlay) {
      var S = {
        view: 'home',
        cat: 'semua',
        menu: KR.applyOverrides({}),
        lines: KR.mem.get('lines', []),
        form: KR.mem.get('form', { type: 'dine', name: '', table: '', note: '' }),
        method: 'qris',
        orderId: KR.mem.get('order', null),
        order: null,
        errors: {},
        busy: false,
        failure: '',
        confirmCancel: false
      };
      var unsubOrder = null;
      var unsubMenu = null;

      /* ---------- bantu ---------- */
      function byId(id) { return S.menu.filter(function (p) { return p.id === id; })[0]; }
      function lines() { return C.reprice(S.lines, S.menu); }
      function save() { KR.mem.set('lines', S.lines); KR.mem.set('form', S.form); }

      function render(toTop) {
        var y = window.scrollY;
        root.replaceChildren(views[S.view]());
        window.scrollTo(0, toTop ? 0 : y);
      }
      function go(view) { S.view = view; S.failure = ''; S.confirmCancel = false; render(true); }

      function watchOrder() {
        if (unsubOrder) { unsubOrder(); unsubOrder = null; }
        if (!S.orderId) { S.order = null; return; }
        unsubOrder = store.subscribeOrder(S.orderId, function (o) {
          if (!o) { forgetOrder(); if (S.view === 'status') go('menu'); return; }
          S.order = o;
          if (S.view === 'status') render(false);
          if (S.view === 'home' || S.view === 'menu') render(false);
        });
      }
      function forgetOrder() {
        S.orderId = null; S.order = null;
        KR.mem.set('order', null);
        if (unsubOrder) { unsubOrder(); unsubOrder = null; }
      }

      /* ---------- potongan layar yang dipakai ulang ---------- */
      function topbar(title, sub, backTo) {
        return h('header', { class: 'topbar pad' },
          h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Kembali', onclick: function () { go(backTo); }, svg: A.icon.back }),
          h('div', null, h('h1', null, title), sub ? h('div', { class: 'topbar__sub' }, sub) : null));
      }

      function seg(onPick) {
        function btn(value, label) {
          return h('button', { type: 'button', 'aria-pressed': String(S.form.type === value), onclick: function () {
            S.form.type = value; save(); onPick();
          } }, label);
        }
        return [btn('dine', 'Makan di tempat'), btn('take', 'Bawa pulang')];
      }

      function itemSummary(items) {
        return items.map(function (l) {
          var opt = O.optionText(l);
          return h('div', { class: 'sumrow' },
            h('span', null, l.qty + '× ' + l.name,
              opt ? h('span', { class: 'opt' }, opt) : null,
              l.note ? h('span', { class: 'opt' }, 'Catatan: ' + l.note) : null),
            h('strong', { class: 'num' }, F.rupiah(l.qty * l.price)));
        });
      }

      /* ---------- jendela pilih opsi ---------- */
      function openSheet(p) {
        var pick = { sugar: p.sugar ? KR.DEFAULT_SUGAR : '', ice: p.ice ? KR.DEFAULT_ICE : '', qty: 1 };
        var noteInput = h('input', { class: 'input', id: 'sheet-note', type: 'text', maxlength: '80', placeholder: 'Misalnya: es dipisah' });
        var qtyOut = h('output', { 'aria-live': 'polite' }, '1');
        var addBtn = h('button', { class: 'btn btn--primary', type: 'submit' });
        var dlg = h('dialog', { class: 'sheet', 'aria-labelledby': 'sheet-title' });

        function refresh() {
          qtyOut.textContent = String(pick.qty);
          addBtn.textContent = 'Tambah ke keranjang · ' + F.rupiah(p.price * pick.qty);
        }
        function group(title, name, values, current) {
          return h('fieldset', { class: 'pills' },
            h('legend', null, title),
            values.map(function (v) {
              return h('label', { class: 'pill' },
                h('input', { type: 'radio', name: name, value: v, checked: v === current, onchange: function () { pick[name] = v; } }),
                h('span', null, v));
            }));
        }
        function step(delta, label, icon) {
          return h('button', { type: 'button', 'aria-label': label, svg: icon, onclick: function () {
            pick.qty = Math.max(1, Math.min(C.MAX_QTY, pick.qty + delta)); refresh();
          } });
        }

        var form = h('form', { onsubmit: function (e) {
          e.preventDefault();
          S.lines = C.add(S.lines, {
            id: p.id, name: p.name, price: p.price,
            sugar: pick.sugar, ice: pick.ice, note: noteInput.value.trim()
          }, pick.qty);
          save();
          dlg.close();
        } },
          h('div', { class: 'sheet__head' },
            svgBox('art', A.product(p.art, p.img)),
            h('div', null,
              h('h2', { class: 'sheet__title', id: 'sheet-title' }, p.name),
              h('p', { class: 'sheet__desc' }, p.desc),
              h('p', { class: 'prow__price num' }, F.rupiah(p.price))),
            h('button', { class: 'iconbtn sheet__close', type: 'button', 'aria-label': 'Tutup', svg: A.icon.close, onclick: function () { dlg.close(); } })),
          h('div', { class: 'sheet__body' },
            p.sugar ? group('Gula', 'sugar', KR.SUGAR, pick.sugar) : null,
            p.ice ? group('Es', 'ice', KR.ICE, pick.ice) : null,
            h('div', { class: 'field' }, h('label', { for: 'sheet-note' }, 'Catatan (opsional)'), noteInput)),
          h('div', { class: 'sheet__foot' },
            h('div', { class: 'stepper' }, step(-1, 'Kurangi jumlah', A.icon.minus), qtyOut, step(1, 'Tambah jumlah', A.icon.plus)),
            addBtn));

        dlg.appendChild(form);
        dlg.addEventListener('close', function () { dlg.remove(); render(false); });
        dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
        overlay.replaceChildren(dlg);
        refresh();
        dlg.showModal();
      }

      /* ---------- layar ---------- */
      var views = {};

      /* menu bawah (+ bilah keranjang di atasnya bila ada isi) */
      function dock(active, withCart) {
        var L = lines();
        var count = C.count(L);
        var o = S.order;
        var tabs = [['home', 'Beranda', A.icon.home], ['menu', 'Menu', A.icon.cupnav], ['status', 'Pesanan', A.icon.receipt]];
        return h('div', { class: 'dock' },
          withCart && count > 0
            ? h('div', { class: 'dock__float pad' },
                h('button', { class: 'floatbar__btn', type: 'button', onclick: function () { go('cart'); } },
                  h('span', null, count + ' item · ', h('strong', { class: 'num' }, F.rupiah(C.total(L)))),
                  h('span', null, 'Lihat keranjang')))
            : null,
          h('nav', { class: 'nav', 'aria-label': 'Navigasi utama' }, tabs.map(function (t) {
            var dot = t[0] === 'status' && o && O.isActive(o.status);
            return h('button', { type: 'button', 'aria-current': active === t[0] ? 'page' : null, onclick: function () { go(t[0]); } },
              h('span', { class: dot ? 'nav__dot' : null, svg: t[2], style: 'display:inline-flex' }), t[1]);
          })));
      }

      function productCell(p, kind) {
        var label = p.name + ', ' + F.rupiah(p.price) + (p.soldOut ? ', habis' : '');
        var add = p.soldOut ? h('span', { class: 'badge st-done' }, 'Habis') : h('span', { class: 'add', svg: A.icon.plus });
        if (kind === 'fav') {
          return h('button', { class: 'fav', type: 'button', disabled: p.soldOut, 'aria-label': label, onclick: function () { openSheet(p); } },
            svgBox('art', A.product(p.art, p.img)),
            h('span', { class: 'fav__name' }, p.name),
            h('span', { class: 'fav__row' }, h('span', { class: 'fav__price num' }, F.rupiah(p.price)), add));
        }
        return h('button', { class: 'prow', type: 'button', disabled: p.soldOut, 'aria-label': label, onclick: function () { openSheet(p); } },
          svgBox('art', A.product(p.art, p.img)),
          h('span', { class: 'prow__body' },
            h('span', { class: 'prow__name', style: 'display:block' }, p.name),
            h('span', { class: 'prow__desc', style: 'display:block' }, p.desc),
            h('span', { class: 'prow__price num', style: 'display:block' }, F.rupiah(p.price))),
          add);
      }

      views.home = function () {
        var o = S.order;
        var active = o && O.isActive(o.status);
        var favs = ['es-kopi-susu-gula-aren', 'spanish-latte'].map(byId).filter(Boolean);
        return h('div', { class: 'app' },
          h('header', { class: 'hero pad' },
            h('span', { class: 'hero__decor', svg: A.decor(170) }),
            h('div', { class: 'hero__row' },
              h('div', { class: 'brand' },
                artBox('brand__mark brand__mark--logo', '<img src="img/logo.jpg" alt="Kopi Rasan" class="logo-img">'),
                'Kopi Rasan'),
              active ? h('button', { class: 'hero__track', type: 'button', onclick: function () { go('status'); } }, o.no + ' · ' + KR.STATUS_LABEL[o.status]) : null),
            h('h1', null, 'Kopi enak, pesan tanpa antre.'),
            h('p', null, 'Pilih menu, atur gula dan es, lalu bayar dari meja Anda.'),
            artBox('hero__art', '<img src="img/gula aren.jpg" alt="" aria-hidden="true" class="art-photo art-photo--hero">'),
            h('button', { class: 'btn btn--light btn--block', type: 'button', onclick: function () { go('menu'); } }, 'Mulai pesan')),
          h('section', { class: 'pad', 'aria-labelledby': 'fav-title' },
            h('div', { class: 'secthead' },
              h('h2', { id: 'fav-title' }, 'Favorit hari ini'),
              h('button', { class: 'link', type: 'button', onclick: function () { go('menu'); } }, 'Lihat semua')),
            h('div', { class: 'favs' }, favs.map(function (p) { return productCell(p, 'fav'); })),
            h('p', { class: 'foot-note' }, h('a', { href: '#dasbor' }, 'Masuk kasir'))),
          dock('home', true));
      };

      views.menu = function () {
        var list = S.menu.filter(function (p) { return S.cat === 'semua' || p.cat === S.cat; });
        return h('div', { class: 'app' },
          h('header', { class: 'mhead pad' }, h('h1', null, 'Menu'),
            h('p', null, S.form.type === 'take' ? 'Bawa pulang' : 'Makan di tempat')),
          h('div', { class: 'pad' },
            h('div', { class: 'chips', role: 'group', 'aria-label': 'Kategori menu' },
              KR.CATEGORIES.map(function (c) {
                return h('button', { class: 'chip', type: 'button', 'aria-pressed': String(S.cat === c[0]), onclick: function () { S.cat = c[0]; render(false); } }, c[1]);
              })),
            h('ul', { class: 'menu' }, list.map(function (p) { return h('li', null, productCell(p, 'row')); }))),
          dock('menu', true));
      };

      function setQty(line, qty) {
        S.lines = C.setQty(S.lines, C.lineKey(line), qty);
        save();
        render(false);
      }

      views.cart = function () {
        var L = lines();
        var count = C.count(L);
        if (!L.length) {
          return h('div', { class: 'app' }, topbar('Keranjang', '', 'menu'),
            h('div', { class: 'empty pad' },
              h('h2', null, 'Keranjang masih kosong'),
              h('p', null, 'Pilih minuman dari menu, lalu kembali ke sini untuk checkout.'),
              h('button', { class: 'btn btn--primary', type: 'button', onclick: function () { go('menu'); } }, 'Lihat menu')));
        }
        var anySold = L.some(function (l) { return l.soldOut; });
        return h('div', { class: 'app' },
          topbar('Keranjang', (S.form.type === 'take' ? 'Bawa pulang' : 'Makan di tempat') + ' · ' + count + ' item', 'menu'),
          h('div', { class: 'stack pad' },
            h('ul', { style: 'display:flex;flex-direction:column;gap:10px' }, L.map(function (l) {
              var p = byId(l.id);
              var opt = O.optionText(l);
              return h('li', { class: 'cline' },
                p ? svgBox('art', A.product(p.art, p.img)) : h('span', { class: 'art' }),
                h('div', { class: 'cline__body' },
                  h('div', { class: 'cline__name' }, l.name),
                  opt ? h('div', { class: 'cline__meta' }, opt) : null,
                  l.note ? h('div', { class: 'cline__meta' }, 'Catatan: ' + l.note) : null,
                  l.soldOut ? h('div', { class: 'cline__warn' }, 'Sedang habis. Hapus untuk lanjut.') : null,
                  h('div', { class: 'cline__row' },
                    h('div', { class: 'stepper' },
                      h('button', { type: 'button', 'aria-label': 'Kurangi ' + l.name, svg: A.icon.minus, onclick: function () { setQty(l, l.qty - 1); } }),
                      h('output', { 'aria-label': 'Jumlah ' + l.name }, String(l.qty)),
                      h('button', { type: 'button', 'aria-label': 'Tambah ' + l.name, svg: A.icon.plus, onclick: function () { setQty(l, l.qty + 1); } })),
                    h('strong', { class: 'num' }, F.rupiah(l.qty * l.price)))));
            })),
            h('button', { class: 'addmore', type: 'button', onclick: function () { go('menu'); } },
              svgBox('', A.icon.plus), 'Tambah menu lain')),
          h('div', { class: 'bar pad' },
            h('div', { class: 'bar__row' },
              h('span', { class: 'bar__label' }, 'Total · ' + count + ' item'),
              h('span', { class: 'bar__total num', 'aria-live': 'polite' }, F.rupiah(C.total(L)))),
            h('button', { class: 'btn btn--primary btn--block', type: 'button', disabled: anySold, onclick: function () { go('checkout'); } }, 'Lanjut ke checkout')));
      };

      views.checkout = function () {
        var L = lines();
        if (!L.length) return views.cart();
        var dine = S.form.type === 'dine';
        var e = S.errors;

        var name = h('input', { class: 'input', id: 'co-name', type: 'text', maxlength: '40', autocomplete: 'given-name', value: S.form.name,
          'aria-invalid': e.name ? 'true' : null, 'aria-describedby': e.name ? 'co-name-err' : null,
          oninput: function (ev) { S.form.name = ev.target.value; save(); } });
        var table = h('input', { class: 'input', id: 'co-table', type: 'text', inputmode: 'numeric', maxlength: '10', value: S.form.table,
          'aria-invalid': e.table ? 'true' : null, 'aria-describedby': e.table ? 'co-table-err' : null,
          oninput: function (ev) { S.form.table = ev.target.value; save(); } });
        var note = h('textarea', { class: 'input', id: 'co-note', maxlength: '200', placeholder: 'Misalnya: es dipisah',
          oninput: function (ev) { S.form.note = ev.target.value; save(); } });
        note.value = S.form.note;

        function next() {
          S.errors = {};
          if (!S.form.name.trim()) S.errors.name = 'Isi nama agar kami bisa memanggil Anda.';
          if (dine && !S.form.table.trim()) S.errors.table = 'Isi nomor meja Anda.';
          if (S.errors.name || S.errors.table) {
            render(false);
            var first = document.getElementById(S.errors.name ? 'co-name' : 'co-table');
            if (first) first.focus();
            return;
          }
          go('pay');
        }

        return h('div', { class: 'app' }, topbar('Checkout', '', 'cart'),
          h('form', { class: 'stack pad', novalidate: true, onsubmit: function (ev) { ev.preventDefault(); next(); } },
            h('div', { class: 'seg', role: 'group', 'aria-label': 'Jenis pesanan' }, seg(function () { S.errors = {}; render(false); })),
            h('div', { class: 'field' }, h('label', { for: 'co-name' }, 'Nama pemesan'), name,
              e.name ? h('div', { class: 'field-error', id: 'co-name-err' }, e.name) : null),
            dine ? h('div', { class: 'field' }, h('label', { for: 'co-table' }, 'Nomor meja'), table,
              e.table ? h('div', { class: 'field-error', id: 'co-table-err' }, e.table) : null) : null,
            h('div', { class: 'field' }, h('label', { for: 'co-note' }, 'Catatan (opsional)'), note),
            h('div', { class: 'card' }, itemSummary(L),
              h('div', { class: 'sumrow sumrow--total' }, h('span', { class: 'bar__label' }, 'Total'), h('strong', { class: 'num' }, F.rupiah(C.total(L))))),
            h('button', { class: 'btn btn--primary btn--block', type: 'submit' }, 'Lanjut ke pembayaran')));
      };

      function submitOrder() {
        var L = lines();
        if (S.busy || !L.length) return;
        S.busy = true; S.failure = '';
        render(false);
        var now = Date.now();
        store.nextSeq(now).then(function (seq) {
          var doc = O.build({ lines: L, form: S.form, method: S.method, seq: seq, now: now });
          return store.createOrder(doc);
        }).then(function (id) {
          S.orderId = id; S.busy = false;
          S.lines = []; save();
          KR.mem.set('order', id);
          watchOrder();
          go('status');
        }).catch(function (err) {
          console.error(err);
          S.busy = false;
          S.failure = 'Pesanan belum terkirim. Periksa koneksi Anda, lalu coba lagi.';
          render(false);
        });
      }

      views.pay = function () {
        var L = lines();
        if (!L.length) return views.cart();
        var total = C.total(L);
        var cash = S.method === 'cash';
        var defs = [
          ['qris', 'QRIS', 'Scan dari aplikasi bank atau e-wallet', A.icon.qris],
          ['ewallet', 'E-wallet', 'GoPay, OVO, DANA, ShopeePay', A.icon.wallet],
          ['cash', 'Tunai di kasir', 'Bayar saat mengambil pesanan', A.icon.cash]
        ];
        return h('div', { class: 'app' }, topbar('Pembayaran', '', 'checkout'),
          h('div', { class: 'stack pad' },
            h('div', { class: 'paycard' },
              h('div', { class: 'paycard__label' }, 'Total pembayaran'),
              h('div', { class: 'paycard__total num' }, F.rupiah(total)),
              h('div', { class: 'paycard__meta' }, (S.form.type === 'take' ? 'Bawa pulang' : 'Meja ' + S.form.table) + ' · a.n. ' + S.form.name)),
            h('fieldset', { class: 'methods' },
              h('legend', { class: 'sr-only' }, 'Metode pembayaran'),
              defs.map(function (d) {
                var on = S.method === d[0];
                return h('div', { class: 'method' + (on ? ' method--on' : '') },
                  h('label', null,
                    h('span', { class: 'method__icon', svg: d[3] }),
                    h('span', { class: 'method__text' }, h('strong', null, d[1]), h('span', null, d[2])),
                    h('input', { type: 'radio', name: 'metode', value: d[0], checked: on, onchange: function () { S.method = d[0]; render(false); } })),
                  on && d[0] === 'qris'
                    ? h('div', { class: 'qr' }, h('div', { class: 'qr__box', svg: A.qr() }),
                        h('div', { class: 'qr__note' }, 'Contoh tampilan, bukan kode asli.'))
                    : null);
              })),
            h('p', { class: 'notice' }, 'Tahap uji: pembayaran disimulasikan. Tidak ada uang yang dipotong.'),
            S.failure ? h('p', { class: 'alert', role: 'alert' }, S.failure) : null),
          h('div', { class: 'bar pad' },
            h('button', { class: 'btn btn--primary btn--block', type: 'button', disabled: S.busy, onclick: submitOrder },
              S.busy ? 'Mengirim pesanan…' : (cash ? 'Pesan dan bayar di kasir' : 'Saya sudah bayar')),
            h('p', { class: 'bar__help' }, cash ? 'Kasir menandai pesanan lunas saat Anda membayar.' : 'Pesanan masuk ke kasir setelah pembayaran dikonfirmasi.')));
      };

      var HEAD = {
        waiting: ['Menunggu pembayaran', 'Tunjukkan nomor pesanan ini ke kasir dan bayar di sana.'],
        paid: ['Pesanan diterima', 'Kasir sudah menerima pesanan Anda.'],
        preparing: ['Sedang diproses', 'Barista sedang menyiapkan pesanan Anda.'],
        ready: ['Siap diambil', 'Pesanan Anda sudah siap. Silakan ambil di kasir.'],
        done: ['Selesai', 'Terima kasih sudah memesan di Kopi Rasan.'],
        cancelled: ['Pesanan dibatalkan', 'Pesanan ini tidak jadi diproses.']
      };

      views.status = function () {
        var o = S.order;
        if (!o) {
          return h('div', { class: 'app' },
            h('header', { class: 'mhead pad' }, h('h1', null, 'Pesanan')),
            h('div', { class: 'empty pad' },
              h('h2', null, 'Belum ada pesanan'),
              h('p', null, 'Pesanan Anda dan statusnya akan muncul di sini.'),
              h('button', { class: 'btn btn--primary', type: 'button', onclick: function () { go('menu'); } }, 'Lihat menu')),
            dock('status', false));
        }
        var head = HEAD[o.status];
        var steps = [
          ['paid', o.method === 'cash' ? 'Dibayar di kasir' : 'Dibayar'],
          ['preparing', 'Diproses'], ['ready', 'Siap diambil'], ['done', 'Selesai']
        ];
        var order = ['waiting', 'paid', 'preparing', 'ready', 'done'];
        var at = order.indexOf(o.status);
        var finished = o.status === 'done' || o.status === 'cancelled';

        var timeline = o.status === 'cancelled' ? null : h('div', { class: 'card timeline' }, steps.map(function (s, i) {
          var idx = order.indexOf(s[0]);
          var cls = idx < at || o.status === 'done' ? 'tl--done' : (idx === at || (o.status === 'waiting' && i === 0) ? 'tl--now' : 'tl--todo');
          var sub = '';
          if (i === 0 && o.method !== 'cash') sub = F.clock(o.createdAt) + ' · ' + KR.METHOD_LABEL[o.method];
          if (i === 0 && o.status === 'waiting') sub = 'Menunggu di kasir';
          return h('div', { class: 'tl ' + cls },
            h('div', { class: 'tl__rail' },
              h('span', { class: 'tl__dot', svg: cls === 'tl--done' ? A.icon.check : '' }),
              i < steps.length - 1 ? h('span', { class: 'tl__line' }) : null),
            h('div', { class: 'tl__text' }, h('strong', null, s[1]), sub ? h('span', null, sub) : null));
        }));

        var cancelArea = null;
        if (O.canCancel(o.status)) {
          cancelArea = S.confirmCancel
            ? h('div', { class: 'card' },
                h('p', null, 'Batalkan pesanan ' + o.no + '?'),
                h('div', { style: 'display:flex;gap:10px;margin-top:10px' },
                  h('button', { class: 'btn btn--danger btn--sm', type: 'button', onclick: function () {
                    S.confirmCancel = false; store.updateOrder(o.id, { status: 'cancelled' });
                  } }, 'Ya, batalkan'),
                  h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: function () { S.confirmCancel = false; render(false); } }, 'Tidak')))
            : h('button', { class: 'btn btn--danger', type: 'button', onclick: function () { S.confirmCancel = true; render(false); } }, 'Batalkan pesanan');
        }

        return h('div', { class: 'app' },
          h('header', { class: 'shero pad' },
            h('span', { class: 'shero__tag' }, 'Pesanan ' + o.no),
            h('div', { class: 'shero__row' },
              h('div', { 'aria-live': 'polite' }, h('h1', null, head[0]), h('p', null, head[1])),
              h('span', { class: 'shero__art', svg: A.cupLarge() }))),
          h('div', { class: 'stack pad' },
            timeline,
            h('div', { class: 'card' }, itemSummary(o.items),
              h('div', { class: 'sumrow sumrow--total' },
                h('span', { class: 'bar__label' }, o.paid ? 'Total · Lunas' : 'Total · Bayar di kasir'),
                h('strong', { class: 'num' }, F.rupiah(o.total)))),
            cancelArea,
            finished ? h('button', { class: 'btn btn--primary btn--block', type: 'button', onclick: function () { forgetOrder(); go('menu'); } }, 'Pesan lagi') : null),
          dock('status', false));
      };

      /* ---------- mulai ---------- */
      unsubMenu = store.subscribeMenu(function (ov) {
        S.menu = KR.applyOverrides(ov);
        var typing = document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
        if (!typing && !overlay.firstChild) render(false);
      });
      if (S.orderId) { S.view = 'status'; watchOrder(); }
      render(true);

      return function unmount() {
        if (unsubOrder) unsubOrder();
        if (unsubMenu) unsubMenu();
        overlay.replaceChildren();
        root.replaceChildren();
      };
    }
  };
})();
