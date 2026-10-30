import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-control border border-ink-300 bg-white px-3.5 text-body text-ink-900 placeholder:text-ink-400 transition-colors hover:border-ink-400 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-ink-100 aria-[invalid=true]:border-danger-600 aria-[invalid=true]:focus:ring-danger-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(control, "h-11", className)} {...props} />
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(control, "min-h-28 py-2.5", className)} {...props} />
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(control, "h-11 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7589%22 stroke-width=%222.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_0.85rem_center] bg-no-repeat pr-9", className)}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function Label({ children, htmlFor, className }: { children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-small font-medium text-ink-800", className)}>
      {children}
    </label>
  );
}

export function Field({
  label, htmlFor, error, hint, children, className,
}: { label?: ReactNode; htmlFor?: string; error?: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-caption font-medium text-danger-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-caption text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

/** Honeypot field: invisible to people, tempting to bots. Server rejects any non-empty value. */
export const Honeypot = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
  <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
    <label>
      Website
      <input ref={ref} type="text" tabIndex={-1} autoComplete="off" {...props} />
    </label>
  </div>
));
Honeypot.displayName = "Honeypot";
