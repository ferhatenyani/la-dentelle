import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export const inputClasses =
  "w-full h-12 rounded-lg bg-surface-container-low border border-on-surface/10 px-4 text-body-md text-on-surface placeholder:text-outline transition-[border-color,box-shadow] outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container aria-[invalid=true]:border-error aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-error/40";

interface FieldProps {
  label: ReactNode;
  error?: string | null;
  hint?: ReactNode;
  icon?: string;
  aside?: ReactNode;
  className?: string;
  children?: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

/** Label + control + error/hint wiring (aria-describedby, aria-invalid). */
export function Field({ label, error, hint, aside, className, children }: FieldProps) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-label-md font-bold text-on-surface">
          {label}
        </label>
        {aside}
      </div>
      {children?.({ id, describedBy: error || hint ? msgId : undefined, invalid: !!error })}
      {error ? (
        <p id={msgId} role="alert" className="flex items-start gap-1 text-body-sm text-error">
          <Icon name="error" size={16} className="mt-0.5" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={msgId} className="text-body-sm text-on-surface-variant">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends Omit<ComponentProps<"input">, "id"> {
  label: ReactNode;
  error?: string | null;
  hint?: ReactNode;
  icon?: string;
  aside?: ReactNode;
  containerClassName?: string;
}

export function TextField({ label, error, hint, icon, aside, containerClassName, className, ...rest }: TextFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} aside={aside} className={containerClassName}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          {icon && (
            <Icon name={icon} size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
          )}
          <input
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={cn(inputClasses, icon && "pl-11", className)}
            {...rest}
          />
        </div>
      )}
    </Field>
  );
}
