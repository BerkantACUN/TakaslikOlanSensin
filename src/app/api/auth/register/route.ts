import { NextResponse } from "next/server";
import { z } from "zod";
import { users } from "@/lib/repo";
import { hashPassword, setAuthCookie, signToken } from "@/lib/auth";

const schema = z.object({
  username: z
    .string()
    .min(3, "Kullanıcı adı en az 3 karakter olmalı")
    .max(20)
    .regex(/^[a-zA-Z0-9_.]+$/, "Sadece harf, rakam, _ ve . kullanılabilir"),
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  departmentId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
      { status: 400 },
    );
  }

  const { username, email, password, departmentId } = parsed.data;

  const exists = await users.exists({ email, username });
  if (exists?.sameEmail) {
    return NextResponse.json({ error: "Bu e-posta zaten kayıtlı" }, { status: 409 });
  }
  if (exists?.sameUsername) {
    return NextResponse.json({ error: "Bu kullanıcı adı alınmış" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await users.create({
    email,
    username,
    passwordHash,
    avatarName: username,
    departmentId: departmentId || null,
  });

  const token = await signToken({ sub: user.id, username: user.username });
  await setAuthCookie(token);

  return NextResponse.json({
    user: { id: user.id, username: user.username, email: user.email },
  });
}
