import Link from "next/link";
import { departments } from "@/lib/repo";
import { requireUser } from "@/lib/auth";
import { Icon } from "@/components/ui/Icon";
import { NewPostForm } from "./NewPostForm";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requireUser();
  const depts = await departments.list();

  return (
    <div className="page-container py-8 md:py-10 max-w-3xl">
      <Link
        href="/posts"
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-slate)] hover:text-[var(--color-carbon)] mb-4"
      >
        <Icon.ArrowLeft size={14} />
        İlanlara dön
      </Link>

      <h1 className="text-[32px] md:text-[36px] font-bold tracking-tight">
        Yeni ilan oluştur
      </h1>
      <p className="text-[14px] text-[var(--color-slate)] mt-1 mb-8">
        Sunduğun kaynağı ve karşılığında aradığını net biçimde anlat. Detaylı
        ilanlar daha hızlı eşleşir.
      </p>

      <NewPostForm departments={depts} />
    </div>
  );
}
