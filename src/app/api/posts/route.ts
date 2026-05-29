import { NextResponse } from "next/server";
import { z } from "zod";
import { posts } from "@/lib/repo";
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
  const me = await getCurrentUser();
  const list = await posts.list(me ? { id: me.id } : null, {
    q: url.searchParams.get("q") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    departmentId: url.searchParams.get("department") ?? undefined,
    sort: (url.searchParams.get("sort") as "new" | "popular") ?? undefined,
  });
  return NextResponse.json({ posts: list });
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
  const post = await posts.create({
    ownerId: me.id,
    title: d.title,
    description: d.description || null,
    offer: {
      title: d.offerTitle,
      type: d.offerType,
      description: d.offerDescription || null,
      departmentId: d.offerDepartmentId || null,
    },
    request: {
      title: d.requestTitle,
      type: d.requestType,
      description: d.requestDescription || null,
      departmentId: d.requestDepartmentId || null,
    },
  });

  return NextResponse.json({ post });
}
