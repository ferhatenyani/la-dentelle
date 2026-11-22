import { cn } from "@/lib/cn";

interface IconProps {
  name: string;
  className?: string;
  fill?: boolean;
  /** px size, defaults to 24 */
  size?: number;
}

/** Material Symbols Outlined glyph (decorative by default). */
export function Icon({ name, className, fill, size }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined", fill && "icon-fill", className)}
      style={size ? { fontSize: size } : undefined}
    >
      {name}
    </span>
  );
}
