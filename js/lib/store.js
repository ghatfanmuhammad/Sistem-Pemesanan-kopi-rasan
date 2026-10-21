/* Penyimpanan pesanan dan penimpa menu.
   Mode "shared": database bersama (capability db), pesanan terlihat di semua perangkat.
   Mode "local": cadangan di browser ini saja, supaya halaman tetap jalan tanpa db.
   Semua layar memakai antarmuka yang sama dan tidak tahu mode mana yang aktif. */
(function () {
  var KR = globalThis.KR || (globalThis.KR = {});

  var db = null;
  var mode = 'local';

  /* ---------- cadangan lokal ---------- */
  var LOCAL_KEY = 'kr.local.v1';
  var local = { orders: {}, menu: {} };
  var subs = { orders: [], menu: [] };

  function readLocal() {
    try {
      var raw = localStorage.getItem(LOCAL_KEY);
      if (raw) local = JSON.parse(raw);
    } catch (e) { /* storage tidak tersedia: tetap di memori */ }
    local.orders = local.orders || {};
    local.menu = local.menu || {};
  }
  function writeLocal() {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(local)); } catch (e) { /* abaikan */ }
  }
  function localOrders() {
    return Object.keys(local.orders)
      .map(function (id) { return Object.assign({ id: id }, local.orders[id]); })
      .sort(function (a, b) { return b.createdAt - a.createdAt; });
  }
  function notifyLocal() {
    subs.orders.forEach(function (f) { f(); });
    subs.menu.forEach(function (f) { f(); });
  }
  function subscribeLocal(kind, push) {
    subs[kind].push(push);
    push();
    return function () { subs[kind] = subs[kind].filter(function (f) { return f !== push; }); };
  }

  /* ---------- API ---------- */
  KR.store = {
    get mode() { return mode; },

    // Menunggu db paling lama 4 detik, lalu pakai cadangan lokal.
    init: function () {
      readLocal();
      window.addEventListener('storage', function (e) {
        if (e.key === LOCAL_KEY && mode === 'local') { readLocal(); notifyLocal(); }
      });
      var claude = window.claude;
      if (!claude || typeof claude.use !== 'function') return Promise.resolve(mode);
      var timeout = new Promise(function (res) { setTimeout(function () { res(null); }, 4000); });
      return Promise.race([claude.use('db'), timeout]).then(function (d) {
        db = d || null;
        mode = db ? 'shared' : 'local';
        return mode;
      }, function () { mode = 'local'; return mode; });
    },

    // Callback menerima daftar pesanan, terbaru di atas.
    subscribeOrders: function (cb) {
      if (db) {
        return db.collection('orders').orderBy('createdAt', 'desc').limit(300).onSnapshot(
          function (snap) {
            cb(snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); }));
          },
          function (err) { console.error('orders', err); }
        );
      }
      return subscribeLocal('orders', function () { cb(localOrders()); });
    },

    // Callback menerima satu pesanan, atau null bila tidak ada.
    subscribeOrder: function (id, cb) {
      if (db) {
        return db.doc('orders/' + id).onSnapshot(
          function (snap) { cb(snap.exists ? Object.assign({ id: id }, snap.data()) : null); },
          function (err) { console.error('order', err); }
        );
      }
      return subscribeLocal('orders', function () {
        cb(local.orders[id] ? Object.assign({ id: id }, local.orders[id]) : null);
      });
    },

    // Callback menerima penimpa menu: { [idProduk]: { price, soldOut } }
    subscribeMenu: function (cb) {
      if (db) {
        return db.collection('menu').onSnapshot(
          function (snap) {
            var out = {};
            snap.docs.forEach(function (d) { out[d.id] = d.data(); });
            cb(out);
          },
          function (err) { console.error('menu', err); }
        );
      }
      return subscribeLocal('menu', function () { cb(local.menu); });
    },

    // Nomor urut pesanan hari ini (untuk A-001, A-002, ...).
    nextSeq: function (now) {
      var from = KR.orders.startOfDay(now);
      if (db) {
        return db.collection('orders').where('createdAt', '>=', from).get()
          .then(function (snap) { return snap.size + 1; });
      }
      var n = localOrders().filter(function (o) { return o.createdAt >= from; }).length;
      return Promise.resolve(n + 1);
    },

    createOrder: function (doc) {
      if (db) {
        var ref = db.collection('orders').doc();
        return ref.set(doc).then(function () { return ref.id; });
      }
      var id = 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      local.orders[id] = doc;
      writeLocal();
      notifyLocal();
      return Promise.resolve(id);
    },

    updateOrder: function (id, patch) {
      var next = Object.assign({}, patch, { updatedAt: Date.now() });
      if (db) return db.doc('orders/' + id).update(next);
      if (local.orders[id]) {
        local.orders[id] = Object.assign({}, local.orders[id], next);
        writeLocal();
        notifyLocal();
      }
      return Promise.resolve();
    },

    // Simpan harga dan status habis satu produk.
    setMenuItem: function (id, value) {
      var data = { price: Math.max(0, Math.round(Number(value.price) || 0)), soldOut: !!value.soldOut };
      if (db) return db.doc('menu/' + id).set(data);
      local.menu[id] = data;
      writeLocal();
      notifyLocal();
      return Promise.resolve();
    }
  };
})();
