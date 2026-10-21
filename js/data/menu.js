/* Daftar menu Kopi Rasan: satu-satunya sumber data produk.
   Ubah harga, opsi, atau tambah produk di sini. Owner juga bisa mengubah
   harga dan menandai habis dari dasbor (disimpan sebagai penimpa di database). */
(function () {
  var KR = globalThis.KR || (globalThis.KR = {});

  KR.CATEGORIES = [
    ['semua', 'Semua'],
    ['kopi', 'Kopi'],
    ['nonkopi', 'Non-kopi'],
    ['manual', 'Manual brew'],
    ['biji', 'Biji kopi']
  ];

  KR.SUGAR = ['No sugar', 'Less sugar', 'Normal sugar'];
  KR.ICE = ['No ice', 'Less ice', 'Normal ice'];
  KR.DEFAULT_SUGAR = 'Normal sugar';
  KR.DEFAULT_ICE = 'Normal ice';

  function glass(a, b, c) { return { kind: 'glass', colors: [a, b, c] }; }
  function cup(a) { return { kind: 'cup', colors: [a] }; }

  // sugar: punya opsi gula. ice: punya opsi es. img: path foto nyata (relatif ke index.html).
  KR.MENU = [
    { id: 'es-kopi-susu-gula-aren', name: 'Es Kopi Susu Gula Aren', cat: 'kopi', price: 12000, sugar: true, ice: true,
      desc: 'Espresso, susu segar, dan gula aren cair.',
      img: 'img/gula aren.jpg', art: glass('#4A2C17', '#F1E3CF', '#9A5F28') },
    { id: 'iced-americano', name: 'Iced Americano', cat: 'kopi', price: 10000, sugar: true, ice: true,
      desc: 'Double espresso dengan air dingin.',
      img: 'img/ice americano.jpg', art: glass('#3A2216', '#2F1B10', '#2F1B10') },
    { id: 'cafe-latte', name: 'Cafe Latte', cat: 'kopi', price: 15000, sugar: true, ice: false,
      desc: 'Espresso dengan susu steam yang lembut.',
      img: 'img/caffe latte.jpg', art: cup('#D6B48A') },
    { id: 'caramel-macchiato', name: 'Caramel Macchiato', cat: 'kopi', price: 15000, sugar: true, ice: false,
      desc: 'Susu, espresso, dan saus karamel.',
      img: 'img/caramel machiato.jpg', art: cup('#C48A4E') },
    { id: 'spanish-latte', name: 'Spanish Latte', cat: 'kopi', price: 17000, sugar: true, ice: false,
      desc: 'Latte dengan susu kental manis.',
      img: 'img/spanish latte.png', art: cup('#D6B48A') },
    { id: 'butterscotch-latte', name: 'Butterscotch Latte', cat: 'kopi', price: 17000, sugar: true, ice: false,
      desc: 'Latte dengan sirup butterscotch.',
      img: 'img/butterschote.jpg', art: cup('#C9984F') },
    { id: 'espresso', name: 'Espresso', cat: 'kopi', price: 12000, sugar: true, ice: true,
      desc: 'Satu shot pekat, tanpa susu.',
      img: 'img/ekspresso.jpg', art: glass('#2F1B10', '#3A2216', '#2F1B10') },
    { id: 'matcha-latte', name: 'Matcha Latte', cat: 'nonkopi', price: 17000, sugar: true, ice: true,
      desc: 'Matcha dan susu segar.',
      img: 'img/machalatte.jpg', art: glass('#8FA566', '#E9EBD2', '#6F8A4A') },
    { id: 'chocolate', name: 'Chocolate', cat: 'nonkopi', price: 15000, sugar: true, ice: true,
      desc: 'Coklat pekat dengan susu.',
      img: 'img/coklat.jpg', art: glass('#5A3523', '#F1E3CF', '#3B2216') },
    { id: 'taro-latte', name: 'Taro Latte', cat: 'nonkopi', price: 17000, sugar: true, ice: true,
      desc: 'Taro manis dengan susu.',
      img: 'img/taro.jpg', art: glass('#B9A0C9', '#E6DAEC', '#9C7FB3') },
    { id: 'lychee-tea', name: 'Lychee Tea', cat: 'nonkopi', price: 17000, sugar: true, ice: true,
      desc: 'Teh dengan buah leci.',
      img: 'img/lecitea.jpg', art: glass('#F4C9C0', '#FBE7E1', '#E9A89C') },
    { id: 'v60', name: 'V60', cat: 'manual', price: 15000, sugar: true, ice: true,
      desc: 'Seduh tangan, rasa bersih dan terang.',
      img: 'img/v60.jpg', art: glass('#7A4A2A', '#9A5F28', '#7A4A2A') },
    { id: 'japanese-iced-coffee', name: 'Japanese Iced Coffee', cat: 'manual', price: 15000, sugar: true, ice: true,
      desc: 'Diseduh panas langsung di atas es.',
      img: 'img/japanes iced coffe.jpg', art: glass('#5A3320', '#8A5530', '#6B3F24') },
    { id: 'vietnam-drip', name: 'Vietnam Drip', cat: 'manual', price: 15000, sugar: true, ice: true,
      desc: 'Kopi tetes khas Vietnam yang kaya dan manis.',
      img: 'img/vietnam drip.jpg', art: glass('#3B2216', '#5A3523', '#3B2216') },
    { id: 'biji-arabika', name: 'Biji Kopi Arabika', cat: 'biji', price: 50000, sugar: false, ice: false,
      desc: 'Biji sangrai untuk dibawa pulang.',
      img: 'img/biji kopi arabica.jpg', art: { kind: 'bag', colors: ['#6F4E37'] } }
  ];

  // overrides: { [id]: { price?: number, soldOut?: boolean } }
  KR.applyOverrides = function (overrides) {
    var ov = overrides || {};
    return KR.MENU.map(function (p) {
      var o = ov[p.id] || {};
      var price = typeof o.price === 'number' && o.price >= 0 ? o.price : p.price;
      return Object.assign({}, p, { price: price, soldOut: !!o.soldOut });
    });
  };
})();
