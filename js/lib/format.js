/* Format tampilan: rupiah dan jam. */
(function () {
  var KR = globalThis.KR || (globalThis.KR = {});

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  KR.fmt = {
    // 12000 -> "Rp12.000"
    rupiah: function (n) {
      var v = Math.round(Number(n) || 0);
      var s = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return (v < 0 ? '-Rp' : 'Rp') + s;
    },
    // timestamp -> "20.41"
    clock: function (ts) {
      var d = new Date(ts);
      return pad(d.getHours()) + '.' + pad(d.getMinutes());
    },
    // "5 mnt lalu"
    ago: function (ts, now) {
      var m = Math.max(0, Math.floor(((now || Date.now()) - ts) / 60000));
      if (m < 1) return 'baru saja';
      if (m < 60) return m + ' mnt lalu';
      return Math.floor(m / 60) + ' jam lalu';
    },
    pad: pad
  };
})();
