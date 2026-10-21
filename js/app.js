/* Titik masuk: memilih halaman pelanggan atau dasbor dari alamat (#dasbor).
   Dasbor hanya terbuka untuk akun yang boleh mengubah halaman ini. */
(function () {
  var KR = globalThis.KR;
  var root = document.getElementById('app');
  var overlay = document.getElementById('overlay');
  var unmount = null;

  // Boleh membuka dasbor? Tanpa database (mode lokal) dibuka untuk uji coba.
  function canManage() {
    if (KR.store.mode === 'local') return Promise.resolve(true);
    var claude = window.claude;
    return claude.use('user').then(function (user) {
      return user ? user.canEdit() : false;
    }, function () { return false; });
  }

  function route() {
    if (unmount) { unmount(); unmount = null; }
    if (location.hash === '#dasbor') {
      canManage().then(function (ok) {
        if (location.hash !== '#dasbor') return;
        if (ok) unmount = KR.dasbor.mount(root);
        else KR.dasbor.denied(root);
      });
    } else {
      unmount = KR.customer.mount(root, overlay);
    }
    window.scrollTo(0, 0);
  }

  KR.store.init().then(function () {
    window.addEventListener('hashchange', route);
    route();
  });
})();
