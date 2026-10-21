# Kopi Rasan: pemesanan online

Halaman pelanggan (menu, opsi gula dan es, keranjang, checkout, bayar, status pesanan) dan dasbor kasir dalam satu proyek tanpa build. Hanya HTML, CSS, dan JavaScript biasa.

## Menjalankan

Buka `index.html` di browser, atau jalankan server kecil:

    npx serve .

- Halaman pelanggan: alamat utama.
- Dasbor kasir: alamat yang sama dengan `#dasbor` di belakangnya.

## Struktur

    index.html            kerangka halaman dan urutan skrip
    css/
      tokens.css          warna, huruf, mode terang dan gelap (ganti warna di sini)
      base.css            reset, tombol, isian, status
      customer.css        halaman pelanggan
      dasbor.css          dasbor kasir
    js/
      data/menu.js        15 produk, harga, opsi gula dan es (ubah menu di sini)
      lib/format.js       format rupiah dan jam
      lib/cart.js         logika keranjang (fungsi murni)
      lib/orders.js       status pesanan, susun pesanan, ringkasan harian
      lib/store.js        penyimpanan pesanan (lihat bagian di bawah)
      ui/dom.js           pembuat elemen kecil
      ui/art.js           ilustrasi minuman dan ikon
      ui/customer.js      layar pelanggan
      ui/dasbor.js        layar dasbor
      app.js              memilih halaman pelanggan atau dasbor

## Penyimpanan pesanan

`js/lib/store.js` punya dua mode dengan antarmuka yang sama:

- **shared**: dipakai saat halaman berjalan sebagai Artifact di Claude. Pesanan disimpan di database bersama, jadi pelanggan dan kasir di perangkat berbeda saling melihat.
- **local**: dipakai di luar Claude. Pesanan hanya disimpan di browser yang sama (localStorage). Cukup untuk mencoba alur di satu perangkat, tetapi pesanan dari ponsel pelanggan tidak sampai ke komputer kasir.

Untuk dipakai pelanggan sungguhan, ganti isi `store.js` dengan server dan database sendiri. Fungsi yang harus ada: `init`, `subscribeOrders`, `subscribeOrder`, `subscribeMenu`, `nextSeq`, `createOrder`, `updateOrder`, `setMenuItem`. Layar tidak perlu diubah.

## Yang masih simulasi

- Pembayaran QRIS dan e-wallet hanya tampilan. Tidak ada uang yang dipotong. Pembayaran otomatis butuh payment gateway (misalnya Midtrans atau Xendit) dan server.
- Dasbor tidak punya login sendiri. Di Claude, aksesnya mengikuti pengaturan Share. Di luar Claude, siapa pun yang membuka `#dasbor` bisa masuk.

## Mengubah menu

Edit `js/data/menu.js`: nama, kategori, harga, `sugar` (ada opsi gula), `ice` (ada opsi es). Owner juga bisa mengubah harga dan menandai habis dari tab Menu di dasbor.
