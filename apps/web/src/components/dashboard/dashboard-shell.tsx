'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Table2,
  Key,
  Webhook,
  HardDrive,
  Settings,
  Zap,
  ChevronRight,
  LogOut,
  CreditCard,
  Loader2,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { ProjectSelector } from './project-selector';
import { Logo } from '@/components/logo';

const nav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/dashboard/projects', icon: Database, label: 'Projetos' },
  { href: '/dashboard/tables', icon: Table2, label: 'Tabelas' },
  { href: '/dashboard/api', icon: Key, label: 'API Keys' },
  { href: '/dashboard/webhooks', icon: Webhook, label: 'Webhooks' },
  { href: '/dashboard/storage', icon: HardDrive, label: 'Storage' },
  { href: '/dashboard/connectors', icon: Zap, label: 'Conectores' },
  { href: '/dashboard/settings', icon: Settings, label: 'Configurações' },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { workspace, loading } = useWorkspace();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Logo href="/dashboard" size="md" />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive(item.href, item.exact)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-4 space-y-3">
          {workspace && (
            <div className="rounded-lg border border-border bg-secondary/50 p-3">
              <p className="text-xs font-medium truncate">{workspace.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Plano {workspace.plan.name}
              </p>
              <Link
                href="/dashboard/billing"
                className="mt-2 flex items-center text-xs text-primary hover:underline"
              >
                Fazer upgrade <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{user?.name ?? user?.email}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <button
              onClick={() => logout()}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="ml-64 flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-8 backdrop-blur-xl">
          <ProjectSelector />
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <CreditCard className="h-4 w-4" />
            Billing
          </Link>
        </header>

        <main className="flex-1 p-8">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
      <Database className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
}: {
  title: string;
  value: string;
  change?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {change && <p className="mt-1 text-xs text-emerald-500">{change}</p>}
    </div>
  );
}
