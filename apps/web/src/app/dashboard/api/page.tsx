'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Copy, Check, Key } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/dashboard/dashboard-shell';
import { useRequireProject } from '@/contexts/workspace-context';
import { apiClient, type ApiKey } from '@/lib/api-client';
import { Alert, Button, Card, Input, Modal } from '@/components/ui';

export default function ApiKeysPage() {
  const { project, projects } = useRequireProject();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [apiUrl, setApiUrl] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState('');

  async function load() {
    if (!project) return;
    const detail = await apiClient.getProject(project.id);
    setKeys(detail.apiKeys ?? []);
    setApiUrl(detail.apiUrl ?? '');
  }

  useEffect(() => {
    load().catch(() => {});
  }, [project?.id]);

  async function handleCreate() {
    if (!project || !keyName.trim()) return;
    const result = await apiClient.createApiKey(project.id, keyName.trim());
    setNewKey(result.key);
    setKeyName('');
    await load();
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }

  if (!project) {
    return (
      <>
        <PageHeader title="API Keys" description="Chaves de acesso à REST API" />
        <EmptyState
          title="Selecione um projeto"
          description="API Keys são geradas por projeto."
          action={
            <Link href="/dashboard/projects">
              <Button>Ir para projetos</Button>
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="API Keys"
        description={`Projeto: ${project.name}`}
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Nova key
          </Button>
        }
      />

      {apiUrl && (
        <Card className="mb-6">
          <h3 className="text-sm font-medium">Base URL da API</h3>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg bg-secondary px-3 py-2 text-xs">
              {apiUrl}
            </code>
            <Button size="sm" variant="secondary" onClick={() => copy(apiUrl, 'url')}>
              {copied === 'url' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Exemplo: <code>GET {apiUrl}/users</code> com header <code>X-API-Key: bk_...</code>
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {keys.length === 0 ? (
          <EmptyState
            title="Nenhuma API Key"
            description="Crie uma key para conectar Bubble, FlutterFlow, N8N e outras ferramentas."
            action={<Button onClick={() => setShowCreate(true)}>Criar API Key</Button>}
          />
        ) : (
          keys.map((k) => (
            <Card key={k.id} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{k.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {k.keyPrefix}... · Criada{' '}
                    {new Date(k.createdAt).toLocaleDateString('pt-BR')}
                    {k.lastUsedAt && ` · Usada ${new Date(k.lastUsedAt).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          setNewKey(null);
        }}
        title={newKey ? 'API Key criada' : 'Nova API Key'}
      >
        {newKey ? (
          <div className="space-y-4">
            <Alert variant="success">Copie agora — não será exibida novamente.</Alert>
            <code className="block break-all rounded-lg bg-secondary p-3 text-xs">{newKey}</code>
            <Button className="w-full" onClick={() => copy(newKey, 'new')}>
              {copied === 'new' ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              placeholder="Nome (ex: Bubble Production)"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
            />
            <Button className="w-full" onClick={handleCreate}>
              Gerar key
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
