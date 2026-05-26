import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui/Toast";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "CampusSwap — Akademik Kaynak Takası",
  description:
    "Üniversite öğrencileri için akademik kaynak takas platformu. Kitap, not, sınav ve daha fazlasını güvenle değiş tokuş et.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getCurrentUser();

  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body>
        <ToastProvider>
          <Header
            me={
              me
                ? {
                    id: me.id,
                    username: me.username,
                    email: me.email,
                    avatarName: me.avatarName,
                  }
                : null
            }
          />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
