import { redirect } from "next/navigation";
import { departments } from "@/lib/repo";
import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?next=/settings");

  const depts = await departments.list();

  return (
    <div className="page-container py-8 md:py-10 max-w-2xl">
      <h1 className="text-[32px] md:text-[36px] font-bold tracking-tight">
        Ayarlar
      </h1>
      <p className="text-[14px] text-[var(--color-slate)] mt-1 mb-6">
        Profil bilgilerini güncelle.
      </p>

      <SettingsForm
        initial={{
          avatarName: me.avatarName ?? "",
          bio: me.bio ?? "",
          departmentId: me.departmentId ?? "",
          skills: me.skills,
        }}
        departments={depts}
      />
    </div>
  );
}
