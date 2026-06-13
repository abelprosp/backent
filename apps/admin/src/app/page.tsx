'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAccessToken, ensureSession, adminFetch } from '@/lib/auth';
import { Logo } from '@/components/logo';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<{
    users: number;
    activeProjects: number;
    workspaces: number;
    servers: Array<{ name: string; status: string; currentLoad: number; capacity: number }>;
  } | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; email: string; name: string; role: string }>>([]);
  const [logs, setLogs] = useState<Array<{ action: string; resource: string; createdAt: string; user?: { email: string } }>>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const me = await ensureSession();
        if (me.role !== 'ADMIN' && me.role !== 'SUPER_ADMIN') {
          setError('Acesso negado — apenas administradores');
          return;
        }
        const [dash, userList, auditLogs] = await Promise.all([
          adminFetch<typeof dashboard>('/admin/dashboard'),
          adminFetch<{ data: typeof users }>('/admin/users'),
          adminFetch<typeof logs>('/admin/audit-logs'),
        ]);
        setDashboard(dash);
        setUsers(userList.data);
        setLogs(auditLogs.slice(0, 10));
      } catch (e) {
        if (!getAccessToken()) {
          router.replace('/login');
          return;
        }
        setError(e instanceof Error ? e.message : 'Erro ao carregar admin');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Faça login como admin@backent.io em{' '}
            <a href="http://localhost:3000/login" className="text-primary underline">
              localhost:3000
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo href="/" size="md" />
            <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-400">Admin</span>
          </div>
          <a href="http://localhost:3000/dashboard" className="text-sm text-white/60 hover:text-white">
            ← Dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Usuários', value: dashboard?.users },
            { label: 'Projetos ativos', value: dashboard?.activeProjects },
            { label: 'Workspaces', value: dashboard?.workspaces },
            { label: 'Servidores', value: dashboard?.servers?.length },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-white/60">{s.label}</p>
              <p className="mt-2 text-3xl font-semibold">{s.value ?? 0}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-medium">Servidores VPS</h2>
            <div className="mt-4 space-y-3">
              {dashboard?.servers?.map((s) => (
                <div key={s.name} className="flex items-center justify-between rounded-lg border border-white/10 p-4">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-white/60">
                      {s.currentLoad}/{s.capacity} tenants
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs ${s.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-medium">Audit Logs</h2>
            <div className="mt-4 space-y-2 font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i} className="text-white/60">
                  {log.action} — {log.resource} — {log.user?.email ?? 'system'} —{' '}
                  {new Date(log.createdAt).toLocaleString('pt-BR')}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-medium mb-4">Usuários recentes</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/60">
                <th className="pb-3">Email</th>
                <th className="pb-3">Nome</th>
                <th className="pb-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="py-3">{u.email}</td>
                  <td className="py-3">{u.name ?? '—'}</td>
                  <td className="py-3">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
