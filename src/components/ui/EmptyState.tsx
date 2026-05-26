export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-[20px] border border-dashed border-[var(--color-pebble)] bg-white/60">
      {icon && (
        <div className="w-14 h-14 rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-600)] grid place-items-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-[20px] font-semibold text-[var(--color-carbon)] tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-md text-[14px] text-[var(--color-slate)] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
