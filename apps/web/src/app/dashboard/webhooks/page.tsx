'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Webhook } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/dashboard/dashboard-shell';
import { useRequireProject } from '@/contexts/workspace-context';
import { apiClient, type Webhook as WebhookType } from '@/lib/api-client';
import { Alert, Badge, Button, Card, Input, Modal, Select } from '@/components/ui';

const EVENTS = ['INSERT', 'UPDATE', 'DELETE', 'AUTH'];

export default function WebhooksPage() {
  const { project } = useRequireProject();
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['INSERT', 'UPDATE']);
  const [error, setError] = useState('');

  async function load() {
    if (!project) return;
    setWebhooks(await apiClient.getWebhooks(project.id));
  }

  useEffect(() => {
    load().catch(() => setWebhooks([]));
  }, [project?.id]);

  async function handleCreate() {
    if (!project) return;
    setError('');
    try {
      await apiClient.createWebhook(project.id, { name, url, events });
      setShowCreate(false);
      setName('');
      setUrl('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar webhook');
    }
  }

  async function handleDelete(id: string) {
    if (!project || !confirm('Excluir webhook?')) return;
    await apiClient.deleteWebhook(project.id, id);
    await load();
  }

  function toggleEvent(ev: string) {
    setEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev],
    );
  }

  if (!project) {
    return (
      <>
        <PageHeader title="Webhooks" description="Dispare automações em eventos" />
        <EmptyState title="Selecione um projeto" description="Webhooks são configurados por projeto." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Webhooks"
        description={`Projeto: ${project.name}`}
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Novo webhook
          </Button>
        }
      />

      {webhooks.length === 0 ? (
        <EmptyState
          title="Nenhum webhook"
          description="Receba notificações HTTP quando dados forem inseridos, atualizados ou excluídos."
          action={<Button onClick={() => setShowCreate(true)}>Criar webhook</Button>}
        />
      ) : (
        <div className="space-y-3">
          {webhooks.map((w) => (
            <Card key={w.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Webhook className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{w.name}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-md">{w.url}</p>
                  <div className="mt-1 flex gap-1">
                    {w.events.map((e) => (
                      <Badge key={e}>{e}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button size="sm" variant="danger" onClick={() => handleDelete(w.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo webhook">
        <div className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
          <div>
            <label className="text-sm font-medium">Eventos</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {EVENTS.map((ev) => (
                <button
                  key={ev}
                  type="button"
                  onClick={() => toggleEvent(ev)}
                  className={`rounded-lg border px-3 py-1 text-xs ${
                    events.includes(ev)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border'
                  }`}
                >
                  {ev}
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={handleCreate}>
            Criar webhook
          </Button>
        </div>
      </Modal>
    </>
  );
}
