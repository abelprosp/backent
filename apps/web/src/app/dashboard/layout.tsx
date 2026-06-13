'use client';

import { Loader2 } from 'lucide-react';
import { useRequireAuth } from '@/contexts/auth-context';
import { WorkspaceProvider } from '@/contexts/workspace-context';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <WorkspaceProvider>
      <DashboardShell>{children}</DashboardShell>
    </WorkspaceProvider>
  );
}
