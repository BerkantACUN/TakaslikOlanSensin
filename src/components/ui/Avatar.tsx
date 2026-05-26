import { avatarUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  size = 40,
  className,
}: {
  name: string | null | undefined;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full overflow-hidden bg-[var(--color-brand-100)] shrink-0",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarUrl(name)}
        alt={name ?? "avatar"}
        width={size}
        height={size}
        className="w-full h-full object-cover"
      />
    </span>
  );
}
