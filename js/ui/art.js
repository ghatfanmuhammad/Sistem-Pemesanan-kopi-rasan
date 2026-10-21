/* Ilustrasi produk dan ikon, semuanya SVG buatan sendiri (viewBox 72x72). */
(function () {
  var KR = globalThis.KR || (globalThis.KR = {});
  var W = '#FFFDFA';
  var OUT = '#C9BBAA';   // garis gambar, terbaca di kotak terang maupun gelap

  function glass(c) {
    return '<svg viewBox="0 0 72 72" aria-hidden="true">' +
      '<path d="M22.84 26H49.16L48.47 36H23.53Z" fill="' + c[0] + '"/>' +
      '<path d="M23.53 36H48.47L47.77 46H24.23Z" fill="' + c[1] + '"/>' +
      '<path d="M24.23 46H47.77L47.1 54a3 3 0 0 1-3 3H28a3 3 0 0 1-3-3Z" fill="' + c[2] + '"/>' +
      '<rect x="29" y="17" width="9" height="9" rx="2" fill="' + W + '" fill-opacity=".7" transform="rotate(-12 33 21)"/>' +
      '<path d="M22 14H50L47 54a3 3 0 0 1-3 3H28a3 3 0 0 1-3-3Z" fill="' + W + '" fill-opacity=".14" stroke="' + OUT + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M42 5L38 40" stroke="' + OUT + '" stroke-width="3" stroke-linecap="round"/></svg>';
  }

  function cup(c) {
    return '<svg viewBox="0 0 72 72" aria-hidden="true">' +
      '<path d="M50 32h4a6 6 0 0 1 0 12h-4" fill="none" stroke="' + OUT + '" stroke-width="3.5" stroke-linecap="round"/>' +
      '<path d="M18 30h32v14a12 12 0 0 1-12 12h-8a12 12 0 0 1-12-12Z" fill="' + W + '" stroke="' + OUT + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<ellipse cx="34" cy="30" rx="16" ry="3.5" fill="' + c[0] + '"/>' +
      '<path d="M28 24c-2-4 2-5 0-10M36 24c-2-4 2-5 0-10" fill="none" stroke="' + OUT + '" stroke-opacity=".85" stroke-width="2.5" stroke-linecap="round"/></svg>';
  }

  function bean(color, extra) {
    return '<ellipse cx="32" cy="32" rx="14" ry="22" transform="rotate(35 32 32)" fill="' + color + '"' + (extra || '') + '/>' +
      '<path d="M20 46C32 36 32 28 44 18" stroke="#3B2416" stroke-width="3" fill="none" stroke-linecap="round"/>';
  }

  function bag(c) {
    return '<svg viewBox="0 0 72 72" aria-hidden="true">' +
      '<path d="M20 20h32l3 40a3 3 0 0 1-3 3H20a3 3 0 0 1-3-3Z" fill="' + c[0] + '" stroke="' + OUT + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M20 20c0-5 4-8 8-8h16c4 0 8 3 8 8" fill="none" stroke="' + OUT + '" stroke-width="2.4" stroke-linecap="round"/>' +
      '<g transform="translate(22 28) scale(.42)">' + bean(W) + '</g></svg>';
  }

  KR.art = {
    // Isi kotak gambar produk. Kalau produk punya field `img`, tampilkan foto nyata.
    // Kalau tidak, fallback ke ilustrasi SVG.
    product: function (art, img) {
      if (img) {
        return '<img src="' + img + '" alt="" aria-hidden="true" class="art-photo">';
      }
      if (art.kind === 'cup') return cup(art.colors);
      if (art.kind === 'bag') return bag(art.colors);
      return glass(art.colors);
    },
    // Biji kopi sebagai penanda merek dan hiasan header
    mark: function (size) {
      return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true">' + bean('#F6F1EB') +
        '</svg>';
    },
    decor: function (size) {
      return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true">' + bean('#FFFDFA') + '</svg>';
    },
    cupLarge: function () { return cup(['#4A2C17']); },

    // Contoh QRIS. Bukan kode asli.
    qr: function () {
      return '<svg viewBox="0 0 23 23" role="img" aria-label="Contoh tampilan kode QRIS">' +
        '<rect width="23" height="23" fill="#FFFDFA"/>' +
        '<g fill="#2B1A12"><rect x="1" y="1" width="7" height="7"/><rect x="15" y="1" width="7" height="7"/><rect x="1" y="15" width="7" height="7"/></g>' +
        '<g fill="#FFFDFA"><rect x="2" y="2" width="5" height="5"/><rect x="16" y="2" width="5" height="5"/><rect x="2" y="16" width="5" height="5"/></g>' +
        '<g fill="#2B1A12"><rect x="3" y="3" width="3" height="3"/><rect x="17" y="3" width="3" height="3"/><rect x="3" y="17" width="3" height="3"/>' +
        '<path d="M9 1h1v1H9zM11 1h1v1h-1zM13 2h1v1h-1zM9 3h2v1H9zM12 3h1v1h-1zM9 5h1v1H9zM11 5h1v1h-1zM13 5h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM1 9h1v1H1zM3 9h2v1H3zM6 9h1v1H6zM2 11h1v1H2zM5 11h1v1H5zM7 10h1v1H7zM9 9h1v1H9zM11 9h2v1h-2zM14 9h1v1h-1zM16 9h1v1h-1zM18 10h1v1h-1zM20 9h2v1h-2zM9 11h1v1H9zM10 12h1v1h-1zM13 11h1v1h-1zM15 12h1v1h-1zM17 11h2v1h-2zM19 12h1v1h-1zM21 11h1v1h-1zM9 13h1v1H9zM11 14h1v1h-1zM12 13h1v1h-1zM14 14h1v1h-1zM16 13h1v1h-1zM18 14h2v1h-2zM20 13h1v1h-1zM9 16h1v1H9zM10 17h1v1h-1zM12 16h1v1h-1zM13 18h1v1h-1zM15 17h1v1h-1zM17 16h1v1h-1zM19 17h1v1h-1zM21 16h1v1h-1zM10 19h1v1h-1zM12 20h1v1h-1zM14 19h1v1h-1zM16 20h1v1h-1zM18 19h1v1h-1zM20 20h1v1h-1zM9 21h1v1H9zM11 21h2v1h-2zM2 13h1v1H2zM5 13h2v1H5zM21 21h1v1h-1z"/></g></svg>';
    },

    icon: {
      home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
      cupnav: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3c-1 1.5 1 2 0 4M12 3c-1 1.5 1 2 0 4"/></svg>',
      receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
      back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
      plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
      minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>',
      check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
      close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
      qris: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 14h2v2M14 18h2M18 18v2h2"/></svg>',
      wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><path d="M4 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5z"/><circle cx="16" cy="13.5" r="1.1"/></svg>',
      cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.4"/></svg>',
      bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>',
      bellOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 17V11a6 6 0 0 1 9-5.2M18 11v6l1.5 2h-15L6 17"/><path d="M10 21a2 2 0 0 0 4 0M4 4l16 16"/></svg>'
    }
  };
})();
