/* Logika keranjang. Fungsi murni: tidak menyentuh halaman, mudah diuji.
   Satu baris keranjang = satu produk dengan satu kombinasi opsi dan catatan.
   { id, name, price, sugar, ice, note, qty } */
(function () {
  var KR = globalThis.KR || (globalThis.KR = {});
  var MAX_QTY = 99;

  function clamp(n) {
    n = Math.floor(Number(n) || 0);
    return Math.max(0, Math.min(MAX_QTY, n));
  }

  // Kunci baris: produk yang sama dengan opsi berbeda menjadi baris terpisah.
  function lineKey(l) {
    return [l.id, l.sugar || '-', l.ice || '-', l.note || ''].join('|');
  }

  KR.cart = {
    MAX_QTY: MAX_QTY,
    lineKey: lineKey,

    add: function (lines, entry, qty) {
      var key = lineKey(entry);
      var add = clamp(qty || 1);
      var found = false;
      var next = lines.map(function (l) {
        if (lineKey(l) !== key) return l;
        found = true;
        return Object.assign({}, l, { qty: clamp(l.qty + add) });
      });
      if (!found && add > 0) next.push(Object.assign({}, entry, { qty: add }));
      return next;
    },

    // qty 0 menghapus baris
    setQty: function (lines, key, qty) {
      var q = clamp(qty);
      return lines
        .map(function (l) { return lineKey(l) === key ? Object.assign({}, l, { qty: q }) : l; })
        .filter(function (l) { return l.qty > 0; });
    },

    count: function (lines) {
      return lines.reduce(function (n, l) { return n + l.qty; }, 0);
    },

    total: function (lines) {
      return lines.reduce(function (n, l) { return n + l.qty * l.price; }, 0);
    },

    // Samakan harga dengan menu terbaru dan tandai produk yang habis.
    reprice: function (lines, menu) {
      var byId = {};
      menu.forEach(function (p) { byId[p.id] = p; });
      return lines.map(function (l) {
        var p = byId[l.id];
        if (!p) return Object.assign({}, l, { soldOut: true });
        return Object.assign({}, l, { price: p.price, soldOut: !!p.soldOut });
      });
    }
  };
})();
