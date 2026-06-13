'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/dashboard-shell';
import { useWorkspace } from '@/contexts/workspace-context';
import { apiClient, type Plan } from '@/lib/api-client';
import { formatBytes } from '@/lib/utils';
import { Badge, Button, Card } from '@/components/ui';

export default function BillingPage() {
  const { workspace } = useWorkspace();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [limits, setLimits] = useState<{
    plan: Plan;
    usage: { apiRequests: number; storageBytes: number };
    limits: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    apiClient.getPlans().then(setPlans).catch(() => {});
  }, []);

  useEffect(() => {
    if (workspace) {
      apiClient.getBillingLimits(workspace.id).then(setLimits).catch(() => {});
    }
  }, [workspace?.id]);

  const currentTier = workspace?.plan.tier ?? 'FREE';

  return (
    <>
      <PageHeader title="Billing" description="Planos e consumo do workspace" />

      {limits && (
        <Card className="mb-8">
          <h3 className="font-medium">Uso atual — Plano {limits.plan.name}</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">API Requests</p>
              <p className="text-2xl font-semibold">
                {limits.usage.apiRequests.toLocaleString('pt-BR')}
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}/ {limits.limits.apiRequests?.toLocaleString('pt-BR')}
                </span>
              </p>
              <div className="mt-2 h-2 rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${Math.min(100, (limits.usage.apiRequests / limits.limits.apiRequests) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Storage</p>
              <p className="text-2xl font-semibold">
                {formatBytes(limits.usage.storageBytes)}
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}/ {limits.limits.storageGb} GB
                </span>
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          const price =
            plan.priceMonthly === 0
              ? plan.tier === 'ENTERPRISE'
                ? 'Sob consulta'
                : 'Grátis'
              : `R$ ${(plan.priceMonthly / 100).toFixed(0)}/mês`;

          return (
            <Card
              key={plan.id}
              className={isCurrent ? 'border-primary bg-primary/5' : ''}
            >
              {isCurrent && (
                <Badge variant="success" >
                  Plano atual
                </Badge>
              )}
              <h3 className="mt-2 text-xl font-semibold">{plan.name}</h3>
              <p className="mt-1 text-2xl font-bold">{price}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-primary" /> {plan.storageGb} GB storage
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-primary" />{' '}
                  {plan.apiRequests.toLocaleString('pt-BR')} requests/mês
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-primary" /> {plan.maxProjects} projetos
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-primary" /> {plan.maxTables} tabelas
                </li>
              </ul>
              {!isCurrent && plan.tier !== 'FREE' && (
                <Button className="mt-6 w-full" variant="secondary" disabled>
                  Em breve (Stripe)
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
