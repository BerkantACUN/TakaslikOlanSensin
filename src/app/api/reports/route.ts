import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const REASONS = [
  "SPAM",
  "INAPPROPRIATE",
  "FRAUD",
  "HARASSMENT",
  "OTHER",
] as const;

const schema = z.object({
  targetType: z.string().min(1).max(20),
  targetId: z.string().min(1),
  reportedUserId: z.string().optional().nullable(),
  reason: z.enum(REASONS),
  details: z.string().max(1000).optional().nullable(),
});

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const d = parsed.data;
  const report = await prisma.report.create({
    data: {
      reporterId: me.id,
      targetType: d.targetType,
      targetId: d.targetId,
      reportedUserId: d.reportedUserId || null,
      reason: d.reason,
      details: d.details || null,
    },
  });

  return NextResponse.json({ report });
}
