'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/dashboard/dashboard-shell';
import { useAuth } from '@/contexts/auth-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { apiClient } from '@/lib/api-client';
import { Alert, Button, Card, Input } from '@/components/ui';

export default function SettingsPage() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const [name, setName] = useState(user?.name ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    try {
      await apiClient.updateProfile({ name: name || undefined });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    }
  }

  return (
    <>
      <PageHeader title="Configurações" description="Perfil e workspace" />

      <div className="max-w-xl space-y-6">
        <Card>
          <h3 className="font-medium">Perfil</h3>
          <div className="mt-4 space-y-4">
            {saved && <Alert variant="success">Perfil atualizado!</Alert>}
            {error && <Alert>{error}</Alert>}
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input className="mt-1" value={user?.email ?? ''} disabled />
            </div>
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input
                className="mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Função</label>
              <Input className="mt-1" value={user?.role ?? ''} disabled />
            </div>
            <Button onClick={handleSave}>Salvar alterações</Button>
          </div>
        </Card>

        {workspace && (
          <Card>
            <h3 className="font-medium">Workspace</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome</span>
                <span>{workspace.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slug</span>
                <span>{workspace.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plano</span>
                <span>{workspace.plan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Projetos</span>
                <span>{workspace._count?.projects ?? '—'}</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
