/* Dasbor kasir dan owner: papan pesanan, ringkasan hari ini, kelola menu. */
(function () {
  var KR = globalThis.KR;
  var h = KR.h, F = KR.fmt, O = KR.orders, A = KR.art, store = KR.store;

  var COLUMNS = [
    ['waiting', 'Menunggu bayar'],
    ['paid', 'Baru dibayar'],
    ['preparing', 'Diproses'],
    ['ready', 'Siap diambil']
  ];
  var NEW_MS = 30000;   // penanda "Baru" bertahan 30 detik

  KR.dasbor = {
    mount: function mount(root) {
      var S = {
        tab: 'pesanan',
        orders: [],
        overrides: {},
        loaded: false,
        sound: KR.mem.get('sound', false),
        fresh: {},        // id -> waktu masuk, untuk penanda Baru
        seen: {}
      };
      var audio = null;

      /* ---------- bunyi pesanan baru ---------- */
      function beep() {
        if (!S.sound) return;
        try {
          audio = audio || new (window.AudioContext || window.webkitAudioContext)();
          [0, 0.22].forEach(function (t) {
            var osc = audio.createOscillator(), gain = audio.createGain();
            osc.type = 'sine'; osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.0001, audio.currentTime + t);
            gain.gain.exponentialRampToValueAtTime(0.25, audio.currentTime + t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + t + 0.18);
            osc.connect(gain); gain.connect(audio.destination);
            osc.start(audio.currentTime + t); osc.stop(audio.currentTime + t + 0.2);
          });
        } catch (e) { /* bunyi tidak wajib */ }
      }

      function onOrders(list) {
        var now = Date.now();
        var incoming = false;
        list.forEach(function (o) {
          if (S.loaded && !S.seen[o.id] && now - o.createdAt < 120000) { S.fresh[o.id] = now; incoming = true; }
          S.seen[o.id] = true;
        });
        S.orders = list;
        S.loaded = true;
        if (incoming) beep();
        if (S.tab === 'pesanan') draw();
      }

      /* ---------- potongan tampilan ---------- */
      function orderCard(o) {
        var now = Date.now();
        var isNew = S.fresh[o.id] && now - S.fresh[o.id] < NEW_MS;
        var next = O.next(o.status);
        var where = o.type === 'take' ? 'Bawa pulang' : 'Meja ' + (o.table || '-');
        return h('article', { class: 'ocard' + (isNew ? ' ocard--new' : '') },
          h('div', { class: 'ocard__top' },
            h('div', { class: 'ocard__no' }, h('strong', null, o.no), h('span', { class: 'tagpill' }, where), isNew ? h('span', { class: 'newtag' }, 'Baru') : null),
            h('span', { class: 'ocard__who' }, F.clock(o.createdAt) + ' · ' + o.name)),
          h('div', { class: 'ocard__items' }, o.items.map(function (i) {
            var opt = O.optionText(i);
            return h('div', null, h('b', null, i.qty + '× ' + i.name),
              opt ? h('span', { class: 'opt' }, opt) : null,
              i.note ? h('span', { class: 'opt' }, 'Catatan: ' + i.note) : null);
          })),
          o.note ? h('div', { class: 'ocard__note' }, 'Catatan: ' + o.note) : null,
          h('div', { class: 'ocard__pay' },
            h('span', { class: 'badge ' + (o.paid ? 'st-ready' : 'st-waiting') }, o.paid ? 'Lunas · ' + KR.METHOD_LABEL[o.method] : 'Tunai · belum dibayar'),
            h('strong', null, F.rupiah(o.total))),
          h('div', { class: 'ocard__actions' },
            next ? h('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: function () {
              var patch = { status: next };
              if (o.status === 'waiting') patch.paid = true;
              store.updateOrder(o.id, patch);
            } }, O.nextLabel(o.status)) : null,
            O.canCancel(o.status) ? h('button', { class: 'btn btn--danger btn--sm', type: 'button', onclick: function () {
              store.updateOrder(o.id, { status: 'cancelled' });
            } }, 'Batalkan') : null));
      }

      function pesananTab() {
        var now = Date.now();
        var from = O.startOfDay(now);
        var todayOrders = S.orders.filter(function (o) { return o.createdAt >= from; });
        var sum = O.summarize(S.orders, now);
        var ended = todayOrders.filter(function (o) { return o.status === 'done' || o.status === 'cancelled'; });

        function stat(label, value) {
          return h('div', { class: 'stat' }, h('div', { class: 'stat__label' }, label), h('div', { class: 'stat__value num' }, value));
        }

        return [
          h('div', null, h('h1', null, 'Pesanan hari ini'),
            h('p', { class: 'dmain__sub' }, new Date(now).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))),
          h('div', { class: 'stats' },
            stat('Pesanan hari ini', String(sum.count)),
            stat('Penjualan (lunas)', F.rupiah(sum.sales)),
            stat('Pesanan aktif', String(sum.active)),
            stat('Rata-rata per pesanan', F.rupiah(sum.average))),
          sum.top.length
            ? h('p', { class: 'top' }, 'Terlaris: ', sum.top.map(function (t, i) {
                return [i ? ' · ' : '', h('strong', null, t.name), ' (' + t.qty + ')'];
              }))
            : null,
          h('div', { class: 'board' }, COLUMNS.map(function (c) {
            var list = todayOrders.filter(function (o) { return o.status === c[0]; }).sort(function (a, b) { return a.createdAt - b.createdAt; });
            return h('section', { class: 'col', 'aria-label': c[1] },
              h('div', { class: 'col__head' }, h('h2', null, c[1]), h('span', { class: 'col__count st-' + c[0] }, String(list.length))),
              list.length ? list.map(orderCard) : h('div', { class: 'col__empty' }, S.loaded ? 'Belum ada pesanan' : 'Memuat…'));
          })),
          ended.length
            ? h('details', { class: 'donebox' },
                h('summary', null, 'Selesai dan dibatalkan (' + ended.length + ')'),
                h('ul', { class: 'donelist' }, ended.slice(0, 30).map(function (o) {
                  return h('li', null,
                    h('span', null, o.no + ' · ' + o.name + ' · ' + F.clock(o.createdAt)),
                    h('span', null, h('span', { class: 'badge st-' + o.status }, KR.STATUS_LABEL[o.status]), ' ', F.rupiah(o.total)));
                })))
            : null
        ];
      }

      function menuTab() {
        var menu = KR.applyOverrides(S.overrides);
        var catName = {};
        KR.CATEGORIES.forEach(function (c) { catName[c[0]] = c[1]; });
        return [
          h('div', null, h('h1', null, 'Menu dan harga'),
            h('p', { class: 'dmain__sub' }, 'Perubahan langsung terlihat di halaman pelanggan.')),
          h('ul', { class: 'mgrid' }, menu.map(function (p) {
            var priceId = 'harga-' + p.id;
            var price = h('input', { class: 'input num', id: priceId, type: 'number', inputmode: 'numeric', min: '0', step: '500', value: String(p.price),
              onchange: function (e) {
                store.setMenuItem(p.id, { price: e.target.value, soldOut: p.soldOut });
              } });
            var sold = h('input', { type: 'checkbox', checked: p.soldOut, onchange: function (e) {
              store.setMenuItem(p.id, { price: p.price, soldOut: e.target.checked });
            } });
            return h('li', { class: 'mrow' },
              h('span', { class: 'art', svg: A.product(p.art) }),
              h('div', { class: 'mrow__name' }, p.name, h('span', { class: 'mrow__cat' }, catName[p.cat])),
              h('div', { class: 'field' }, h('label', { for: priceId, class: 'sr-only' }, 'Harga ' + p.name + ' dalam rupiah'), price),
              h('label', { class: 'switch' }, sold, 'Habis'));
          }))
        ];
      }

      /* ---------- kerangka ---------- */
      function draw() {
        var active = document.activeElement;
        var tabs = [['pesanan', 'Pesanan'], ['menu', 'Menu dan harga']];
        root.replaceChildren(h('div', { class: 'dash' },
          h('header', { class: 'dhead pad' }, h('div', { class: 'dash__inner' },
            h('div', { class: 'dhead__row' },
              h('div', { class: 'brand' }, h('span', { class: 'brand__mark', svg: A.mark(24) }),
                h('span', null, 'Kopi Rasan', h('span', { class: 'brand__sub' }, 'Dasbor kasir'))),
              h('div', { class: 'dhead__tools' },
                h('span', { class: 'dtool' }, h('span', { class: 'dot' + (store.mode === 'shared' ? '' : ' dot--local') }),
                  store.mode === 'shared' ? 'Terhubung' : 'Mode lokal'),
                h('button', { class: 'dtool', type: 'button', 'aria-pressed': String(S.sound), onclick: function () {
                  S.sound = !S.sound; KR.mem.set('sound', S.sound); if (S.sound) beep(); draw();
                } }, h('span', { svg: S.sound ? A.icon.bell : A.icon.bellOff, style: 'display:flex' }), S.sound ? 'Bunyi aktif' : 'Bunyi mati'),
                h('a', { class: 'dtool', href: '#menu' }, 'Halaman pelanggan'))),
            h('div', { class: 'tabs', role: 'tablist' }, tabs.map(function (t) {
              return h('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': String(S.tab === t[0]), onclick: function () { S.tab = t[0]; draw(); } }, t[1]);
            })))),
          h('main', { class: 'pad' }, h('div', { class: 'dash__inner dmain' }, S.tab === 'pesanan' ? pesananTab() : menuTab()))));
        if (active && active.id) { var again = document.getElementById(active.id); if (again) again.focus(); }
      }

      var unsubOrders = store.subscribeOrders(onOrders);
      var unsubMenu = store.subscribeMenu(function (ov) {
        S.overrides = ov;
        var typing = document.activeElement && document.activeElement.tagName === 'INPUT';
        if (S.tab === 'menu' && !typing) draw();
      });
      // jam, "Baru", dan penanda waktu diperbarui tiap 20 detik
      var tick = setInterval(function () {
        var typing = document.activeElement && document.activeElement.tagName === 'INPUT';
        if (S.tab === 'pesanan' && !typing) draw();
      }, 20000);
      draw();

      return function unmount() {
        unsubOrders(); unsubMenu(); clearInterval(tick);
        root.replaceChildren();
      };
    },

    denied: function (root) {
      root.replaceChildren(h('main', { class: 'denied pad' },
        h('span', { class: 'brand__mark', svg: A.mark(28), style: 'width:56px;height:56px;border-radius:50%;background:var(--brand);display:flex;align-items:center;justify-content:center' }),
        h('h1', null, 'Dasbor hanya untuk kasir dan owner'),
        h('p', null, 'Akun ini belum punya akses ke dasbor. Minta owner memberi akses ubah pada halaman ini.'),
        h('a', { class: 'btn btn--primary', href: '#menu' }, 'Ke halaman pelanggan')));
    }
  };
})();
