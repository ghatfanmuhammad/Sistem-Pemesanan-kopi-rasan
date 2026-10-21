/* Pembuat elemen kecil. Teks selalu dipasang sebagai text node,
   jadi nama dan catatan dari pelanggan tidak pernah dibaca sebagai HTML. */
(function () {
  var KR = globalThis.KR || (globalThis.KR = {});

  // h('button', { class: 'btn', onclick: fn, 'aria-label': 'x' }, 'Teks', [anak...])
  KR.h = function h(tag, attrs) {
    var el = document.createElement(tag);
    var a = attrs || {};
    Object.keys(a).forEach(function (k) {
      var v = a[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'svg') el.innerHTML = v;      // hanya untuk gambar buatan sendiri (art.js)
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    });
    function add(child) {
      if (child === null || child === undefined || child === false) return;
      if (Array.isArray(child)) { child.forEach(add); return; }
      el.appendChild(child.nodeType ? child : document.createTextNode(String(child)));
    }
    for (var i = 2; i < arguments.length; i++) add(arguments[i]);
    return el;
  };

  // Simpan dan baca nilai kecil di browser. Aman bila storage ditolak.
  KR.mem = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem('kr.' + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try {
        if (value === null || value === undefined) localStorage.removeItem('kr.' + key);
        else localStorage.setItem('kr.' + key, JSON.stringify(value));
      } catch (e) { /* abaikan */ }
    }
  };
})();
