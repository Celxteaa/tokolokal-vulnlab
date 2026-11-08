export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="footer-col">
          <h3 className="wordmark">Tokolokal</h3>
          <p className="muted">
            Menghubungkan pengrajin dan produsen lokal Indonesia langsung
            dengan pembeli di seluruh negeri.
          </p>
        </div>
        <div className="footer-col">
          <h4>Belanja</h4>
          <a href="/produk">Semua Produk</a>
          <a href="/produk?kategori=Makanan+%26+Minuman">Makanan &amp; Minuman</a>
          <a href="/produk?kategori=Dekorasi+Rumah">Dekorasi Rumah</a>
        </div>
        <div className="footer-col">
          <h4>Bantuan</h4>
          <a href="/pesanan">Lacak Pesanan</a>
          <a href="/tentang">Tentang Kami</a>
        </div>
        <div className="footer-col">
          <h4>Akun</h4>
          <a href="/login">Masuk</a>
          <a href="/register">Daftar Akun</a>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} Tokolokal. Seluruh hak cipta dilindungi.</span>
      </div>
    </footer>
  );
}
