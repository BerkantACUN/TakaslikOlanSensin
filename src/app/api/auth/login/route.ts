import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { setAuthCookie, signToken, verifyPassword } from "@/lib/auth";

const schema = z.object({
  emailOrUsername: z.string().min(3),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const { emailOrUsername, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
    },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "E-posta/kullanıcı adı veya şifre hatalı" },
      { status: 401 },
    );
  }

  const token = await signToken({ sub: user.id, username: user.username });
  await setAuthCookie(token);

  return NextResponse.json({
    user: { id: user.id, username: user.username, email: user.email },
  });
}
