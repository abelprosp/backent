'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, Database, HardDrive, Zap, ArrowUpRight } from 'lucide-react';
import {
  PageHeader,
  StatCard,
  EmptyState,
} from '@/components/dashboard/dashboard-shell';
import { useWorkspace } from '@/contexts/workspace-context';
import { apiClient, type ProjectMetrics } from '@/lib/api-client';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const { projects, selectedProject, workspace } = useWorkspace();
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [usage, setUsage] = useState<{ apiRequests: number; storageBytes: number } | null>(null);

  useEffect(() => {
    if (workspace) {
      apiClient.getWorkspaceUsage(workspace.id).then(setUsage).catch(() => {});
    }
  }, [workspace]);

  useEffect(() => {
    if (selectedProject?.status === 'ACTIVE') {
      apiClient.getMetrics(selectedProject.id).then(setMetrics).catch(() => setMetrics(null));
    } else {
      setMetrics(null);
    }
  }, [selectedProject]);

  const chartData =
    metrics?.metrics?.map((m) => ({
      day: new Date(m.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      requests: m.apiRequests,
    })) ?? [];

  if (projects.length === 0) {
    return (
      <>
        <PageHeader title="Dashboard" description="Visão geral do seu backend" />
        <EmptyState
          title="Bem-vindo ao Backent"
          description="Crie seu primeiro projeto para ter banco de dados, API REST e storage provisionados automaticamente."
          action={
            <Link href="/dashboard/projects">
              <Button>Criar primeiro projeto</Button>
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          selectedProject
            ? `Projeto: ${selectedProject.name}`
            : 'Selecione um projeto no menu superior'
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="API Requests (7d)"
          value={String(metrics?.apiRequests7d ?? usage?.apiRequests ?? 0)}
          icon={Activity}
        />
        <StatCard
          title="Tabelas"
          value={String(metrics?.tables ?? 0)}
          icon={Database}
        />
        <StatCard
          title="Storage"
          value={formatBytes(Number(usage?.storageBytes ?? 0))}
          icon={HardDrive}
        />
        <StatCard
          title="Webhooks"
          value={String(metrics?.webhooks ?? 0)}
          icon={Zap}
        />
      </div>

      {chartData.length > 0 && (
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <h2 className="font-medium">Requests — últimos 7 dias</h2>
          <ResponsiveContainer width="100%" height={280} className="mt-4">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="day" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="requests"
                stroke="#8b5cf6"
                fill="url(#colorRequests)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-medium">Projetos</h2>
          <div className="mt-4 space-y-3">
            {projects.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${p.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                  />
                  <span className="text-sm">{p.name}</span>
                </div>
                <Link href="/dashboard/projects">
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {selectedProject?.apiUrl && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-medium">API URL</h2>
            <code className="mt-3 block overflow-x-auto rounded-lg bg-secondary p-3 text-xs">
              {selectedProject.apiUrl}
            </code>
            <p className="mt-3 text-xs text-muted-foreground">
              Use o header <strong>X-API-Key</strong> para autenticar requests
            </p>
          </div>
        )}
      </div>
    </>
  );
}
