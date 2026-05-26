import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--color-mist)] bg-[var(--color-fog)]">
      <div className="page-container py-10 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-9 h-9 grid place-items-center rounded-[12px] bg-[var(--color-brand-500)] text-white font-bold">
              cs
            </span>
            <span className="font-bold text-[16px]">CampusSwap</span>
          </div>
          <p className="text-[13px] text-[var(--color-slate)] leading-relaxed">
            Üniversite öğrencileri için akademik kaynak takas platformu.
            Kitabını, notunu, sınavını güvenle paylaş.
          </p>
        </div>

        <FooterCol title="Keşfet">
          <FooterLink href="/posts">Tüm ilanlar</FooterLink>
          <FooterLink href="/posts?type=BOOK">Kitaplar</FooterLink>
          <FooterLink href="/posts?type=NOTES">Notlar</FooterLink>
          <FooterLink href="/posts?type=EXAM">Çıkmış sınavlar</FooterLink>
        </FooterCol>

        <FooterCol title="Hesap">
          <FooterLink href="/login">Giriş yap</FooterLink>
          <FooterLink href="/register">Üye ol</FooterLink>
          <FooterLink href="/exchanges">Takaslarım</FooterLink>
          <FooterLink href="/favorites">Favorilerim</FooterLink>
        </FooterCol>

        <FooterCol title="Topluluk">
          <FooterLink href="/about">Hakkımızda</FooterLink>
          <FooterLink href="/community-rules">Topluluk kuralları</FooterLink>
          <FooterLink href="/privacy">Gizlilik</FooterLink>
          <FooterLink href="/terms">Kullanım koşulları</FooterLink>
        </FooterCol>
      </div>

      <div className="border-t border-[var(--color-mist)]">
        <div className="page-container py-5 text-[12px] text-[var(--color-slate)] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} CampusSwap — Akademik kaynak takası</p>
          <p>Grup 13 · Veritabanı Yönetim Sistemleri Projesi</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold text-[13px] uppercase tracking-wider text-[var(--color-carbon)] mb-3">
        {title}
      </h4>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-[13px] text-[var(--color-slate)] hover:text-[var(--color-carbon)] hover:underline"
      >
        {children}
      </Link>
    </li>
  );
}
