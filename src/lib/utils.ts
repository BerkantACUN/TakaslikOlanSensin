import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  const intervals: [number, string][] = [
    [31536000, "yıl"],
    [2592000, "ay"],
    [86400, "gün"],
    [3600, "saat"],
    [60, "dakika"],
  ];

  for (const [secondsInUnit, unit] of intervals) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) return `${value} ${unit} önce`;
  }
  return "az önce";
}

export function avatarUrl(seed: string | null | undefined) {
  const safe = encodeURIComponent(seed ?? "anon");
  return `https://api.dicebear.com/7.x/initials/svg?seed=${safe}&backgroundType=gradientLinear&backgroundColor=2f6fff,87b6ff,1f56e6`;
}

export function postStatusLabel(status: string) {
  return (
    {
      ACTIVE: "Aktif",
      RESERVED: "Rezerve",
      COMPLETED: "Tamamlandı",
      CANCELLED: "İptal",
    } as Record<string, string>
  )[status] ?? status;
}

export function exchangeStatusLabel(status: string) {
  return (
    {
      PENDING: "Bekliyor",
      ACCEPTED: "Onaylandı",
      REJECTED: "Reddedildi",
      COMPLETED: "Tamamlandı",
      CANCELLED: "İptal",
    } as Record<string, string>
  )[status] ?? status;
}

export function resourceTypeLabel(type: string) {
  return (
    {
      BOOK: "Kitap",
      PDF: "PDF",
      NOTES: "Not",
      SLIDES: "Sunum",
      EXAM: "Sınav",
      PROJECT: "Proje",
      OTHER: "Diğer",
    } as Record<string, string>
  )[type] ?? type;
}
