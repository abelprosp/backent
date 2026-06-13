import { cn } from '@/lib/utils';

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:opacity-50',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
        variant === 'primary' && 'bg-primary text-primary-foreground hover:opacity-90',
        variant === 'secondary' && 'border border-border bg-secondary hover:bg-secondary/80',
        variant === 'ghost' && 'hover:bg-secondary',
        variant === 'danger' && 'border border-red-500/30 text-red-400 hover:bg-red-500/10',
        className,
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary',
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary',
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        variant === 'default' && 'bg-secondary text-muted-foreground',
        variant === 'success' && 'bg-emerald-500/10 text-emerald-400',
        variant === 'warning' && 'bg-yellow-500/10 text-yellow-400',
        variant === 'error' && 'bg-red-500/10 text-red-400',
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-6', className)}>
      {children}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Alert({
  children,
  variant = 'error',
  className,
}: {
  children: React.ReactNode;
  variant?: 'error' | 'success' | 'info';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3 text-sm',
        variant === 'error' && 'border-red-500/30 bg-red-500/10 text-red-400',
        variant === 'success' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        variant === 'info' && 'border-blue-500/30 bg-blue-500/10 text-blue-400',
        className,
      )}
    >
      {children}
    </div>
  );
}
