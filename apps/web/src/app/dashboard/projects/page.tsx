'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Copy, Check } from 'lucide-react';
import {
  PageHeader,
  EmptyState,
} from '@/components/dashboard/dashboard-shell';
import { useWorkspace } from '@/contexts/workspace-context';
import { apiClient, type Project, type Template } from '@/lib/api-client';
import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  Modal,
  Select,
} from '@/components/ui';

export default function ProjectsPage() {
  const { workspace, projects, refreshProjects, selectProject } = useWorkspace();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiClient.getTemplates().then(setTemplates).catch(() => {});
  }, []);

  async function handleCreate() {
    if (!workspace || !name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.createProject(workspace.id, {
        name: name.trim(),
        description: description || undefined,
        templateId: templateId || undefined,
      });
      setNewApiKey(result.apiKey);
      await refreshProjects();
      selectProject(result.project);
      setName('');
      setDescription('');
      setTemplateId('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar projeto');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(project: Project) {
    if (!confirm(`Excluir projeto "${project.name}"?`)) return;
    try {
      await apiClient.deleteProject(project.id);
      await refreshProjects();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao excluir');
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <PageHeader
        title="Projetos"
        description="Gerencie seus backends provisionados"
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Novo projeto
          </Button>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          title="Nenhum projeto ainda"
          description="Crie seu primeiro projeto — schema, API REST e storage são provisionados automaticamente."
          action={<Button onClick={() => setShowCreate(true)}>Criar projeto</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{p.slug}</p>
                </div>
                <Badge variant={p.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {p.status}
                </Badge>
              </div>
              {p.description && (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                  {p.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{p._count?.tables ?? 0} tabelas</span>
                <span>·</span>
                <span>{p.serverNode?.region ?? 'sa-east-1'}</span>
              </div>
              {p.apiUrl && (
                <code className="mt-3 block truncate rounded bg-secondary px-2 py-1 text-xs">
                  {p.apiUrl}
                </code>
              )}
              <div className="mt-auto flex gap-2 pt-4">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => selectProject(p)}
                >
                  Selecionar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(p)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          setNewApiKey(null);
        }}
        title={newApiKey ? 'Projeto criado!' : 'Novo projeto'}
      >
        {newApiKey ? (
          <div className="space-y-4">
            <Alert variant="success">
              Projeto provisionado com sucesso. Copie sua API Key — ela não será exibida novamente.
            </Alert>
            <code className="block break-all rounded-lg bg-secondary p-3 text-xs">
              {newApiKey}
            </code>
            <Button className="w-full" onClick={() => copyKey(newApiKey)}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado!' : 'Copiar API Key'}
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setShowCreate(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && <Alert>{error}</Alert>}
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input
                className="mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Meu App SaaS"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Input
                className="mt-1"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Template</label>
              <Select
                className="mt-1"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">Sem template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" disabled={loading || !name.trim()} onClick={handleCreate}>
                {loading ? 'Provisionando...' : 'Criar e provisionar'}
              </Button>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
