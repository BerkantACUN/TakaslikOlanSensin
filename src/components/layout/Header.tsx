"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

type Me = {
  id: string;
  username: string;
  email: string;
  avatarName: string | null;
} | null;

export function Header({ me }: { me: Me }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/posts${params.size ? `?${params.toString()}` : ""}`);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[var(--color-mist)]">
      <div className="page-container flex items-center gap-4 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="w-9 h-9 grid place-items-center rounded-[12px] bg-[var(--color-brand-500)] text-white font-bold tracking-tight text-[16px]">
            cs
          </span>
          <span className="font-bold text-[18px] tracking-tight hidden sm:block">
            CampusSwap
          </span>
        </Link>

        {/* Arama */}
        <form
          onSubmit={submitSearch}
          className="flex-1 max-w-2xl mx-auto hidden md:flex items-center bg-white border border-[var(--color-pebble)] rounded-[20px] h-12 pl-4 pr-1 hover:shadow-[var(--shadow-subtle)] transition"
        >
          <Icon.Search className="text-[var(--color-slate)] shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kitap, ders notu, kaynak ara..."
            className="flex-1 bg-transparent outline-none px-3 text-[14px] placeholder:text-[var(--color-slate)]"
          />
          <button
            type="submit"
            className="h-10 px-4 rounded-[16px] bg-[var(--color-brand-500)] text-white font-semibold text-[13px] hover:bg-[var(--color-brand-600)]"
          >
            Ara
          </button>
        </form>

        {/* Sağ menü */}
        <nav className="flex items-center gap-1 ml-auto">
          <Link
            href="/posts"
            className={cn(
              "hidden sm:inline-flex items-center h-10 px-3 rounded-[10px] text-[14px] font-semibold transition",
              isActive("/posts") && !pathname.startsWith("/posts/new")
                ? "text-[var(--color-brand-600)]"
                : "text-[var(--color-carbon)] hover:bg-[var(--color-fog)]",
            )}
          >
            Keşfet
          </Link>

          {me && (
            <>
              <Link
                href="/exchanges"
                className={cn(
                  "hidden sm:inline-flex items-center h-10 px-3 rounded-[10px] text-[14px] font-semibold transition",
                  isActive("/exchanges")
                    ? "text-[var(--color-brand-600)]"
                    : "text-[var(--color-carbon)] hover:bg-[var(--color-fog)]",
                )}
              >
                Takaslarım
              </Link>
              <Link
                href="/favorites"
                className="hidden md:inline-flex items-center justify-center w-10 h-10 rounded-full text-[var(--color-carbon)] hover:bg-[var(--color-fog)]"
                aria-label="Favoriler"
              >
                <Icon.Heart />
              </Link>
              <Link
                href="/messages"
                className="hidden md:inline-flex items-center justify-center w-10 h-10 rounded-full text-[var(--color-carbon)] hover:bg-[var(--color-fog)]"
                aria-label="Mesajlar"
              >
                <Icon.MessageCircle />
              </Link>
              <Link
                href="/posts/new"
                className="hidden sm:inline-flex items-center gap-1.5 h-10 px-4 rounded-[10px] bg-[var(--color-carbon)] text-white text-[13px] font-semibold hover:bg-black"
              >
                <Icon.Plus size={16} />
                İlan ver
              </Link>
            </>
          )}

          {me ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((s) => !s)}
                className="flex items-center gap-2 pl-3 pr-1 h-11 rounded-full border border-[var(--color-pebble)] bg-white hover:shadow-[var(--shadow-subtle)] transition"
              >
                <span className="w-1 h-1 rounded-full bg-[var(--color-slate)] hidden sm:block" />
                <Avatar name={me.avatarName ?? me.username} size={32} />
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-[16px] shadow-[var(--shadow-pop)] border border-[var(--color-mist)] overflow-hidden animate-fade-up">
                  <div className="px-4 py-3 border-b border-[var(--color-mist)]">
                    <p className="font-semibold text-[14px]">
                      {me.avatarName ?? me.username}
                    </p>
                    <p className="text-[12px] text-[var(--color-slate)] truncate">
                      {me.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <DropdownLink href={`/profile/${me.id}`} onClick={() => setOpen(false)}>
                      Profilim
                    </DropdownLink>
                    <DropdownLink href="/posts/new" onClick={() => setOpen(false)}>
                      Yeni ilan
                    </DropdownLink>
                    <DropdownLink href="/exchanges" onClick={() => setOpen(false)}>
                      Takaslarım
                    </DropdownLink>
                    <DropdownLink href="/favorites" onClick={() => setOpen(false)}>
                      Favorilerim
                    </DropdownLink>
                    <DropdownLink href="/messages" onClick={() => setOpen(false)}>
                      Mesajlar
                    </DropdownLink>
                    <DropdownLink href="/settings" onClick={() => setOpen(false)}>
                      Ayarlar
                    </DropdownLink>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-3 text-[13px] text-[var(--color-carbon)] hover:bg-[var(--color-fog)] border-t border-[var(--color-mist)] flex items-center gap-2"
                  >
                    <Icon.Logout size={16} />
                    Çıkış yap
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center h-10 px-3 rounded-[10px] text-[14px] font-semibold hover:bg-[var(--color-fog)]"
              >
                Giriş yap
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center h-10 px-4 rounded-[10px] bg-[var(--color-brand-500)] text-white text-[13px] font-semibold hover:bg-[var(--color-brand-600)]"
              >
                Üye ol
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function DropdownLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2.5 text-[13px] text-[var(--color-carbon)] hover:bg-[var(--color-fog)]"
    >
      {children}
    </Link>
  );
}
