"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase-browser";
import { logEvent } from "@/lib/log-client";

export default function Navbar({
  username,
  isAdmin,
}: {
  username: string | null;
  isAdmin: boolean;
}) {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    logEvent("logout");
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="wordmark">
          Tokolokal
        </Link>

        <nav className="main-nav">
          <Link href="/produk">Produk</Link>
          <Link href="/produk?kategori=Kerajinan+Tangan">Kerajinan</Link>
          <Link href="/produk?kategori=Fashion+%26+Tekstil">Fashion</Link>
          <Link href="/tentang">Tentang</Link>
        </nav>

        <div className="header-actions">
          <Link href="/keranjang" className="cart-link" aria-label="Keranjang belanja">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 8H6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9.5" cy="20.5" r="1.3" />
              <circle cx="17" cy="20.5" r="1.3" />
            </svg>
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>

          <div className="account-menu">
            <button className="account-trigger" onClick={() => setMenuOpen((v) => !v)}>
              {username ? username : "Akun"}
            </button>
            {menuOpen && (
              <div className="account-dropdown" onMouseLeave={() => setMenuOpen(false)}>
                {username ? (
                  <>
                    <Link href="/profile" onClick={() => setMenuOpen(false)}>Profil Saya</Link>
                    <Link href="/pesanan" onClick={() => setMenuOpen(false)}>Pesanan Saya</Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setMenuOpen(false)}>Dashboard Admin</Link>
                    )}
                    <button onClick={handleLogout}>Keluar</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMenuOpen(false)}>Masuk</Link>
                    <Link href="/register" onClick={() => setMenuOpen(false)}>Daftar</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
