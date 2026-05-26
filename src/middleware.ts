import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PREFIXES = [
  "/posts/new",
  "/posts/edit",
  "/exchanges",
  "/messages",
  "/favorites",
  "/reports",
  "/settings",
];

const AUTH_PAGES = ["/login", "/register"];

async function isValid(token: string | undefined) {
  if (!token || !process.env.JWT_SECRET) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("campusswap_token")?.value;
  const authed = await isValid(token);

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.includes(pathname) && authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/posts/new",
    "/posts/edit/:path*",
    "/exchanges/:path*",
    "/messages/:path*",
    "/favorites",
    "/reports/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
