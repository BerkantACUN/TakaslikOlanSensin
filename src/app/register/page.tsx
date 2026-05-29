import Link from "next/link";
import { departments } from "@/lib/repo";
import { Icon } from "@/components/ui/Icon";
import { RegisterForm } from "./RegisterForm";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const depts = await departments.list();

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      {/* Form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--color-slate)] hover:text-[var(--color-carbon)] mb-8"
          >
            <Icon.ArrowLeft size={14} /> Ana sayfaya dön
          </Link>

          <h1 className="text-[32px] font-bold tracking-tight mb-1">
            Aramıza katıl
          </h1>
          <p className="text-[14px] text-[var(--color-slate)] mb-7">
            Üniversite öğrencileri için akademik kaynak takası — ücretsiz, hızlı.
          </p>

          <RegisterForm departments={depts} />

          <div className="mt-6 text-center text-[13px] text-[var(--color-slate)]">
            Zaten bir hesabın var mı?{" "}
            <Link
              href="/login"
              className="font-semibold text-[var(--color-carbon)] underline underline-offset-2"
            >
              Giriş yap
            </Link>
          </div>
        </div>
      </div>

      {/* Görsel */}
      <div className="hidden lg:block relative">
        <div className="absolute inset-6 rounded-[28px] bg-gradient-to-tr from-[#1942b8] via-[var(--color-brand-600)] to-[var(--color-brand-400)] overflow-hidden">
          <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.45),transparent_45%),radial-gradient(circle_at_20%_70%,rgba(245,158,11,0.35),transparent_50%)]" />
          <div className="relative h-full flex flex-col justify-between p-10 text-white">
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 grid place-items-center rounded-[12px] bg-white/20 backdrop-blur font-bold">
                cs
              </span>
              <span className="font-bold text-[18px]">CampusSwap</span>
            </div>

            <ul className="space-y-4">
              <Feature
                title="Kampüs dostu takas"
                desc="Üniversite e-postanla bölümünü doğrula, güvenli bir öğrenci topluluğunun parçası ol."
              />
              <Feature
                title="Mesajlaşma & değerlendirme"
                desc="Takas başına özel sohbet ve karşılıklı puanlama — kötü deneyimler topluluk dışında kalır."
              />
              <Feature
                title="Favori ve filtreleme"
                desc="Bölüm, kaynak türü ve isteğe göre filtrele; beğendiklerini favori listene at."
              />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-1 w-6 h-6 grid place-items-center rounded-full bg-white/20 backdrop-blur shrink-0">
        <Icon.Check size={14} />
      </span>
      <div>
        <p className="font-semibold text-[15px]">{title}</p>
        <p className="text-[13px] text-white/80 leading-relaxed">{desc}</p>
      </div>
    </li>
  );
}
