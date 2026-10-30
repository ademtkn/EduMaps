import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

/** Required consent tick box with an inline error. */
export const ConsentCheckbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; error?: string }>(
  ({ label, error, id, ...props }, ref) => (
    <div>
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 size-4.5 shrink-0 rounded border-ink-300 text-brand-700 focus:ring-brand-500 aria-[invalid=true]:border-danger-600"
          {...props}
        />
        <label htmlFor={id} className="text-small text-ink-700">{label}</label>
      </div>
      {error ? <p id={`${id}-error`} role="alert" className="mt-1.5 text-caption font-medium text-danger-600">{error}</p> : null}
    </div>
  )
);
ConsentCheckbox.displayName = "ConsentCheckbox";
