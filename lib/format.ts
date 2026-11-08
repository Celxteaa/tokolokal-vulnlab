// Sengaja TIDAK ada "use client" di sini. File lib/cart-context.tsx punya
// direktif "use client" karena berisi React context/hook — tapi itu
// membuat SEMUA export dari file itu (termasuk fungsi biasa seperti
// formatRupiah) diperlakukan sebagai referensi client component oleh
// Next.js App Router, sehingga gagal dipanggil langsung dari Server
// Component. Fungsi murni seperti ini harus tinggal di modul terpisah.
export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
