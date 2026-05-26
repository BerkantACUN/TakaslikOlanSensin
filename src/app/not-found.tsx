import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="page-container py-24 flex flex-col items-center text-center">
      <div className="text-[80px] font-bold tracking-tight bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-accent-amber)] bg-clip-text text-transparent leading-none">
        404
      </div>
      <h1 className="text-[28px] font-bold tracking-tight mt-4">
        Aradığın sayfa bulunamadı
      </h1>
      <p className="text-[14px] text-[var(--color-slate)] mt-2 max-w-md">
        Bağlantı eski olabilir veya silinmiş bir ilana yöneliyor olabilirsin.
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/">
          <Button>Ana sayfa</Button>
        </Link>
        <Link href="/posts">
          <Button variant="outline">İlanları gör</Button>
        </Link>
      </div>
    </div>
  );
}
