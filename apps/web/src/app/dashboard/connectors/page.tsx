'use client';

import { useEffect, useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/dashboard/dashboard-shell';
import { useRequireProject } from '@/contexts/workspace-context';
import { apiClient } from '@/lib/api-client';
import { NO_CODE_CONNECTORS } from '@backent/shared';
import { Button, Card } from '@/components/ui';

export default function ConnectorsPage() {
  const { project } = useRequireProject();
  const [selected, setSelected] = useState('bubble');
  const [snippet, setSnippet] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!project) return;
    apiClient
      .getConnectorSnippet(selected, project.id)
      .then((r) => setSnippet(r.snippet))
      .catch(() => setSnippet(null));
  }, [project?.id, selected]);

  function copySnippet() {
    if (!snippet) return;
    navigator.clipboard.writeText(JSON.stringify(snippet, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!project) {
    return (
      <>
        <PageHeader title="Conectores No-Code" description="Integre com Bubble, N8N, Make e mais" />
        <EmptyState title="Selecione um projeto" description="Snippets são gerados por projeto." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Conectores No-Code"
        description={`Projeto: ${project.name}`}
      />

      <div className="grid gap-4 md:grid-cols-4">
        {NO_CODE_CONNECTORS.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={`rounded-xl border p-4 text-left transition ${
              selected === c.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <p className="font-medium">{c.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">REST API</p>
          </button>
        ))}
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">
            Snippet — {NO_CODE_CONNECTORS.find((c) => c.id === selected)?.name}
          </h3>
          <Button size="sm" variant="secondary" onClick={copySnippet}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            Copiar
          </Button>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-secondary p-4 text-xs">
          {snippet ? JSON.stringify(snippet, null, 2) : 'Carregando...'}
        </pre>
        <p className="mt-4 text-xs text-muted-foreground">
          Use sua API Key no header <code>X-API-Key</code>. Documentação completa em{' '}
          <a href="http://localhost:4000/docs" target="_blank" className="text-primary hover:underline">
            Swagger <ExternalLink className="inline h-3 w-3" />
          </a>
        </p>
      </Card>
    </>
  );
}
