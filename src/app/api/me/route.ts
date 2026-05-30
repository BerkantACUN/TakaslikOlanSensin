import { NextResponse } from "next/server";
import { z } from "zod";
import { users } from "@/lib/repo";
import { clearAuthCookie, getCurrentUser } from "@/lib/auth";

const schema = z.object({
  avatarName: z.string().max(60).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  departmentId: z.string().optional().nullable(),
  skills: z.array(z.string().min(1).max(40)).max(20).optional(),
});

export async function PATCH(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  await users.updateProfile(me.id, {
    avatarName: parsed.data.avatarName ?? null,
    bio: parsed.data.bio ?? null,
    departmentId: parsed.data.departmentId || null,
    skills: parsed.data.skills,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(): Promise<NextResponse> {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const ok = await users.deleteAccount(me.id);
  if (!ok) {
    return NextResponse.json({ error: "Hesap silinemedi" }, { status: 500 });
  }
  await clearAuthCookie();
  return NextResponse.json({ ok: true });
}
