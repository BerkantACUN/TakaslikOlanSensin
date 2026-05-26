import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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

  const d = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: me.id },
      data: {
        avatarName: d.avatarName ?? null,
        bio: d.bio ?? null,
        departmentId: d.departmentId || null,
      },
    });

    if (Array.isArray(d.skills)) {
      await tx.userSkill.deleteMany({ where: { userId: me.id } });
      if (d.skills.length > 0) {
        await tx.userSkill.createMany({
          data: d.skills.map((s) => ({ userId: me.id, skill: s })),
          skipDuplicates: true,
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
