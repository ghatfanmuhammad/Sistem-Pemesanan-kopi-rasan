/* Logika pesanan: status, penyusunan dokumen pesanan, ringkasan harian.
   Fungsi murni, tanpa akses ke halaman atau database. */
(function () {
  var KR = globalThis.KR || (globalThis.KR = {});

  KR.STATUS_LABEL = {
    waiting: 'Menunggu pembayaran',
    paid: 'Dibayar',
    preparing: 'Diproses',
    ready: 'Siap diambil',
    done: 'Selesai',
    cancelled: 'Dibatalkan'
  };

  KR.METHOD_LABEL = { qris: 'QRIS', ewallet: 'E-wallet', cash: 'Tunai di kasir' };

  var NEXT = { waiting: 'paid', paid: 'preparing', preparing: 'ready', ready: 'done' };
  var NEXT_LABEL = { waiting: 'Tandai lunas', paid: 'Proses', preparing: 'Siap diambil', ready: 'Selesai' };
  var ACTIVE = ['waiting', 'paid', 'preparing', 'ready'];

  function startOfDay(now) {
    var d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  KR.orders = {
    next: function (status) { return NEXT[status] || null; },
    nextLabel: function (status) { return NEXT_LABEL[status] || ''; },
    // Pesanan hanya bisa dibatalkan sebelum diproses.
    canCancel: function (status) { return status === 'waiting' || status === 'paid'; },
    isActive: function (status) { return ACTIVE.indexOf(status) !== -1; },
    startOfDay: startOfDay,

    number: function (seq) {
      return 'A-' + (seq < 10 ? '00' : seq < 100 ? '0' : '') + seq;
    },

    optionText: function (line) {
      var parts = [];
      if (line.sugar) parts.push(line.sugar);
      if (line.ice) parts.push(line.ice);
      return parts.join(' · ');
    },

    // Susun dokumen pesanan dari keranjang dan isian checkout.
    build: function (input) {
      var lines = input.lines, form = input.form, now = input.now;
      var cash = input.method === 'cash';
      return {
        no: KR.orders.number(input.seq),
        status: cash ? 'waiting' : 'paid',
        method: input.method,
        paid: !cash,
        type: form.type === 'take' ? 'take' : 'dine',
        name: String(form.name || '').trim().slice(0, 40),
        table: form.type === 'take' ? '' : String(form.table || '').trim().slice(0, 10),
        note: String(form.note || '').trim().slice(0, 200),
        items: lines.map(function (l) {
          return {
            id: l.id, name: l.name, qty: l.qty, price: l.price,
            sugar: l.sugar || '', ice: l.ice || '', note: l.note || ''
          };
        }),
        count: KR.cart.count(lines),
        total: KR.cart.total(lines),
        createdAt: now,
        updatedAt: now
      };
    },

    // Ringkasan untuk kartu di dasbor. Hanya pesanan hari ini.
    summarize: function (orders, now) {
      var from = startOfDay(now);
      var today = orders.filter(function (o) { return o.createdAt >= from && o.status !== 'cancelled'; });
      var paid = today.filter(function (o) { return o.paid; });
      var sales = paid.reduce(function (n, o) { return n + o.total; }, 0);
      var tally = {};
      today.forEach(function (o) {
        o.items.forEach(function (i) { tally[i.name] = (tally[i.name] || 0) + i.qty; });
      });
      var top = Object.keys(tally)
        .map(function (name) { return { name: name, qty: tally[name] }; })
        .sort(function (a, b) { return b.qty - a.qty || a.name.localeCompare(b.name); })
        .slice(0, 3);
      return {
        count: today.length,
        sales: sales,
        active: today.filter(function (o) { return ACTIVE.indexOf(o.status) !== -1; }).length,
        average: paid.length ? Math.round(sales / paid.length) : 0,
        top: top
      };
    }
  };
})();
