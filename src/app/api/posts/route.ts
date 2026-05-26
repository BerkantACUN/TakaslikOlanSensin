import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const RESOURCE_TYPES = [
  "BOOK",
  "PDF",
  "NOTES",
  "SLIDES",
  "EXAM",
  "PROJECT",
  "OTHER",
] as const;

const createSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional().nullable(),
  offerTitle: z.string().min(2).max(120),
  offerType: z.enum(RESOURCE_TYPES),
  offerDescription: z.string().max(500).optional().nullable(),
  offerDepartmentId: z.string().optional().nullable(),
  requestTitle: z.string().min(2).max(120),
  requestType: z.enum(RESOURCE_TYPES),
  requestDescription: z.string().max(500).optional().nullable(),
  requestDepartmentId: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const type = url.searchParams.get("type");
  const department = url.searchParams.get("department");

  const where: any = { status: "ACTIVE" };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
    ];
  }
  if (type) where.offer = { type };
  if (department) where.owner = { departmentId: department };

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      owner: { select: { id: true, username: true, avatarName: true } },
      offer: { select: { title: true, type: true } },
      request: { select: { title: true, type: true } },
    },
  });

  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
      { status: 400 },
    );
  }

  const d = parsed.data;

  const post = await prisma.$transaction(async (tx) => {
    const offer = await tx.resource.create({
      data: {
        title: d.offerTitle,
        type: d.offerType,
        description: d.offerDescription || null,
        departmentId: d.offerDepartmentId || null,
      },
    });
    const request = await tx.resource.create({
      data: {
        title: d.requestTitle,
        type: d.requestType,
        description: d.requestDescription || null,
        departmentId: d.requestDepartmentId || null,
      },
    });
    return tx.post.create({
      data: {
        title: d.title,
        description: d.description || null,
        ownerId: me.id,
        offerId: offer.id,
        requestId: request.id,
      },
    });
  });

  return NextResponse.json({ post });
}
