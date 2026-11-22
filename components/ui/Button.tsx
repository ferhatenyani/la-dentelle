import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

type Variant = "primary" | "solid" | "secondary" | "outline" | "ghost" | "accent" | "dark" | "light";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary-container text-on-primary hover:bg-primary shadow-sm",
  solid: "bg-primary text-on-primary hover:bg-primary-container shadow-md",
  secondary: "bg-surface-container text-primary hover:bg-surface-container-high",
  outline: "border-[1.5px] border-primary-container text-primary-container hover:bg-primary-container/5",
  ghost: "text-primary hover:bg-primary-container/5",
  accent: "bg-secondary-container text-on-secondary-fixed hover:bg-secondary-fixed shadow-sm",
  dark: "bg-on-surface text-surface-container-lowest hover:bg-inverse-surface shadow-md",
  light: "bg-surface-container-lowest text-primary hover:bg-surface-container-low shadow-sm",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-label-md gap-1.5 rounded-xl",
  md: "h-11 px-5 text-label-lg gap-2 rounded-xl",
  lg: "h-12 px-6 text-label-lg gap-2 rounded-xl",
};

interface Common {
  variant?: Variant;
  size?: Size;
  icon?: string;
  iconRight?: string;
  loading?: boolean;
  children?: ReactNode;
  className?: string;
}

export function buttonClasses({ variant = "primary", size = "md", className }: Pick<Common, "variant" | "size" | "className">) {
  return cn(
    "inline-flex items-center justify-center font-bold whitespace-nowrap select-none transition-all duration-200",
    "active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

function Content({ icon, iconRight, loading, children, size }: Common) {
  const iconSize = size === "sm" ? 17 : 19;
  return (
    <>
      {loading ? (
        <span className="inline-block size-4 rounded-full border-2 border-current border-r-transparent animate-spin" aria-hidden />
      ) : (
        icon && <Icon name={icon} size={iconSize} />
      )}
      {children}
      {iconRight && !loading && <Icon name={iconRight} size={iconSize} />}
    </>
  );
}

export function Button({
  variant,
  size,
  icon,
  iconRight,
  loading,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: Common & Omit<ComponentProps<"button">, "children">) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...rest}
    >
      <Content icon={icon} iconRight={iconRight} loading={loading} size={size}>
        {children}
      </Content>
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  icon,
  iconRight,
  className,
  children,
  ...rest
}: Common & Omit<ComponentProps<typeof Link>, "children">) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...rest}>
      <Content icon={icon} iconRight={iconRight} size={size}>
        {children}
      </Content>
    </Link>
  );
}
