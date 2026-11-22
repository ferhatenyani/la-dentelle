import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-14 text-center",
        className,
      )}
    >
      <span className="mb-4 grid size-16 place-items-center rounded-full bg-surface-container text-primary">
        <Icon name={icon} size={30} />
      </span>
      <h2 className="text-headline-sm font-bold text-primary">{title}</h2>
      {description && <p className="mt-2 max-w-md text-body-md text-on-surface-variant">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-xl bg-surface-container", className)} />;
}

export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-margin py-8 md:px-6" aria-busy="true" aria-label="Chargement">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Skeleton className="h-64 md:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
